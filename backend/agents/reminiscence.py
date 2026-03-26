# Reminiscence Agent — retrieves biography RAG + Mem0 memories and generates warm response
from agents.supervisor import AgentState


async def generate_response(state: AgentState) -> AgentState:
    """Retrieve relevant biography chunks and past memories, then generate a warm personalised response."""
    pass
