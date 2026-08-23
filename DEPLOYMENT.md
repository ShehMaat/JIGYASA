# 🚀 JIGYASA AI Platform — Production Deployment Guide

## 📋 Overview

JIGYASA AI is an enterprise-grade autonomous market intelligence platform built with:
- **Frontend**: Next.js 15 (App Router), TypeScript, Tailwind CSS / Vanilla Glassmorphism
- **Backend**: FastAPI, SQLAlchemy (SQLite default / PostgreSQL production pool), APScheduler
- **Integrations**: Firebase Cloud, Google Stitch MCP, Multi-LLM Fallback Engine

---

## 🛠️ Local Development Setup

### 1. Backend Server
```bash
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

### 2. Frontend Web Application
```bash
cd frontend
npm install
npm run dev
```
Navigate to `http://localhost:3000`.

---

## 🐳 Docker Deployment

### `Dockerfile` (Backend)
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### `docker-compose.yml`
```yaml
version: '3.8'
services:
  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      - DATABASE_URL=postgresql://alkame_user:alkame_password@db:5432/alkame_db
      - GEMINI_API_KEY=${GEMINI_API_KEY}
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
    depends_on:
      - db

  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: alkame_user
      POSTGRES_PASSWORD: alkame_password
      POSTGRES_DB: alkame_db
    ports:
      - "5432:5432"

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1
```

---

## ☁️ Firebase App Hosting Deployment

1. Install Firebase CLI:
   ```bash
   npm install -g firebase-tools
   ```
2. Login and deploy:
   ```bash
   firebase login
   firebase deploy --only hosting
   ```

---

## 🔐 Environment Variables (`.env`)

```env
# Backend Environment Secrets
GEMINI_API_KEY=your_gemini_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
DATABASE_URL=postgresql://user:password@localhost:5432/jigyasa_db
JWT_SECRET=super_secret_jwt_key_2026

# Frontend Environment Variables
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000/api/v1
```

---

## 🧪 Verification & Health Check

Verify production status via CLI:
```bash
curl http://127.0.0.1:8000/api/v1/system/health
```
