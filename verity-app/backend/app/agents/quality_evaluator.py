# =============================================================================
# VERITY — Quality Evaluator Agent
# =============================================================================
from __future__ import annotations

import json

import structlog
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.gateway import AIGateway
from app.agents.contracts import AgentResult
from app.models import (
    ResearchSession, Claim, Evidence, Source, Report,
    Contradiction, Evaluation,
)

logger = structlog.get_logger()


class QualityEvaluatorAgent:
    """Evaluates overall research quality with configurable thresholds."""

    def __init__(self, gateway: AIGateway, db: AsyncSession, session: ResearchSession):
        self.gateway = gateway
        self.db = db
        self.session = session

    async def execute(self) -> AgentResult:
        """Run quality evaluation on the completed research."""
        scores = {}

        # Retrieval metrics
        total_sources = await self.db.scalar(
            select(func.count()).select_from(Source).where(Source.session_id == self.session.id)
        ) or 0
        validated_sources = await self.db.scalar(
            select(func.count()).select_from(Source).where(
                Source.session_id == self.session.id,
                Source.status.in_(["validated", "ingested"]),
            )
        ) or 0
        scores["source_count"] = total_sources
        scores["source_validation_rate"] = validated_sources / max(total_sources, 1)

        # Evidence metrics
        total_claims = await self.db.scalar(
            select(func.count()).select_from(Claim).where(Claim.session_id == self.session.id)
        ) or 0
        supported_claims = await self.db.scalar(
            select(func.count()).select_from(Claim).where(
                Claim.session_id == self.session.id,
                Claim.support_status == "supported",
            )
        ) or 0
        scores["claim_count"] = total_claims
        scores["support_rate"] = supported_claims / max(total_claims, 1)

        # Citation metrics
        total_evidence = await self.db.scalar(
            select(func.count()).select_from(Evidence)
            .join(Claim, Evidence.claim_id == Claim.id)
            .where(Claim.session_id == self.session.id)
        ) or 0
        scores["evidence_count"] = total_evidence
        scores["evidence_per_claim"] = total_evidence / max(total_claims, 1)

        # Contradiction metrics
        contradiction_count = await self.db.scalar(
            select(func.count()).select_from(Contradiction)
            .where(Contradiction.session_id == self.session.id)
        ) or 0
        scores["contradiction_count"] = contradiction_count

        # Overall quality score (0-1)
        quality_score = min(1.0, (
            (scores["support_rate"] * 0.4) +
            (min(scores["evidence_per_claim"] / 3, 1.0) * 0.3) +
            (min(total_sources / 5, 1.0) * 0.2) +
            (0.1 if total_claims > 0 else 0.0)
        ))
        scores["overall_quality"] = round(quality_score, 3)

        # Save evaluation
        evaluation = Evaluation(
            session_id=self.session.id,
            evaluation_type="overall",
            scores=scores,
            passed=quality_score >= 0.3,  # Configurable threshold
        )
        self.db.add(evaluation)

        # Update report quality score
        result = await self.db.execute(
            select(Report).where(Report.session_id == self.session.id)
        )
        report = result.scalar_one_or_none()
        if report:
            report.quality_score = quality_score
            report.citation_accuracy = scores["support_rate"]

        await self.db.flush()

        return AgentResult(
            status="success",
            result=scores,
            metadata={"scores": scores, "passed": quality_score >= 0.3},
        )
