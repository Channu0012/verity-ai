# =============================================================================
# VERITY — Document Ingestion Pipeline
# =============================================================================
# Pipeline: Upload → Validate → Extract → Clean → Chunk → Embed → Index
# =============================================================================
from __future__ import annotations

import hashlib
import os
import uuid
from typing import Optional

import structlog
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.gateway import AIGateway
from app.config import get_settings
from app.models import Document, DocumentChunk, Source

logger = structlog.get_logger()
settings = get_settings()


class DocumentIngestionPipeline:
    """End-to-end document processing: extract → chunk → embed → index."""

    def __init__(self, db: AsyncSession):
        self.db = db
        self.gateway = AIGateway(db)

    async def process(self, document: Document):
        """Process an uploaded document through the full pipeline."""
        try:
            # Step 1: Extract text
            document.status = "extracting"
            await self.db.commit()

            text = await self._extract_text(document)
            if not text.strip():
                document.status = "failed"
                await self.db.commit()
                raise ValueError("No text could be extracted from document")

            document.extracted_text = text

            # Step 2: Chunk
            document.status = "chunking"
            await self.db.commit()

            chunks = self._chunk_text(text)

            # Step 3: Embed and index
            document.status = "embedding"
            await self.db.commit()

            await self._embed_and_store(document, chunks)

            # Complete
            document.status = "indexed"
            document.page_count = len(chunks)
            await self.db.commit()

            logger.info("Document processed", doc_id=str(document.id), chunks=len(chunks))

        except Exception as e:
            document.status = "failed"
            await self.db.commit()
            logger.error("Document processing failed", doc_id=str(document.id), error=str(e))
            raise

    async def ingest_from_url(
        self,
        source_id: str,
        url: str | None = None,
        content: str = "",
    ):
        """Ingest content from a web source (not a file upload)."""
        if not content and url:
            content = await self._fetch_url_content(url)

        if not content:
            return

        # Create a document record for this web content
        doc = Document(
            source_id=uuid.UUID(source_id),
            user_id=uuid.UUID("00000000-0000-0000-0000-000000000000"),  # System user
            filename=url or "web_content",
            file_type="html",
            file_size=len(content),
            file_path="",
            content_hash=hashlib.sha256(content.encode()).hexdigest(),
            status="extracting",
            extracted_text=content,
        )
        self.db.add(doc)
        await self.db.flush()

        # Chunk and embed
        chunks = self._chunk_text(content)
        await self._embed_and_store(doc, chunks)

        doc.status = "indexed"
        await self.db.flush()

    async def _extract_text(self, document: Document) -> str:
        """Extract text based on file type."""
        file_path = document.file_path
        file_type = document.file_type.lower()

        if not os.path.exists(file_path):
            raise FileNotFoundError(f"File not found: {file_path}")

        if file_type == "txt":
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                return f.read()

        elif file_type == "pdf":
            try:
                from pypdf import PdfReader
                reader = PdfReader(file_path)
                text_parts = []
                for page in reader.pages:
                    page_text = page.extract_text()
                    if page_text:
                        text_parts.append(page_text)
                return "\n\n".join(text_parts)
            except Exception as e:
                logger.error("PDF extraction failed", error=str(e))
                return ""

        elif file_type == "docx":
            try:
                from docx import Document as DocxDocument
                doc = DocxDocument(file_path)
                return "\n\n".join(p.text for p in doc.paragraphs if p.text.strip())
            except Exception as e:
                logger.error("DOCX extraction failed", error=str(e))
                return ""

        elif file_type == "csv":
            import csv
            try:
                with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                    reader = csv.reader(f)
                    rows = [", ".join(row) for row in reader]
                return "\n".join(rows)
            except Exception as e:
                logger.error("CSV extraction failed", error=str(e))
                return ""

        return ""

    def _chunk_text(
        self,
        text: str,
        chunk_size: int = 1000,
        overlap: int = 200,
    ) -> list[dict]:
        """Split text into overlapping chunks for embedding."""
        chunks = []
        start = 0

        while start < len(text):
            end = start + chunk_size

            # Try to break at sentence boundary
            if end < len(text):
                for sep in [". ", ".\n", "\n\n", "\n", " "]:
                    last_sep = text[start:end].rfind(sep)
                    if last_sep > chunk_size * 0.5:
                        end = start + last_sep + len(sep)
                        break

            chunk_text = text[start:end].strip()
            if chunk_text:
                chunks.append({
                    "content": chunk_text,
                    "start_char": start,
                    "end_char": end,
                    "index": len(chunks),
                })

            start = end - overlap
            if start >= len(text):
                break

        return chunks

    async def _embed_and_store(self, document: Document, chunks: list[dict]):
        """Embed chunks and store in database with pgvector."""
        if not chunks:
            return

        # Batch embed
        texts = [c["content"] for c in chunks]

        try:
            embedding_response = await self.gateway.embed(texts=texts, batch_size=50)
            embeddings = embedding_response.embeddings
        except Exception as e:
            logger.warning("Embedding failed, storing chunks without embeddings", error=str(e))
            embeddings = [None] * len(chunks)

        # Store chunks
        for i, chunk in enumerate(chunks):
            db_chunk = DocumentChunk(
                document_id=document.id,
                chunk_index=chunk["index"],
                content=chunk["content"],
                token_count=len(chunk["content"].split()),  # Approximate
                start_char=chunk["start_char"],
                end_char=chunk["end_char"],
                embedding=embeddings[i] if i < len(embeddings) and embeddings[i] else None,
            )
            self.db.add(db_chunk)

        await self.db.flush()

    async def _fetch_url_content(self, url: str) -> str:
        """Fetch and extract text content from a URL."""
        import httpx
        from bs4 import BeautifulSoup
        import html2text

        try:
            async with httpx.AsyncClient(follow_redirects=True) as client:
                resp = await client.get(url, timeout=15.0, headers={
                    "User-Agent": "VERITY Research Engine/1.0",
                })

                if resp.status_code != 200:
                    return ""

                content_type = resp.headers.get("content-type", "")
                if "text/html" in content_type:
                    soup = BeautifulSoup(resp.text, "html.parser")
                    # Remove scripts and styles
                    for tag in soup(["script", "style", "nav", "footer", "header"]):
                        tag.decompose()

                    h = html2text.HTML2Text()
                    h.ignore_links = False
                    h.ignore_images = True
                    return h.handle(str(soup))
                elif "text/plain" in content_type:
                    return resp.text
                else:
                    return resp.text[:10000]  # Fallback

        except Exception as e:
            logger.warning("URL fetch failed", url=url, error=str(e))
            return ""
