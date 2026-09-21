# =============================================================================
# VERITY — Evidence Agent
# =============================================================================
from __future__ import annotations

import json

import structlog
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.gateway import AIGateway
from app.agents.contracts import AgentResult
from app.models import ResearchSession, Claim, Evidence, Source

logger = structlog.get_logger()

EVIDENCE_SYSTEM_PROMPT = """You are an evidence analysis agent for VERITY.

CONTEXT BOUNDARY:
- WHAT I KNOW: Retrieved evidence chunks and research tasks.
- WHAT I CAN DO: Extract claims, map evidence to claims, assess support.
- WHAT I CANNOT DO: Fabricate evidence or sources. Present model confidence as objective truth.
- WHAT I MUST RETURN: Structured JSON with claims and evidence mappings.

RULES:
- Extract ONLY claims directly supported by the provided evidence passages.
- Each claim must reference specific evidence passage(s).
- Classify support: supported, partially_supported, conflicting_evidence, insufficient_evidence.
- Do NOT present model confidence as objective truth.
- Label claims with types: factual, statistical, causal, comparative, predictive.
- Rate importance 1-5 (5 = critical to research question).

OUTPUT (JSON):
{
  "claims": [
    {
      "claim_text": "...",
      "claim_type": "factual|statistical|causal|comparative|predictive",
      "importance": 3,
      "evidence": [
        {
          "passage_text": "Exact text from source",
          "support_type": "supports|partially_supports|contradicts|neutral",
          "relevance_score": 0.85,
          "source_index": 0,
          "location_info": "Page 3, paragraph 2"
        }
      ]
    }
  ]
}"""


class EvidenceAgent:
    """Extracts claims and maps evidence from retrieved chunks."""

    def __init__(self, gateway: AIGateway, db: AsyncSession, session: ResearchSession):
        self.gateway = gateway
        self.db = db
        self.session = session

    async def execute(self, evidence_chunks: list, plan: dict) -> AgentResult:
        """Extract claims and map evidence."""
        if not evidence_chunks:
            return AgentResult(status="success", result=[], metadata={"reason": "no evidence to analyze"})

        # Build evidence context (respect token budget)
        evidence_text = self._build_evidence_context(evidence_chunks[:30])

        messages = [
            {"role": "system", "content": EVIDENCE_SYSTEM_PROMPT},
            {"role": "user", "content": (
                f"Research Question: {self.session.question}\n\n"
                f"EVIDENCE PASSAGES:\n{evidence_text}\n\n"
                f"Extract all important claims from the evidence. Map each claim to its supporting evidence passages. "
                f"Respond with valid JSON."
            )},
        ]

        try:
            response = await self.gateway.generate(
                messages=messages,
                temperature=0.1,
                max_tokens=4096,
                response_format={"type": "json_object"},
                agent_name="evidence",
                session_id=self.session.id,
            )

            data = response.structured_output or json.loads(response.content)
            claims_data = data.get("claims", [])

            # Get sources for this session
            from sqlalchemy import select
            sources_result = await self.db.execute(
                select(Source).where(Source.session_id == self.session.id)
            )
            sources = list(sources_result.scalars().all())

            # Save to database
            db_claims = []
            for claim_data in claims_data:
                claim = Claim(
                    session_id=self.session.id,
                    claim_text=claim_data.get("claim_text", ""),
                    claim_type=claim_data.get("claim_type", "factual"),
                    support_status="unverified",
                    confidence_label="unverified",
                    importance=claim_data.get("importance", 3),
                )
                self.db.add(claim)
                await self.db.flush()

                # Save evidence mappings
                for ev_data in claim_data.get("evidence", []):
                    source_idx = ev_data.get("source_index", 0)
                    source = sources[source_idx] if source_idx < len(sources) else None

                    evidence = Evidence(
                        claim_id=claim.id,
                        source_id=source.id if source else None,
                        passage_text=ev_data.get("passage_text", ""),
                        relevance_score=ev_data.get("relevance_score", 0.5),
                        support_type=ev_data.get("support_type", "supports"),
                        location_info=ev_data.get("location_info"),
                    )
                    self.db.add(evidence)

                # Update claim support status based on evidence
                support_types = [e.get("support_type", "supports") for e in claim_data.get("evidence", [])]
                if "contradicts" in support_types:
                    claim.support_status = "conflicting_evidence"
                elif all(s == "supports" for s in support_types):
                    claim.support_status = "supported"
                elif any(s == "supports" for s in support_types):
                    claim.support_status = "partially_supported"
                else:
                    claim.support_status = "insufficient_evidence"

                claim.confidence_label = claim.support_status
                db_claims.append({"id": str(claim.id), "text": claim.claim_text, "status": claim.support_status})

            await self.db.flush()

            return AgentResult(
                status="success",
                result=db_claims,
                tokens_used=response.total_tokens,
                cost=response.estimated_cost,
                metadata={"claims_extracted": len(db_claims)},
            )

        except Exception as e:
            logger.error("Evidence agent failed", error=str(e))
            return AgentResult(status="error", errors=[str(e)])

    def _build_evidence_context(self, chunks: list) -> str:
        """Build a token-efficient evidence context string."""
        lines = []
        for i, chunk in enumerate(chunks):
            content = chunk.get("content", "")[:500]  # Truncate long chunks
            lines.append(f"[Source {i}] {content}")
        return "\n\n".join(lines)
