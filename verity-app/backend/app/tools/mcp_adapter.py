# =============================================================================
# VERITY — Model Context Protocol (MCP) Adapter
# =============================================================================
from __future__ import annotations

import json
from typing import Any, Callable, Awaitable
import structlog

logger = structlog.get_logger()


class MCPToolDefinition:
    """Represents an MCP-compatible tool schema."""

    def __init__(
        self,
        name: str,
        description: str,
        parameters: dict[str, Any],
        handler: Callable[..., Awaitable[Any]],
    ):
        self.name = name
        self.description = description
        self.parameters = parameters
        self.handler = handler

    def to_openai_schema(self) -> dict[str, Any]:
        """Convert MCP tool definition to OpenAI function call format."""
        return {
            "type": "function",
            "function": {
                "name": self.name,
                "description": self.description,
                "parameters": self.parameters,
            },
        }

    def to_gemini_schema(self) -> dict[str, Any]:
        """Convert to Google Gemini function declaration format."""
        return {
            "name": self.name,
            "description": self.description,
            "parameters": self.parameters,
        }


class MCPAdapter:
    """Manages MCP tools and bridges them to AI providers."""

    def __init__(self):
        self._tools: dict[str, MCPToolDefinition] = {}

    def register_tool(
        self,
        name: str,
        description: str,
        parameters: dict[str, Any],
        handler: Callable[..., Awaitable[Any]],
    ):
        """Register an MCP tool."""
        self._tools[name] = MCPToolDefinition(name, description, parameters, handler)
        logger.info("Registered MCP tool", tool_name=name)

    async def execute_tool(self, name: str, arguments: dict[str, Any]) -> Any:
        """Execute a tool call by name with validated arguments."""
        if name not in self._tools:
            raise ValueError(f"Tool '{name}' is not registered in MCP adapter.")

        tool = self._tools[name]
        logger.info("Executing MCP tool", tool_name=name, args=list(arguments.keys()))
        try:
            return await tool.handler(**arguments)
        except Exception as e:
            logger.error("MCP tool execution error", tool_name=name, error=str(e))
            raise

    def get_openai_tools(self) -> list[dict[str, Any]]:
        """Get all registered tools as OpenAI tool specifications."""
        return [tool.to_openai_schema() for tool in self._tools.values()]

    def get_gemini_tools(self) -> list[dict[str, Any]]:
        """Get all registered tools as Gemini tool specifications."""
        return [tool.to_gemini_schema() for tool in self._tools.values()]
