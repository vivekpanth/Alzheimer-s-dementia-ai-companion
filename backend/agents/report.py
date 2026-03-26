# Report Agent — generates end-of-session summary for caregiver dashboard
import os
from openai import AsyncOpenAI
from agents.supervisor import AgentState


def _get_openai() -> AsyncOpenAI:
    """Return OpenAI client, reading key at call time so dotenv is already loaded."""
    return AsyncOpenAI(api_key=os.environ["OPENAI_API_KEY"])

_SYSTEM_PROMPT = """You are writing a plain-English summary for a caregiver about their patient's conversation session.
The caregiver may not be tech-savvy. Write warmly and clearly.
Max 200 words. Include: topics discussed, mood trend, any distress events, and overall impression."""


async def generate_report(state: AgentState) -> AgentState:
    """Summarise session log into plain-English caregiver report with mood trend and concern flags."""
    session_log = state.get("session_log", [])

    if not session_log:
        return {**state, "response": "No session data to report."}

    # Build readable log
    log_text = "\n".join(
        f"[{entry.get('timestamp', '')}] {entry.get('role', 'unknown').upper()}: {entry.get('content', '')}"
        for entry in session_log
    )

    # Extract mood trend
    mood_trend = [
        entry.get("sentiment", "neutral")
        for entry in session_log
        if entry.get("role") == "user" and entry.get("sentiment")
    ]

    report_prompt = f"""Session log:
{log_text}

Mood trend: {mood_trend}

Write a caregiver report summarising this session."""

    response = await _get_openai().chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": _SYSTEM_PROMPT},
            {"role": "user", "content": report_prompt},
        ],
        max_tokens=300,
        temperature=0.4,
    )
    summary = response.choices[0].message.content

    # Flag concerns: distress appearing 3+ times
    distress_count = mood_trend.count("distressed")
    concerns = []
    if distress_count >= 3:
        concerns.append({
            "text": "Patient showed repeated signs of distress during this session",
            "occurrences": distress_count,
        })

    return {
        **state,
        "response": summary,
        "session_log": session_log,
    }
