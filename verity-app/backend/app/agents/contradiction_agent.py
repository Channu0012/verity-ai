# =============================================================================
# VERITY — Contradiction Agent
# =============================================================================
from __future__ import annotations

import json

import structlog
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.gateway import AIGateway
from app.agents.contracts import AgentResult
from app.models import ResearchSession, Claim, Contradiction

logger = structlog.get_logger()


class ContradictionAgent:
    """Detects contradictions between claims with evidence from different sources."""

    def __init__(self, gateway: AIGateway, db: AsyncSession, session: ResearchSession):
        self.gateway = gateway
        self.db = db
        self.session = session

    async def execute(self, claims: list) -> AgentResult:
        """Detect contradictions between extracted claims."""
        if len(claims) < 2:
            return AgentResult(status="success", result=[], metadata={"reason": "too few claims to compare"})

        claims_text = "\n".join(
            f"[Claim {i}] (ID: {c.get('id', i)}) {c.get('text', '')}"
            for i, c in enumerate(claims)
        )

        messages = [
            {"role": "system", "content": (
                "You are a contradiction detection agent. Analyze claims for disagreements.\n"
                "Do NOT force consensus. Show disagreement transparently.\n"
                "Output JSON: {\"contradictions\": [{\"claim_a_index\": 0, \"claim_b_index\": 1, "
                "\"description\": \"...\", \"severity\": \"low|moderate|high\"}]}"
            )},
            {"role": "user", "content": f"Analyze these claims for contradictions:\n\n{claims_text}\n\nRespond with JSON."},
        ]

        try:
            response = await self.gateway.generate(
                messages=messages,
                temperature=0.1,
                max_tokens=2048,
                response_format={"type": "json_object"},
                agent_name="contradiction",
                session_id=self.session.id,
            )

            data = response.structured_output
            if not data:
                try:
                    raw = (response.content or "").strip()
                    if "```" in raw:
                        parts = raw.split("```")
                        raw = parts[1] if len(parts) > 1 else raw
                        if raw.startswith("json"):
                            raw = raw[4:].strip()
                    data = json.loads(raw)
                except Exception:
                    data = {}
            contradictions = data.get("contradictions", [])

            # Load claim IDs from database
            result = await self.db.execute(
                select(Claim).where(Claim.session_id == self.session.id).order_by(Claim.created_at)
            )
            db_claims = list(result.scalars().all())

            saved = []
            for c in contradictions:
                idx_a = c.get("claim_a_index", 0)
                idx_b = c.get("claim_b_index", 1)

                if idx_a < len(db_claims) and idx_b < len(db_claims):
                    contradiction = Contradiction(
                        session_id=self.session.id,
                        claim_a_id=db_claims[idx_a].id,
                        claim_b_id=db_claims[idx_b].id,
                        description=c.get("description", ""),
                        severity=c.get("severity", "moderate"),
                    )
                    self.db.add(contradiction)
                    saved.append(c)

            await self.db.flush()

            return AgentResult(
                status="success",
                result=saved,
                tokens_used=response.total_tokens,
                cost=response.estimated_cost,
                metadata={"contradictions_found": len(saved)},
            )

        except Exception as e:
            logger.error("Contradiction agent failed", error=str(e))
            return AgentResult(status="error", errors=[str(e)])
