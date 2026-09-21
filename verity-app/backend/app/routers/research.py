# =============================================================================
# VERITY — Research Router
# =============================================================================
from __future__ import annotations

import uuid
from datetime import datetime

import structlog
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.config import get_settings
from app.database import get_db
from app.models import (
    User, ResearchSession, ResearchTask, Source, Claim, Evidence,
    Report, Contradiction,
)
from app.routers.auth import get_current_user
from app.schemas import (
    ResearchCreate,
    ResearchStatusResponse,
    ResearchListResponse,
    SourceResponse,
    ClaimResponse,
    EvidenceResponse,
    ContradictionResponse,
    ReportResponse,
)

router = APIRouter()
settings = get_settings()
logger = structlog.get_logger()


@router.post("", status_code=201)
async def create_research(
    request: ResearchCreate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new research session and queue it for processing."""
    # Validate project ownership
    from app.models import Project
    result = await db.execute(
        select(Project).where(
            Project.id == request.project_id,
            Project.owner_id == current_user.id,
            Project.deleted_at.is_(None),
        )
    )
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Check concurrent research limit
    active_count = await db.scalar(
        select(func.count()).select_from(ResearchSession).where(
            ResearchSession.user_id == current_user.id,
            ResearchSession.status.in_(["queued", "planning", "searching", "ingesting",
                                         "retrieving", "analyzing", "verifying", "generating"]),
        )
    )
    if active_count >= settings.max_concurrent_research:
        raise HTTPException(
            status_code=429,
            detail=f"Maximum {settings.max_concurrent_research} concurrent research sessions allowed",
        )

    # Create session
    session = ResearchSession(
        project_id=request.project_id,
        user_id=current_user.id,
        question=request.question,
        mode=request.mode,
        status="queued",
    )
    db.add(session)
    await db.commit()
    await db.refresh(session)

    # Queue research execution in background
    background_tasks.add_task(execute_research_pipeline, str(session.id))

    logger.info("Research created", research_id=str(session.id), mode=request.mode)

    return {
        "id": str(session.id),
        "research_id": str(session.id),
        "status": "queued",
        "message": "Research has been queued for processing",
    }


async def execute_research_pipeline(research_id: str):
    """Background task: runs the full research pipeline."""
    from app.database import async_session
    from app.agents.orchestrator import ResearchOrchestrator

    async with async_session() as db:
        try:
            session = await db.get(ResearchSession, uuid.UUID(research_id))
            if not session:
                logger.error("Research session not found", research_id=research_id)
                return

            orchestrator = ResearchOrchestrator(db, session)
            await orchestrator.run()

        except Exception as e:
            logger.error("Research pipeline failed", research_id=research_id, error=str(e))
            try:
                session = await db.get(ResearchSession, uuid.UUID(research_id))
                if session:
                    session.status = "failed"
                    session.error_message = str(e)[:500]
                    await db.commit()
            except Exception:
                pass


@router.get("", response_model=list[ResearchListResponse])
async def list_research(
    project_id: uuid.UUID | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all research sessions for the current user."""
    query = (
        select(ResearchSession)
        .where(ResearchSession.user_id == current_user.id)
        .order_by(ResearchSession.created_at.desc())
    )
    if project_id:
        query = query.where(ResearchSession.project_id == project_id)

    result = await db.execute(query)
    sessions = result.scalars().all()
    return sessions


@router.get("/{research_id}", response_model=ResearchStatusResponse)
async def get_research_status(
    research_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get detailed research status including tasks."""
    result = await db.execute(
        select(ResearchSession)
        .options(selectinload(ResearchSession.tasks))
        .where(
            ResearchSession.id == research_id,
            ResearchSession.user_id == current_user.id,
        )
    )
    session = result.scalar_one_or_none()
    if not session:
        raise HTTPException(status_code=404, detail="Research session not found")
    return session


@router.get("/{research_id}/sources", response_model=list[SourceResponse])
async def get_research_sources(
    research_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all sources discovered during research."""
    # Verify ownership
    session = await db.get(ResearchSession, research_id)
    if not session or session.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Research session not found")

    result = await db.execute(
        select(Source)
        .where(Source.session_id == research_id)
        .order_by(Source.relevance_score.desc().nullslast())
    )
    return result.scalars().all()


@router.get("/{research_id}/evidence", response_model=list[ClaimResponse])
async def get_research_evidence(
    research_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all claims and evidence for a research session."""
    session = await db.get(ResearchSession, research_id)
    if not session or session.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Research session not found")

    result = await db.execute(
        select(Claim)
        .options(selectinload(Claim.evidence_items).selectinload(Evidence.source))
        .where(Claim.session_id == research_id)
        .order_by(Claim.importance.desc())
    )
    return result.scalars().all()


@router.get("/{research_id}/contradictions", response_model=list[ContradictionResponse])
async def get_research_contradictions(
    research_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get all detected contradictions."""
    session = await db.get(ResearchSession, research_id)
    if not session or session.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Research session not found")

    result = await db.execute(
        select(Contradiction)
        .options(
            selectinload(Contradiction.claim_a),
            selectinload(Contradiction.claim_b),
        )
        .where(Contradiction.session_id == research_id)
    )
    return result.scalars().all()


@router.get("/{research_id}/report", response_model=ReportResponse)
async def get_research_report(
    research_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get the final research report."""
    session = await db.get(ResearchSession, research_id)
    if not session or session.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Research session not found")

    result = await db.execute(
        select(Report)
        .options(selectinload(Report.sections))
        .where(Report.session_id == research_id)
    )
    report = result.scalar_one_or_none()
    if not report:
        raise HTTPException(status_code=404, detail="Report not yet generated")
    return report
