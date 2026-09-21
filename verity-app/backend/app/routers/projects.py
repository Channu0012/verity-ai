# =============================================================================
# VERITY — Projects Router
# =============================================================================
from __future__ import annotations

import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import User, Project, ResearchSession
from app.routers.auth import get_current_user
from app.schemas import ProjectCreate, ProjectUpdate, ProjectResponse

router = APIRouter()


@router.post("", status_code=201, response_model=ProjectResponse)
async def create_project(
    request: ProjectCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new research project."""
    project = Project(
        owner_id=current_user.id,
        name=request.name,
        description=request.description,
    )
    db.add(project)
    await db.flush()
    return ProjectResponse(
        id=project.id,
        name=project.name,
        description=project.description,
        status=project.status,
        created_at=project.created_at,
        updated_at=project.updated_at,
        research_count=0,
    )


@router.get("", response_model=list[ProjectResponse])
async def list_projects(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all projects for the current user."""
    result = await db.execute(
        select(Project)
        .where(
            Project.owner_id == current_user.id,
            Project.deleted_at.is_(None),
        )
        .order_by(Project.updated_at.desc())
    )
    projects = result.scalars().all()

    response = []
    for p in projects:
        count = await db.scalar(
            select(func.count()).select_from(ResearchSession)
            .where(ResearchSession.project_id == p.id)
        )
        response.append(ProjectResponse(
            id=p.id,
            name=p.name,
            description=p.description,
            status=p.status,
            created_at=p.created_at,
            updated_at=p.updated_at,
            research_count=count or 0,
        ))
    return response


@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a single project."""
    result = await db.execute(
        select(Project).where(
            Project.id == project_id,
            Project.owner_id == current_user.id,
            Project.deleted_at.is_(None),
        )
    )
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    count = await db.scalar(
        select(func.count()).select_from(ResearchSession)
        .where(ResearchSession.project_id == project_id)
    )

    return ProjectResponse(
        id=project.id,
        name=project.name,
        description=project.description,
        status=project.status,
        created_at=project.created_at,
        updated_at=project.updated_at,
        research_count=count or 0,
    )


@router.patch("/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: uuid.UUID,
    request: ProjectUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Update a project."""
    result = await db.execute(
        select(Project).where(
            Project.id == project_id,
            Project.owner_id == current_user.id,
            Project.deleted_at.is_(None),
        )
    )
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    if request.name is not None:
        project.name = request.name
    if request.description is not None:
        project.description = request.description
    if request.status is not None:
        project.status = request.status

    await db.flush()
    return project


@router.delete("/{project_id}")
async def delete_project(
    project_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Soft delete a project."""
    result = await db.execute(
        select(Project).where(
            Project.id == project_id,
            Project.owner_id == current_user.id,
            Project.deleted_at.is_(None),
        )
    )
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    project.deleted_at = datetime.utcnow()
    project.status = "archived"
    await db.flush()

    return {"message": "Project deleted"}
