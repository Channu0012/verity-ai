# =============================================================================
# VERITY — Agent Contracts
# =============================================================================
# Every agent receives a contract and returns a structured result.
# This prevents uncontrolled agent behavior per PRD §18-20.
# =============================================================================
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any


@dataclass
class AgentContext:
    """
    Context boundary for every agent.
    Defines: WHAT I KNOW, WHAT I CAN DO, WHAT I MUST RETURN.
    """
    system_context: str = ""       # Role and constraints
    task_context: str = ""         # Specific task objective
    user_context: str = ""         # User's question/input
    retrieved_evidence: list[str] = field(default_factory=list)
    constraints: list[str] = field(default_factory=list)
    output_schema: dict | None = None
    available_tools: list[str] = field(default_factory=list)
    token_budget: int = 4096
    max_retries: int = 3


@dataclass
class AgentResult:
    """
    Structured result from every agent.
    """
    stage: str = ""               # planner, discovery, retrieval, etc.
    status: str = "success"       # success, error, partial
    result: Any = None            # Agent-specific output
    evidence: list[dict] = field(default_factory=list)
    errors: list[str] = field(default_factory=list)
    metadata: dict = field(default_factory=dict)
    tokens_used: int = 0
    cost: float = 0.0


@dataclass
class CriticFeedback:
    """
    Structured feedback from the internal critic.
    """
    passed: bool = False
    issues: list[str] = field(default_factory=list)
    suggestions: list[str] = field(default_factory=list)
    scores: dict = field(default_factory=dict)  # correctness, relevance, evidence_support, etc.
