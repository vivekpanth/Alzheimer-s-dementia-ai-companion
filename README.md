# Memory Companion Agent

A web app where a caregiver uploads a patient's photos and life story once, and an AI companion holds warm, personalised daily conversations with the patient — detecting emotional distress and auto-generating caregiver reports.

**Course:** ITEC630 — Masters IT Project, ACU Sydney
**Team:** Bharat (AI/Backend) · Vivek (Data Pipeline) · Anish (Frontend) · Rohit (UI & Testing)

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

## Local Setup

### Backend

```bash
cd backend
cp ../.env.example .env
# Fill in your API keys in .env
pip install -r requirements.txt
uvicorn backend.main:app --reload
# API available at http://localhost:8000
# Health check: GET http://localhost:8000/health
```

### Frontend

```bash
cd frontend
npm install
npm run dev
# App available at http://localhost:5173
```

---

## Branch Naming Convention

```
feature/bharat-reminiscence-agent
feature/vivek-rag-pipeline
feature/anish-chat-ui
feature/rohit-onboarding-form
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

*Memory Companion Agent | ITEC630 ACU Sydney | Team: Bharat · Vivek · Anish · Rohit*
