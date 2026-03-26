# Session recall tool — retrieves past session memories from Mem0
import os
from mem0 import MemoryClient

_mem0 = MemoryClient(api_key=os.environ.get("MEM0_API_KEY"))


async def recall_session(user_id: str, query: str) -> list:
    """Retrieve relevant memories from previous sessions using Mem0 API."""
    try:
        results = _mem0.search(query=query, user_id=user_id, limit=3, filters={"user_id": user_id})
        return [m["memory"] for m in results]
    except Exception:
        return []


async def save_to_memory(user_id: str, message: str, session_id: str, sentiment: str) -> None:
    """Save a patient message to Mem0 for cross-session recall."""
    _mem0.add(
        messages=[{"role": "user", "content": message}],
        user_id=user_id,
        metadata={"session_id": session_id, "sentiment": sentiment},
    )
