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
            "match_threshold": 0.7,
            "match_count": top_k,
        }).execute()
        return result.data or []
    except Exception:
        # Return empty if function not yet available (schema cache lag) or no data
        return []
