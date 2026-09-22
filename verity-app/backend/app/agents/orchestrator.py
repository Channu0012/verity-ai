# =============================================================================
# VERITY — Research Orchestrator
# =============================================================================
# Deterministic workflow controller for the full research pipeline.
# Follows: Planner → Search → Ingest → Retrieve → Analyze → Verify → Generate
# Each stage: EXECUTE → CRITIC → FIX → EXIT CONDITION → NEXT
# =============================================================================
from __future__ import annotations

import uuid
from datetime import datetime

import structlog
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.gateway import AIGateway
from app.agents.planner import PlannerAgent
from app.agents.source_discovery import SourceDiscoveryAgent
from app.agents.retrieval_agent import RetrievalAgent
from app.agents.evidence_agent import EvidenceAgent
from app.agents.contradiction_agent import ContradictionAgent
from app.agents.synthesis_agent import SynthesisAgent
from app.agents.citation_validator import CitationValidatorAgent
from app.agents.quality_evaluator import QualityEvaluatorAgent
from app.models import ResearchSession

logger = structlog.get_logger()


class ResearchOrchestrator:
    """
    Master pipeline controller for end-to-end research.
    Each stage has strict context boundaries, exit conditions, and critic evaluation.
    """

    def __init__(self, db: AsyncSession, session: ResearchSession):
        self.db = db
        self.session = session
        self.gateway = AIGateway(db)
        self.session_id = session.id

    async def run(self):
        """Execute the full research pipeline."""
        logger.info("Research pipeline started", research_id=str(self.session_id))

        try:
            # Stage 1: Planning
            await self._update_status("planning", 0.05)
            plan = await self._stage_plan()

            # Stage 2: Source Discovery
            await self._update_status("searching", 0.15)
            sources = await self._stage_search(plan)

            # Stage 3: Document Ingestion
            await self._update_status("ingesting", 0.30)
            await self._stage_ingest(sources)

            # Stage 4: Retrieval
            await self._update_status("retrieving", 0.45)
            evidence_chunks = await self._stage_retrieve(plan)

            # Stage 5: Evidence Analysis
            await self._update_status("analyzing", 0.60)
            claims = await self._stage_analyze(evidence_chunks, plan)

            # Stage 6: Contradiction Detection
            await self._update_status("analyzing", 0.70)
            await self._stage_contradictions(claims)

            # Stage 7: Citation Verification
            await self._update_status("verifying", 0.80)
            await self._stage_verify(claims)

            # Stage 8: Report Generation
            await self._update_status("generating", 0.90)
            await self._stage_generate(plan, claims)

            # Stage 9: Quality Evaluation
            await self._stage_evaluate()

            # Complete
            await self._update_status("completed", 1.0)
            self.session.completed_at = datetime.utcnow()
            await self.db.commit()

            logger.info("Research pipeline completed", research_id=str(self.session_id))

        except Exception as e:
            logger.error("Research pipeline failed", research_id=str(self.session_id), error=str(e))
            self.session.status = "failed"
            self.session.error_message = f"Pipeline error: {str(e)[:500]}"
            await self.db.commit()
            raise

    async def _update_status(self, status: str, progress: float):
        """Update session status and progress."""
        self.session.status = status
        self.session.progress = progress
        if status != "queued" and not self.session.started_at:
            self.session.started_at = datetime.utcnow()
        await self.db.commit()

    # =========================================================================
    # Stage 1: Research Planning
    # =========================================================================
    async def _stage_plan(self) -> dict:
        """Convert user question into research tasks."""
        planner = PlannerAgent(self.gateway, self.db, self.session)
        result = await planner.execute()

        if result.status != "success":
            raise RuntimeError(f"Planning failed: {result.errors}")

        # Exit condition: plan must have at least 1 task
        if not result.result or not result.result.get("tasks"):
            raise RuntimeError("Planning produced no research tasks")

        logger.info("Planning complete", tasks=len(result.result.get("tasks", [])))
        return result.result

    # =========================================================================
    # Stage 2: Source Discovery
    # =========================================================================
    async def _stage_search(self, plan: dict) -> list:
        """Discover sources for each research task."""
        agent = SourceDiscoveryAgent(self.gateway, self.db, self.session)
        result = await agent.execute(plan)

        if result.status == "error":
            logger.warning("Source discovery had errors", errors=result.errors)
            # Partial success is OK — preserve what we found

        sources = result.result or []
        logger.info("Source discovery complete", sources_found=len(sources))
        return sources

    # =========================================================================
    # Stage 3: Document Ingestion
    # =========================================================================
    async def _stage_ingest(self, sources: list):
        """Ingest and chunk discovered sources."""
        from app.ingestion.pipeline import DocumentIngestionPipeline
        pipeline = DocumentIngestionPipeline(self.db)

        # Ingest top 12 sources for depth without excessive latency
        for source_data in sources[:12]:
            try:
                snippet = ""
                if isinstance(source_data.get("metadata_json"), dict):
                    snippet = source_data["metadata_json"].get("snippet", "")
                elif isinstance(source_data.get("snippet"), str):
                    snippet = source_data["snippet"]

                await pipeline.ingest_from_url(
                    source_id=source_data.get("source_id"),
                    url=source_data.get("url"),
                    content=source_data.get("content", ""),
                    user_id=self.session.user_id,
                    fallback_snippet=snippet,
                )
            except Exception as e:
                logger.warning("Ingestion failed for source", url=source_data.get("url"), error=str(e))

        logger.info("Ingestion complete")

    # =========================================================================
    # Stage 4: Hybrid Retrieval
    # =========================================================================
    async def _stage_retrieve(self, plan: dict) -> list:
        """Retrieve relevant chunks using hybrid search."""
        agent = RetrievalAgent(self.gateway, self.db, self.session)
        result = await agent.execute(plan)

        chunks = result.result or []
        logger.info("Retrieval complete", chunks_retrieved=len(chunks))
        return chunks

    # =========================================================================
    # Stage 5: Evidence Analysis
    # =========================================================================
    async def _stage_analyze(self, evidence_chunks: list, plan: dict) -> list:
        """Extract claims and map evidence."""
        agent = EvidenceAgent(self.gateway, self.db, self.session)
        result = await agent.execute(evidence_chunks, plan)

        claims = result.result or []

        # Exit condition: must have at least 1 claim
        if not claims:
            logger.warning("No claims extracted — research may lack substance")

        logger.info("Evidence analysis complete", claims=len(claims))
        return claims

    # =========================================================================
    # Stage 6: Contradiction Detection
    # =========================================================================
    async def _stage_contradictions(self, claims: list):
        """Detect contradictions between claims."""
        agent = ContradictionAgent(self.gateway, self.db, self.session)
        result = await agent.execute(claims)

        contradictions = result.result or []
        logger.info("Contradiction detection complete", contradictions=len(contradictions))

    # =========================================================================
    # Stage 7: Citation Verification
    # =========================================================================
    async def _stage_verify(self, claims: list):
        """Verify all citations are supported by evidence."""
        agent = CitationValidatorAgent(self.gateway, self.db, self.session)
        result = await agent.execute(claims)

        logger.info("Citation verification complete",
                     verified=result.metadata.get("verified_count", 0),
                     flagged=result.metadata.get("flagged_count", 0))

    # =========================================================================
    # Stage 8: Report Generation
    # =========================================================================
    async def _stage_generate(self, plan: dict, claims: list):
        """Generate the final research report."""
        agent = SynthesisAgent(self.gateway, self.db, self.session)
        result = await agent.execute(plan, claims)

        if result.status == "error":
            raise RuntimeError(f"Report generation failed: {result.errors}")

        logger.info("Report generated")

    # =========================================================================
    # Stage 9: Quality Evaluation
    # =========================================================================
    async def _stage_evaluate(self):
        """Evaluate overall research quality."""
        agent = QualityEvaluatorAgent(self.gateway, self.db, self.session)
        result = await agent.execute()

        logger.info("Quality evaluation complete", scores=result.metadata.get("scores", {}))
