# =============================================================================
# VERITY — Web Search Connector
# =============================================================================
from __future__ import annotations

import httpx
import structlog
from typing import Any
from urllib.parse import urlparse

from app.config import get_settings

logger = structlog.get_logger()
settings = get_settings()


class WebSearchConnector:
    """Connects to web search providers (KIE.ai, Serper, or generic JSON search)."""

    def __init__(self, api_key: str | None = None, provider: str | None = None):
        self.api_key = api_key or settings.search_api_key
        self.provider = provider or settings.search_api_provider

    async def search(self, query: str, num_results: int = 8) -> list[dict[str, Any]]:
        """
        Execute web search query and return normalized results.
        Returns: list of dict with keys: title, url, snippet, publisher, published_date
        """
        if not query.strip():
            return []

        logger.info("Executing web search", query=query, provider=self.provider)

        # 1. Try KIE.ai search endpoint
        if self.provider == "kieai" and self.api_key:
            try:
                results = await self._search_kieai(query, num_results)
                if results:
                    return results
            except Exception as e:
                logger.warning("KIE.ai search failed, falling back", error=str(e))

        # 2. Try generic search / Serper
        if self.provider == "serper" and self.api_key:
            try:
                results = await self._search_serper(query, num_results)
                if results:
                    return results
            except Exception as e:
                logger.warning("Serper search failed", error=str(e))

        # 3. Fallback: DuckDuckGo Instant Answer / HTML Search
        try:
            return await self._search_duckduckgo_fallback(query, num_results)
        except Exception as e:
            logger.warning("DuckDuckGo fallback search failed", error=str(e))
            return []

    async def _search_kieai(self, query: str, num_results: int) -> list[dict[str, Any]]:
        """Call KIE.ai search endpoint."""
        async with httpx.AsyncClient(timeout=15.0) as client:
            headers = {
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
            }
            # Support standard KIE API payload
            payload = {
                "query": query,
                "limit": num_results,
            }
            resp = await client.post(
                "https://api.kie.ai/v1/search",
                headers=headers,
                json=payload,
            )
            if resp.status_code == 200:
                data = resp.json()
                items = data.get("results") or data.get("data") or []
                normalized = []
                for item in items[:num_results]:
                    url = item.get("url") or item.get("link") or ""
                    parsed = urlparse(url)
                    normalized.append({
                        "title": item.get("title", ""),
                        "url": url,
                        "snippet": item.get("snippet") or item.get("description") or "",
                        "publisher": item.get("publisher") or parsed.netloc,
                        "published_date": item.get("published_date") or item.get("date"),
                    })
                return normalized
            else:
                logger.warning("KIE.ai returned status", status=resp.status_code, body=resp.text[:200])
                return []

    async def _search_serper(self, query: str, num_results: int) -> list[dict[str, Any]]:
        """Call Serper Google search endpoint."""
        async with httpx.AsyncClient(timeout=15.0) as client:
            headers = {
                "X-API-KEY": self.api_key,
                "Content-Type": "application/json",
            }
            resp = await client.post(
                "https://google.serper.dev/search",
                headers=headers,
                json={"q": query, "num": num_results},
            )
            if resp.status_code == 200:
                data = resp.json()
                items = data.get("organic", [])
                normalized = []
                for item in items[:num_results]:
                    url = item.get("link", "")
                    parsed = urlparse(url)
                    normalized.append({
                        "title": item.get("title", ""),
                        "url": url,
                        "snippet": item.get("snippet", ""),
                        "publisher": parsed.netloc,
                        "published_date": item.get("date"),
                    })
                return normalized
            return []

    async def _search_duckduckgo_fallback(self, query: str, num_results: int) -> list[dict[str, Any]]:
        """Fallback lightweight search without API key."""
        async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
            resp = await client.get(
                "https://api.duckduckgo.com/",
                params={"q": query, "format": "json", "no_html": "1", "skip_disambig": "1"},
                headers={"User-Agent": "VERITY-ResearchEngine/1.0"},
            )
            normalized = []
            if resp.status_code == 200:
                data = resp.json()
                # Abstract
                if data.get("AbstractText") and data.get("AbstractURL"):
                    url = data.get("AbstractURL")
                    normalized.append({
                        "title": data.get("Heading") or query,
                        "url": url,
                        "snippet": data.get("AbstractText"),
                        "publisher": urlparse(url).netloc,
                        "published_date": None,
                    })
                # Related topics
                for topic in data.get("RelatedTopics", []):
                    if isinstance(topic, dict) and topic.get("FirstURL"):
                        url = topic.get("FirstURL")
                        text = topic.get("Text", "")
                        normalized.append({
                            "title": text[:60] if len(text) > 60 else text,
                            "url": url,
                            "snippet": text,
                            "publisher": urlparse(url).netloc,
                            "published_date": None,
                        })
                        if len(normalized) >= num_results:
                            break
            return normalized
