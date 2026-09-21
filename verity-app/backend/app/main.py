# =============================================================================
# VERITY Backend — FastAPI Application
# =============================================================================
from __future__ import annotations

import uuid
from contextlib import asynccontextmanager

import structlog
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import get_settings
from app.routers import auth, research, projects, documents, reports, sources, admin, health

settings = get_settings()
logger = structlog.get_logger()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown."""
    logger.info("VERITY starting", version=settings.app_version, env=settings.environment)
    # Import here to avoid circular imports
    from app.database import init_db
    try:
        await init_db()
        logger.info("Database initialized")
    except Exception as e:
        logger.warning("Database init skipped (may not be available)", error=str(e))
    yield
    logger.info("VERITY shutting down")


app = FastAPI(
    title="VERITY API",
    description="Evidence-First AI Research Engine",
    version=settings.app_version,
    docs_url="/api/docs" if settings.debug else None,
    redoc_url="/api/redoc" if settings.debug else None,
    lifespan=lifespan,
)

# --- CORS ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# --- Request ID Middleware ---
@app.middleware("http")
async def add_request_id(request: Request, call_next):
    request_id = str(uuid.uuid4())[:8]
    request.state.request_id = request_id
    response: Response = await call_next(request)
    response.headers["X-Request-ID"] = request_id
    return response


# --- Global Error Handler ---
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    request_id = getattr(request.state, "request_id", "unknown")
    logger.error(
        "Unhandled exception",
        request_id=request_id,
        path=str(request.url),
        error=str(exc),
        exc_info=True,
    )
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "request_id": request_id,
        },
    )


# --- Register Routers ---
app.include_router(health.router, prefix="/api/v1", tags=["Health"])
app.include_router(auth.router, prefix="/api/v1/auth", tags=["Authentication"])
app.include_router(research.router, prefix="/api/v1/research", tags=["Research"])
app.include_router(projects.router, prefix="/api/v1/projects", tags=["Projects"])
app.include_router(documents.router, prefix="/api/v1/documents", tags=["Documents"])
app.include_router(sources.router, prefix="/api/v1/sources", tags=["Sources"])
app.include_router(reports.router, prefix="/api/v1/reports", tags=["Reports"])
app.include_router(admin.router, prefix="/api/v1/admin", tags=["Admin"])
