# =============================================================================
# VERITY — Synthesis Agent (Report Generation)
# =============================================================================
from __future__ import annotations

import json

import structlog
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.ai.gateway import AIGateway
from app.agents.contracts import AgentResult
from app.models import (
    ResearchSession, Claim, Evidence, Source, Contradiction,
    Report, ReportSection,
)

logger = structlog.get_logger()

SYNTHESIS_SYSTEM_PROMPT = """You are a research synthesis agent for VERITY.

CONTEXT BOUNDARY:
- WHAT I KNOW: Research question, claims with evidence, sources, contradictions.
- WHAT I CAN DO: Synthesize a structured research report from evidence.
- WHAT I CANNOT DO: Add information not supported by the evidence. Fabricate citations.
- WHAT I MUST RETURN: A structured report in JSON format.

REPORT STRUCTURE (required sections):
1. Research Question — Restate clearly
2. Executive Summary — Key findings in 2-3 paragraphs
3. Key Findings — Numbered list of main findings with citations
4. Evidence Analysis — Deep analysis of the evidence
5. Supporting Evidence — Evidence that supports the main thesis
6. Conflicting Evidence — Evidence that challenges or contradicts (show transparently)
7. Limitations — What the research doesn't cover
8. Methodology — How the research was conducted
9. Sources — Numbered source list

RULES:
- Every claim must reference evidence with [Source N] citations
- Never fabricate sources or citations
- Present conflicting evidence honestly — do not force consensus
- Use professional, analytical tone
- Be specific, not vague

OUTPUT (JSON):
{
  "title": "Research report title",
  "executive_summary": "...",
  "methodology": "...",
  "limitations": "...",
  "sections": [
    {"type": "research_question", "title": "Research Question", "content": "...", "order": 1},
    {"type": "key_findings", "title": "Key Findings", "content": "...", "order": 2},
    {"type": "evidence_analysis", "title": "Evidence Analysis", "content": "...", "order": 3},
    {"type": "supporting_evidence", "title": "Supporting Evidence", "content": "...", "order": 4},
    {"type": "conflicting_evidence", "title": "Conflicting Evidence", "content": "...", "order": 5}
  ]
}"""


class SynthesisAgent:
    """Generates structured research reports from evidence and claims."""

    def __init__(self, gateway: AIGateway, db: AsyncSession, session: ResearchSession):
        self.gateway = gateway
        self.db = db
        self.session = session

    async def execute(self, plan: dict, claims: list) -> AgentResult:
        """Generate the final research report."""
        # Load full claims with evidence from database
        result = await self.db.execute(
            select(Claim)
            .options(selectinload(Claim.evidence_items).selectinload(Evidence.source))
            .where(Claim.session_id == self.session.id)
            .order_by(Claim.importance.desc())
        )
        db_claims = list(result.scalars().all())

        # Load sources
        sources_result = await self.db.execute(
            select(Source).where(Source.session_id == self.session.id)
        )
        sources = list(sources_result.scalars().all())

        # Load contradictions
        contradictions_result = await self.db.execute(
            select(Contradiction).where(Contradiction.session_id == self.session.id)
        )
        contradictions = list(contradictions_result.scalars().all())

        # Build context
        context = self._build_synthesis_context(db_claims, sources, contradictions)

        messages = [
            {"role": "system", "content": SYNTHESIS_SYSTEM_PROMPT},
            {"role": "user", "content": (
                f"Generate a comprehensive research report.\n\n"
                f"RESEARCH QUESTION: {self.session.question}\n\n"
                f"{context}\n\n"
                f"Respond with valid JSON."
            )},
        ]

        try:
            response = await self.gateway.generate(
                messages=messages,
                model=None,  # Use strong model
                temperature=0.2,
                max_tokens=8192,
                response_format={"type": "json_object"},
                agent_name="synthesis",
                session_id=self.session.id,
            )

            data = response.structured_output or json.loads(response.content)

            # Build full markdown content
            full_content = self._build_full_markdown(data, sources)

            # Save report
            report = Report(
                session_id=self.session.id,
                title=data.get("title", f"Research: {self.session.question[:100]}"),
                executive_summary=data.get("executive_summary", ""),
                methodology=data.get("methodology", ""),
                limitations=data.get("limitations", ""),
                full_content=full_content,
            )
            self.db.add(report)
            await self.db.flush()

            # Save sections
            for section_data in data.get("sections", []):
                section = ReportSection(
                    report_id=report.id,
                    section_type=section_data.get("type", "content"),
                    title=section_data.get("title", ""),
                    content=section_data.get("content", ""),
                    order=section_data.get("order", 0),
                )
                self.db.add(section)

            await self.db.flush()

            return AgentResult(
                status="success",
                result={"report_id": str(report.id)},
                tokens_used=response.total_tokens,
                cost=response.estimated_cost,
            )

        except Exception as e:
            logger.error("Synthesis agent failed", error=str(e))
            return AgentResult(status="error", errors=[str(e)])

    def _build_synthesis_context(self, claims, sources, contradictions) -> str:
        """Build context for synthesis, respecting token budget."""
        lines = []

        lines.append("SOURCES:")
        for i, s in enumerate(sources):
            lines.append(f"[Source {i+1}] {s.title} ({s.source_type}) - {s.url or 'N/A'}")

        lines.append("\nCLAIMS AND EVIDENCE:")
        for claim in claims[:20]:  # Limit for token budget
            lines.append(f"\nClaim: {claim.claim_text}")
            lines.append(f"Status: {claim.support_status} | Type: {claim.claim_type}")
            for ev in claim.evidence_items[:5]:
                source_ref = f"[Source: {ev.source.title[:50]}]" if ev.source else "[Unknown Source]"
                lines.append(f"  Evidence ({ev.support_type}): {ev.passage_text[:200]} {source_ref}")

        if contradictions:
            lines.append("\nCONTRADICTIONS:")
            for c in contradictions:
                lines.append(f"  {c.description} (Severity: {c.severity})")

        return "\n".join(lines)

    def _build_full_markdown(self, data: dict, sources: list) -> str:
        """Build a complete markdown document from report data."""
        lines = [f"# {data.get('title', 'Research Report')}\n"]

        if data.get("executive_summary"):
            lines.append(f"## Executive Summary\n\n{data['executive_summary']}\n")

        for section in sorted(data.get("sections", []), key=lambda x: x.get("order", 0)):
            lines.append(f"## {section.get('title', '')}\n\n{section.get('content', '')}\n")

        if data.get("methodology"):
            lines.append(f"## Methodology\n\n{data['methodology']}\n")
        if data.get("limitations"):
            lines.append(f"## Limitations\n\n{data['limitations']}\n")

        # Source list
        lines.append("## Sources\n")
        for i, s in enumerate(sources):
            url_ref = f" — [{s.url}]({s.url})" if s.url else ""
            lines.append(f"{i+1}. **{s.title}** ({s.source_type}){url_ref}")

        return "\n".join(lines)
