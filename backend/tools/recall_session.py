# Session recall tool — retrieves past session memories from Mem0 (async client)
import os
from mem0 import AsyncMemoryClient

_mem0: AsyncMemoryClient | None = None


def _get_mem0() -> AsyncMemoryClient:
    """Lazily initialise async Mem0 client so dotenv is loaded before first use."""
    global _mem0
    if _mem0 is None:
        _mem0 = AsyncMemoryClient(api_key=os.environ["MEM0_API_KEY"])
    return _mem0


async def recall_session(user_id: str, query: str) -> list:
    """Retrieve relevant memories from previous sessions using Mem0 API."""
    try:
        results = await _get_mem0().search(query=query, user_id=user_id, limit=3, filters={"user_id": user_id})
        return [m["memory"] for m in results]
    except Exception:
        return []


async def save_to_memory(user_id: str, message: str, session_id: str, sentiment: str) -> None:
    """Save a patient message to Mem0 for cross-session recall."""
    await _get_mem0().add(
        messages=[{"role": "user", "content": message}],
        user_id=user_id,
        metadata={"session_id": session_id, "sentiment": sentiment},
    )
