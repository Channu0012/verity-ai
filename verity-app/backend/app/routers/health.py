# =============================================================================
# VERITY — Health Check Router
# =============================================================================
from __future__ import annotations

from fastapi import APIRouter

from app.config import get_settings
from app.schemas import HealthResponse

router = APIRouter()
settings = get_settings()


@router.get("/health", response_model=HealthResponse)
async def health_check():
    """Basic health check — verifies service is running."""
    db_status = "unknown"
    redis_status = "unknown"
    ai_status = "unknown"

    # Check database
    try:
        from app.database import engine
        from sqlalchemy import text
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        db_status = "healthy"
    except Exception:
        db_status = "unavailable"

    # Check AI provider
    if settings.openai_api_key:
        ai_status = "configured"
    elif settings.gemini_api_key:
        ai_status = "configured (gemini only)"
    else:
        ai_status = "not configured"

    return HealthResponse(
        status="healthy",
        version=settings.app_version,
        environment=settings.environment,
        database=db_status,
        redis=redis_status,
        ai_provider=ai_status,
    )


@router.get("/ready")
async def readiness_check():
    """Readiness check — verifies critical dependencies."""
    checks = {}

    try:
        from app.database import engine
        from sqlalchemy import text
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        checks["database"] = True
    except Exception:
        checks["database"] = False

    checks["ai_configured"] = bool(settings.openai_api_key or settings.gemini_api_key)

    all_ready = all(checks.values())
    return {
        "ready": all_ready,
        "checks": checks,
    }
