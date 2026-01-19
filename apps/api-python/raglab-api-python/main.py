from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Literal

from fastapi import FastAPI, HTTPException, Request
from fastapi.exception_handlers import http_exception_handler as fastapi_http_exception_handler
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field


app = FastAPI(title="raglab-api-python", version="1.0.0")


def error_envelope(code: str, message: str, details: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    payload: Dict[str, Any] = {"error": {"code": code, "message": message}}
    if details is not None:
        payload["error"]["details"] = details
    return payload


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    errors = [{"loc": error.get("loc"), "msg": error.get("msg")} for error in exc.errors()]
    return JSONResponse(
        status_code=400,
        content=error_envelope("BAD_REQUEST", "Validation failed", {"errors": errors}),
    )


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    if isinstance(exc.detail, dict) and "error" in exc.detail:
        return JSONResponse(status_code=exc.status_code, content=exc.detail)
    return await fastapi_http_exception_handler(request, exc)


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    return JSONResponse(
        status_code=500,
        content=error_envelope("INTERNAL_ERROR", "Unexpected server error"),
    )


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
