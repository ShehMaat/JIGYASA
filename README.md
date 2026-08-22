# Alkame AI Market Intelligence Platform

Alkame is an AI-powered Market Intelligence Platform designed to provide structured research reports, competitor analysis, and evidence-based insights using LLMs, RAG, and an agent orchestration layer.

## Architecture

- **Frontend:** Next.js + TypeScript
- **Backend:** Python + FastAPI
- **Database:** PostgreSQL + pgvector
- **Cache/Queue:** Redis
- **AI/Agents:** OpenAI Agents SDK

## Setup Instructions

### Prerequisites
- Node.js (v18+)
- Python (3.10+)
- Docker & Docker Compose

### 1. Database & Cache
Start PostgreSQL (with pgvector) and Redis using Docker Compose:
```bash
docker-compose up -d
```

### 2. Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### 3. Frontend Setup
```bash
cd frontend
# (Next.js initialization pending Node.js installation)
npm install
npm run dev
```
