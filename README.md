# Memory Companion Agent

A web app where a caregiver uploads a patient's photos and life story once, and an AI companion holds warm, personalised daily conversations with the patient — detecting emotional distress and auto-generating caregiver reports.



---

## Tech Stack

| Layer | Tool | Version / Notes |
|-------|------|-----------------|
| LLM — chat & agents | OpenAI GPT-4o Mini | Use for all agent calls to keep cost low |
| LLM — photo captions | OpenAI GPT-4o | Vision model, only runs during onboarding |
| Agent framework | LangGraph | Latest stable |
| Backend framework | FastAPI | Python 3.11+ |
| Database + RAG | Supabase + pgvector | Hosted, free tier |
| Cross-session memory | Mem0 | Free tier, Python SDK |
| Frontend | React 18 + Tailwind CSS 3 | Vite build tool |
| Voice input | Web Speech API | Browser built-in, no install needed |
| Voice output (TTS) | Web Speech API speechSynthesis | Browser built-in, no install needed |
| Deployment — frontend | Vercel | Free tier |
| Deployment — backend | Railway | Free tier |
| Version control | GitHub | All team members on separate branches |

---

## Architecture Overview

```
FRONTEND (React + Tailwind)
  /onboarding   → Caregiver uploads bio, photos, family details
  /chat         → Patient voice/text chat interface (large text, TTS)
  /dashboard    → Caregiver daily summary, mood chart, concern alerts

BACKEND (FastAPI — Python)
  POST /ingest        → Receives onboarding data, stores in Supabase
  POST /chat          → Receives patient message, runs LangGraph agents
  GET  /report/{uid}  → Returns daily session summary for caregiver dashboard

AI AGENTS (LangGraph + OpenAI)
  Supervisor Agent    → Routes messages between agents based on sentiment
  Reminiscence Agent  → Searches biography RAG + Mem0, generates warm responses
  Mood Agent          → Classifies sentiment: happy / confused / distressed / neutral
  Report Agent        → Summarises session logs, flags concerns (runs at session end)

DATA LAYER
  Supabase            → PostgreSQL + pgvector for RAG, file storage for photos
  Mem0                → Cross-session patient memory (what was discussed before)
```

---

## Prerequisites

- Python 3.11+
- Node.js 18+
- A Supabase account (free tier) with pgvector enabled
- An OpenAI API key
- A Mem0 API key (free tier at mem0.ai)

## Local Setup

### 1. Environment Variables

```bash
cp .env.example backend/.env
# Fill in your API keys in backend/.env:
#   OPENAI_API_KEY, SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_KEY, MEM0_API_KEY
```

### 2. Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Verify: `curl http://localhost:8000/health` should return `{"status":"ok","service":"memory-companion-agent"}`

### 3. Frontend (separate terminal)

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173 in your browser (Chrome/Edge recommended for voice features).

### Returning After First Setup

Backend:
```bash
cd backend && source venv/bin/activate && uvicorn main:app --reload --port 8000
```

Frontend:
```bash
cd frontend && npm run dev
```

---

## Branch Naming Convention

```
feature/vivek-reminiscence-agent
feature/vivek-rag-pipeline
feature/vivek-chat-ui
feature/vivek-onboarding-form
fix/bharat-mood-routing-bug
```

## Commit Message Format

```
[agent] Add LangGraph supervisor routing logic
[frontend] Build patient chat UI with TTS
[pipeline] Add GPT-4o Vision photo captioning
[fix] Correct Mem0 session recall query
```

---

*Memory Companion Agent 
