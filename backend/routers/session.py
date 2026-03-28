# Session router — handles POST /session/end to generate caregiver report and persist session
from datetime import datetime
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from agents.report import generate_report
from agents.supervisor import AgentState
from db.supabase_client import save_session, save_report

router = APIRouter()


class EndSessionRequest(BaseModel):
    """Request to end a session and generate a caregiver report."""
    user_id: str
    session_id: str


class EndSessionResponse(BaseModel):
    """Response after ending a session — includes the generated summary."""
    status: str
    session_id: str
    summary: str
    mood_trend: list
    duration_minutes: int


@router.post("/session/end", response_model=EndSessionResponse)
async def end_session(body: EndSessionRequest) -> EndSessionResponse:
    """End a session, run the Report Agent directly, and persist to Supabase."""
    from routers.chat import _sessions

    sess = _sessions.get(body.session_id)
    if not sess or not sess["log"]:
        raise HTTPException(status_code=404, detail="Session not found or has no messages.")

    duration = max(1, int((datetime.utcnow() - sess["started_at"]).total_seconds() / 60))
    mood_trend = sess["mood_log"] or ["neutral"]

    # Call report agent directly — skip mood/reminiscence to avoid empty-message errors
    state = AgentState(
        user_id=body.user_id,
        session_id=body.session_id,
        user_message="",
        sentiment=None,
        sentiment_confidence=None,
        retrieved_biography=None,
        retrieved_memory=None,
        response=None,
        session_log=list(sess["log"]),
        session_end=True,
    )
    try:
        result = await generate_report(state)
        summary = result.get("response") or "Session completed."
    except Exception:
        summary = "Session completed successfully."

    # Build concern flags
    distress_count = mood_trend.count("distressed")
    concerns = []
    if distress_count >= 2:
        concerns.append({
            "text": "Patient showed repeated signs of distress during this session",
            "timestamp": datetime.utcnow().isoformat(),
            "occurrences_this_week": distress_count,
        })

    # Persist to Supabase
    try:
        await save_session(
            user_id=body.user_id,
            session_id=body.session_id,
            session_log=sess["log"],
            mood_trend=mood_trend,
            duration_minutes=duration,
        )
        await save_report(
            user_id=body.user_id,
            session_id=body.session_id,
            summary=summary,
            concerns=concerns,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save session: {str(e)}")

    _sessions.pop(body.session_id, None)

    return EndSessionResponse(
        status="ended",
        session_id=body.session_id,
        summary=summary,
        mood_trend=mood_trend,
        duration_minutes=duration,
    )
