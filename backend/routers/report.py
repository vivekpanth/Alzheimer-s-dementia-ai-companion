# Report router — handles GET /report/{user_id} endpoint for caregiver dashboard
from fastapi import APIRouter
from pydantic import BaseModel
from typing import List

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
    return ReportResponse(
        user_id=user_id,
        date="2026-03-25",
        duration_minutes=0,
        summary="Report pipeline not yet connected.",
        mood_trend=["neutral"],
        concerns=[],
    )
