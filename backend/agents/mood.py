# Mood Agent — classifies patient message sentiment using GPT-4o Mini
import json
import os
from openai import AsyncOpenAI
from agents.supervisor import AgentState


def _get_openai() -> AsyncOpenAI:
    """Return OpenAI client, reading key at call time so dotenv is already loaded."""
    return AsyncOpenAI(api_key=os.environ["OPENAI_API_KEY"])

_SYSTEM_PROMPT = """You are a sentiment classifier for messages from elderly patients with memory difficulties.
Classify the message as exactly one of: happy, confused, distressed, neutral.

Distress signals include: asking for a deceased person, expressing fear, confusion about time/place, repeated questions.

Respond with ONLY valid JSON in this exact format:
{"sentiment": "happy", "confidence": 0.91}"""


async def classify_mood(state: AgentState) -> AgentState:
    """Classify patient message as happy/confused/distressed/neutral. Returns updated state with sentiment and confidence."""
    try:
        response = await _get_openai().chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": _SYSTEM_PROMPT},
                {"role": "user", "content": state["user_message"]},
            ],
            max_tokens=50,
            temperature=0,
        )
        result = json.loads(response.choices[0].message.content)
        sentiment = result.get("sentiment", "neutral")
        confidence = result.get("confidence", 0.5)
    except (json.JSONDecodeError, Exception):
        sentiment = "neutral"
        confidence = 0.0

    return {
        **state,
        "sentiment": sentiment,
        "sentiment_confidence": confidence,
    }
