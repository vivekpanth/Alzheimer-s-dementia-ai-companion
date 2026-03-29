# Reminiscence Agent — parallel retrieval for low latency, grounded warm responses
import asyncio
import os
from openai import AsyncOpenAI
from agents.supervisor import AgentState
from tools.recall_session import recall_session, save_to_memory
from db.supabase_client import get_client, search_embeddings

# In-memory profile cache — avoids Supabase round-trip on every message
_profile_cache: dict = {}


def _get_openai() -> AsyncOpenAI:
    """Return OpenAI client, reading key at call time so dotenv is already loaded."""
    return AsyncOpenAI(api_key=os.environ["OPENAI_API_KEY"])


def _build_system_prompt(profile: dict | None) -> str:
    """Build the system prompt enriched with the patient's personal profile."""
    name = "friend"
    family_line = ""
    topics_line = ""

    if profile:
        if profile.get("full_name"):
            name = profile["full_name"].split()[0]
        if profile.get("family_members"):
            members = profile["family_members"]
            if isinstance(members, list) and members:
                family_line = f"\nTheir family: {', '.join(str(m) for m in members)}."
        if profile.get("favourite_topics"):
            topics = profile["favourite_topics"]
            if isinstance(topics, list) and topics:
                topics_line = f"\nFavourite topics: {', '.join(str(t) for t in topics)}."

    return f"""You are a warm, caring companion speaking with {name}, an elderly person with memory difficulties.
Speak with genuine warmth and emotional presence — like a trusted old friend, not a bot.{family_line}{topics_line}

CRITICAL RULES — follow strictly:
1. ONLY mention facts that appear in the "Context from their life" section below. Do NOT invent any names, places, relationships, or events.
2. If the context mentions wife, son, and daughter — only speak about those people. Never add anyone not mentioned.
3. If you have no relevant context, say warmly that you would love to hear more about it from them.
4. Keep your response to 2-3 sentences. End with one warm follow-up question.
5. Mirror their tone: joyful if happy, tender if nostalgic, gentle and reassuring if confused."""


async def _fetch_profile(user_id: str) -> dict | None:
    """Fetch patient profile from Supabase, cached per user_id for the session."""
    if user_id in _profile_cache:
        return _profile_cache[user_id]
    try:
        res = get_client().table("patient_profiles") \
            .select("full_name, family_members, favourite_topics, biography_text") \
            .eq("user_id", user_id) \
            .maybe_single() \
            .execute()
        _profile_cache[user_id] = res.data
        return res.data
    except Exception:
        return None


async def _embed_and_search(user_id: str, query: str) -> list:
    """Embed query and search biography — two sequential steps bundled for gather."""
    try:
        openai = _get_openai()
        emb_resp = await openai.embeddings.create(
            model="text-embedding-3-small",
            input=query,
        )
        results = await search_embeddings(user_id, emb_resp.data[0].embedding)
        return [r["content"] for r in results]
    except Exception:
        return []


async def generate_response(state: AgentState) -> AgentState:
    """Parallel retrieval (profile + Mem0 + embedding+RAG), then single LLM call."""
    user_id = state["user_id"]
    message = state["user_message"]
    session_id = state.get("session_id", "unknown")

    # Run all retrieval in parallel
    profile, past_memories, biography_chunks = await asyncio.gather(
        _fetch_profile(user_id),
        recall_session(user_id=user_id, query=message),
        _embed_and_search(user_id, message),
    )

    biography_context = "\n".join(biography_chunks) if biography_chunks else ""
    memory_context = "\n".join(past_memories) if past_memories else ""

    # Fallback to biography_text if RAG returned nothing
    if not biography_context and profile and profile.get("biography_text"):
        biography_context = profile["biography_text"]

    context_parts = []
    if biography_context:
        context_parts.append(f"Context from their life:\n{biography_context}")
    if memory_context:
        context_parts.append(f"Things we have talked about before:\n{memory_context}")

    context_block = ("\n\n".join(context_parts) + "\n\n") if context_parts else ""
    context_note = "" if context_parts else "Note: No specific context found — ask them to share more.\n\n"
    user_prompt = f"{context_block}{context_note}Patient said: {message}"

    response = await _get_openai().chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": _build_system_prompt(profile)},
            {"role": "user", "content": user_prompt},
        ],
        max_tokens=160,
        temperature=0.5,
    )
    reply = response.choices[0].message.content

    if message.strip():
        await save_to_memory(
            user_id=user_id,
            message=message,
            session_id=session_id,
            sentiment=state.get("sentiment", "neutral"),
        )

    return {
        **state,
        "retrieved_biography": biography_context,
        "retrieved_memory": memory_context,
        "response": reply,
    }


async def calm_redirect(state: AgentState) -> AgentState:
    """Parallel fetch profile + search happy memories, then generate redirect response."""
    user_id = state["user_id"]

    profile, biography_chunks = await asyncio.gather(
        _fetch_profile(user_id),
        _embed_and_search(user_id, "happy memory favourite place family"),
    )
    biography_context = "\n".join(biography_chunks) if biography_chunks else ""
    if not biography_context and profile and profile.get("biography_text"):
        biography_context = profile["biography_text"]

    redirect_prompt = f"""The patient seems upset or distressed.
Acknowledge their feeling warmly in one short sentence.
Then gently bring up something from their life story that is positive and comforting — ONLY use facts from the context below.
Never mention death, loss, or the distressing subject directly.
End with a gentle, warm question about something joyful in their life.

Context from their life: {biography_context}
Patient said: {state['user_message']}"""

    response = await _get_openai().chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": _build_system_prompt(profile)},
            {"role": "user", "content": redirect_prompt},
        ],
        max_tokens=160,
        temperature=0.5,
    )
    reply = response.choices[0].message.content

    return {
        **state,
        "retrieved_biography": biography_context,
        "response": reply,
    }
