# Reminiscence Agent — retrieves biography RAG + Mem0 memories and generates warm response
import os
from openai import AsyncOpenAI
from agents.supervisor import AgentState
from tools.search_biography import search_biography
from tools.recall_session import recall_session, save_to_memory


def _get_openai() -> AsyncOpenAI:
    """Return OpenAI client, reading key at call time so dotenv is already loaded."""
    return AsyncOpenAI(api_key=os.environ["OPENAI_API_KEY"])

_SYSTEM_PROMPT = """You are a warm, caring AI companion talking with an elderly person with memory difficulties.
You only speak about things you know are true from their personal story.
Keep responses to 2-3 sentences — never long paragraphs.
Ask one follow-up question per response to keep the conversation going.
Use a warm, gentle, first-name tone. Never invent names, dates, places, or relationships."""


async def generate_response(state: AgentState) -> AgentState:
    """Retrieve relevant biography chunks and past memories, then generate a warm personalised response."""
    user_id = state["user_id"]
    message = state["user_message"]
    session_id = state.get("session_id", "unknown")

    # Retrieve from RAG and Mem0
    biography_chunks = await search_biography(user_id=user_id, query=message)
    past_memories = await recall_session(user_id=user_id, query=message)

    biography_context = "\n".join(biography_chunks) if biography_chunks else "No biography available."
    memory_context = "\n".join(past_memories) if past_memories else "No previous memories."

    user_prompt = f"""Patient's biography context:
{biography_context}

Past session memories:
{memory_context}

Patient's message: {message}"""

    response = await _get_openai().chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": _SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt},
        ],
        max_tokens=150,
        temperature=0.7,
    )
    reply = response.choices[0].message.content

    # Save to Mem0 for future sessions
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
    biography_chunks = await search_biography(user_id=user_id, query="happy memory favourite place")

    biography_context = "\n".join(biography_chunks) if biography_chunks else ""

    redirect_prompt = f"""The patient seems distressed. Acknowledge their feeling warmly, then gently pivot to a positive memory or sensory anchor from their life story.
Never mention death, loss, or the distressing subject directly.
Keep to 2-3 sentences and end with a gentle, positive question.

Biography context: {biography_context}
Patient's message: {state['user_message']}"""

    response = await _get_openai().chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": _SYSTEM_PROMPT},
            {"role": "user", "content": redirect_prompt},
        ],
        max_tokens=150,
        temperature=0.6,
    )
    reply = response.choices[0].message.content

    return {
        **state,
        "retrieved_biography": biography_context,
        "response": reply,
    }
