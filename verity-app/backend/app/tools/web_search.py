# =============================================================================
# VERITY — Web & Scholarly Search Connector
# =============================================================================
# High-reliability multi-engine search aggregator:
# 1. DuckDuckGo HTML Live Web Search (News, Government, Industry, Wikipedia)
# 2. CrossRef Scholarly Metadata API (Peer-reviewed academic papers with DOIs)
# 3. arXiv Preprints API (Computer Science, AI, Physics, Math papers)
# =============================================================================
from __future__ import annotations

import asyncio
import re
import urllib.parse
from typing import Any
from urllib.parse import parse_qs, unquote, urlparse

import httpx
import structlog
from bs4 import BeautifulSoup

from app.config import get_settings

logger = structlog.get_logger()
settings = get_settings()

BROWSER_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
}


def _determine_source_type(url: str, publisher: str, title: str) -> str:
    """Classify source type from URL domain and publisher name."""
    url_lower = url.lower()
    pub_lower = publisher.lower()

    if any(d in url_lower for d in [".edu", ".ac.uk", "arxiv.org", "doi.org", "nature.com", "sciencedirect.com", "ieee.org", "springer.com", "crossref.org", "nih.gov", "ncbi.nlm.nih.gov"]):
        return "academic"
    if any(d in url_lower for d in [".gov", ".gov.in", ".gov.uk", "europa.eu", "who.int", "un.org"]):
        return "government"
    if any(d in url_lower for d in ["reuters.com", "bloomberg.com", "ft.com", "wsj.com", "nytimes.com", "bbc.com", "cnbc.com", "economist.com", "theguardian.com"]):
        return "news"
    if any(d in pub_lower for d in ["research", "institute", "laboratory", "university"]):
        return "research_organization"
    if any(d in url_lower for d in ["wikipedia.org"]):
        return "encyclopedia"
    return "industry"


