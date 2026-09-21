# =============================================================================
# VERITY — Research Background Worker
# =============================================================================
from __future__ import annotations

import asyncio
import uuid
import structlog
from datetime import datetime
from sqlalchemy import select

from app.database import async_session
from app.models import ResearchSession
from app.agents.orchestrator import ResearchOrchestrator

logger = structlog.get_logger()


class ResearchWorker:
    """
    Asynchronous background worker responsible for processing research requests.
    Supports single task dispatch or standing worker queue loops.
    """

    @staticmethod
    async def process_session(session_id: str | uuid.UUID):
        """Execute the full research pipeline for a specific session."""
        uid = uuid.UUID(str(session_id))
        logger.info("Worker starting research processing", session_id=str(uid))

        async with async_session() as db:
            try:
                session = await db.get(ResearchSession, uid)
                if not session:
                    logger.error("Session not found for worker", session_id=str(uid))
                    return

                if session.status in ["completed", "failed"]:
                    logger.warning("Session already finalized", session_id=str(uid), status=session.status)
                    return

                orchestrator = ResearchOrchestrator(db, session)
                await orchestrator.run()
                logger.info("Worker completed research processing", session_id=str(uid))

            except Exception as e:
                logger.error("Worker encountered fatal error", session_id=str(uid), error=str(e))
                try:
                    session = await db.get(ResearchSession, uid)
                    if session:
                        session.status = "failed"
                        session.error_message = f"Worker failure: {str(e)[:500]}"
                        session.completed_at = datetime.utcnow()
                        await db.commit()
                except Exception as inner_e:
                    logger.error("Failed to mark session as failed", error=str(inner_e))

    @classmethod
    async def run_queue_listener(cls, poll_interval: float = 3.0, stop_event: asyncio.Event | None = None):
        """Continuous polling loop for queued research jobs."""
        logger.info("Research worker loop initiated", poll_interval=poll_interval)
        while not (stop_event and stop_event.is_set()):
            try:
                async with async_session() as db:
                    result = await db.execute(
                        select(ResearchSession.id)
                        .where(ResearchSession.status == "queued")
                        .order_by(ResearchSession.created_at.asc())
                        .limit(1)
                    )
                    next_id = result.scalar_one_or_none()

                if next_id:
                    logger.info("Dequeued research task", session_id=str(next_id))
                    await cls.process_session(next_id)
                else:
                    await asyncio.sleep(poll_interval)

            except asyncio.CancelledError:
                logger.info("Research worker loop cancelled")
                break
            except Exception as e:
                logger.error("Error in research worker queue loop", error=str(e))
                await asyncio.sleep(poll_interval)
