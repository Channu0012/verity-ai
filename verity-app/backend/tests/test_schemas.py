# =============================================================================
# VERITY — Pydantic Schemas Validation Tests
# =============================================================================
import uuid
import pytest
from pydantic import ValidationError

from app.schemas import (
    ResearchCreate,
    ProjectCreate,
    ReportExportRequest,
    LoginRequest,
    SignUpRequest,
)


def test_research_create_valid():
    req = ResearchCreate(
        project_id=uuid.uuid4(),
        question="What are the latest breakthroughs in fusion energy?",
        mode="deep",
    )
    assert req.mode == "deep"
    assert "fusion energy" in req.question


def test_research_create_invalid_mode():
    with pytest.raises(ValidationError):
        ResearchCreate(
            project_id=uuid.uuid4(),
            question="Question?",
            mode="ultra_fast",  # Invalid mode
        )


def test_project_create_schema():
    req = ProjectCreate(name="AI Safety 2026", description="Literature review")
    assert req.name == "AI Safety 2026"
    assert req.description == "Literature review"


def test_report_export_schema():
    req = ReportExportRequest(format="markdown")
    assert req.format == "markdown"

    with pytest.raises(ValidationError):
        ReportExportRequest(format="doc")  # Not in allowed formats


def test_auth_schemas():
    login = LoginRequest(email="researcher@verity.ai", password="securepassword123")
    assert login.email == "researcher@verity.ai"

    signup = SignUpRequest(
        email="test@verity.ai",
        password="securepassword123",
        full_name="Dr. Jane Doe",
    )
    assert signup.full_name == "Dr. Jane Doe"
