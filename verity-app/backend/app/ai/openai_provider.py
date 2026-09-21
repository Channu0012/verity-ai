# =============================================================================
# VERITY — OpenAI Provider
# =============================================================================
from __future__ import annotations

import json
import time

import structlog
from openai import AsyncOpenAI

from app.ai.base import AIProvider, AIResponse, EmbeddingResponse
from app.config import get_settings

settings = get_settings()
logger = structlog.get_logger()

# Cost per 1M tokens (approximate, configurable)
COST_MAP = {
    "gpt-4o": {"input": 2.50, "output": 10.00},
    "gpt-4o-mini": {"input": 0.15, "output": 0.60},
    "gpt-4-turbo": {"input": 10.00, "output": 30.00},
    "text-embedding-3-small": {"input": 0.02, "output": 0.0},
    "text-embedding-3-large": {"input": 0.13, "output": 0.0},
}


class OpenAIProvider(AIProvider):
    """OpenAI API provider."""

    def __init__(self):
        self.client = AsyncOpenAI(api_key=settings.openai_api_key) if settings.openai_api_key else None

    @property
    def name(self) -> str:
        return "openai"

    async def generate(
        self,
        messages: list[dict[str, str]],
        model: str | None = None,
        temperature: float = 0.1,
        max_tokens: int = 4096,
        response_format: dict | None = None,
        **kwargs,
    ) -> AIResponse:
        """Generate completion using OpenAI."""
        if not self.client:
            raise RuntimeError("OpenAI API key not configured")

        model = model or settings.default_model
        start_time = time.time()

        try:
            params = {
                "model": model,
                "messages": messages,
                "temperature": temperature,
                "max_tokens": max_tokens,
            }

            if response_format:
                params["response_format"] = response_format

            response = await self.client.chat.completions.create(**params)

            latency_ms = int((time.time() - start_time) * 1000)
            usage = response.usage

            # Calculate cost
            cost_rates = COST_MAP.get(model, {"input": 0.0, "output": 0.0})
            estimated_cost = (
                (usage.prompt_tokens * cost_rates["input"] / 1_000_000) +
                (usage.completion_tokens * cost_rates["output"] / 1_000_000)
            ) if usage else 0.0

            content = response.choices[0].message.content or ""

            # Try to parse structured output
            structured = None
            if response_format and response_format.get("type") == "json_object":
                try:
                    structured = json.loads(content)
                except json.JSONDecodeError:
                    pass

            return AIResponse(
                content=content,
                model=model,
                provider="openai",
                prompt_tokens=usage.prompt_tokens if usage else 0,
                completion_tokens=usage.completion_tokens if usage else 0,
                total_tokens=usage.total_tokens if usage else 0,
                estimated_cost=estimated_cost,
                latency_ms=latency_ms,
                structured_output=structured,
            )

        except Exception as e:
            latency_ms = int((time.time() - start_time) * 1000)
            logger.error("OpenAI generate failed", model=model, error=str(e), latency_ms=latency_ms)
            raise

    async def embed(
        self,
        texts: list[str],
        model: str | None = None,
        **kwargs,
    ) -> EmbeddingResponse:
        """Generate embeddings using OpenAI."""
        if not self.client:
            raise RuntimeError("OpenAI API key not configured")

        model = model or settings.embedding_model

        try:
            response = await self.client.embeddings.create(
                model=model,
                input=texts,
                dimensions=settings.embedding_dimensions,
            )

            embeddings = [item.embedding for item in response.data]
            total_tokens = response.usage.total_tokens if response.usage else 0
            cost_rates = COST_MAP.get(model, {"input": 0.0})
            estimated_cost = total_tokens * cost_rates["input"] / 1_000_000

            return EmbeddingResponse(
                embeddings=embeddings,
                model=model,
                provider="openai",
                total_tokens=total_tokens,
                estimated_cost=estimated_cost,
                dimensions=settings.embedding_dimensions,
            )

        except Exception as e:
            logger.error("OpenAI embed failed", model=model, error=str(e))
            raise

    async def is_available(self) -> bool:
        """Check if OpenAI is configured."""
        return bool(settings.openai_api_key)
