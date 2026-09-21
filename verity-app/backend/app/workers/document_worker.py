# =============================================================================
# VERITY — Document Processing Background Worker
# =============================================================================
from __future__ import annotations

import uuid
import structlog
from app.database import async_session
from app.models import Document
from app.ingestion.pipeline import DocumentIngestionPipeline

logger = structlog.get_logger()


class DocumentWorker:
    """Worker for asynchronously processing uploaded documents into chunks & embeddings."""

    @staticmethod
    async def process_document(document_id: str | uuid.UUID):
        """Parse, chunk, and embed an uploaded document."""
        uid = uuid.UUID(str(document_id))
        logger.info("Starting background document processing", document_id=str(uid))

        async with async_session() as db:
            try:
                document = await db.get(Document, uid)
                if not document:
                    logger.error("Document not found for processing", document_id=str(uid))
                    return

                document.status = "processing"
                await db.commit()

                pipeline = DocumentIngestionPipeline(db)
                chunk_count = await pipeline.process_document_file(document)

                document.status = "completed"
                document.chunk_count = chunk_count
                await db.commit()
                logger.info("Document successfully processed", document_id=str(uid), chunks=chunk_count)

            except Exception as e:
                logger.error("Document processing failed", document_id=str(uid), error=str(e))
                try:
                    document = await db.get(Document, uid)
                    if document:
                        document.status = "failed"
                        document.error_message = str(e)[:500]
                        await db.commit()
                except Exception:
                    pass
