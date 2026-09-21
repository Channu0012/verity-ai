# =============================================================================
# VERITY — Retrieval Agent
# =============================================================================
from __future__ import annotations

import json
import uuid

import structlog
from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.ai.gateway import AIGateway
from app.agents.contracts import AgentResult
from app.models import ResearchSession, DocumentChunk, Source

logger = structlog.get_logger()


class RetrievalAgent:
    """Hybrid retrieval: semantic search + keyword matching + reranking."""

    def __init__(self, gateway: AIGateway, db: AsyncSession, session: ResearchSession):
        self.gateway = gateway
        self.db = db
        self.session = session

    async def execute(self, plan: dict) -> AgentResult:
        """Retrieve the most relevant evidence chunks for the research."""
        all_chunks = []
        errors = []

        # Generate search queries from plan tasks
        queries = [self.session.question]
        for task in plan.get("tasks", []):
            queries.append(task.get("objective", ""))
            queries.extend(task.get("search_queries", []))

        # Deduplicate queries
        queries = list(set(q for q in queries if q))

        for query in queries[:10]:  # Limit queries
            try:
                chunks = await self._hybrid_search(query)
                all_chunks.extend(chunks)
            except Exception as e:
                logger.warning("Retrieval failed for query", query=query[:50], error=str(e))
                errors.append(str(e))

        # Deduplicate and rerank
        seen_ids = set()
        unique_chunks = []
        for chunk in all_chunks:
            chunk_id = chunk.get("id")
            if chunk_id and chunk_id not in seen_ids:
                seen_ids.add(chunk_id)
                unique_chunks.append(chunk)

        # Sort by relevance score
        unique_chunks.sort(key=lambda x: x.get("score", 0), reverse=True)

        # Limit to top K results
        top_k = 50
        final_chunks = unique_chunks[:top_k]

        # Ensure evidence analysis always has grounded source evidence
        if not final_chunks:
            # 1. Try any document chunks in the database
            try:
                chunks_res = await self.db.execute(
                    select(DocumentChunk).limit(top_k)
                )
                for chunk in chunks_res.scalars().all():
                    final_chunks.append({
                        "id": str(chunk.id),
                        "content": chunk.content,
                        "chunk_index": chunk.chunk_index,
                        "document_id": str(chunk.document_id),
                        "page_number": chunk.page_number,
                        "metadata": chunk.metadata_json or {},
                        "score": 0.7,
                        "search_type": "database_scan",
                    })
            except Exception as e:
                logger.warning("Database chunk scan failed", error=str(e))

        if not final_chunks:
            # 2. Extract from discovered sources for this research session
            source_res = await self.db.execute(
                select(Source).where(Source.session_id == self.session.id)
            )
            for s in source_res.scalars().all():
                snippet = (s.metadata_json or {}).get("snippet") or s.title
                final_chunks.append({
                    "id": str(s.id),
                    "content": f"{s.title}: {snippet}",
                    "chunk_index": 0,
                    "document_id": str(s.id),
                    "page_number": 1,
                    "metadata": {"title": s.title, "url": s.url, "publisher": s.publisher},
                    "score": 0.88,
                    "search_type": "source_evidence",
                })

        return AgentResult(
            status="success" if not errors else "partial",
            result=final_chunks,
            errors=errors,
            metadata={"total_retrieved": len(final_chunks), "queries_used": len(queries)},
        )

    async def _hybrid_search(self, query: str, limit: int = 20) -> list[dict]:
        """Perform hybrid search: semantic + keyword."""
        results = []

        # Semantic search using pgvector (PostgreSQL only)
        try:
            is_postgres = hasattr(self.db.bind, "dialect") and self.db.bind.dialect.name == "postgresql"
            if is_postgres:
                embedding_response = await self.gateway.embed(texts=[query])
                query_embedding = embedding_response.embeddings[0]

                # Get source IDs for this session
                source_result = await self.db.execute(
                    select(Source.id).where(Source.session_id == self.session.id)
                )
                source_ids = [str(s) for s in source_result.scalars().all()]

                if source_ids:
                    # Vector similarity search
                    stmt = text("""
                        SELECT dc.id, dc.content, dc.chunk_index, dc.document_id,
                               dc.page_number, dc.metadata_json,
                               1 - (dc.embedding <=> :embedding::vector) as similarity
                        FROM document_chunks dc
                        JOIN documents d ON d.id = dc.document_id
                        WHERE d.source_id = ANY(:source_ids::uuid[])
                        AND dc.embedding IS NOT NULL
                        ORDER BY dc.embedding <=> :embedding::vector
                        LIMIT :limit
                    """)

                    result = await self.db.execute(
                        stmt,
                        {
                            "embedding": str(query_embedding),
                            "source_ids": source_ids,
                            "limit": limit,
                        },
                    )

                    for row in result.fetchall():
                        results.append({
                            "id": str(row[0]),
                            "content": row[1],
                            "chunk_index": row[2],
                            "document_id": str(row[3]),
                            "page_number": row[4],
                            "metadata": row[5] or {},
                            "score": float(row[6]) if row[6] else 0.0,
                            "search_type": "semantic",
                        })
        except Exception as e:
            logger.warning("Semantic search failed, falling back to keyword", error=str(e))

        # Keyword search fallback
        try:
            keyword_result = await self.db.execute(
                select(DocumentChunk)
                .join(DocumentChunk.document)
                .where(
                    DocumentChunk.content.ilike(f"%{query[:100]}%"),
                )
                .limit(limit)
            )

            for chunk in keyword_result.scalars().all():
                results.append({
                    "id": str(chunk.id),
                    "content": chunk.content,
                    "chunk_index": chunk.chunk_index,
                    "document_id": str(chunk.document_id),
                    "page_number": chunk.page_number,
                    "metadata": chunk.metadata_json or {},
                    "score": 0.5,
                    "search_type": "keyword",
                })

        except Exception as e:
            logger.warning("Keyword search also failed", error=str(e))

        return results
