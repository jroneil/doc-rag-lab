from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Literal

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field


app = FastAPI(title="raglab-api-python", version="1.0.0")


# ----------------------------
# Models (match docs/API.md)
# ----------------------------

Backend = Literal["python", "java"]


class RagQueryFilters(BaseModel):
    docIds: Optional[List[str]] = None
    tags: Optional[List[str]] = None


class RagQueryOptions(BaseModel):
    returnCitations: bool = True
    returnDebug: bool = False


class RagQueryRequest(BaseModel):
    query: str = Field(min_length=1)
    topK: int = Field(default=5, ge=1, le=50)
    filters: Optional[RagQueryFilters] = None
    options: Optional[RagQueryOptions] = None


class Citation(BaseModel):
    docId: str
    chunkId: str
    text: str
    score: float
    meta: Dict[str, Any] = {}


class Metrics(BaseModel):
    backend: Backend
    latencyMs: int
    retrievedCount: int
    model: Optional[str] = None
    promptTokens: Optional[int] = None
    completionTokens: Optional[int] = None
    totalTokens: Optional[int] = None


class RagQueryResponse(BaseModel):
    answer: str
    citations: List[Citation] = []
    metrics: Metrics
    debug: Optional[Dict[str, Any]] = None


class HealthResponse(BaseModel):
    status: str = "ok"
    service: str = "raglab-api"
    backend: Backend = "python"
    version: str = "1.0.0"
    time: str


# ----------------------------
# Endpoints
# ----------------------------

@app.get("/api/v1/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(time=datetime.now(timezone.utc).isoformat())


@app.post("/api/v1/rag/query", response_model=RagQueryResponse)
def rag_query(req: RagQueryRequest) -> RagQueryResponse:
    # Stub implementation for Day 1:
    # Return deterministic, obviously-fake but correctly-shaped output.

    if not req.query.strip():
        raise HTTPException(
            status_code=400,
            detail={"error": {"code": "BAD_REQUEST", "message": "query is required", "details": {"field": "query"}}},
        )

    citations = []
    if (req.options is None) or req.options.returnCitations:
        citations = [
            Citation(
                docId=(req.filters.docIds[0] if req.filters and req.filters.docIds else "demo-doc"),
                chunkId="demo-doc#1",
                text="(stub) This is a placeholder citation chunk returned by the Python backend.",
                score=0.80,
                meta={"source": "stub"},
            )
        ]

    metrics = Metrics(
        backend="python",
        latencyMs=10,
        retrievedCount=req.topK,
        model="stub",
        promptTokens=None,
        completionTokens=None,
        totalTokens=None,
    )

    debug = {"note": "stub response"} if (req.options and req.options.returnDebug) else None

    return RagQueryResponse(
        answer=f"(stub) Python backend received: {req.query}",
        citations=citations,
        metrics=metrics,
        debug=debug,
    )
