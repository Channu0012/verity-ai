# =============================================================================
# VERITY — Observability & Telemetry Metrics
# =============================================================================
from __future__ import annotations

import time
from typing import Dict, Any
from contextlib import asynccontextmanager
import structlog

logger = structlog.get_logger()


class MetricsCollector:
    """In-memory telemetry and performance metrics accumulator."""

    _counters: Dict[str, int] = {}
    _latencies: Dict[str, list[float]] = {}

    @classmethod
    def increment(cls, metric_name: str, count: int = 1):
        """Increment a counter metric."""
        cls._counters[metric_name] = cls._counters.get(metric_name, 0) + count

    @classmethod
    def record_latency(cls, metric_name: str, duration_ms: float):
        """Record an execution duration in milliseconds."""
        if metric_name not in cls._latencies:
            cls._latencies[metric_name] = []
        cls._latencies[metric_name].append(duration_ms)
        # Keep window of last 1000 observations
        if len(cls._latencies[metric_name]) > 1000:
            cls._latencies[metric_name].pop(0)

    @classmethod
    def get_summary(cls) -> Dict[str, Any]:
        """Return a snapshot of metrics."""
        summary = {"counters": dict(cls._counters), "averages": {}}
        for key, vals in cls._latencies.items():
            if vals:
                summary["averages"][f"{key}_avg_ms"] = round(sum(vals) / len(vals), 2)
                summary["averages"][f"{key}_p95_ms"] = round(
                    sorted(vals)[int(len(vals) * 0.95)], 2
                )
        return summary


@asynccontextmanager
async def time_block(metric_name: str):
    """Context manager for timing async code blocks."""
    start = time.perf_counter()
    try:
        yield
    finally:
        elapsed_ms = (time.perf_counter() - start) * 1000
        MetricsCollector.record_latency(metric_name, elapsed_ms)
        MetricsCollector.increment(f"{metric_name}_total")
