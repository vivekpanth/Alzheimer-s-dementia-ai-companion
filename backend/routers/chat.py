# Chat router — handles POST /chat endpoint for patient conversation
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()


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
    return ChatResponse(
        response="Agent pipeline not yet connected.",
        sentiment="neutral",
        session_id=request.session_id,
    )
