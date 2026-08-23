# ⚡ Alkame AI — Enterprise Market Intelligence Platform

Alkame AI is an autonomous, multi-agent market intelligence platform designed to conduct live web search research, analyze competitive landscapes, ingest external document knowledge bases (PDF/TXT/MD), and synthesize presentation-ready strategic dossiers.

---

## 🌟 10-Phase Feature Matrix

| Phase | Milestone | Features & Capabilities |
|---|---|---|
| **Phase 1** | Core Architecture | FastAPI REST API, PostgreSQL (`pgvector`), SQLite fallback, Redis, and Next.js 16 App Router |
| **Phase 2** | Multi-Agent AI Engine | Groq Cloud LLM synthesis (`llama-3.3-70b-versatile`) with automatic failover chain |
| **Phase 3** | Live Web Search | DuckDuckGo dual-crawler engine with exponential backoff & domain extraction |
| **Phase 4** | Workspaces & Battlecard | Multi-project workspace management & side-by-side battlecard comparison matrix |
| **Phase 5** | RAG Vector Knowledge | Hybrid semantic RAG vector query over document chunks with cosine similarity |
| **Phase 6** | Monitoring & Export | Competitor monitoring dashboard, alert feeds, global spotlight (`Cmd+K`), & multi-format export (MD, CSV, HTML, JSON) |
| **Phase 7** | Ingestion & Live SSE | Drag-and-drop PDF/TXT/MD file uploader & Server-Sent Events (SSE) live agent event streaming |
| **Phase 8** | JWT Auth & RBAC | User authentication portal (`/login`), direct bcrypt hashing, JWT tokens, & user profile badges |
| **Phase 9** | Production Docker & CI/CD | Multi-stage Docker containers, Docker Compose, GitHub Actions workflow, & embedded OpenAPI portal (`/settings`) |
| **Phase 10** | Macro Analytics & Pitch Mode | Enterprise Analytics Dashboard (`/analytics`) & Fullscreen Executive Presentation Mode (`PresentationModal.tsx`) |

---

## 🌐 Navigation & Application Routes (13 App Router Pages)

| Route | Feature Description |
|---|---|
| **[`/`](http://localhost:3000)** | **Executive Dashboard** — KPI statistics, quick launcher, and recent dossiers |
| **[`/login`](http://localhost:3000/login)** | **Auth Portal** — Sign In & Registration with JWT token security |
| **[`/research`](http://localhost:3000/research)** | **New Research** — Task launcher & real-time SSE live agent event streamer |
| **[`/knowledge`](http://localhost:3000/knowledge)** | **Knowledge RAG** — Vector RAG search & PDF/TXT/MD drag-and-drop document uploader |
| **[`/monitoring`](http://localhost:3000/monitoring)** | **Competitor Monitoring** | Active competitor trackers, live re-scans & market alert feeds |
| **[`/analytics`](http://localhost:3000/analytics)** | **Macro Analytics** — Cross-dossier KPIs, strategic priority ratios & competitor footprint |
| **[`/projects`](http://localhost:3000/projects)** | **Workspaces** — Project workspace organization & dossier linkage |
| **[`/compare`](http://localhost:3000/compare)** | **Battlecard Matrix** — Side-by-side comparative analysis matrix of 2-3 reports |
| **[`/reports`](http://localhost:3000/reports)** | **Report Archive** — Searchable report history with export & delete capabilities |
| **[`/reports/[id]`](http://localhost:3000/reports/c4045c8b-f9cd-4dcd-b057-05538772a289)** | **7-Tab Dossier Viewer** — Overview, Competitors, Matrix, SWOT, Strategy, Risks, Evidence + **📺 Presentation Mode** |
| **[`/settings`](http://localhost:3000/settings)** | **Settings & Developer Portal** — System overview + embedded interactive OpenAPI Swagger explorer |
| **`Cmd+K` / `Ctrl+K`** | **Command Palette** — Global spotlight search overlay over pages & dossiers |

---

## 🏗️ System Architecture

```
                       ┌──────────────────────────────────────────────┐
                       │  Alkame SaaS Frontend (Next.js 16 App Router)│
                       │  13 Pages + Cmd+K + AuthContext + SSE Stream │
                       └──────────────────────┬───────────────────────┘
                                              │ REST / SSE (Port 8000)
                                              ▼
                       ┌──────────────────────────────────────────────┐
                       │   Alkame Python Backend Engine (FastAPI)     │
                       │   Multi-Agent LLM + RAG + Crawler + Auth     │
                       └──────┬──────────────────────┬────────────────┘
                              │                      │
                   ┌──────────┴─────────┐  ┌─────────┴──────────┐
                   ▼                    ▼  ▼                    ▼
        ┌─────────────────────┐ ┌──────────────┐   ┌──────────────────────┐
        │ Groq LLM (120B/70B) │ │ DuckDuckGo   │   │ PostgreSQL (pgvector)│
        │ Failover Multi-Model│ │ Web Crawler  │   │ & Local SQLite Store │
        └─────────────────────┘ └──────────────┘   └──────────────────────┘
```

---

## 🐳 Quick Start with Docker Compose

To launch the full production stack using Docker:

```bash
# Clone the repository
git clone git@github.com:ShehMaat/Alkame-Intelligence-.git
cd Alkame-Intelligence-

# Launch full stack (FastAPI, Next.js, PostgreSQL pgvector, Redis)
docker compose up -d --build
```

Access the applications at:
- **Frontend SaaS Portal:** `http://localhost:3000`
- **Backend REST API:** `http://localhost:8000/api/v1`
- **Interactive OpenAPI Docs:** `http://localhost:8000/docs`

---

## 💻 Local Development Setup

### 1. Backend Setup
```bash
cd backend
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

---

## 🧪 Verification & Quality Control

- **Frontend Compilation:** `npm run build` (13 Next.js static & dynamic routes compiled)
- **ESLint Code Standards:** `npm run lint` (0 warnings, 0 errors)
- **Backend Code Verification:** `python -m py_compile` across all backend modules
- **CI/CD Automation:** GitHub Actions workflow (`.github/workflows/ci.yml`)
