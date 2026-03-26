# Ingest router — handles POST /ingest endpoint for caregiver onboarding data
from fastapi import APIRouter, UploadFile, File, Form
from pydantic import BaseModel
from typing import List
from pipelines.ingest import ingest_biography
from pipelines.caption import caption_photos

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
    family_list = [f.strip() for f in family_members.split(",")] if family_members else []
    topics_list = [t.strip() for t in favourite_topics.split(",")] if favourite_topics else []

    result = await ingest_biography(
        user_id=user_id,
        biography=biography,
        family_members=family_list,
        favourite_topics=topics_list,
    )

    photo_bytes_list = [await p.read() for p in photos if p.filename]
    captions = await caption_photos(user_id=user_id, photo_files=photo_bytes_list) if photo_bytes_list else []

    return IngestResponse(
        status="indexed",
        chunks_stored=result["chunks_stored"],
        photos_captioned=len(captions),
    )
