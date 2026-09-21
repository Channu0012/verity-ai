# =============================================================================
# VERITY — Prompt Injection Defense & Sanitization
# =============================================================================
from __future__ import annotations

import re
from typing import Tuple
import structlog

logger = structlog.get_logger()

# Patterns indicative of prompt injection or system override attempts
INJECTION_PATTERNS = [
    re.compile(r"ignore\s+(all\s+)?(previous|prior)\s+(instructions|prompts|rules)", re.I),
    re.compile(r"disregard\s+(the\s+)?(above|system\s+prompt)", re.I),
    re.compile(r"you\s+are\s+now\s+(DAN|unrestricted|in\s+developer\s+mode)", re.I),
    re.compile(r"(system|assistant)\s*:\s*", re.I),
    re.compile(r"<\s*\|(im_start|im_end|endoftext)\|\s*>", re.I),
    re.compile(r"reveal\s+your\s+(initial|secret|system)\s+(prompt|instructions)", re.I),
]


class PromptGuard:
    """Detects and neutralizes prompt injection attacks."""

    @classmethod
    def check_for_injection(cls, user_text: str) -> Tuple[bool, str | None]:
        """
        Scan text for prompt injection signatures.
        Returns: (is_suspicious: bool, reason: str | None)
        """
        if not user_text:
            return False, None

        for pattern in INJECTION_PATTERNS:
            match = pattern.search(user_text)
            if match:
                logger.warning("Prompt injection pattern detected", matched=match.group(0))
                return True, f"Detected disallowed override sequence: '{match.group(0)}'"

        return False, None

    @classmethod
    def sanitize_untrusted_content(cls, content: str) -> str:
        """
        Wrap third-party untrusted content (e.g. scraped web pages) with defensive boundaries
        so the LLM treats it as passive data rather than instructions.
        """
        if not content:
            return ""

        # Neutralize markdown code block fences and system tokens
        safe = content.replace("<|im_start|>", "[token]").replace("<|im_end|>", "[token]")
        safe = safe.replace("```system", "```data")
        return f"<UNTRUSTED_EXTERNAL_SOURCE_DATA>\n{safe}\n</UNTRUSTED_EXTERNAL_SOURCE_DATA>"
