# =============================================================================
# VERITY — Pytest Fixtures & Test Setup
# =============================================================================
import os
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport

# Ensure test environment variables
os.environ["AUTH_SECRET"] = "test-auth-secret-key-12345"
os.environ["DATABASE_URL"] = "sqlite+aiosqlite:///:memory:"
os.environ["SEARCH_API_KEY"] = "test-key"
os.environ["SEARCH_API_PROVIDER"] = "duckduckgo"

@pytest_asyncio.fixture
async def async_client():
    """Async HTTP client for testing FastAPI endpoints."""
    from app.main import app
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        yield client
