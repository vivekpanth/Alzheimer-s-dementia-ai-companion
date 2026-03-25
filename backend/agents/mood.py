# Mood Agent — classifies patient message sentiment using GPT-4o Mini
from agents.supervisor import AgentState


async def classify_mood(state: AgentState) -> AgentState:
    """Classify patient message as happy/confused/distressed/neutral. Returns updated state with sentiment and confidence."""
    pass
