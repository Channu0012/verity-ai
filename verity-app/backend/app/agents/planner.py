# =============================================================================
# VERITY — Planner Agent
# =============================================================================
# Converts user question into structured research tasks.
# Context boundary: knows the question, can generate tasks, nothing else.
# =============================================================================
from __future__ import annotations

import json
import uuid

import structlog
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.gateway import AIGateway
from app.agents.contracts import AgentContext, AgentResult
from app.models import ResearchSession, ResearchTask

logger = structlog.get_logger()

PLANNER_SYSTEM_PROMPT = """You are a research planning agent for VERITY, an evidence-first AI research engine.

Your role: Convert the user's research question into a structured set of research tasks (sub-questions).

CONTEXT BOUNDARY:
- WHAT I KNOW: The user's research question and selected research mode.
- WHAT I CAN DO: Generate research tasks with objectives, priorities, and dependencies.
- WHAT I CANNOT DO: Search the web, retrieve documents, or generate reports.
- WHAT I MUST RETURN: A JSON object with research tasks.

RULES:
- Break the question into 3-8 focused sub-questions depending on mode.
- Each task must have a clear, specific objective.
- Include a "counter-evidence" task to search for opposing viewpoints.
- Assign priorities (1=highest, 5=lowest).
- Identify dependencies between tasks.
- Do not fabricate facts or sources.

OUTPUT SCHEMA (JSON):
{
  "research_summary": "Brief summary of the research plan",
  "tasks": [
    {
      "task_number": 1,
      "objective": "Specific research objective",
      "priority": 1,
      "required_evidence": "What evidence is needed",
      "source_requirements": "Type of sources needed",
      "search_queries": ["query1", "query2"],
      "dependencies": []
    }
  ]
}"""


class PlannerAgent:
    """Research planner: question → structured research tasks."""

    def __init__(self, gateway: AIGateway, db: AsyncSession, session: ResearchSession):
        self.gateway = gateway
        self.db = db
        self.session = session

    async def execute(self) -> AgentResult:
        """Generate a research plan from the user's question."""
        mode_config = {
            "quick": {"min_tasks": 3, "max_tasks": 4},
            "standard": {"min_tasks": 4, "max_tasks": 6},
            "deep": {"min_tasks": 6, "max_tasks": 8},
        }
        config = mode_config.get(self.session.mode, mode_config["standard"])

        messages = [
            {"role": "system", "content": PLANNER_SYSTEM_PROMPT},
            {"role": "user", "content": (
                f"Research Question: {self.session.question}\n"
                f"Research Mode: {self.session.mode}\n"
                f"Generate {config['min_tasks']}-{config['max_tasks']} focused research tasks.\n"
                f"Respond with valid JSON only."
            )},
        ]

        try:
            response = await self.gateway.generate(
                messages=messages,
                temperature=0.2,
                max_tokens=2048,
                response_format={"type": "json_object"},
                agent_name="planner",
                session_id=self.session.id,
            )

            plan = response.structured_output
            if not plan:
                plan = json.loads(response.content)

            # Save tasks to database
            tasks = plan.get("tasks", [])
            for task_data in tasks:
                task = ResearchTask(
                    session_id=self.session.id,
                    task_number=task_data.get("task_number", 0),
                    objective=task_data.get("objective", ""),
                    priority=task_data.get("priority", 3),
                    required_evidence=task_data.get("required_evidence", ""),
                    source_requirements=task_data.get("source_requirements", ""),
                    dependencies=task_data.get("dependencies", []),
                    status="pending",
                )
                self.db.add(task)

            await self.db.flush()

            return AgentResult(
                status="success",
                result=plan,
                tokens_used=response.total_tokens,
                cost=response.estimated_cost,
                metadata={"task_count": len(tasks)},
            )

        except Exception as e:
            logger.error("Planner agent failed", error=str(e))
            return AgentResult(status="error", errors=[str(e)])
