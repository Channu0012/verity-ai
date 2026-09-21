# =============================================================================
# VERITY — In-Memory Sliding Window Rate Limiter
# =============================================================================
from __future__ import annotations

import time
from collections import defaultdict
import structlog

logger = structlog.get_logger()


class RateLimiter:
    """Sliding-window in-memory rate limiter per key (user_id or IP)."""

    def __init__(self, requests_per_minute: int = 60):
        self.rpm = requests_per_minute
        self._history: dict[str, list[float]] = defaultdict(list)

    def is_allowed(self, key: str, cost: int = 1) -> bool:
        """Check if request is permitted under rate limit window."""
        now = time.time()
        window_start = now - 60.0

        # Purge timestamps older than 1 minute
        history = [ts for ts in self._history[key] if ts > window_start]
        self._history[key] = history

        if len(history) + cost <= self.rpm:
            for _ in range(cost):
                self._history[key].append(now)
            return True

        logger.warning("Rate limit exceeded", key=key, count=len(history), max_rpm=self.rpm)
        return False

    def remaining_requests(self, key: str) -> int:
        """Get remaining allowed requests in current window."""
        now = time.time()
        window_start = now - 60.0
        active = [ts for ts in self._history[key] if ts > window_start]
        return max(0, self.rpm - len(active))
