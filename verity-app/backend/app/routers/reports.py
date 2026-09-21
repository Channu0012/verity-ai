# =============================================================================
# VERITY — Reports Router
# =============================================================================
from __future__ import annotations

import json
import uuid

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import PlainTextResponse, JSONResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models import User, Report, ReportSection, ResearchSession
from app.routers.auth import get_current_user
from app.schemas import ReportResponse, ReportExportRequest

router = APIRouter()


@router.get("", response_model=list[ReportResponse])
async def list_reports(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all reports for the current user."""
    result = await db.execute(
        select(Report)
        .join(ResearchSession, Report.session_id == ResearchSession.id)
        .options(selectinload(Report.sections))
        .where(ResearchSession.user_id == current_user.id)
        .order_by(Report.created_at.desc())
    )
    return result.scalars().all()


@router.get("/{report_id}", response_model=ReportResponse)
async def get_report(
    report_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a specific report."""
    result = await db.execute(
        select(Report)
        .join(ResearchSession, Report.session_id == ResearchSession.id)
        .options(selectinload(Report.sections))
        .where(
            Report.id == report_id,
            ResearchSession.user_id == current_user.id,
        )
    )
    report = result.scalar_one_or_none()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return report


@router.post("/{report_id}/export")
async def export_report(
    report_id: uuid.UUID,
    request: ReportExportRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Export a report in the specified format."""
    result = await db.execute(
        select(Report)
        .join(ResearchSession, Report.session_id == ResearchSession.id)
        .options(selectinload(Report.sections))
        .where(
            Report.id == report_id,
            ResearchSession.user_id == current_user.id,
        )
    )
    report = result.scalar_one_or_none()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")

    if request.format == "markdown":
        content = report.full_content or _build_markdown(report)
        return PlainTextResponse(
            content=content,
            media_type="text/markdown",
            headers={"Content-Disposition": f'attachment; filename="{report.title}.md"'},
        )

    elif request.format == "json":
        export_data = {
            "title": report.title,
            "executive_summary": report.executive_summary,
            "methodology": report.methodology,
            "limitations": report.limitations,
            "quality_score": report.quality_score,
            "citation_accuracy": report.citation_accuracy,
            "sections": [
                {
                    "type": s.section_type,
                    "title": s.title,
                    "content": s.content,
                    "order": s.order,
                }
                for s in sorted(report.sections, key=lambda x: x.order)
            ],
        }
        return JSONResponse(
            content=export_data,
            headers={"Content-Disposition": f'attachment; filename="{report.title}.json"'},
        )

    elif request.format == "pdf":
        # PDF export — generate markdown then convert
        content = report.full_content or _build_markdown(report)
        # For MVP, return markdown with PDF content-type as a safe fallback
        return PlainTextResponse(
            content=content,
            media_type="text/markdown",
            headers={"Content-Disposition": f'attachment; filename="{report.title}.md"'},
        )

    raise HTTPException(status_code=400, detail="Unsupported format")


def _build_markdown(report: Report) -> str:
    """Build a markdown document from report sections."""
    lines = [f"# {report.title}\n"]

    if report.executive_summary:
        lines.append(f"## Executive Summary\n\n{report.executive_summary}\n")

    for section in sorted(report.sections, key=lambda x: x.order):
        lines.append(f"## {section.title}\n\n{section.content}\n")

    if report.methodology:
        lines.append(f"## Methodology\n\n{report.methodology}\n")
    if report.limitations:
        lines.append(f"## Limitations\n\n{report.limitations}\n")

    return "\n".join(lines)
