# Ingest router — handles POST /ingest endpoint for caregiver onboarding data
from fastapi import APIRouter, UploadFile, File, Form
from pydantic import BaseModel
from typing import List

router = APIRouter()


class IngestResponse(BaseModel):
    """Response model for the /ingest endpoint."""

    status: str
    chunks_stored: int
    photos_captioned: int


@router.post("/ingest", response_model=IngestResponse)
async def ingest(
    user_id: str = Form(...),
    biography: str = Form(...),
    family_members: str = Form(""),
    favourite_topics: str = Form(""),
    photos: List[UploadFile] = File(default=[]),
) -> IngestResponse:
    """Receive caregiver onboarding data, run ingestion pipeline, return indexing summary."""
    return IngestResponse(
        status="pipeline not yet connected",
        chunks_stored=0,
        photos_captioned=0,
    )
