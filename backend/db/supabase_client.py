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
    pass


async def search_embeddings(
    user_id: str,
    query_embedding: list,
    top_k: int = 5,
) -> list:
    """Perform pgvector similarity search and return top_k matching chunks."""
    pass
