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
from app.tools.web_search import WebSearchConnector

logger = structlog.get_logger()
settings = get_settings()


class SourceDiscoveryAgent:
    """Discovers and validates real-world sources for research tasks."""

    def __init__(self, gateway: AIGateway, db: AsyncSession, session: ResearchSession):
        self.gateway = gateway
        self.db = db
        self.session = session
        self.search_connector = WebSearchConnector()

    async def execute(self, plan: dict) -> AgentResult:
        """Discover real sources for all research tasks."""
        all_sources = []
        errors = []
        tasks = plan.get("tasks", [])

        # 1. Search for each research sub-task
        for task in tasks:
            queries = task.get("search_queries", [])
            if not queries:
                queries = [task.get("objective", "")]

            for query in queries[:2]:
                try:
                    logger.info("Discovering sources for query", query=query)
                    sources = await self.search_connector.search(query, num_results=4)
                    all_sources.extend(sources)
                except Exception as e:
                    logger.warning("Search query failed", query=query, error=str(e))
                    errors.append(f"Query '{query}': {str(e)}")

        # 2. Also search for the primary research question
        try:
            primary_sources = await self.search_connector.search(self.session.question, num_results=5)
            all_sources.extend(primary_sources)
        except Exception as e:
            logger.warning("Primary question search failed", error=str(e))

        # 3. Deduplicate by normalized URL
        seen_urls = set()
        unique_sources = []
        for s in all_sources:
            url = (s.get("url") or "").strip()
            if not url:
                continue
            norm_url = url.split("#")[0].rstrip("/").lower()
            if norm_url not in seen_urls:
                seen_urls.add(norm_url)
                unique_sources.append(s)

        # 4. If search returned nothing, use AI query refinement
        if not unique_sources:
            logger.warning("Live search returned 0 sources, attempting AI query expansion")
            try:
                ai_sources = await self._search_via_ai(plan)
                for s in ai_sources:
                    if s.get("url") and s["url"] not in seen_urls:
                        seen_urls.add(s["url"])
                        unique_sources.append(s)
            except Exception as e:
                logger.error("AI source discovery failed", error=str(e))

        # 5. Save verified sources to database
        db_sources = []
        for source_data in unique_sources:
            source = Source(
                session_id=self.session.id,
                title=source_data.get("title", "Verified Source")[:500],
                url=source_data.get("url"),
                publisher=source_data.get("publisher", "Web Source")[:255] if source_data.get("publisher") else None,
                source_type=source_data.get("source_type", "industry"),
                status="discovered",
                metadata_json={
                    "snippet": source_data.get("snippet", ""),
                    "published_date": source_data.get("published_date"),
                    "relevance_score": source_data.get("relevance_score", 0.85),
                },
            )
            self.db.add(source)
            await self.db.flush()
            source_data["source_id"] = str(source.id)
            db_sources.append(source_data)

        await self.db.commit()

        logger.info("Discovered and saved sources", total=len(db_sources))

        return AgentResult(
            status="success" if db_sources else "partial",
            result=db_sources,
            errors=errors,
            metadata={"sources_found": len(db_sources)},
        )

    async def _search_via_ai(self, plan: dict) -> list[dict]:
        """Generate search queries and execute search for each."""
        messages = [
            {"role": "system", "content": "You are a research query specialist. Return 3 precise web search queries for this topic as JSON: {\"queries\": [\"...\"]}"},
            {"role": "user", "content": f"Topic: {self.session.question}"},
        ]
        resp = await self.gateway.generate(messages, agent_name="source_discovery", session_id=self.session.id)
        data = resp.structured_output or {}
        queries = data.get("queries", [self.session.question])
        results = []
        for q in queries:
            r = await self.search_connector.search(q, 3)
            results.extend(r)
        return results
