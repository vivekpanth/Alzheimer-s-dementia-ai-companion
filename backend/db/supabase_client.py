# Supabase client — connection setup and helper functions for all database operations
import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

_supabase_url: str = os.environ["SUPABASE_URL"]
_supabase_key: str = os.environ["SUPABASE_SERVICE_KEY"]

_client: Client = create_client(_supabase_url, _supabase_key)


def get_client() -> Client:
    """Return the initialised Supabase client instance."""
    return _client


async def store_embedding(
    user_id: str,
    chunk: str,
    embedding: list,
    metadata: dict,
) -> None:
    """Store a text chunk and its embedding vector in the Supabase pgvector table."""
    get_client().table("biography_chunks").insert({
        "user_id": user_id,
        "content": chunk,
        "embedding": embedding,
        "metadata": metadata,
    }).execute()


async def search_embeddings(
    user_id: str,
    query_embedding: list,
    top_k: int = 5,
) -> list:
    """Perform pgvector similarity search and return top_k matching chunks."""
    try:
        result = get_client().rpc("search_biography", {
            "query_embedding": query_embedding,
            "match_user_id": user_id,
            "match_threshold": 0.4,
            "match_count": top_k,
        }).execute()
        return result.data or []
    except Exception:
        return []


async def save_session(
    user_id: str,
    session_id: str,
    session_log: list,
    mood_trend: list,
    duration_minutes: int,
) -> None:
    """Upsert session record with full log, mood trend, and duration."""
    get_client().table("sessions").upsert({
        "session_id": session_id,
        "user_id": user_id,
        "session_log": session_log,
        "mood_trend": mood_trend,
        "duration_minutes": duration_minutes,
        "is_complete": True,
    }, on_conflict="session_id").execute()


async def save_report(
    user_id: str,
    session_id: str,
    summary: str,
    concerns: list,
) -> None:
    """Insert caregiver report for this session."""
    get_client().table("caregiver_reports").insert({
        "user_id": user_id,
        "session_id": session_id,
        "summary": summary,
        "concerns": concerns,
    }).execute()
