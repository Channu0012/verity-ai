# =============================================================================
# VERITY — Source Discovery Agent
# =============================================================================
from __future__ import annotations

import json
import uuid
from datetime import datetime

import structlog
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.gateway import AIGateway
from app.agents.contracts import AgentResult
from app.config import get_settings
from app.models import ResearchSession, Source

logger = structlog.get_logger()
settings = get_settings()

SEARCH_SYSTEM_PROMPT = """You are a source discovery agent for VERITY, an evidence-first AI research engine.

CONTEXT BOUNDARY:
- WHAT I KNOW: Research tasks with search queries.
- WHAT I CAN DO: Generate web search results and evaluate source quality.
- WHAT I CANNOT DO: Fabricate sources or URLs that don't exist.
- WHAT I MUST RETURN: A JSON list of discovered sources with metadata.

RULES:
- Prioritize credible sources: government, academic, major news, research organizations.
- Include the source type classification.
- Never fabricate URLs, titles, or authors.
- If you cannot find real sources, return an empty list rather than fake ones.

OUTPUT (JSON):
{
  "sources": [
    {
      "title": "Source title",
      "url": "https://...",
      "publisher": "Publisher name",
      "source_type": "academic|government|company|news|research_organization|other",
      "relevance": "Why this source is relevant",
      "snippet": "Key excerpt from the source"
    }
  ]
}"""


class SourceDiscoveryAgent:
    """Discovers and validates sources for research tasks."""

    def __init__(self, gateway: AIGateway, db: AsyncSession, session: ResearchSession):
        self.gateway = gateway
        self.db = db
        self.session = session

    async def execute(self, plan: dict) -> AgentResult:
        """Discover sources for all research tasks."""
        all_sources = []
        errors = []
        tasks = plan.get("tasks", [])

        for task in tasks:
            try:
                task_sources = await self._search_for_task(task)
                all_sources.extend(task_sources)
            except Exception as e:
                logger.warning("Source search failed for task", task=task.get("objective"), error=str(e))
                errors.append(f"Task '{task.get('objective', 'unknown')}': {str(e)}")

        # Also try web search if API is available
        if settings.search_api_key:
            try:
                web_sources = await self._web_search(plan)
                all_sources.extend(web_sources)
            except Exception as e:
                logger.warning("Web search failed", error=str(e))
                errors.append(f"Web search: {str(e)}")

        # Deduplicate by URL
        seen_urls = set()
        unique_sources = []
        for s in all_sources:
            url = s.get("url", "")
            if url and url not in seen_urls:
                seen_urls.add(url)
                unique_sources.append(s)
            elif not url:
                unique_sources.append(s)

        # Save sources to database
        db_sources = []
        for source_data in unique_sources:
            source = Source(
                session_id=self.session.id,
                title=source_data.get("title", "Unknown Source"),
                url=source_data.get("url"),
                publisher=source_data.get("publisher"),
                source_type=source_data.get("source_type", "other"),
                status="discovered",
                metadata_json={"snippet": source_data.get("snippet", ""), "relevance": source_data.get("relevance", "")},
            )
            self.db.add(source)
            await self.db.flush()
            source_data["source_id"] = str(source.id)
            db_sources.append(source_data)

        return AgentResult(
            status="success" if not errors else "partial",
            result=db_sources,
            errors=errors,
            metadata={"sources_found": len(db_sources)},
        )

    async def _search_for_task(self, task: dict) -> list[dict]:
        """Use AI to generate relevant source suggestions for a task."""
        queries = task.get("search_queries", [task.get("objective", "")])

        messages = [
            {"role": "system", "content": SEARCH_SYSTEM_PROMPT},
            {"role": "user", "content": (
                f"Research objective: {task.get('objective', '')}\n"
                f"Search queries: {', '.join(queries)}\n"
                f"Source requirements: {task.get('source_requirements', 'Any credible source')}\n\n"
                f"Find and list the most relevant, credible sources. Respond with JSON."
            )},
        ]

        response = await self.gateway.generate(
            messages=messages,
            temperature=0.3,
            max_tokens=2048,
            response_format={"type": "json_object"},
            agent_name="source_discovery",
            session_id=self.session.id,
        )

        data = response.structured_output or json.loads(response.content)
        return data.get("sources", [])

    async def _web_search(self, plan: dict) -> list[dict]:
        """Perform actual web search using configured search API."""
        import httpx

        sources = []
        question = self.session.question

        try:
            async with httpx.AsyncClient() as client:
                resp = await client.get(
                    "https://api.kie.ai/v1/search",
                    params={"q": question, "num": 10},
                    headers={"Authorization": f"Bearer {settings.search_api_key}"},
                    timeout=15.0,
                )

                if resp.status_code == 200:
                    data = resp.json()
                    for item in data.get("results", []):
                        sources.append({
                            "title": item.get("title", ""),
                            "url": item.get("url", ""),
                            "publisher": item.get("domain", ""),
                            "source_type": "other",
                            "snippet": item.get("snippet", ""),
                            "content": item.get("content", ""),
                        })
        except Exception as e:
            logger.warning("Web search API call failed", error=str(e))

        return sources
