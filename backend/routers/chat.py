# Chat router — handles POST /chat endpoint for patient conversation
from fastapi import APIRouter
from pydantic import BaseModel
from agents.supervisor import build_graph, AgentState

router = APIRouter()
_graph = build_graph()


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
    """Receive patient message, run LangGraph agent pipeline, return AI response with sentiment."""
    state = AgentState(
        user_id=request.user_id,
        session_id=request.session_id,
        user_message=request.message,
        sentiment=None,
        sentiment_confidence=None,
        retrieved_biography=None,
        retrieved_memory=None,
        response=None,
        session_log=[],
        session_end=False,
    )
    result = await _graph.ainvoke(state)
    return ChatResponse(
        response=result["response"] or "I'm here with you. Can you tell me more?",
        sentiment=result["sentiment"] or "neutral",
        session_id=request.session_id,
    )
