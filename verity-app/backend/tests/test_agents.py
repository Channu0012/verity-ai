# =============================================================================
# VERITY — Agent Pipeline Contracts & Logic Tests
# =============================================================================
import pytest
from app.agents.contracts import AgentResult


def test_agent_result_contract():
    result = AgentResult(
        stage="planner",
        status="success",
        result={"tasks": [{"id": "t1", "objective": "Analyze energy density"}]},
        metadata={"tokens_used": 150},
    )
    assert result.status == "success"
    assert result.stage == "planner"
    assert len(result.result["tasks"]) == 1


def test_agent_result_error_contract():
    result = AgentResult(
        stage="retrieval",
        status="error",
        errors=["Search engine rate limited", "Connection reset"],
    )
    assert result.status == "error"
    assert len(result.errors) == 2
