# Chat router — mood + retrieval in parallel for minimum latency
import asyncio
import os
from datetime import datetime
from fastapi import APIRouter
from pydantic import BaseModel
from openai import AsyncOpenAI
from agents.supervisor import AgentState
from agents.reminiscence import _fetch_profile, _embed_and_search, _build_system_prompt
from tools.recall_session import recall_session, save_to_memory
import json

router = APIRouter()

_sessions: dict = {}


def _get_openai() -> AsyncOpenAI:
    """Return OpenAI client lazily."""
    return AsyncOpenAI(api_key=os.environ["OPENAI_API_KEY"])


_MOOD_PROMPT = """Classify this message from an elderly patient as exactly one of: happy, confused, distressed, neutral.
Distress signals: asking for a deceased person, expressing fear, confusion about time/place.
Respond ONLY as JSON: {"sentiment": "distressed", "confidence": 0.91}"""


async def _classify_mood(message: str) -> str:
    """Classify patient message sentiment. Returns sentiment string."""
    try:
        r = await _get_openai().chat.completions.create(
            model="gpt-4o-mini",
            messages=[{"role":"system","content":_MOOD_PROMPT},{"role":"user","content":message}],
            max_tokens=50, temperature=0,
        )
        return json.loads(r.choices[0].message.content).get("sentiment", "neutral")
    except Exception:
        return "neutral"


class ChatRequest(BaseModel):
    """Request model for the /chat endpoint."""
    user_id: str
    message: str
    session_id: str


class ChatResponse(BaseModel):
    """Response model for the /chat endpoint."""
    response: str
    sentiment: str
    session_id: str


@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest) -> ChatResponse:
    """Run mood classification + context retrieval in parallel, then single LLM call."""
    if request.session_id not in _sessions:
        _sessions[request.session_id] = {
            "user_id": request.user_id,
            "started_at": datetime.utcnow(),
            "log": [],
            "mood_log": [],
        }

    sess = _sessions[request.session_id]
    ts = datetime.utcnow().isoformat()
    message = request.message
    user_id = request.user_id

    # Phase 1: mood + profile + mem0 + embedding all in parallel
    sentiment, profile, past_memories, biography_chunks = await asyncio.gather(
        _classify_mood(message),
        _fetch_profile(user_id),
        recall_session(user_id=user_id, query=message),
        _embed_and_search(user_id, message),
    )

    # Build context
    biography_context = "\n".join(biography_chunks) if biography_chunks else ""
    if not biography_context and profile and profile.get("biography_text"):
        biography_context = profile["biography_text"]
    memory_context = "\n".join(past_memories) if past_memories else ""

    # Build prompt based on mood
    if sentiment == "distressed":
        user_prompt = f"""The patient seems upset or distressed.
Acknowledge their feeling warmly in one short sentence.
Then gently bring up something positive from their life — ONLY use facts from the context below.
Never mention death, loss, or the distressing subject directly.
End with a gentle, warm question about something joyful.

Context from their life: {biography_context}
Patient said: {message}"""
    else:
        context_parts = []
        if biography_context:
            context_parts.append(f"Context from their life:\n{biography_context}")
        if memory_context:
            context_parts.append(f"Things we have talked about before:\n{memory_context}")
        context_block = ("\n\n".join(context_parts) + "\n\n") if context_parts else ""
        user_prompt = f"{context_block}Patient said: {message}"

    # Phase 2: single LLM call
    resp = await _get_openai().chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": _build_system_prompt(profile)},
            {"role": "user", "content": user_prompt},
        ],
        max_tokens=160,
        temperature=0.5,
    )
    reply = resp.choices[0].message.content

    # Save to Mem0 (fire and forget — don't block the response)
    if message.strip():
        asyncio.create_task(save_to_memory(user_id, message, request.session_id, sentiment))

    # Accumulate session log
    sess["log"].append({"role": "user", "content": message, "timestamp": ts, "sentiment": sentiment})
    sess["log"].append({"role": "assistant", "content": reply, "timestamp": ts})
    sess["mood_log"].append(sentiment)

    return ChatResponse(response=reply, sentiment=sentiment, session_id=request.session_id)
