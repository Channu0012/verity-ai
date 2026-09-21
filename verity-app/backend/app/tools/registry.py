# =============================================================================
# VERITY — Tool Registry
# =============================================================================
from __future__ import annotations

import structlog
from typing import Any, Dict

from app.tools.web_search import WebSearchConnector
from app.tools.web_scraper import WebScraper
from app.tools.mcp_adapter import MCPAdapter

logger = structlog.get_logger()


class ToolRegistry:
    """Central registry of executable research tools."""

    def __init__(self):
        self.mcp = MCPAdapter()
        self.search_connector = WebSearchConnector()
        self.scraper = WebScraper()
        self._register_default_tools()

    def _register_default_tools(self):
        """Register built-in research tools."""
        # 1. Web Search
        self.mcp.register_tool(
            name="web_search",
            description="Perform a web search for authoritative sources, data, statistics, and citations.",
            parameters={
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "The search query keywords or question.",
                    },
                    "num_results": {
                        "type": "integer",
                        "description": "Maximum number of search results to return (default: 5).",
                        "default": 5,
                    },
                },
                "required": ["query"],
            },
            handler=self._handle_search,
        )

        # 2. Web Page Scraper
        self.mcp.register_tool(
            name="scrape_url",
            description="Fetch and extract readable text from a web page URL for evidence analysis.",
            parameters={
                "type": "object",
                "properties": {
                    "url": {
                        "type": "string",
                        "description": "The HTTP or HTTPS URL of the page to scrape.",
                    },
                },
                "required": ["url"],
            },
            handler=self._handle_scrape,
        )

    async def _handle_search(self, query: str, num_results: int = 5) -> list[Dict[str, Any]]:
        return await self.search_connector.search(query, num_results)

    async def _handle_scrape(self, url: str) -> Dict[str, Any]:
        return await self.scraper.scrape(url)

    async def execute(self, tool_name: str, arguments: dict[str, Any]) -> Any:
        """Execute a tool by name."""
        return await self.mcp.execute_tool(tool_name, arguments)
