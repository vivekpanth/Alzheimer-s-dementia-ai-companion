# Patient router — handles patient management endpoints (info, delete, link, multi-patient)
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from db.supabase_client import get_client

router = APIRouter()


class PatientInfoResponse(BaseModel):
    """Summary of stored data for a patient."""
    user_id: str
    chunks_stored: int
    sessions_count: int


class DeleteResponse(BaseModel):
    """Response after deleting a patient's data."""
    status: str
    user_id: str


class LinkPatientRequest(BaseModel):
    """Request to set the active/selected patient for chat."""
    auth_user_id: str
    patient_user_id: Optional[str]


class LinkPatientResponse(BaseModel):
    """Response after linking a patient."""
    status: str
    patient_user_id: Optional[str]


class EnsureCaregiverRequest(BaseModel):
    """Request to ensure a caregiver row exists — creates it if missing."""
    auth_user_id: str
    email: str
    full_name: str


class AddPatientRequest(BaseModel):
    """Request to register a new patient under a caregiver."""
    auth_user_id: str
    patient_user_id: str
    display_name: Optional[str] = None


class RemovePatientRequest(BaseModel):
    """Request to remove a patient from a caregiver's list (does not delete patient data)."""
    auth_user_id: str
    patient_user_id: str


@router.get("/patient/{user_id}/profile")
async def get_patient_profile(user_id: str) -> dict:
    """Return raw profile data (biography, family, topics) and photo memory captions."""
    try:
        profile_res = get_client().table("patient_profiles") \
            .select("biography_text, family_members, favourite_topics, full_name, updated_at") \
            .eq("user_id", user_id) \
            .maybe_single() \
            .execute()

        photos_res = get_client().table("biography_chunks") \
            .select("content, metadata, created_at") \
            .eq("user_id", user_id) \
            .eq("metadata->>source", "photo_caption") \
            .order("created_at") \
            .execute()

        return {
            "profile": profile_res.data,
            "photo_memories": photos_res.data or [],
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load profile: {str(e)}")


@router.get("/patient/{user_id}", response_model=PatientInfoResponse)
async def get_patient_info(user_id: str) -> PatientInfoResponse:
    """Return a summary of stored memory chunks and sessions for a patient."""
    chunks = get_client().table("biography_chunks").select("id", count="exact").eq("user_id", user_id).execute()
    sessions = get_client().table("sessions").select("id", count="exact").eq("user_id", user_id).execute()
    return PatientInfoResponse(
        user_id=user_id,
        chunks_stored=chunks.count or 0,
        sessions_count=sessions.count or 0,
    )


@router.get("/caregiver/{auth_user_id}/patients")
async def list_caregiver_patients(auth_user_id: str):
    """Return all patients linked to a caregiver, with active flag."""
    try:
        caregiver_res = get_client().table("caregivers") \
            .select("patient_user_id") \
            .eq("auth_user_id", auth_user_id) \
            .execute()

        active_id = caregiver_res.data[0].get("patient_user_id") if caregiver_res.data else None

        patients_res = get_client().table("caregiver_patients") \
            .select("patient_user_id, display_name, created_at") \
            .eq("caregiver_id", auth_user_id) \
            .execute()

        return [
            {
                "patient_user_id": r["patient_user_id"],
                "display_name": r.get("display_name") or "",
                "created_at": r["created_at"],
                "is_active": r["patient_user_id"] == active_id,
            }
            for r in (patients_res.data or [])
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list patients: {str(e)}")


@router.post("/caregiver/ensure")
async def ensure_caregiver(body: EnsureCaregiverRequest) -> dict:
    """Create caregiver row if it doesn't exist. Safe to call on every login."""
    existing = get_client().table("caregivers") \
        .select("*") \
        .eq("auth_user_id", body.auth_user_id) \
        .execute()

    if existing.data:
        return existing.data[0]

    result = get_client().table("caregivers").insert({
        "auth_user_id": body.auth_user_id,
        "email": body.email,
        "full_name": body.full_name,
    }).execute()

    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create caregiver profile")

    return result.data[0]


@router.post("/caregiver/patients/add")
async def add_patient_to_caregiver(body: AddPatientRequest) -> dict:
    """Register a patient under a caregiver and make them the active patient."""
    try:
        get_client().table("caregiver_patients").upsert({
            "caregiver_id": body.auth_user_id,
            "patient_user_id": body.patient_user_id,
            "display_name": body.display_name,
        }, on_conflict="caregiver_id,patient_user_id").execute()

        get_client().table("caregivers") \
            .update({"patient_user_id": body.patient_user_id}) \
            .eq("auth_user_id", body.auth_user_id) \
            .execute()

        return {"status": "added", "patient_user_id": body.patient_user_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to add patient: {str(e)}")


@router.delete("/caregiver/patients/remove")
async def remove_patient_from_caregiver(body: RemovePatientRequest) -> dict:
    """Remove a patient from a caregiver's list. If active, auto-selects next or null."""
    get_client().table("caregiver_patients") \
        .delete() \
        .eq("caregiver_id", body.auth_user_id) \
        .eq("patient_user_id", body.patient_user_id) \
        .execute()

    caregiver = get_client().table("caregivers") \
        .select("patient_user_id") \
        .eq("auth_user_id", body.auth_user_id) \
        .maybe_single().execute()

    if caregiver.data and caregiver.data.get("patient_user_id") == body.patient_user_id:
        remaining = get_client().table("caregiver_patients") \
            .select("patient_user_id") \
            .eq("caregiver_id", body.auth_user_id) \
            .limit(1).execute()
        next_id = remaining.data[0]["patient_user_id"] if remaining.data else None
        get_client().table("caregivers") \
            .update({"patient_user_id": next_id}) \
            .eq("auth_user_id", body.auth_user_id) \
            .execute()

    return {"status": "removed", "patient_user_id": body.patient_user_id}


@router.patch("/caregiver/link", response_model=LinkPatientResponse)
async def link_patient(body: LinkPatientRequest) -> LinkPatientResponse:
    """Set the active/selected patient for chat. Uses service key — bypasses RLS."""
    result = get_client().table("caregivers") \
        .update({"patient_user_id": body.patient_user_id}) \
        .eq("auth_user_id", body.auth_user_id) \
        .execute()

    if not result.data:
        raise HTTPException(
            status_code=404,
            detail=f"Caregiver not found. Call POST /caregiver/ensure first. auth_user_id={body.auth_user_id}"
        )

    return LinkPatientResponse(status="linked", patient_user_id=body.patient_user_id)


@router.delete("/patient/{user_id}", response_model=DeleteResponse)
async def delete_patient(user_id: str) -> DeleteResponse:
    """Delete all data for a patient — chunks, sessions, reports, and profile."""
    client = get_client()
    client.table("caregiver_reports").delete().eq("user_id", user_id).execute()
    client.table("sessions").delete().eq("user_id", user_id).execute()
    client.table("biography_chunks").delete().eq("user_id", user_id).execute()
    client.table("patient_profiles").delete().eq("user_id", user_id).execute()
    return DeleteResponse(status="deleted", user_id=user_id)
