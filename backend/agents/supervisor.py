# LangGraph supervisor — routes messages between agents based on sentiment
from typing import TypedDict, List, Optional


class AgentState(TypedDict):
    """Shared state passed between all LangGraph agent nodes."""

    user_id: str
    user_message: str
    sentiment: Optional[str]
    sentiment_confidence: Optional[float]
    retrieved_biography: Optional[str]
    retrieved_memory: Optional[str]
    response: Optional[str]
    session_log: List[dict]
    session_end: bool


def build_graph():
    """Build and return the compiled LangGraph state graph."""
    pass


def route_message(state: AgentState) -> str:
    """Route to reminiscence or calm_redirect based on sentiment."""
    pass
