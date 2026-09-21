# =============================================================================
# VERITY — Admin Router
# =============================================================================
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import (
    User, Project, ResearchSession, Source, Report,
    ModelRun, AuditLog,
)
from app.routers.auth import get_current_user
from app.schemas import UsageStatsResponse, ModelRunResponse

router = APIRouter()


async def require_admin(current_user: User = Depends(get_current_user)) -> User:
    """Ensure the current user is an admin."""
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user


@router.get("/stats", response_model=UsageStatsResponse)
async def get_usage_stats(
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """Get platform-wide usage statistics."""
    total_users = await db.scalar(select(func.count()).select_from(User)) or 0
    total_research = await db.scalar(select(func.count()).select_from(ResearchSession)) or 0
    total_sources = await db.scalar(select(func.count()).select_from(Source)) or 0
    total_reports = await db.scalar(select(func.count()).select_from(Report)) or 0
    total_model_runs = await db.scalar(select(func.count()).select_from(ModelRun)) or 0
    total_tokens = await db.scalar(select(func.sum(ModelRun.total_tokens))) or 0
    estimated_cost = await db.scalar(select(func.sum(ModelRun.estimated_cost))) or 0.0

    return UsageStatsResponse(
        total_users=total_users,
        total_research=total_research,
        total_sources=total_sources,
        total_reports=total_reports,
        total_model_runs=total_model_runs,
        total_tokens=total_tokens,
        estimated_cost=estimated_cost,
    )


@router.get("/model-runs", response_model=list[ModelRunResponse])
async def list_model_runs(
    limit: int = 50,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """List recent model runs."""
    result = await db.execute(
        select(ModelRun)
        .order_by(ModelRun.created_at.desc())
        .limit(limit)
    )
    return result.scalars().all()


@router.get("/audit-logs")
async def list_audit_logs(
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """List recent audit log entries."""
    result = await db.execute(
        select(AuditLog)
        .order_by(AuditLog.created_at.desc())
        .limit(limit)
    )
    logs = result.scalars().all()
    return [
        {
            "id": str(log.id),
            "user_id": str(log.user_id) if log.user_id else None,
            "action": log.action,
            "resource_type": log.resource_type,
            "resource_id": log.resource_id,
            "details": log.details,
            "created_at": log.created_at.isoformat(),
        }
        for log in logs
    ]
