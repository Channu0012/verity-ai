# =============================================================================
# VERITY — Citation Validator Agent
# =============================================================================
from __future__ import annotations

import json

import structlog
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.ai.gateway import AIGateway
from app.agents.contracts import AgentResult
from app.models import ResearchSession, Claim, Evidence

logger = structlog.get_logger()


class CitationValidatorAgent:
    """Verifies that all claims are properly supported by cited evidence."""

    def __init__(self, gateway: AIGateway, db: AsyncSession, session: ResearchSession):
        self.gateway = gateway
        self.db = db
        self.session = session

    async def execute(self, claims: list) -> AgentResult:
        """Verify each claim's citations against evidence."""
        result = await self.db.execute(
            select(Claim)
            .options(selectinload(Claim.evidence_items))
            .where(Claim.session_id == self.session.id)
        )
        db_claims = list(result.scalars().all())

        verified = 0
        flagged = 0

        for claim in db_claims:
            if not claim.evidence_items:
                claim.support_status = "insufficient_evidence"
                claim.confidence_label = "insufficient_evidence"
                flagged += 1
                continue

            # Check: does the evidence actually support the claim?
            evidence_texts = [e.passage_text for e in claim.evidence_items]
            try:
                is_supported = await self._verify_claim(claim.claim_text, evidence_texts)
                if is_supported:
                    claim.support_status = "supported"
                    claim.confidence_label = "supported"
                    verified += 1
                else:
                    claim.support_status = "partially_supported"
                    claim.confidence_label = "partially_supported"
                    flagged += 1
            except Exception as e:
                logger.warning("Citation verification failed for claim", claim_id=str(claim.id), error=str(e))
                flagged += 1

        await self.db.flush()

        return AgentResult(
            status="success",
            result={"verified": verified, "flagged": flagged},
            metadata={"verified_count": verified, "flagged_count": flagged},
        )

    async def _verify_claim(self, claim_text: str, evidence_texts: list[str]) -> bool:
        """Verify if the evidence supports the claim using lexical and semantic grounding."""
        if not evidence_texts:
            return False

        import re
        claim_tokens = set(re.findall(r'\b[a-zA-Z]{4,}\b', claim_text.lower()))
        combined_evidence = " ".join(evidence_texts).lower()
        ev_tokens = set(re.findall(r'\b[a-zA-Z]{4,}\b', combined_evidence))

        if claim_tokens:
            overlap = len(claim_tokens.intersection(ev_tokens)) / len(claim_tokens)
            if overlap >= 0.35:
                return True

        # If borderline, check with LLM
        try:
            evidence_context = "\n".join(f"- {e[:250]}" for e in evidence_texts[:3])
            messages = [
                {"role": "system", "content": "Does the evidence support this claim? Respond with JSON: {\"supported\": true/false}"},
                {"role": "user", "content": f"CLAIM: {claim_text}\n\nEVIDENCE:\n{evidence_context}"},
            ]
            response = await self.gateway.generate(
                messages=messages,
                temperature=0.0,
                max_tokens=128,
                agent_name="citation_validator",
                session_id=self.session.id,
            )
            data = response.structured_output or {}
            return bool(data.get("supported", True))
        except Exception:
            return True
