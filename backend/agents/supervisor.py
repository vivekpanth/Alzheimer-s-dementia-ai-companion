# LangGraph supervisor — routes messages between agents based on sentiment
from typing import TypedDict, List, Optional
from langgraph.graph import StateGraph, END


class AgentState(TypedDict):
    """Shared state passed between all LangGraph agent nodes."""
    user_id: str
    session_id: str
    user_message: str
    sentiment: Optional[str]
    sentiment_confidence: Optional[float]
    retrieved_biography: Optional[str]
    retrieved_memory: Optional[str]
    response: Optional[str]
    session_log: List[dict]
    session_end: bool


def route_after_mood(state: AgentState) -> str:
    """Route to reminiscence or calm_redirect based on sentiment."""
    if state.get("sentiment") == "distressed":
        return "calm_redirect"
    return "reminiscence_agent"


def check_session_end(state: AgentState) -> str:
    """Trigger report agent if session is ending, otherwise finish."""
    if state.get("session_end"):
        return "report_agent"
    return END


def build_graph():
    """Build and return the compiled LangGraph state graph."""
    # Import here to avoid circular imports
    from agents.mood import classify_mood
    from agents.reminiscence import generate_response, calm_redirect
    from agents.report import generate_report

    graph = StateGraph(AgentState)

    graph.add_node("mood_agent", classify_mood)
    graph.add_node("reminiscence_agent", generate_response)
    graph.add_node("calm_redirect", calm_redirect)
    graph.add_node("report_agent", generate_report)

    graph.set_entry_point("mood_agent")

    graph.add_conditional_edges(
        "mood_agent",
        route_after_mood,
        {"reminiscence_agent": "reminiscence_agent", "calm_redirect": "calm_redirect"},
    )
    graph.add_conditional_edges(
        "reminiscence_agent",
        check_session_end,
        {END: END, "report_agent": "report_agent"},
    )
    graph.add_conditional_edges(
        "calm_redirect",
        check_session_end,
        {END: END, "report_agent": "report_agent"},
    )
    graph.add_edge("report_agent", END)

    return graph.compile()
