# Reminiscence Agent — retrieves biography RAG + Mem0 memories and generates warm, grounded response
import os
from openai import AsyncOpenAI
from agents.supervisor import AgentState
from tools.search_biography import search_biography
from tools.recall_session import recall_session, save_to_memory
from db.supabase_client import get_client


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
2. If the context mentions their wife, son, and daughter — only speak about those people. Never add grandchildren, parents, siblings, or anyone not mentioned.
3. If you have no relevant context for what they asked, say warmly that you would love to hear more about it from them.
4. Keep your response to 2–3 sentences. End with one warm follow-up question.
5. Mirror their tone: joyful if they are happy, tender if nostalgic, gentle and reassuring if confused."""


async def _fetch_profile(user_id: str) -> dict | None:
    """Fetch patient profile from Supabase for context enrichment."""
    try:
        res = get_client().table("patient_profiles") \
            .select("full_name, family_members, favourite_topics, biography_text") \
            .eq("user_id", user_id) \
            .maybe_single() \
            .execute()
        return res.data
    except Exception:
        return None


async def generate_response(state: AgentState) -> AgentState:
    """Retrieve relevant biography chunks and past memories, then generate a warm personalised response."""
    user_id = state["user_id"]
    message = state["user_message"]
    session_id = state.get("session_id", "unknown")

    profile = await _fetch_profile(user_id)
    biography_chunks = await search_biography(user_id=user_id, query=message)
    past_memories = await recall_session(user_id=user_id, query=message)

    biography_context = "\n".join(biography_chunks) if biography_chunks else ""
    memory_context = "\n".join(past_memories) if past_memories else ""

    # Also include biography_text from profile as a fallback
    if not biography_context and profile and profile.get("biography_text"):
        biography_context = profile["biography_text"]

    context_parts = []
    if biography_context:
        context_parts.append(f"Context from their life:\n{biography_context}")
    if memory_context:
        context_parts.append(f"Things we have talked about before:\n{memory_context}")

    if context_parts:
        context_block = "\n\n".join(context_parts) + "\n\n"
        context_note = ""
    else:
        context_block = ""
        context_note = "Note: No specific context found — ask them to share more.\n\n"

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

    # Only save to Mem0 if there is an actual message
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
    """Gently redirect a distressed patient to a positive memory without mentioning the distressing subject."""
    user_id = state["user_id"]
    profile = await _fetch_profile(user_id)
    biography_chunks = await search_biography(user_id=user_id, query="happy memory favourite place family")
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