def _clean_text(text: str) -> str:
    """Clean extra whitespace and formatting from text."""
    if not text:
        return ""
    text = re.sub(r"<[^>]+>", " ", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()


class WebSearchConnector:
    """High-reliability multi-engine search connector."""

    def __init__(self, api_key: str | None = None, provider: str | None = None):
        self.api_key = api_key or settings.search_api_key
        self.provider = provider or settings.search_api_provider

    async def search(self, query: str, num_results: int = 8) -> list[dict[str, Any]]:
        """
        Execute multi-engine search across live web and academic repositories.
        Returns: normalized list of dict with keys:
            title, url, snippet, publisher, published_date, source_type, relevance_score
        """
        if not query or not query.strip():
            return []

        cleaned_query = query.strip()
        logger.info("Executing multi-engine research search", query=cleaned_query)

        # Run DuckDuckGo HTML and CrossRef Academic concurrently
        ddg_task = asyncio.create_task(self._search_duckduckgo_html(cleaned_query, num_results=num_results))
        crossref_task = asyncio.create_task(self._search_crossref_academic(cleaned_query, num_results=min(4, num_results)))
        arxiv_task = asyncio.create_task(self._search_arxiv(cleaned_query, num_results=2))

        results_lists = await asyncio.gather(ddg_task, crossref_task, arxiv_task, return_exceptions=True)

        all_results = []
        for res in results_lists:
            if isinstance(res, list):
                all_results.extend(res)
            elif isinstance(res, Exception):
                logger.warning("Search sub-engine encountered error", error=str(res))

        # Deduplicate by normalized URL
        seen_urls = set()
        deduped = []
        for item in all_results:
            url = item.get("url", "").strip()
            if not url:
                continue
            normalized_url = url.split("#")[0].rstrip("/")
            if normalized_url not in seen_urls:
                seen_urls.add(normalized_url)
                deduped.append(item)

        # Fallback if both engines returned empty
        if not deduped:
            logger.warning("Primary engines returned empty, trying Instant Answer fallback", query=cleaned_query)
            deduped = await self._search_duckduckgo_ia_fallback(cleaned_query, num_results)

        logger.info("Search complete", query=cleaned_query, total_results=len(deduped))
        return deduped[:num_results]

    async def _search_duckduckgo_html(self, query: str, num_results: int = 6) -> list[dict[str, Any]]:
        """Live DuckDuckGo HTML search extracting verified destination URLs."""
        results = []
        try:
            async with httpx.AsyncClient(headers=BROWSER_HEADERS, timeout=12.0, follow_redirects=True) as client:
                resp = await client.post(
                    "https://html.duckduckgo.com/html/",
                    data={"q": query},
                )

                if resp.status_code != 200:
                    logger.warning("DuckDuckGo HTML returned non-200", status=resp.status_code)
                    return []

                soup = BeautifulSoup(resp.text, "html.parser")
                elements = soup.select(".result")

                for el in elements:
                    title_el = el.select_one(".result__title .result__a") or el.select_one(".result__a")
                    snippet_el = el.select_one(".result__snippet")
                    if not title_el or not snippet_el:
                        continue

                    title = _clean_text(title_el.get_text())
                    snippet = _clean_text(snippet_el.get_text())
                    raw_href = title_el.get("href", "")

                    # Decode actual destination URL from DDG redirect wrapper
                    url = raw_href
                    if "/l/?uddg=" in raw_href or "duckduckgo.com/l/?" in raw_href:
                        parsed = urlparse(raw_href)
                        qs = parse_qs(parsed.query)
                        if "uddg" in qs:
                            url = unquote(qs["uddg"][0])

                    if not url or not url.startswith("http"):
                        continue

                    parsed_url = urlparse(url)
                    publisher = parsed_url.netloc.replace("www.", "")
                    source_type = _determine_source_type(url, publisher, title)

                    results.append({
                        "title": title,
                        "url": url,
                        "snippet": snippet,
                        "publisher": publisher,
                        "published_date": None,
                        "source_type": source_type,
                        "relevance_score": 0.88,
                    })

                    if len(results) >= num_results:
                        break

        except Exception as e:
            logger.warning("DuckDuckGo HTML search failed", error=str(e))

        return results

    async def _search_crossref_academic(self, query: str, num_results: int = 4) -> list[dict[str, Any]]:
        """Query CrossRef API for peer-reviewed academic papers with verified DOIs."""
        results = []
        try:
            url = "https://api.crossref.org/works"
            params = {
                "query": query,
                "rows": num_results,
                "sort": "relevance",
            }
            headers = {
                "User-Agent": "VERITY-ResearchEngine/1.0 (mailto:research@verity.ai)",
                "Accept": "application/json",
            }

            async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
                resp = await client.get(url, params=params, headers=headers)
                if resp.status_code == 200:
                    data = resp.json()
                    items = data.get("message", {}).get("items", [])
                    for item in items:
                        titles = item.get("title", [])
                        title = titles[0] if titles else ""
                        if not title:
                            continue

                        doi = item.get("DOI", "")
                        paper_url = item.get("URL") or (f"https://doi.org/{doi}" if doi else "")
                        if not paper_url:
                            continue

                        publisher = item.get("publisher") or item.get("container-title", [""])[0] or "Academic Press"
                        abstract = _clean_text(item.get("abstract", ""))

                        # Extract publication year
                        year = None
                        issued = item.get("issued", {}).get("date-parts", [[]])
                        if issued and issued[0]:
                            year = str(issued[0][0])

                        # Build informative snippet
                        snippet = abstract if abstract else f"Scholarly publication in {publisher} ({year or 'Recent'}). DOI: {doi}"

                        results.append({
                            "title": title,
                            "url": paper_url,
                            "snippet": snippet[:400],
                            "publisher": publisher,
                            "published_date": year,
                            "source_type": "academic",
                            "relevance_score": 0.95,
                        })

        except Exception as e:
            logger.warning("CrossRef academic search failed", error=str(e))

        return results

    async def _search_arxiv(self, query: str, num_results: int = 2) -> list[dict[str, Any]]:
        """Query arXiv API for scientific preprints."""
        results = []
        try:
            cleaned_q = re.sub(r"[^\w\s]", " ", query).strip()
            url = f"https://export.arxiv.org/api/query?search_query=all:{urllib.parse.quote(cleaned_q)}&start=0&max_results={num_results}"
            async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
                resp = await client.get(url)
                if resp.status_code == 200:
                    soup = BeautifulSoup(resp.text, "xml")
                    for entry in soup.find_all("entry"):
                        title = _clean_text(entry.title.get_text()) if entry.title else ""
                        summary = _clean_text(entry.summary.get_text()) if entry.summary else ""
                        id_url = entry.id.get_text().strip() if entry.id else ""
                        published = entry.published.get_text()[:4] if entry.published else None

                        if title and id_url:
                            results.append({
                                "title": title,
                                "url": id_url,
                                "snippet": summary[:400],
                                "publisher": "arXiv.org",
                                "published_date": published,
                                "source_type": "academic",
                                "relevance_score": 0.92,
                            })
        except Exception as e:
            logger.warning("arXiv search failed", error=str(e))

        return results

    async def _search_duckduckgo_ia_fallback(self, query: str, num_results: int) -> list[dict[str, Any]]:
        """Fallback lightweight search when HTML is blocked."""
        results = []
        try:
            async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
                resp = await client.get(
                    "https://api.duckduckgo.com/",
                    params={"q": query, "format": "json", "no_html": "1", "skip_disambig": "1"},
                    headers={"User-Agent": "VERITY-ResearchEngine/1.0"},
                )
                if resp.status_code == 200:
                    data = resp.json()
                    if data.get("AbstractText") and data.get("AbstractURL"):
                        url = data.get("AbstractURL")
                        results.append({
                            "title": data.get("Heading") or query,
                            "url": url,
                            "snippet": data.get("AbstractText"),
                            "publisher": urlparse(url).netloc,
                            "published_date": None,
                            "source_type": "encyclopedia",
                            "relevance_score": 0.80,
                        })
                    for topic in data.get("RelatedTopics", []):
                        if isinstance(topic, dict) and topic.get("FirstURL"):
                            url = topic.get("FirstURL")
                            text = topic.get("Text", "")
                            results.append({
                                "title": text[:70] if len(text) > 70 else text,
                                "url": url,
                                "snippet": text,
                                "publisher": urlparse(url).netloc,
                                "published_date": None,
                                "source_type": "encyclopedia",
                                "relevance_score": 0.75,
                            })
                            if len(results) >= num_results:
                                break
        except Exception as e:
            logger.warning("DuckDuckGo IA fallback failed", error=str(e))

        return results
