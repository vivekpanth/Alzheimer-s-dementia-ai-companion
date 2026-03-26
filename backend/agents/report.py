# Report Agent — generates end-of-session summary for caregiver dashboard
from agents.supervisor import AgentState


async def generate_report(state: AgentState) -> AgentState:
    """Summarise session log into plain-English caregiver report with mood trend and concern flags."""
    pass
