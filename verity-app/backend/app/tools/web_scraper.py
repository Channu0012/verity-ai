# =============================================================================
# VERITY — Web Scraper & Article Extractor
# =============================================================================
from __future__ import annotations

import re
import httpx
import structlog
from bs4 import BeautifulSoup
from typing import Any

logger = structlog.get_logger()


class WebScraper:
    """Safely extracts text and clean markdown/paragraphs from URLs."""

    HEADERS = {
        "User-Agent": (
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/120.0.0.0 Safari/537.36 VERITY-Research/1.0"
        ),
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
    }

    async def scrape(self, url: str, max_chars: int = 25000) -> dict[str, Any]:
        """
        Fetch URL and extract clean text content.
        Returns: { "url": url, "title": title, "content": text, "status": "success" | "error" }
        """
        logger.info("Scraping webpage", url=url)
        try:
            async with httpx.AsyncClient(
                timeout=15.0,
                follow_redirects=True,
                headers=self.HEADERS,
                verify=False,
            ) as client:
                resp = await client.get(url)
                if resp.status_code != 200:
                    return {
                        "url": url,
                        "title": "",
                        "content": "",
                        "status": "error",
                        "error": f"HTTP status {resp.status_code}",
                    }

                html = resp.text
                return self.extract_content_from_html(html, url, max_chars)

        except Exception as e:
            logger.warning("Scrape failed", url=url, error=str(e))
            return {
                "url": url,
                "title": "",
                "content": "",
                "status": "error",
                "error": str(e),
            }

    def extract_content_from_html(self, html: str, url: str, max_chars: int = 25000) -> dict[str, Any]:
        """Parse HTML, strip irrelevant markup, and return structured text."""
        soup = BeautifulSoup(html, "html.parser")

        # Extract title
        title = ""
        if soup.title and soup.title.string:
            title = soup.title.string.strip()
        elif soup.find("h1"):
            title = soup.find("h1").get_text().strip()

        # Remove scripts, styles, forms, navs, footers
        for tag in soup(["script", "style", "nav", "footer", "header", "aside", "form", "noscript", "svg"]):
            tag.decompose()

        # Find primary container: <article>, <main>, or .content / #content
        article = soup.find("article") or soup.find("main") or soup.find(id=re.compile(r"content|main|post|article", re.I))
        target = article if article else (soup.body if soup.body else soup)

        # Extract paragraphs and headings
        paragraphs = []
        for element in target.find_all(["p", "h1", "h2", "h3", "h4", "li"]):
            text = element.get_text(separator=" ", strip=True)
            if text and len(text) > 25:
                paragraphs.append(text)

        joined_text = "\n\n".join(paragraphs)

        # Truncate if exceeding maximum characters
        if len(joined_text) > max_chars:
            joined_text = joined_text[:max_chars] + "\n...[truncated]"

        return {
            "url": url,
            "title": title,
            "content": joined_text,
            "char_count": len(joined_text),
            "status": "success",
        }
