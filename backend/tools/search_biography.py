# Biography search tool — Supabase pgvector similarity search for relevant patient memories
import os
from openai import AsyncOpenAI
from db.supabase_client import search_embeddings


async def search_biography(user_id: str, query: str) -> list:
    """Search patient biography embeddings in Supabase pgvector and return top matching chunks."""
    openai = AsyncOpenAI(api_key=os.environ["OPENAI_API_KEY"])
    embedding_response = await openai.embeddings.create(
        model="text-embedding-3-small",
        input=query,
    )
    query_embedding = embedding_response.data[0].embedding
    results = await search_embeddings(user_id=user_id, query_embedding=query_embedding)
    return [r["content"] for r in results]
