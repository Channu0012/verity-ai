# =============================================================================
# VERITY — Sources Router
# =============================================================================
from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import User, Source, ResearchSession
from app.routers.auth import get_current_user
from app.schemas import SourceResponse

router = APIRouter()


@router.get("/{source_id}", response_model=SourceResponse)
async def get_source(
    source_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a single source with its metadata."""
    result = await db.execute(
        select(Source)
        .join(ResearchSession, Source.session_id == ResearchSession.id)
        .where(
            Source.id == source_id,
            ResearchSession.user_id == current_user.id,
        )
    )
    source = result.scalar_one_or_none()
    if not source:
        raise HTTPException(status_code=404, detail="Source not found")
    return source
