# verity-ai

> **Evidence-First AI Research Engine**  
> Transform complex questions into verified, evidence-backed research reports with multi-agent orchestration, citation verification, and contradiction detection.

[![Next.js](https://img.shields.io/badge/Next.js-16.3.5-black?logo=next.js)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115+-009688?logo=fastapi)](https://fastapi.tiangolo.com/)
[![Python](https://img.shields.io/badge/Python-3.11+-blue?logo=python)](https://www.python.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

---

## Overview

**VERITY** is a production-grade research intelligence engine designed to eliminate AI hallucinations by grounding every synthesized claim in verifiable empirical evidence. Rather than treating generative AI models as authoritative oracles, VERITY orchestrates a deterministic 9-stage verification pipeline where claims are extracted, mapped to discrete source passages, cross-checked for contradictions, and audited for citation fidelity.

### Core Capabilities

- **9-Stage Multi-Agent Pipeline**:
  1. **Planning**: Deconstructs complex research inquiries into prioritized sub-questions and target search vectors.
  2. **Source Discovery**: Queries academic databases, technical registries, and search engines with domain credibility scoring.
  3. **Document Ingestion**: Normalizes, cleanses, and chunks long-form literature into semantic evidence units.
  4. **Hybrid Retrieval**: Combines semantic dense embeddings with sparse BM25 keyword matching and cross-encoder reranking.
  5. **Evidence Analysis**: Maps extracted claims directly to specific cited passages with confidence bounds.
  6. **Contradiction Detection**: Cross-references claims across sources to identify conflicting findings and nuanced disagreements.
  7. **Citation Verification**: Strict audit verifying that every generated assertion is supported by its cited passage.
  8. **Synthesis & Structuring**: Generates structured, publishable reports with executive summaries, findings, and methodology.
  9. **Quality Evaluation**: Scores completeness, soundness, verifiability, and source validation rates.

- **Dual-Database Compatibility**:
  - **Production**: PostgreSQL 16 + pgvector for high-dimensional vector search and ACID concurrency.
  - **Local / Edge**: SQLite fallback with safe type decorators and deterministic embeddings.

- **Unified AI Gateway**:
  - Multi-provider routing (OpenAI GPT-4o, Google Gemini 1.5 Pro/Flash).
  - Resilient heuristic fallback pipeline ensuring zero crash guarantees even during upstream network disruptions.
  - Automatic token tracking, latency recording, and audit logging.

- **Modern Glassmorphic UI**:
  - Built with Next.js 16 (Turbopack), Tailwind CSS, Framer Motion, and Lucide Icons.
  - Interactive Constellation Evidence Universe, real-time Stage Tracker, Report Explorer, and Evidence Inspector.

---

## Architecture

```
verity-ai/
├── verity-app/
│   ├── app/                      # Next.js 16 App Router (Frontend)
│   │   ├── dashboard/            # Workspaces, Research Studio, Reports, Projects
│   │   ├── layout.tsx            # Root Layout with Theme & Tooltip Providers
│   │   └── page.tsx              # Interactive Constellation Landing Page
│   ├── components/               # React Component Library & UI Primitives
│   ├── backend/                  # FastAPI Application (Backend)
│   │   ├── app/
│   │   │   ├── agents/           # Multi-Agent Pipeline Orchestration
│   │   │   ├── ai/               # Unified AI Gateway & Model Routing
│   │   │   ├── ingestion/        # Document Parsing & Chunking
│   │   │   ├── routers/          # RESTful Endpoints (Research, Projects, Reports, Admin)
│   │   │   ├── tools/            # Web Scraper, Search Connectors, MCP Adapter
│   │   │   ├── models.py         # 17 SQLAlchemy Relational Data Models
│   │   │   └── database.py       # Async Database Engine & Session Management
│   │   └── tests/                # Comprehensive Test Suite (pytest)
│   └── package.json              # Frontend Dependencies & Scripts
└── README.md
```

---

## Quickstart

### Prerequisites

- **Node.js**: `v20+` (v25 supported)
- **Python**: `3.11+`
- **Git**

### 1. Clone & Setup

```bash
git clone https://github.com/Channu0012/verity-ai.git
cd verity-ai/verity-app
```

### 2. Backend Setup

```bash
cd backend
python -m venv .venv
# Windows:
.venv\Scripts\activate
# macOS / Linux:
# source .venv/bin/activate

pip install -r requirements.txt
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

Backend API documentation will be available at: `http://127.0.0.1:8000/api/docs`

### 3. Frontend Setup

In a new terminal:

```bash
cd verity-app
npm install
npm run dev
```

Visit `http://localhost:3000` to launch the VERITY Research Engine.

---

## Deployment to Vercel

The frontend is ready for immediate zero-config deployment on **Vercel**:

1. Install Vercel CLI or import repository on [vercel.com](https://vercel.com):
   ```bash
   npx vercel --cwd verity-app
   ```
2. Configure Environment Variables in Vercel Project Settings:
   - `NEXT_PUBLIC_API_URL`: URL of your deployed backend service.
   - `NEXT_PUBLIC_SUPABASE_URL`: (Optional) Supabase project URL.
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: (Optional) Supabase anonymous key.

---

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
