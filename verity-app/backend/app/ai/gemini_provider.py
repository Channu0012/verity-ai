# =============================================================================
# VERITY — Gemini Provider (Fallback)
# =============================================================================
from __future__ import annotations

import json
import time

import structlog

from app.ai.base import AIProvider, AIResponse, EmbeddingResponse
from app.config import get_settings

settings = get_settings()
logger = structlog.get_logger()


class GeminiProvider(AIProvider):
    """Google Gemini AI provider (fallback)."""

    def __init__(self):
        self._configured = bool(settings.gemini_api_key)
        if self._configured:
            try:
                import google.generativeai as genai
                genai.configure(api_key=settings.gemini_api_key)
                self.genai = genai
            except ImportError:
                logger.warning("google-generativeai not installed")
                self._configured = False

    @property
    def name(self) -> str:
        return "gemini"

    async def generate(
        self,
        messages: list[dict[str, str]],
        model: str | None = None,
        temperature: float = 0.1,
        max_tokens: int = 4096,
        response_format: dict | None = None,
        **kwargs,
    ) -> AIResponse:
        """Generate using Gemini."""
        if not self._configured:
            raise RuntimeError("Gemini API key not configured")

        model_name = model or "gemini-1.5-flash"
        start_time = time.time()

        try:
            gemini_model = self.genai.GenerativeModel(model_name)

            # Convert messages to Gemini format
            prompt_parts = []
            for msg in messages:
                role = msg.get("role", "user")
                content = msg.get("content", "")
                if role == "system":
                    prompt_parts.append(f"System: {content}")
                elif role == "assistant":
                    prompt_parts.append(f"Assistant: {content}")
                else:
                    prompt_parts.append(content)

            combined_prompt = "\n\n".join(prompt_parts)

            if response_format and response_format.get("type") == "json_object":
                combined_prompt += "\n\nRespond with valid JSON only."

            response = await gemini_model.generate_content_async(
                combined_prompt,
                generation_config={
                    "temperature": temperature,
                    "max_output_tokens": max_tokens,
                },
            )

            latency_ms = int((time.time() - start_time) * 1000)
            content = response.text or ""

            structured = None
            if response_format and response_format.get("type") == "json_object":
                try:
                    # Try to extract JSON from response
                    json_start = content.find("{")
                    json_end = content.rfind("}") + 1
                    if json_start >= 0 and json_end > json_start:
                        structured = json.loads(content[json_start:json_end])
                except json.JSONDecodeError:
                    pass

            return AIResponse(
                content=content,
                model=model_name,
                provider="gemini",
                latency_ms=latency_ms,
                structured_output=structured,
            )

        except Exception as e:
            logger.error("Gemini generate failed", model=model_name, error=str(e))
            raise

    async def embed(
        self,
        texts: list[str],
        model: str | None = None,
        **kwargs,
    ) -> EmbeddingResponse:
        """Generate embeddings using Gemini."""
        if not self._configured:
            raise RuntimeError("Gemini API key not configured")

        model_name = model or "models/text-embedding-004"

        try:
            result = self.genai.embed_content(
                model=model_name,
                content=texts,
            )

            embeddings = result["embedding"] if isinstance(result["embedding"][0], list) else [result["embedding"]]

            return EmbeddingResponse(
                embeddings=embeddings,
                model=model_name,
                provider="gemini",
                dimensions=len(embeddings[0]) if embeddings else 0,
            )

        except Exception as e:
            logger.error("Gemini embed failed", error=str(e))
            raise

    async def is_available(self) -> bool:
        return self._configured
