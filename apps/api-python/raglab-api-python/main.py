from datetime import datetime, timezone
import os
import time
from typing import Any, Dict, List, Optional, Literal

from fastapi import FastAPI, HTTPException, Query, Request
from fastapi.exception_handlers import http_exception_handler as fastapi_http_exception_handler
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
import psycopg
from psycopg.rows import dict_row


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


class QueryRun(BaseModel):
    id: str
    createdAt: str
    backend: Backend
    query: str
    topK: int
    latencyMs: int
    retrievedCount: int
    status: Literal["ok", "error"]
    errorCode: Optional[str] = None
    errorMessage: Optional[str] = None


# ----------------------------
# Endpoints
# ----------------------------

@app.get("/api/v1/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(time=datetime.now(timezone.utc).isoformat())


def get_db_connection() -> Optional[psycopg.Connection]:
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        return None
    return psycopg.connect(database_url)


def insert_query_run(
    *,
    backend: Backend,
    query: str,
    top_k: int,
    latency_ms: int,
    retrieved_count: int,
    status: Literal["ok", "error"],
    error_code: Optional[str] = None,
    error_message: Optional[str] = None,
) -> None:
    conn = get_db_connection()
    if conn is None:
        return
    try:
        with conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    INSERT INTO query_runs (
                        backend,
                        query,
                        top_k,
                        latency_ms,
                        retrieved_count,
                        status,
                        error_code,
                        error_message
                    )
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                    """,
                    (
                        backend,
                        query,
                        top_k,
                        latency_ms,
                        retrieved_count,
                        status,
                        error_code,
                        error_message,
                    ),
                )
    except psycopg.Error:
        pass
    finally:
        conn.close()


def fetch_query_runs(limit: int) -> List[QueryRun]:
    conn = get_db_connection()
    if conn is None:
        return []
    try:
        with conn:
            with conn.cursor(row_factory=dict_row) as cur:
                cur.execute(
                    """
                    SELECT
                        id,
                        created_at,
                        backend,
                        query,
                        top_k,
                        latency_ms,
                        retrieved_count,
                        status,
                        error_code,
                        error_message
                    FROM query_runs
                    ORDER BY created_at DESC
                    LIMIT %s
                    """,
                    (limit,),
                )
                rows = cur.fetchall()
        return [
            QueryRun(
                id=str(row["id"]),
                createdAt=row["created_at"].isoformat(),
                backend=row["backend"],
                query=row["query"],
                topK=row["top_k"],
                latencyMs=row["latency_ms"],
                retrievedCount=row["retrieved_count"],
                status=row["status"],
                errorCode=row["error_code"],
                errorMessage=row["error_message"],
            )
            for row in rows
        ]
    except psycopg.Error:
        return []
    finally:
        conn.close()


def extract_error_details(exc: HTTPException) -> tuple[Optional[str], Optional[str]]:
    detail = exc.detail
    if isinstance(detail, dict):
        error_payload = detail.get("error")
        if isinstance(error_payload, dict):
            return error_payload.get("code"), error_payload.get("message")
    return None, None


@app.post("/api/v1/rag/query", response_model=RagQueryResponse)
def rag_query(req: RagQueryRequest) -> RagQueryResponse:
    # Stub implementation for Day 1:
    # Return deterministic, obviously-fake but correctly-shaped output.
    start_time = time.perf_counter()
    try:
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

        response = RagQueryResponse(
            answer=f"(stub) Python backend received: {req.query}",
            citations=citations,
            metrics=metrics,
            debug=debug,
        )

        insert_query_run(
            backend="python",
            query=req.query,
            top_k=req.topK,
            latency_ms=response.metrics.latencyMs,
            retrieved_count=response.metrics.retrievedCount,
            status="ok",
        )

        return response
    except HTTPException as exc:
        latency_ms = int((time.perf_counter() - start_time) * 1000)
        error_code, error_message = extract_error_details(exc)
        insert_query_run(
            backend="python",
            query=req.query,
            top_k=req.topK,
            latency_ms=latency_ms,
            retrieved_count=0,
            status="error",
            error_code=error_code,
            error_message=error_message,
        )
        raise
    except Exception:
        latency_ms = int((time.perf_counter() - start_time) * 1000)
        insert_query_run(
            backend="python",
            query=req.query,
            top_k=req.topK,
            latency_ms=latency_ms,
            retrieved_count=0,
            status="error",
            error_code="INTERNAL_ERROR",
            error_message="Unexpected server error",
        )
        raise


@app.get("/api/v1/runs", response_model=List[QueryRun])
def list_runs(limit: int = Query(default=20, ge=1, le=100)) -> List[QueryRun]:
    return fetch_query_runs(limit)
