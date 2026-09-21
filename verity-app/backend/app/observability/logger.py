# =============================================================================
# VERITY — Structured Logging & Sensitive Data Masking
# =============================================================================
from __future__ import annotations

import re
import logging
import structlog

SENSITIVE_PATTERNS = [
    re.compile(r"sk-[a-zA-Z0-9]{20,}", re.IGNORECASE),
    re.compile(r"bearer\s+[a-zA-Z0-9\._\-]+", re.IGNORECASE),
    re.compile(r"password=[\w\W]+?(&|$)", re.IGNORECASE),
    re.compile(r"(api[_\-]?key|secret|token)\s*[:=]\s*[\"']?([a-zA-Z0-9_\-]+)", re.IGNORECASE),
]


def mask_sensitive_data(text: str) -> str:
    """Mask any accidental API keys, tokens, or passwords in strings."""
    if not isinstance(text, str):
        return text
    masked = text
    for pattern in SENSITIVE_PATTERNS:
        masked = pattern.sub("[REDACTED_SECRET]", masked)
    return masked


def configure_logging(level: str = "INFO"):
    """Configure structlog for JSON or console output."""
    structlog.configure(
        processors=[
            structlog.contextvars.merge_contextvars,
            structlog.processors.add_log_level,
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.processors.StackInfoRenderer(),
            structlog.processors.format_exc_info,
            structlog.dev.ConsoleRenderer(),
        ],
        wrapper_class=structlog.make_filtering_bound_logger(
            getattr(logging, level.upper(), logging.INFO)
        ),
        context_class=dict,
        logger_factory=structlog.PrintLoggerFactory(),
        cache_logger_on_first_use=True,
    )
