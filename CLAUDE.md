# CLAUDE.md — Memory Companion Agent
## Project Consistency File for Claude Code | Claude Cowork | Claude in VS Code

> This file is the single source of truth for all AI-assisted development on this project.
> Place this file in the ROOT of your project repository.
> Claude Code, Cowork, and VS Code extension will all read it automatically.

---

## Project Overview

**Project Name:** Memory Companion Agent
**Course:** ITEC630 — Masters IT Project, ACU Sydney
**Team:** Bharat (AI/Backend) · Vivek (Data Pipeline) · Anish (Frontend) · Rohit (UI & Testing)
**Timeline:** 10 weeks
**Type:** Agentic AI web app — assistive healthcare for Alzheimer's / dementia patients

### One-Line Description
A web app where a caregiver uploads a patient's photos and life story once, and an AI companion holds warm, personalised daily conversations with the patient — detecting emotional distress and auto-generating caregiver reports.

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
  POST /voice         → Receives audio, returns transcription (Web Speech API handles client-side)
  GET  /report/{uid}  → Returns daily session summary for caregiver dashboard

AI LAYER (LangGraph + OpenAI)
  Supervisor Agent    → Routes messages between agents based on sentiment
  Reminiscence Agent  → Searches biography RAG + Mem0, generates warm responses
  Mood Agent          → Classifies sentiment: happy / confused / distressed / neutral
  Report Agent        → Summarises session logs, flags concerns (runs at session end)

DATA LAYER
  Supabase            → PostgreSQL + pgvector for RAG, file storage for photos
  Mem0                → Cross-session patient memory (what was discussed before)
```

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

## Project Folder Structure

```
memory-companion-agent/
├── CLAUDE.md                  ← this file (always in root)
├── README.md
├── .env.example               ← template for all env vars, never commit .env
├── .gitignore
│
├── backend/
│   ├── main.py                ← FastAPI app entry point
│   ├── requirements.txt
│   ├── .env                   ← never committed, local only
│   │
│   ├── agents/
│   │   ├── __init__.py
│   │   ├── supervisor.py      ← LangGraph router + state graph
│   │   ├── reminiscence.py    ← Reminiscence Agent node
│   │   ├── mood.py            ← Mood Agent node (sentiment classifier)
│   │   └── report.py          ← Report Agent node (session summariser)
│   │
│   ├── tools/
│   │   ├── __init__.py
│   │   ├── search_biography.py   ← Supabase pgvector similarity search
│   │   ├── recall_session.py     ← Mem0 past session retrieval
│   │   ├── summarise_session.py  ← GPT-4o Mini session summariser
│   │   └── flag_concerns.py      ← Concern pattern detector
│   │
│   ├── pipelines/
│   │   ├── __init__.py
│   │   ├── ingest.py          ← Biography + photo ingestion pipeline
│   │   └── caption.py         ← GPT-4o Vision photo captioning
│   │
│   ├── db/
│   │   ├── __init__.py
│   │   └── supabase_client.py ← Supabase connection + helper functions
│   │
│   └── routers/
│       ├── __init__.py
│       ├── chat.py            ← /chat endpoint
│       ├── ingest.py          ← /ingest endpoint
│       └── report.py          ← /report endpoint
│
└── frontend/
    ├── package.json
    ├── vite.config.js
    ├── tailwind.config.js
    ├── index.html
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── api/
        │   └── client.js      ← axios instance, all API calls centralised here
        ├── pages/
        │   ├── Onboarding.jsx ← caregiver onboarding form
        │   ├── Chat.jsx       ← patient chat interface
        │   └── Dashboard.jsx  ← caregiver dashboard
        ├── components/
        │   ├── VoiceInput.jsx    ← microphone button + Web Speech API
        │   ├── MessageBubble.jsx
        │   ├── MoodChart.jsx     ← Recharts mood trend chart
        │   ├── ConcernAlert.jsx
        │   └── PhotoUpload.jsx   ← drag-and-drop photo uploader
        └── hooks/
            ├── useSpeech.js      ← Web Speech API hook (input + output)
            └── useChat.js        ← chat state management
```

---

## Environment Variables

```bash
# backend/.env (never commit this file)

# OpenAI
OPENAI_API_KEY=sk-...

# Supabase
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_KEY=eyJ...

# Mem0
MEM0_API_KEY=...

