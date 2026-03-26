# Ingestion pipeline — processes biography text and stores embeddings in Supabase


async def ingest_biography(
    user_id: str,
    biography: str,
    family_members: list,
    favourite_topics: list,
) -> dict:
    """Chunk biography text, generate embeddings via OpenAI, and store in Supabase pgvector."""
    pass
