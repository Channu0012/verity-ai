# =============================================================================
# VERITY — Input Sanitization & URL Safety Validator
# =============================================================================
from __future__ import annotations

import re
import ipaddress
from urllib.parse import urlparse
from typing import Tuple

DISALLOWED_HOSTS = {"localhost", "127.0.0.1", "0.0.0.0", "::1"}


class InputValidator:
    """Validates user inputs, questions, and URLs to prevent SSRF and injection."""

    @staticmethod
    def sanitize_text(text: str, max_length: int = 5000) -> str:
        """Strip non-printable control characters and truncate to max_length."""
        if not text:
            return ""
        # Remove ASCII control characters except \n, \r, \t
        sanitized = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]", "", text)
        return sanitized[:max_length].strip()

    @staticmethod
    def is_safe_url(url: str) -> Tuple[bool, str | None]:
        """
        Validate URL for HTTP/HTTPS scheme and ensure it does not target
        private IPs or internal infrastructure (SSRF protection).
        """
        if not url:
            return False, "URL is empty"

        try:
            parsed = urlparse(url)
            if parsed.scheme.lower() not in ("http", "https"):
                return False, f"Scheme '{parsed.scheme}' not allowed (must be http or https)"

            hostname = parsed.hostname
            if not hostname:
                return False, "Invalid host in URL"

            if hostname.lower() in DISALLOWED_HOSTS:
                return False, "Targeting loopback addresses is prohibited"

            # Check if host is a private/internal IP
            try:
                ip = ipaddress.ip_address(hostname)
                if ip.is_private or ip.is_loopback or ip.is_link_local:
                    return False, "Targeting private internal IP addresses is prohibited"
            except ValueError:
                # Hostname is a domain name, not raw IP
                pass

            return True, None

        except Exception as e:
            return False, f"Malformed URL: {str(e)}"
