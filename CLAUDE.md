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
  /patient      → Multi-patient management (list, details, add, remove, select active)
  /onboarding   → Caregiver uploads bio, photos (with per-photo descriptions), family details
  /chat         → Voice-first AI companion (AI speaks first, auto-listens, auto-responds) + text fallback
  /dashboard    → Caregiver daily summary, mood chart, concern alerts

BACKEND (FastAPI — Python)
  POST /ingest                    → Receives onboarding data, chunks biography, captions photos, stores embeddings
  POST /chat                      → Receives patient message, runs LangGraph pipeline, accumulates session log
  POST /session/end               → Ends session, runs Report Agent, persists session + report to Supabase
  GET  /report/{uid}              → Returns latest session report for caregiver dashboard
  GET  /patient/{uid}/profile     → Returns biography, family, topics, photo memories
  GET  /caregiver/{uid}/patients  → Lists all patients for a caregiver
  POST /caregiver/ensure          → Upserts caregiver row on login (idempotent, fixes signup race condition)
  POST /caregiver/patients/add    → Links patient to caregiver, sets as active
  DELETE /caregiver/patients/remove → Removes patient from list (keeps all data)
  PATCH /caregiver/link           → Sets the active patient for chat
  DELETE /patient/{uid}           → Permanently deletes all patient data
  GET  /health                    → Health check

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

## Quick Start — Local Dev Setup

### Prerequisites
- Python 3.11+
- Node.js 18+
- Git
- A Supabase account (free tier) with pgvector enabled
- An OpenAI API key
- A Mem0 API key (free tier at mem0.ai)

### Backend Setup
```bash
cd backend
python3 -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp ../.env.example .env           # then fill in your keys
uvicorn main:app --reload --port 8000
# Test: curl http://localhost:8000/health → {"status": "ok"}
```

### Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env.local        # set VITE_API_URL=http://localhost:8000
npm run dev
# Open: http://localhost:5173
```

### Supabase Setup
1. Create project at supabase.com
2. Go to Extensions → enable `pgvector`
3. Run the SQL schema below in the Supabase SQL editor
4. Copy your project URL and keys into `backend/.env`

---

## Supabase Database Schema

Run this SQL in the Supabase SQL editor to set up all required tables:

```sql
-- Enable pgvector extension (do this first in Extensions tab if not done)
create extension if not exists vector;

-- Biography chunks table (RAG store)
create table biography_chunks (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  content text not null,
  embedding vector(1536),         -- OpenAI text-embedding-3-small dimensions
  metadata jsonb default '{}',    -- source: "text_bio" | "photo_caption", photo_url, etc.
  created_at timestamptz default now()
);

-- Index for fast similarity search
create index on biography_chunks
  using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

-- Sessions table
create table sessions (
  id uuid primary key default gen_random_uuid(),
  session_id text not null unique,
  user_id text not null,
  started_at timestamptz default now(),
  ended_at timestamptz,
  duration_minutes int,
  mood_trend text[],              -- e.g. ["happy","happy","distressed","happy"]
  session_log jsonb default '[]', -- array of {role, content, timestamp, sentiment}
  is_complete boolean default false
);

-- Caregiver reports table
create table caregiver_reports (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  session_id text not null references sessions(session_id),
  report_date date default current_date,
  summary text,
  concerns jsonb default '[]',    -- [{text, timestamp, occurrences_this_week}]
  created_at timestamptz default now()
);

-- Patient profiles table
create table patient_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id text not null unique,
  full_name text,
  date_of_birth date,
  biography_text text,
  family_members jsonb default '[]',
  favourite_topics text[],
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Row Level Security (enable for all tables in production)
alter table biography_chunks enable row level security;
alter table sessions enable row level security;
alter table caregiver_reports enable row level security;
alter table patient_profiles enable row level security;
```

### Supabase Helper: Similarity Search Function
```sql
-- Add this function for biography RAG search
create or replace function search_biography(
  query_embedding vector(1536),
  match_user_id text,
  match_threshold float default 0.7,
  match_count int default 5
)
returns table (
  id uuid,
  content text,
  metadata jsonb,
  similarity float
)
language sql stable
as $$
  select
    id, content, metadata,
    1 - (embedding <=> query_embedding) as similarity
  from biography_chunks
  where user_id = match_user_id
    and 1 - (embedding <=> query_embedding) > match_threshold
  order by embedding <=> query_embedding
  limit match_count;