# App
CORS_ORIGINS=http://localhost:5173,https://your-vercel-app.vercel.app
```

---

## Coding Rules — Follow These Always

### General
- Every new file must include a one-line comment at the top describing what it does
- No hardcoded API keys, URLs, or secrets anywhere — always use environment variables
- Every function must have a docstring (even one line)
- Keep functions short — if a function is more than 40 lines, split it

### Python / Backend
- Python 3.11+
- Use `async def` for all FastAPI route handlers
- Use `pydantic` models for all request and response bodies — no raw dicts in routes
- All database calls go through `db/supabase_client.py` — never import supabase directly in routes
- Agent nodes live in `agents/` — tools live in `tools/` — keep them separate
- Return consistent JSON error responses: `{"error": "message", "detail": "..."}`
- Never catch a bare `except:` — always catch specific exceptions

### React / Frontend
- React 18 functional components only — no class components
- All API calls go through `src/api/client.js` — never use fetch/axios directly in components
- Use `useState` and `useEffect` — avoid unnecessary libraries
- All user-facing text strings in English
- Never use `<form>` HTML tags — use `onClick` handlers on buttons instead
- Loading states required on every async action — show a spinner or disabled state
- Patient chat screen: minimum font size 24px, high contrast, no animations

### Voice Feature
- Web Speech API is the only voice solution — no external APIs for TTS or STT
- Always check `'webkitSpeechRecognition' in window` before initialising
- TTS reads every agent response automatically on the /chat page
- Microphone button is large (min 80x80px) and clearly labelled

---

## Agent Behaviour Rules

These rules define how the AI agents must behave. Reference these when writing system prompts.

### Reminiscence Agent
- ONLY use facts from the patient's uploaded biography and past session memories
- NEVER invent names, dates, places, or relationships
- Always use a warm, gentle, first-name tone
- Keep responses to 2–3 sentences — never long paragraphs
- Ask one follow-up question per response to keep conversation going
- System prompt persona: "You are a warm, caring AI companion talking with an elderly person with memory difficulties. You only speak about things you know are true from their personal story."

### Mood Agent
- Classify every message as exactly one of: `happy`, `confused`, `distressed`, `neutral`
- Return strictly as JSON: `{"sentiment": "distressed", "confidence": 0.91}`
- Never return anything other than valid JSON
- Distress signals include: asking for a deceased person, expressing fear, confusion about time/place, repeated questions

### Report Agent
- Run only at end of session (triggered by session_end event, not per message)
- Summary must include: topics discussed, mood trend, session duration, any distress events
- Concern flag threshold: same topic flagged in 3+ sessions in a row = highlighted alert
- Write in plain English — caregiver may not be tech-savvy
- Max summary length: 200 words

### Supervisor Router
- If Mood Agent returns `distressed` → route to calm_redirect, not Reminiscence Agent
- Calm redirect must: acknowledge the feeling, pivot to a positive memory or sensory anchor (music, a happy photo)
- Never mention death, loss, or the distressing subject directly in a redirect response
- All other sentiments → route to Reminiscence Agent

---

## LangGraph State Schema

```python
# This is the shared state passed between all agent nodes
from typing import TypedDict, List, Optional

class AgentState(TypedDict):
    user_id: str
    user_message: str
    sentiment: Optional[str]          # set by Mood Agent
    sentiment_confidence: Optional[float]
    retrieved_biography: Optional[str] # set by Reminiscence Agent (RAG)
    retrieved_memory: Optional[str]    # set by Reminiscence Agent (Mem0)
    response: Optional[str]            # final output to user
    session_log: List[dict]            # appended every turn: {role, content, timestamp}
    session_end: bool                  # triggers Report Agent when True
```

---

## API Contracts

### POST /chat
```json
Request:
{
  "user_id": "margaret_001",
  "message": "I keep thinking about the beach",
  "session_id": "sess_20260323"
}

Response:
{
  "response": "That photo of you at Bondi Beach in 1964 is wonderful...",
  "sentiment": "happy",
  "session_id": "sess_20260323"
}
```

### POST /ingest
```json
Request (multipart/form-data):
  user_id: "margaret_001"
  biography: "Margaret, 78. Loves gardening..."
  photos: [file1.jpg, file2.jpg]
  family_members: ["Sarah (daughter)", "David (husband, passed 2011)"]
  favourite_topics: ["roses", "folk music", "Bondi Beach"]

