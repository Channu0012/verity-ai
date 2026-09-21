# =============================================================================
# VERITY Backend — Pydantic Schemas
# =============================================================================
from __future__ import annotations

import uuid
from datetime import datetime
from typing import Any, Optional

from pydantic import BaseModel, Field, EmailStr


# =============================================================================
# Auth Schemas
# =============================================================================
class SignUpRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    full_name: str = Field(min_length=1, max_length=255)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class PasswordResetRequest(BaseModel):
    email: EmailStr


# =============================================================================
# User Schemas
# =============================================================================
class UserResponse(BaseModel):
    id: uuid.UUID
    email: str
    full_name: Optional[str] = None
    avatar_url: Optional[str] = None
    role: str = "user"
    created_at: datetime

    model_config = {"from_attributes": True}


# =============================================================================
# Project Schemas
# =============================================================================
class ProjectCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    description: Optional[str] = None


class ProjectUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    status: Optional[str] = None


class ProjectResponse(BaseModel):
    id: uuid.UUID
    name: str
    description: Optional[str] = None
    status: str
    created_at: datetime
    updated_at: datetime
    research_count: int = 0

    model_config = {"from_attributes": True}


# =============================================================================
# Research Schemas
# =============================================================================
class ResearchCreate(BaseModel):
    project_id: uuid.UUID
    question: str = Field(min_length=10, max_length=2000)
    mode: str = Field(default="standard", pattern="^(quick|standard|deep)$")


class ResearchStatusResponse(BaseModel):
    id: uuid.UUID
    question: str
    mode: str
    status: str
    progress: float
    error_message: Optional[str] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    created_at: datetime
    tasks: list[ResearchTaskResponse] = []

    model_config = {"from_attributes": True}


class ResearchTaskResponse(BaseModel):
    id: uuid.UUID
    task_number: int
    objective: str
    status: str
    priority: int
    created_at: datetime

    model_config = {"from_attributes": True}


class ResearchListResponse(BaseModel):
    id: uuid.UUID
    question: str
    mode: str
    status: str
    progress: float
    created_at: datetime

    model_config = {"from_attributes": True}


# =============================================================================
# Source Schemas
# =============================================================================
class SourceResponse(BaseModel):
    id: uuid.UUID
    title: str
    url: Optional[str] = None
    publisher: Optional[str] = None
    author: Optional[str] = None
    publication_date: Optional[str] = None
    source_type: str
    status: str
    relevance_score: Optional[float] = None
    created_at: datetime

    model_config = {"from_attributes": True}


# =============================================================================
# Evidence Schemas
# =============================================================================
class EvidenceResponse(BaseModel):
    id: uuid.UUID
    claim_id: uuid.UUID
    source_id: Optional[uuid.UUID] = None
    passage_text: str
    relevance_score: float
    support_type: str
    location_info: Optional[str] = None
    source: Optional[SourceResponse] = None
    created_at: datetime

    model_config = {"from_attributes": True}


# =============================================================================
# Claim Schemas
# =============================================================================
class ClaimResponse(BaseModel):
    id: uuid.UUID
    claim_text: str
    claim_type: str
    support_status: str
    confidence_label: str
    importance: int
    evidence_items: list[EvidenceResponse] = []
    created_at: datetime

    model_config = {"from_attributes": True}


# =============================================================================
# Contradiction Schemas
# =============================================================================
class ContradictionResponse(BaseModel):
    id: uuid.UUID
    claim_a: ClaimResponse
    claim_b: ClaimResponse
    description: str
    severity: str
    resolution: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}


# =============================================================================
# Report Schemas
# =============================================================================
class ReportSectionResponse(BaseModel):
    id: uuid.UUID
    section_type: str
    title: str
    content: str
    order: int

    model_config = {"from_attributes": True}


class ReportResponse(BaseModel):
    id: uuid.UUID
    title: str
    executive_summary: Optional[str] = None
    methodology: Optional[str] = None
    limitations: Optional[str] = None
    full_content: Optional[str] = None
    quality_score: Optional[float] = None
    citation_accuracy: Optional[float] = None
    sections: list[ReportSectionResponse] = []
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ReportExportRequest(BaseModel):
    format: str = Field(default="markdown", pattern="^(markdown|pdf|json)$")


# =============================================================================
# Document Schemas
# =============================================================================
class DocumentResponse(BaseModel):
    id: uuid.UUID
    filename: str
    file_type: str
    file_size: int
    status: str
    page_count: Optional[int] = None
    created_at: datetime

    model_config = {"from_attributes": True}


# =============================================================================
# Health Check
# =============================================================================
class HealthResponse(BaseModel):
    status: str
    version: str
    environment: str
    database: str = "unknown"
    redis: str = "unknown"
    ai_provider: str = "unknown"
    timestamp: datetime = Field(default_factory=datetime.utcnow)


# =============================================================================
# Admin Schemas
# =============================================================================
class UsageStatsResponse(BaseModel):
    total_users: int
    total_research: int
    total_sources: int
    total_reports: int
    total_model_runs: int
    total_tokens: int
    estimated_cost: float


class ModelRunResponse(BaseModel):
    id: uuid.UUID
    agent_name: str
    provider: str
    model: str
    total_tokens: int
    estimated_cost: float
    latency_ms: int
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}


# =============================================================================
# Generic
# =============================================================================
class PaginatedResponse(BaseModel):
    items: list[Any]
    total: int
    page: int
    page_size: int
    has_more: bool


class ErrorResponse(BaseModel):
    error: str
    detail: Optional[str] = None
    request_id: Optional[str] = None
