# Report router — handles GET /report/{user_id} endpoint for caregiver dashboard
from datetime import date
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List
from db.supabase_client import get_client

router = APIRouter()


class ConcernItem(BaseModel):
    """A single flagged distress concern from the session."""
    text: str
    timestamp: str
    occurrences_this_week: int


class ReportResponse(BaseModel):
    """Response model for the GET /report/{user_id} endpoint."""
    user_id: str
    date: str
    duration_minutes: int
    summary: str
    mood_trend: List[str]
    concerns: List[ConcernItem]


@router.get("/report/{user_id}", response_model=ReportResponse)
async def get_report(user_id: str) -> ReportResponse:
    """Return the latest session report for a patient, including mood trend and concern flags."""
    result = (
        get_client()
        .table("caregiver_reports")
        .select("*")
        .eq("user_id", user_id)
        .order("created_at", desc=True)
        .limit(1)
        .execute()
    )

    if not result.data:
        # No report yet — return empty state
        return ReportResponse(
            user_id=user_id,
            date=str(date.today()),
            duration_minutes=0,
            summary="No session report available yet. Start a conversation to generate a report.",
            mood_trend=["neutral"],
            concerns=[],
        )

    report = result.data[0]
    concerns = [
        ConcernItem(
            text=c.get("text", ""),
            timestamp=c.get("timestamp", ""),
            occurrences_this_week=c.get("occurrences_this_week", 1),
        )
        for c in (report.get("concerns") or [])
    ]

    # Fetch mood trend from the linked session
    session_result = (
        get_client()
        .table("sessions")
        .select("mood_trend, duration_minutes")
        .eq("session_id", report["session_id"])
        .limit(1)
        .execute()
    )
    mood_trend = ["neutral"]
    duration = 0
    if session_result.data:
        mood_trend = session_result.data[0].get("mood_trend") or ["neutral"]
        duration = session_result.data[0].get("duration_minutes") or 0

    return ReportResponse(
        user_id=user_id,
        date=str(report.get("report_date", date.today())),
        duration_minutes=duration,
        summary=report.get("summary", ""),
        mood_trend=mood_trend,
        concerns=concerns,
    )
