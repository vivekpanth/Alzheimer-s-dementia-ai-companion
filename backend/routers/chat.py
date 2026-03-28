# Chat router — handles POST /chat endpoint and in-memory session accumulation
from datetime import datetime
from fastapi import APIRouter
from pydantic import BaseModel
from agents.supervisor import build_graph, AgentState

router = APIRouter()
_graph = build_graph()

# In-memory session store: {session_id: {user_id, started_at, log: [], mood_log: []}}
_sessions: dict = {}


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
    # Initialise session store entry if first message
    if request.session_id not in _sessions:
        _sessions[request.session_id] = {
            "user_id": request.user_id,
            "started_at": datetime.utcnow(),
            "log": [],
            "mood_log": [],
        }

    sess = _sessions[request.session_id]
    ts = datetime.utcnow().isoformat()

    # Build state from accumulated log
    state = AgentState(
        user_id=request.user_id,
        session_id=request.session_id,
        user_message=request.message,
        sentiment=None,
        sentiment_confidence=None,
        retrieved_biography=None,
        retrieved_memory=None,
        response=None,
        session_log=list(sess["log"]),
        session_end=False,
    )

    result = await _graph.ainvoke(state)

    sentiment = result["sentiment"] or "neutral"
    reply = result["response"] or "I'm here with you. Can you tell me more?"

    # Append this turn to the session log
    sess["log"].append({"role": "user", "content": request.message, "timestamp": ts, "sentiment": sentiment})
    sess["log"].append({"role": "assistant", "content": reply, "timestamp": ts})
    sess["mood_log"].append(sentiment)

    return ChatResponse(
        response=reply,
        sentiment=sentiment,
        session_id=request.session_id,
    )
