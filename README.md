# Memory Companion Agent

A web app where a caregiver uploads a patient's photos and life story once, and an AI companion holds warm, personalised daily conversations with the patient — detecting emotional distress and auto-generating caregiver reports.

**Course:** ITEC630 — Masters IT Project, ACU Sydney
**Team:** Bharat (AI/Backend) · Vivek (Data Pipeline) · Anish (Frontend) · Rohit (UI & Testing)

---

## Key Features

### Voice-First AI Companion (`/chat`)
- AI initiates the conversation — patient just presses "Start Conversation"
- AI speaks aloud via Web Speech API TTS, then auto-listens for the patient's response
- Conversation flows naturally: AI speaks → listens → patient responds → AI speaks again
- No "send" button needed in voice mode — speech is auto-detected and sent
- Text mode available as a fallback (toggle in header)
- Large, accessible UI — minimum 24px font, 80×80px touch targets, no animations

### Smart Photo Onboarding (`/onboarding`)
- Caregiver uploads photos with per-photo descriptions ("Who is in this photo? Where and when was it taken?")
- GPT-4o Vision analyses each photo using the caregiver's description as context
- Combined memory chunks (caregiver description + vision caption) are embedded and stored for RAG retrieval
- The AI companion can recall specific people, places, and moments from photos during conversation

### Multi-Agent AI Pipeline (LangGraph)
- **Mood Agent** — classifies every patient message as happy / confused / distressed / neutral
- **Reminiscence Agent** — searches biography RAG (Supabase pgvector) + cross-session memory (Mem0) to generate warm, personalised responses
- **Calm Redirect** — if distress is detected, pivots to positive memories without mentioning the trigger
- **Report Agent** — generates end-of-session caregiver summaries with mood trends and concern flags
- **Supervisor** — routes messages through the pipeline based on real-time sentiment

### Caregiver Dashboard (`/dashboard`)
- Daily session summary in plain English
- Mood trend chart (Recharts)
- Concern alerts when distress patterns repeat across sessions

---

## Tech Stack

| Layer | Tool | Notes |
|-------|------|-------|
| LLM — chat & agents | OpenAI GPT-4o Mini | All agent calls (cost-efficient) |
| LLM — photo captions | OpenAI GPT-4o | Vision model, onboarding only |
| Agent framework | LangGraph | State graph with conditional routing |
| Backend | FastAPI | Python 3.11+ |
| Database + RAG | Supabase + pgvector | PostgreSQL with vector similarity search |
| Cross-session memory | Mem0 | Remembers what was discussed in past sessions |
| Frontend | React 18 + Tailwind CSS 3 | Vite build tool |
| Voice I/O | Web Speech API | Browser-native STT + TTS (Chrome/Edge) |
| Deployment — frontend | Vercel | Free tier |
| Deployment — backend | Railway | Free tier |

---

## Architecture

```
FRONTEND (React + Tailwind)
  /onboarding   → Caregiver uploads bio, photos (with per-photo descriptions), family details
  /chat         → Voice-first AI companion (AI speaks first, auto-listens, auto-responds) + text fallback
  /dashboard    → Caregiver daily summary, mood chart, concern alerts

BACKEND (FastAPI — Python)
  POST /ingest        → Receives onboarding data, chunks biography, captions photos, stores embeddings
  POST /chat          → Receives patient message, runs LangGraph agent pipeline, returns response
  GET  /report/{uid}  → Returns daily session summary for caregiver dashboard
  GET  /health        → Health check

AI AGENTS (LangGraph + OpenAI)
  Supervisor Agent    → Routes messages between agents based on sentiment
  Reminiscence Agent  → Searches biography RAG + Mem0, generates warm responses
  Mood Agent          → Classifies sentiment: happy / confused / distressed / neutral
  Report Agent        → Summarises session logs, flags concerns (runs at session end)

DATA LAYER
  Supabase            → PostgreSQL + pgvector for RAG, biography chunks, session logs, reports
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

Open http://localhost:5173 in Chrome or Edge (required for voice features).

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

## Project Progress

- [x] **Phase 1** — Foundation: Supabase, FastAPI, React app, environment setup
- [x] **Phase 2** — AI Agents: Mood, Reminiscence, Calm Redirect, Report, Supervisor routing
- [x] **Phase 3** — Frontend: Onboarding with photo descriptions, voice-first chat, caregiver dashboard *(accessibility review pending)*
- [ ] **Phase 4** — Testing: Evaluation scenarios, distress detection accuracy, cross-session recall
- [ ] **Phase 5** — Submission: Deployment, demo recording, research paper, presentation

---

## Branch Conventions

- `main` — production branch (merged from dev only)
- `dev` — development/preview branch (all pushes go here)

```
feature/vivek-rag-pipeline
feature/anish-chat-ui
fix/bharat-mood-routing-bug
```

Commit format: `[scope] Description` — e.g. `[agent] Add LangGraph supervisor routing logic`

---

*Memory Companion Agent — ITEC630 ACU Sydney*
*Team: Bharat · Vivek · Anish · Rohit*
