# =============================================================================
# VERITY — Health & Liveness Tests
# =============================================================================
import pytest


@pytest.mark.asyncio
async def test_health_check(async_client):
    """Verify GET /api/v1/health returns 200 OK and healthy status."""
    response = await async_client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "version" in data
    assert "timestamp" in data


@pytest.mark.asyncio
async def test_readiness_probe(async_client):
    """Verify GET /api/v1/ready returns service readiness."""
    response = await async_client.get("/api/v1/ready")
    assert response.status_code == 200
    data = response.json()
    assert "ready" in data
    assert "checks" in data