Response:
{
  "status": "indexed",
  "chunks_stored": 24,
  "photos_captioned": 3
}
```

### GET /report/{user_id}
```json
Response:
{
  "user_id": "margaret_001",
  "date": "2026-03-23",
  "duration_minutes": 28,
  "summary": "Margaret was engaged and happy...",
  "mood_trend": ["happy", "happy", "distressed", "happy"],
  "concerns": [
    {
      "text": "Asked for David",
      "timestamp": "09:38",
      "occurrences_this_week": 3
    }
  ]
}
```

---

## Team Responsibilities

| Person | Role | Owns These Files |
|--------|------|-----------------|
| **Bharat** | AI & Backend | `agents/`, `tools/`, `main.py`, `routers/` |
| **Vivek** | Data Pipeline | `pipelines/`, `db/`, Supabase schema |
| **Anish** | Frontend | `pages/`, `components/`, `hooks/` |
| **Rohit** | UI & Testing | `pages/Onboarding.jsx`, test files, deployment |

### Branch Naming Convention
```
feature/bharat-reminiscence-agent
feature/vivek-rag-pipeline
feature/anish-chat-ui
feature/rohit-onboarding-form
fix/bharat-mood-routing-bug
```

### Commit Message Format
```
[agent] Add LangGraph supervisor routing logic
[frontend] Build patient chat UI with TTS
[pipeline] Add GPT-4o Vision photo captioning
[fix] Correct Mem0 session recall query
```

---

## Build Order — Do Not Skip Steps

Claude Code must follow this order. Never build Phase N+1 until Phase N is tested and working.

```
Phase 1 — Foundation (Week 1-2)
  [ ] GitHub repo created, all 4 members added
  [ ] Supabase project created, pgvector extension enabled
  [ ] FastAPI backend running, /health returns {"status": "ok"}
  [ ] OpenAI API key confirmed working (test call returns response)
  [ ] React app running on localhost:5173 with 3 routes
  [ ] .env.example committed, .env in .gitignore

Phase 2 — AI Agents (Week 3-5)
  [ ] Mood Agent built and tested — returns correct JSON sentiment
  [ ] Reminiscence Agent built — RAG search returns relevant biography chunks
  [ ] Mem0 integrated — saves and retrieves cross-session facts
  [ ] LangGraph supervisor built — correctly routes based on sentiment
  [ ] Report Agent built — generates readable session summary
  [ ] All agents connected — full message flow works end-to-end

Phase 3 — Frontend (Week 6-7)
  [ ] Onboarding form — uploads bio + photos, POSTs to /ingest
  [ ] Patient chat UI — large text, voice input, TTS output working
  [ ] Caregiver dashboard — shows summary, mood chart, concern alerts
  [ ] All pages connected to backend via src/api/client.js

Phase 4 — Testing (Week 8-9)
  [ ] 5 scripted conversation scenarios tested and documented
  [ ] Distress detection + redirect tested
  [ ] Cross-session memory tested (run 3 sessions, confirm recall)
  [ ] Caregiver report tested for accuracy

Phase 5 — Submission (Week 10)
  [ ] Deployed to Vercel (frontend) + Railway (backend)
  [ ] Screen recording demo completed
  [ ] Research paper written
  [ ] Presentation slides completed
```

---

## Claude Code Prompt Patterns

When using Claude Code, always structure prompts like this:

**Template:**
```
Context: [paste the relevant existing file(s)]
Task: [one specific thing to build]
Rules: [any constraints from CLAUDE.md that apply]
Output: [what file(s) to create or modify]
```

**Example:**
```
Context: Here is my current backend/agents/mood.py: [paste file]
Task: Add error handling so that if the OpenAI API call fails, 
      the function returns {"sentiment": "neutral", "confidence": 0.0} 
      instead of raising an exception.
Rules: Use specific exception types, not bare except. Add a docstring.
Output: Updated mood.py file.
```

---

## Research Paper Notes

**Target venue:** ACM ASSETS or CHI (feasibility study framing)
**Framing:** "We demonstrate that agentic AI systems can meaningfully support reminiscence therapy for dementia patients, with preliminary evidence that multi-agent architectures improve conversational safety via real-time mood detection."

**Paper sections and who writes them:**
| Section | Owner | Status |
|---------|-------|--------|
| Introduction + Problem | Bharat | Write from Week 1 |
| Related Work | Vivek | Write from Week 1 |
| System Design | Bharat | Write after Phase 2 |
| Implementation | All | Write during Phase 3 |
| Evaluation | Rohit | Write during Phase 4 |
| Discussion + Conclusion | Bharat | Write Week 10 |

---

## Common Errors and Fixes

| Error | Likely Cause | Fix |
|-------|-------------|-----|
| `CORS error` in browser | CORS_ORIGINS env var not set | Add frontend URL to CORS_ORIGINS in .env |
| `pgvector extension not found` | Supabase extension not enabled | Enable pgvector in Supabase dashboard → Extensions |
| `Mem0 API key invalid` | Wrong key or not set | Check MEM0_API_KEY in .env |
| `Web Speech API not working` | Not on Chrome/Edge | Web Speech API only works in Chrome and Edge |
| `LangGraph state error` | Missing key in AgentState | Check all nodes return complete state dict |
| `OpenAI rate limit` | Too many test calls | Add `time.sleep(1)` between test calls |

---

*Last updated: March 2026 | Memory Companion Agent | ITEC630 ACU Sydney*
*Team: Bharat · Vivek · Anish · Rohit*
