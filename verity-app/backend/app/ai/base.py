# =============================================================================
# VERITY — AI Provider Base
# =============================================================================
from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Any


@dataclass
class AIResponse:
    """Standardized response from any AI provider."""
    content: str
    model: str
    provider: str
    prompt_tokens: int = 0
    completion_tokens: int = 0
    total_tokens: int = 0
    estimated_cost: float = 0.0
    latency_ms: int = 0
    structured_output: dict | None = None
    metadata: dict = field(default_factory=dict)


@dataclass
class EmbeddingResponse:
    """Standardized embedding response."""
    embeddings: list[list[float]]
    model: str
    provider: str
    total_tokens: int = 0
    estimated_cost: float = 0.0
    dimensions: int = 0


class AIProvider(ABC):
    """Abstract base class for all AI providers."""

    @property
    @abstractmethod
    def name(self) -> str:
        """Provider name."""
        ...

    @abstractmethod
    async def generate(
        self,
        messages: list[dict[str, str]],
        model: str | None = None,
        temperature: float = 0.1,
        max_tokens: int = 4096,
        response_format: dict | None = None,
        **kwargs,
    ) -> AIResponse:
        """Generate a text completion."""
        ...

    @abstractmethod
    async def embed(
        self,
        texts: list[str],
        model: str | None = None,
        **kwargs,
    ) -> EmbeddingResponse:
        """Generate embeddings for texts."""
        ...

    @abstractmethod
    async def is_available(self) -> bool:
        """Check if the provider is configured and reachable."""
        ...