$$;
```

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
│       ├── chat.py            ← /chat endpoint (accumulates session log in memory)
│       ├── ingest.py          ← /ingest endpoint
│       ├── report.py          ← /report endpoint
│       ├── patient.py         ← /patient and /caregiver endpoints
│       └── session.py         ← /session/end endpoint (Report Agent + Supabase save)
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
        │   ├── PatientManagement.jsx ← /patient — multi-patient list, details, manage
        │   ├── Onboarding.jsx        ← caregiver onboarding form
        │   ├── Chat.jsx              ← patient chat interface (End Session + auto-timeout)
        │   ├── Dashboard.jsx         ← caregiver dashboard
        │   └── UpdatePatient.jsx     ← add more memories to existing patient
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

## .gitignore Requirements

The `.gitignore` must always include:
```
# Environment
.env
.env.local
.env.*.local

# Python
__pycache__/
*.py[cod]
venv/
.venv/
*.egg-info/

# Node
node_modules/
dist/
.next/

# OS
.DS_Store
Thumbs.db

# IDE
.vscode/settings.json
.idea/

# Never commit patient data
*.jpg
*.jpeg
*.png
uploads/
patient_data/
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
PORT=8000
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
- Use `openai` Python SDK v1.x+ (new client style: `client = OpenAI()`)

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
- **Voice-first design**: AI speaks first, then auto-listens for patient response — patient never needs to tap "send"
- Mic and speaker CANNOT run simultaneously — always stop mic before speaking and vice versa
- Chrome TTS requires `synth.speak()` to be called from a user gesture chain (click handler)
- Long TTS utterances need a pause/resume interval (~5s) to prevent Chrome from cutting off speech
- OpenAI client must be initialised lazily inside functions (not module-level) because dotenv loads after imports

### Photo Onboarding
- Each uploaded photo has a per-photo caregiver description field ("Who is in this photo? Where and when was it taken?")
- During ingestion, the caregiver description is sent to GPT-4o Vision as context alongside the image
- The combined chunk (`"Photo memory: {caregiver_desc}. {vision_caption}"`) is embedded and stored in Supabase for RAG
- This ensures the AI companion knows who is in each photo, where it was taken, and the associated memory

---

## Accessibility Rules — Critical for This Project

The patient UI is used by elderly people with cognitive decline. These rules are non-negotiable:

| Rule | Requirement |
|------|-------------|
| Font size | Minimum 24px on /chat, minimum 18px elsewhere |
| Contrast ratio | WCAG AAA (7:1) on patient-facing screens |
| Touch targets | All buttons minimum 80×80px |
| Animations | Zero animations on /chat — they cause distress |
| Colour | No red on patient screens (associated with alarm/danger) |
| Layout | Max 2 interactive elements visible at once on /chat |
| Error messages | Never show technical errors to patients — show "Let me try again" |
| TTS | Every agent response auto-reads aloud — no user action required |
| Font | Use system-ui or Arial — no decorative fonts |
| Spacing | Generous padding (min 16px) between all interactive elements |

Use the `design:accessibility-review` skill (`.claude/skills/design/accessibility-review/`) when any patient-facing UI is ready for review.

---

## Mem0 Usage Patterns

### When to SAVE to Mem0
Save after every completed conversation turn. Key facts to extract:
- Names mentioned (family, friends, places)
- Topics the patient engaged with positively
- Distress triggers (topics that caused upset)
- Preferences expressed ("I love...", "I don't like...")

```python
# Pattern for saving to Mem0
mem0_client.add(
    messages=[{"role": "user", "content": user_message}],
    user_id=user_id,
    metadata={"session_id": session_id, "sentiment": sentiment}
)
```

### When to RETRIEVE from Mem0
Retrieve before every Reminiscence Agent response:
```python
# Pattern for retrieving from Mem0
memories = mem0_client.search(
    query=user_message,
    user_id=user_id,
    limit=3
)
context = "\n".join([m["memory"] for m in memories])
```

### What NOT to store in Mem0
- Raw session logs (store in Supabase `sessions` table instead)
- Photo data or embeddings (store in Supabase `biography_chunks`)
- API keys or any secrets

---

## Agent Behaviour Rules

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

