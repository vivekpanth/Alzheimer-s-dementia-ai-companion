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
    photo_descriptions: str = Form("[]"),
    photos: List[UploadFile] = File(default=[]),
) -> IngestResponse:
    """Receive caregiver onboarding data, run ingestion pipeline, return indexing summary."""
    import json

    family_list = [f.strip() for f in family_members.split(",")] if family_members else []
    topics_list = [t.strip() for t in favourite_topics.split(",")] if favourite_topics else []

    result = await ingest_biography(
        user_id=user_id,
        biography=biography,
        family_members=family_list,
        favourite_topics=topics_list,
    )

    # Parse caregiver descriptions for each photo
    try:
        descriptions = json.loads(photo_descriptions)
    except json.JSONDecodeError:
        descriptions = []

    photo_bytes_list = [await p.read() for p in photos if p.filename]

    # Pair each photo with its caregiver description
    photo_pairs = []
    for i, photo_bytes in enumerate(photo_bytes_list):
        desc = descriptions[i] if i < len(descriptions) else ""
        photo_pairs.append({"bytes": photo_bytes, "description": desc})

    captions = await caption_photos(user_id=user_id, photo_pairs=photo_pairs) if photo_pairs else []

    return IngestResponse(
        status="indexed",
        chunks_stored=result["chunks_stored"],
        photos_captioned=len(captions),
    )
