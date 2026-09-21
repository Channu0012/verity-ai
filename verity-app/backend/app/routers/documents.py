# =============================================================================
# VERITY — Documents Router
# =============================================================================
from __future__ import annotations

import uuid
import hashlib
from datetime import datetime

import structlog
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, BackgroundTasks
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.database import get_db
from app.models import User, Document, Source
from app.routers.auth import get_current_user
from app.schemas import DocumentResponse

router = APIRouter()
settings = get_settings()
logger = structlog.get_logger()

ALLOWED_TYPES = {"pdf", "txt", "docx", "csv"}
MAX_FILE_SIZE = settings.max_upload_size_mb * 1024 * 1024


@router.post("/upload", status_code=201, response_model=DocumentResponse)
async def upload_document(
    source_id: uuid.UUID,
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Upload a document for processing."""
    # Validate file extension
    if not file.filename:
        raise HTTPException(status_code=400, detail="Filename required")

    extension = file.filename.rsplit(".", 1)[-1].lower() if "." in file.filename else ""
    if extension not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: {extension}. Allowed: {', '.join(ALLOWED_TYPES)}",
        )

    # Read and validate size
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail=f"File too large. Maximum size: {settings.max_upload_size_mb}MB",
        )

    # Security: basic file validation
    if extension == "pdf" and not content[:4] == b"%PDF":
        raise HTTPException(status_code=400, detail="Invalid PDF file")

    # Compute hash for deduplication
    content_hash = hashlib.sha256(content).hexdigest()

    # Store file (local for dev, Supabase storage for prod)
    import os
    upload_dir = os.path.join(os.getcwd(), "uploads", str(current_user.id))
    os.makedirs(upload_dir, exist_ok=True)
    file_path = os.path.join(upload_dir, f"{uuid.uuid4()}.{extension}")

    with open(file_path, "wb") as f:
        f.write(content)

    # Create document record
    doc = Document(
        source_id=source_id,
        user_id=current_user.id,
        filename=file.filename,
        file_type=extension,
        file_size=len(content),
        file_path=file_path,
        content_hash=content_hash,
        status="uploaded",
    )
    db.add(doc)
    await db.flush()

    # Queue document processing
    background_tasks.add_task(process_document_pipeline, str(doc.id))

    logger.info("Document uploaded", doc_id=str(doc.id), filename=file.filename)
    return doc


async def process_document_pipeline(document_id: str):
    """Background: extract, chunk, embed a document."""
    from app.database import async_session
    from app.ingestion.pipeline import DocumentIngestionPipeline

    async with async_session() as db:
        try:
            doc = await db.get(Document, uuid.UUID(document_id))
            if not doc:
                return

            pipeline = DocumentIngestionPipeline(db)
            await pipeline.process(doc)

        except Exception as e:
            logger.error("Document processing failed", doc_id=document_id, error=str(e))
            try:
                doc = await db.get(Document, uuid.UUID(document_id))
                if doc:
                    doc.status = "failed"
                    await db.commit()
            except Exception:
                pass


@router.get("", response_model=list[DocumentResponse])
async def list_documents(
    source_id: uuid.UUID | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List documents for the current user."""
    query = select(Document).where(Document.user_id == current_user.id)
    if source_id:
        query = query.where(Document.source_id == source_id)
    query = query.order_by(Document.created_at.desc())

    result = await db.execute(query)
    return result.scalars().all()


@router.delete("/{document_id}")
async def delete_document(
    document_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a document and its associated data."""
    result = await db.execute(
        select(Document).where(
            Document.id == document_id,
            Document.user_id == current_user.id,
        )
    )
    doc = result.scalar_one_or_none()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    # Remove file from storage
    import os
    if doc.file_path and os.path.exists(doc.file_path):
        os.remove(doc.file_path)

    await db.delete(doc)
    return {"message": "Document deleted"}
