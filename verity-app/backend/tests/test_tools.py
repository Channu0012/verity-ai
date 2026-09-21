# =============================================================================
# VERITY — Tools & MCP Gateway Unit Tests
# =============================================================================
import pytest
from app.tools.gateway import ToolGateway
from app.tools.registry import ToolRegistry
from app.tools.mcp_adapter import MCPAdapter
from app.tools.web_scraper import WebScraper


@pytest.mark.asyncio
async def test_mcp_tool_registration_and_execution():
    adapter = MCPAdapter()

    async def sample_calc(a: int, b: int) -> int:
        return a + b

    adapter.register_tool(
        name="add_numbers",
        description="Add two integers",
        parameters={
            "type": "object",
            "properties": {
                "a": {"type": "integer"},
                "b": {"type": "integer"},
            },
            "required": ["a", "b"],
        },
        handler=sample_calc,
    )

    result = await adapter.execute_tool("add_numbers", {"a": 10, "b": 25})
    assert result == 35

    # Check OpenAI export format
    openai_tools = adapter.get_openai_tools()
    assert len(openai_tools) == 1
    assert openai_tools[0]["function"]["name"] == "add_numbers"


@pytest.mark.asyncio
async def test_tool_gateway_timeout():
    import asyncio
    gateway = ToolGateway(default_timeout=0.1)

    async def slow_func():
        await asyncio.sleep(0.5)
        return "done"

    gateway.registry.mcp.register_tool(
        name="slow_tool",
        description="Slow test",
        parameters={"type": "object"},
        handler=slow_func,
    )

    res = await gateway.invoke_tool("slow_tool", {})
    assert not res["success"]
    assert "timed out" in res["error"]


def test_web_scraper_html_extraction():
    scraper = WebScraper()
    raw_html = """
    <html>
        <head><title>Research Findings on Solid-State Batteries</title></head>
        <body>
            <nav><a href="/">Home</a></nav>
            <main>
                <h1>Solid-State Breakthrough</h1>
                <p>Researchers have achieved a 500 Wh/kg energy density with ceramic electrolytes.</p>
                <p>This enables continuous operation across 1000 fast-charging cycles without degradation.</p>
            </main>
            <footer>Copyright 2026</footer>
        </body>
    </html>
    """
    result = scraper.extract_content_from_html(raw_html, "https://example.com/battery")
    assert result["title"] == "Research Findings on Solid-State Batteries"
    assert "500 Wh/kg" in result["content"]
    assert "Home" not in result["content"]
    assert "Copyright" not in result["content"]
