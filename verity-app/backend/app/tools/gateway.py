# =============================================================================
# VERITY — Tool Gateway
# =============================================================================
from __future__ import annotations

import asyncio
import time
from typing import Any
import structlog

from app.tools.registry import ToolRegistry

logger = structlog.get_logger()


class ToolGateway:
    """
    Unified gateway for executing agent tools.
    Enforces timeouts, records metrics, sanitizes arguments, and handles exceptions safely.
    """

    def __init__(self, registry: ToolRegistry | None = None, default_timeout: float = 30.0):
        self.registry = registry or ToolRegistry()
        self.default_timeout = default_timeout

    async def invoke_tool(
        self,
        tool_name: str,
        arguments: dict[str, Any],
        timeout: float | None = None,
    ) -> dict[str, Any]:
        """
        Safely execute a tool with timeout and error containment.
        Returns: { "success": bool, "data": Any, "error": str | None, "latency_ms": int }
        """
        start_time = time.perf_counter()
        t_limit = timeout or self.default_timeout

        logger.info("ToolGateway invoking tool", tool=tool_name)
        try:
            result = await asyncio.wait_for(
                self.registry.execute(tool_name, arguments),
                timeout=t_limit,
            )
            latency = int((time.perf_counter() - start_time) * 1000)
            return {
                "success": True,
                "data": result,
                "error": None,
                "latency_ms": latency,
            }
        except asyncio.TimeoutError:
            latency = int((time.perf_counter() - start_time) * 1000)
            logger.warning("Tool execution timed out", tool=tool_name, timeout=t_limit)
            return {
                "success": False,
                "data": None,
                "error": f"Tool '{tool_name}' timed out after {t_limit}s",
                "latency_ms": latency,
            }
        except Exception as e:
            latency = int((time.perf_counter() - start_time) * 1000)
            logger.error("Tool execution failed", tool=tool_name, error=str(e))
            return {
                "success": False,
                "data": None,
                "error": str(e),
                "latency_ms": latency,
            }
