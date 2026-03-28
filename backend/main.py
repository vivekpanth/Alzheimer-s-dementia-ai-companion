# FastAPI application entry point for Memory Companion Agent
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import uvicorn

from routers import chat, ingest, report, patient, session

load_dotenv()

app = FastAPI(
    title="Memory Companion Agent",
    description="AI companion backend for Alzheimer's / dementia patients",
    version="0.1.0",
)


def get_cors_origins() -> list[str]:
    """Return list of allowed CORS origins from environment variable."""
    origins_str = os.getenv("CORS_ORIGINS", "http://localhost:5173")
    return [origin.strip() for origin in origins_str.split(",")]


app.add_middleware(
    CORSMiddleware,
    allow_origins=get_cors_origins(),
    allow_origin_regex=r"http://localhost:\d+",  # allow any localhost port for local dev
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat.router)
app.include_router(ingest.router)
app.include_router(report.router)
app.include_router(patient.router)
app.include_router(session.router)


@app.get("/health")
async def health_check() -> dict:
    """Return service health status."""
    return {"status": "ok", "service": "memory-companion-agent"}


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
