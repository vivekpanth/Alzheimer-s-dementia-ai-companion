# Ingestion pipeline — processes biography text and stores embeddings in Supabase
import os
from openai import AsyncOpenAI
from db.supabase_client import store_embedding

_CHUNK_SIZE = 300  # characters per chunk


def _chunk_text(text: str) -> list[str]:
    """Split biography text into overlapping chunks for better RAG recall."""
    words = text.split()
    chunks = []
    chunk_words = _CHUNK_SIZE // 5  # approx words per chunk
    step = chunk_words - 10         # 10-word overlap
    for i in range(0, len(words), step):
        chunk = " ".join(words[i:i + chunk_words])
        if chunk:
            chunks.append(chunk)
    return chunks


async def ingest_biography(
    user_id: str,
    biography: str,
    family_members: list,
    favourite_topics: list,
) -> dict:
    """Chunk biography text, generate embeddings via OpenAI, and store in Supabase pgvector."""
    chunks = _chunk_text(biography)

    # Add family members as extra context chunks
    if family_members:
        family_text = "Family members: " + ", ".join(family_members)
        chunks.append(family_text)

    if favourite_topics:
        topics_text = "Favourite topics: " + ", ".join(favourite_topics)
        chunks.append(topics_text)

    openai = AsyncOpenAI(api_key=os.environ["OPENAI_API_KEY"])
    stored = 0
    for chunk in chunks:
        embedding_response = await openai.embeddings.create(
            model="text-embedding-3-small",
            input=chunk,
        )
        embedding = embedding_response.data[0].embedding
        await store_embedding(
            user_id=user_id,
            chunk=chunk,
            embedding=embedding,
            metadata={"source": "text_bio"},
        )
        stored += 1

    return {"chunks_stored": stored}