### LangGraph Graph Setup Pattern
```python
from langgraph.graph import StateGraph, END

def build_graph():
    graph = StateGraph(AgentState)
    graph.add_node("mood_agent", run_mood_agent)
    graph.add_node("reminiscence_agent", run_reminiscence_agent)
    graph.add_node("calm_redirect", run_calm_redirect)
    graph.add_node("report_agent", run_report_agent)

    graph.set_entry_point("mood_agent")
    graph.add_conditional_edges(
        "mood_agent",
        route_after_mood,           # returns "reminiscence_agent" or "calm_redirect"
        {"reminiscence_agent": "reminiscence_agent", "calm_redirect": "calm_redirect"}
    )
    graph.add_conditional_edges(
        "reminiscence_agent",
        check_session_end,          # returns END or "report_agent"
        {END: END, "report_agent": "report_agent"}
    )
    graph.add_edge("calm_redirect", END)
    graph.add_edge("report_agent", END)
    return graph.compile()
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

### POST /session/end
```json
Request:
{
  "user_id": "margaret_001",
  "session_id": "sess_1774672921962"
}

Response:
{
  "status": "ended",
  "session_id": "sess_1774672921962",
  "summary": "Margaret spoke warmly about her garden today...",
  "mood_trend": ["happy", "happy", "neutral"],
  "duration_minutes": 12
}
```

### GET /health
```json
Response: {"status": "ok", "service": "memory-companion-agent"}
```

### Important Implementation Notes

- `/chat` accumulates session log in `routers/chat._sessions` (in-memory dict keyed by session_id)
- `/session/end` calls `generate_report()` directly — NOT through the full LangGraph graph (avoids Mem0 empty-message errors)
- Reminiscence Agent fetches patient profile from `patient_profiles` table and includes it in system prompt so the AI always knows the patient's name, family, and topics even before RAG results arrive
- RAG similarity threshold is 0.4 (lowered from 0.7 — 0.7 was rejecting nearly all matches)
- `family_members` in `patient_profiles` may be empty if caregiver used the biography text field instead of the structured field — agent falls back to `biography_text` directly
- All `/caregiver/*` endpoints use the service key (bypasses RLS) — never use anon key for caregiver writes
- `maybeSingle()` in supabase-py is `maybe_single()` (snake_case) — wrong casing causes silent 500 crashes

---

## Testing Commands

```bash
# Run from backend/ with venv activated

# Health check
curl http://localhost:8000/health

# Test chat endpoint
curl -X POST http://localhost:8000/chat \
  -H "Content-Type: application/json" \
  -d '{"user_id":"test_001","message":"I love roses","session_id":"sess_test"}'

# Test Mood Agent in isolation
python3 -c "
from agents.mood import run_mood_agent
from agents.supervisor import AgentState
state = AgentState(user_id='test', user_message='Where is David?', sentiment=None, sentiment_confidence=None, retrieved_biography=None, retrieved_memory=None, response=None, session_log=[], session_end=False)
result = run_mood_agent(state)
print(result['sentiment'])  # should be: distressed
"

# Test RAG search (after ingestion)
python3 -c "
from tools.search_biography import search_biography
results = search_biography(query='beach memories', user_id='margaret_001')
print(results)
"

# Run all unit tests (once test files are written)
pytest backend/tests/ -v
```

---

## Evaluation Criteria

### Success Metrics (for research paper)

| Metric | How to Measure | Target |
|--------|---------------|--------|
| Response relevance | Manual score 1–5 on 20 test conversations | Average ≥ 4.0 |
| Distress detection accuracy | Test 10 distress messages, 10 neutral | ≥ 90% correct classification |
| Calm redirect quality | Manual score 1–5 on 10 redirect responses | Average ≥ 4.0 |
| Cross-session recall | Run 3 sessions, check if session 3 recalls session 1 facts | 100% recall |
| Caregiver report accuracy | Compare report to session log manually | ≥ 95% factual accuracy |
| System latency | Time from message to response | < 3 seconds per turn |

### Evaluation Test Scenarios (run all 5 before submission)
1. **Happy reminiscence** — Patient mentions a positive memory, agent responds with relevant bio detail
2. **Distress trigger** — Patient asks for deceased person, agent redirects calmly without mentioning death
3. **Cross-session recall** — End session, start new session, confirm agent remembers previous topics
4. **Confusion handling** — Patient asks where they are, agent gently redirects without confirming confusion
5. **Caregiver report** — Run 20-minute session, verify report accurately reflects topics and flags concerns

---

## Skills Available (use these when creating files)

These skill files contain best practices for document creation. Claude Code should read and follow them:

| Task | Skill File to Read |
|------|--------------------|
| Create Word doc (report, paper section) | `.claude/skills/docx/SKILL.md` |
| Create PowerPoint slides | `.claude/skills/pptx/SKILL.md` |
| Create or read PDF | `.claude/skills/pdf/SKILL.md` |
| Build React UI / frontend components | `.claude/skills/frontend-design/SKILL.md` |
| Make text less AI-sounding | `.claude/skills/humanizer/SKILL.md` |
| Create Excel spreadsheet | `.claude/skills/xlsx/SKILL.md` |

**Rule:** Before creating any `.docx`, `.pptx`, `.pdf`, or `.jsx` file, read the relevant skill file first.

---

## Cowork + Desktop Commander Workflow

When working in Claude Cowork (desktop app), Desktop Commander is connected and can:
- Read/write files directly in this project folder (`/Users/vivekpanth/adp/`)
- Run terminal commands (install packages, start servers, run tests)
- Update this `CLAUDE.md` file when plans change

**Division of work:**
| Task | Use |
|------|-----|
| Planning, architecture, reading PDFs | Claude Cowork |
| Creating documents, slides, reports | Claude Cowork (uses skills) |
| Running code, fixing bugs, building features | Claude Code (CLI or VS Code) |
| Deploying to Vercel | Claude Cowork (Vercel MCP connected) |
| Running Supabase migrations | Claude Cowork (Supabase MCP connected) |
| Quick file edits, terminal commands | Claude Cowork (Desktop Commander) |

**Supabase MCP is connected in Cowork** — SQL migrations and table changes can be run directly from Cowork without opening the Supabase dashboard.

**Vercel MCP is connected in Cowork** — Frontend can be deployed and monitored directly from Cowork.

---

## Team Responsibilities

| Person | Role | Owns These Files |
|--------|------|-----------------|
| **Bharat** | AI & Backend | `agents/`, `tools/`, `main.py`, `routers/` |
| **Vivek** | Data Pipeline | `pipelines/`, `db/`, Supabase schema, Mem0 integration |
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
  [x] GitHub repo created, all 4 members added
  [x] Supabase project created, pgvector extension enabled
  [x] SQL schema above applied in Supabase SQL editor
  [x] FastAPI backend running, /health returns {"status": "ok"}
  [x] OpenAI API key confirmed working (test call returns response)
  [x] React app running on localhost:5173 with 3 routes
  [x] .env.example committed, .env in .gitignore

Phase 2 — AI Agents (Week 3-5)
  [x] Mood Agent built and tested — returns correct JSON sentiment
  [x] Reminiscence Agent built — RAG search returns relevant biography chunks
  [x] Mem0 integrated — saves and retrieves cross-session facts
  [x] LangGraph supervisor built — correctly routes based on sentiment
  [x] Report Agent built — generates readable session summary
  [x] All agents connected — full message flow works end-to-end

Phase 3 — Frontend (Week 6-7)
  [x] Onboarding form — uploads bio + photos, POSTs to /ingest
  [x] Patient chat UI — large text, voice input, TTS output working
  [x] Caregiver dashboard — shows summary, mood chart, concern alerts
  [x] All pages connected to backend via src/api/client.js
  [x] Multi-patient management page (/patient) — list, details, add, remove, select active
  [x] Session end — "End Session" button + 3-min auto-timeout → generates report → shows summary screen
  [x] Post-session screen with report summary + links to dashboard and new conversation
  [ ] Accessibility review run on patient chat screen

Phase 4 — Testing (Week 8-9)
  [ ] All 5 evaluation scenarios tested and documented
  [ ] Distress detection accuracy measured (target ≥ 90%)
  [ ] Cross-session memory tested (run 3 sessions, confirm recall)
  [ ] Caregiver report tested for accuracy (report visible in dashboard after session end)
  [ ] Response latency measured (target < 3 seconds)
  [ ] Verify AI only uses facts from biography/RAG — no hallucination

Phase 5 — Submission (Week 10)
  [ ] Deployed to Vercel (frontend) + Railway (backend)
  [ ] Screen recording demo completed
  [ ] Research paper written (read .claude/skills/docx/SKILL.md first)
  [ ] Presentation slides completed (read .claude/skills/pptx/SKILL.md first)
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
| `vector dimension mismatch` | Wrong embedding model used | Always use text-embedding-3-small (1536 dims) |
| `Supabase RLS blocking insert` | Row Level Security policy missing | Add RLS policy or use service key for backend |
| `Vite CORS on localhost` | Vite proxy not set | Add proxy config in vite.config.js |

---

*Last updated: March 2026 | Memory Companion Agent | ITEC630 ACU Sydney*
*Team: Bharat · Vivek · Anish · Rohit*
