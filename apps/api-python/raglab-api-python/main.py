from datetime import datetime, timezone
import logging
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

from openai import OpenAI


app = FastAPI(title="raglab-api-python", version="1.0.0")
logger = logging.getLogger("raglab.api.python")


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
    logger.exception("Unhandled exception")
    return JSONResponse(
        status_code=500,
        content=error_envelope("INTERNAL_ERROR", "Unexpected server error"),
    )


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


@app.get("/api/v1/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(time=datetime.now(timezone.utc).isoformat())


# ---------------------------
# OpenAI client (main)
# ---------------------------
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4.1-mini")

openai_client: Optional[OpenAI] = None
if OPENAI_API_KEY:
    openai_client = OpenAI(api_key=OPENAI_API_KEY)


def get_db_connection() -> Optional[psycopg.Connection]:
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        return None
    return psycopg.connect(database_url)


def clear_query_runs() -> None:
    conn = get_db_connection()
    if conn is None:
        raise RuntimeError("Database connection is not configured")

    try:
        with conn:
            with conn.cursor() as cur:
                cur.execute("TRUNCATE TABLE query_runs")
    finally:
        conn.close()


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
                        id,
                        backend,
                        query,
                        top_k,
                        latency_ms,
                        retrieved_count,
                        status,
                        error_code,
                        error_message
                    )
                    VALUES (gen_random_uuid(), %s, %s, %s, %s, %s, %s, %s, %s)
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
    except psycopg.Error as exc:
        logger.warning("Failed to insert query run", exc_info=exc)
    finally:
        conn.close()


def fetch_query_runs(limit: int, backend: Optional[Backend]) -> List[QueryRun]:
    conn = get_db_connection()
    if conn is None:
        return []

    try:
        with conn:
            with conn.cursor(row_factory=dict_row) as cur:
                params: List[Any] = []
                backend_clause = ""
                if backend:
                    backend_clause = "WHERE backend = %s"
                    params.append(backend)
                params.append(limit)

                cur.execute(
                    f"""
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
                    {backend_clause}
                    ORDER BY created_at DESC
                    LIMIT %s
                    """,
                    tuple(params),
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
    except psycopg.Error as exc:
        logger.warning("Failed to fetch query runs", exc_info=exc)
        return []
    finally:
        conn.close()


def call_openai_answer(query: str) -> Dict[str, Any]:
    """
    Calls OpenAI Chat Completions and returns:
      {"answer": str, "usage": dict}
    """
    if openai_client is None:
        raise HTTPException(
            status_code=500,
            detail=error_envelope("AI_ERROR", "OPENAI_API_KEY is not configured"),
        )

    prompt = f"Answer the following question clearly and concisely:\n\n{query}"

    try:
        resp = openai_client.chat.completions.create(
            model=OPENAI_MODEL,
            messages=[
                {"role": "system", "content": "You are a helpful AI assistant."},
                {"role": "user", "content": prompt},
            ],
            temperature=0.2,
        )
    except Exception as e:
        # Keep your envelope consistent. If you want, we can map common cases later.
        raise HTTPException(
            status_code=502,
            detail=error_envelope("AI_UPSTREAM_ERROR", f"OpenAI request failed: {e}"),
        ) from e

    answer = resp.choices[0].message.content
    if not isinstance(answer, str) or not answer.strip():
        raise HTTPException(
            status_code=500,
            detail=error_envelope("AI_ERROR", "OpenAI response was invalid"),
        )

    usage = getattr(resp, "usage", None)
    usage_dict = usage.model_dump() if usage else {}

    return {"answer": answer.strip(), "usage": usage_dict}


@app.post("/api/v1/rag/query", response_model=RagQueryResponse)
def rag_query(req: RagQueryRequest) -> RagQueryResponse:
    start_time = time.perf_counter()
    status: Literal["ok", "error"] = "ok"
    error_code: Optional[str] = None
    error_message: Optional[str] = None
    retrieved_count = 0
    latency_ms = 0

    try:
        if not req.query.strip():
            raise HTTPException(
                status_code=400,
                detail={"error": {"code": "BAD_REQUEST", "message": "query is required", "details": {"field": "query"}}},
            )

        # ---- MAIN LLM CALL (OpenAI) ----
        result = call_openai_answer(req.query)
        answer: str = result["answer"]
        usage: Dict[str, Any] = result["usage"]

        citations: List[Citation] = []
        if req.options is None or req.options.returnCitations:
            citations = [
                Citation(
                    docId="demo-doc",
                    chunkId="demo-doc#1",
                    text="(stub) Placeholder citation.",
                    score=0.80,
                    meta={"source": "stub"},
                )
            ]

        retrieved_count = len(citations)
        latency_ms = max(int((time.perf_counter() - start_time) * 1000), 1)

        metrics = Metrics(
            backend="python",
            latencyMs=latency_ms,
            retrievedCount=retrieved_count,
            model=OPENAI_MODEL,
            promptTokens=usage.get("prompt_tokens"),
            completionTokens=usage.get("completion_tokens"),
            totalTokens=usage.get("total_tokens"),
        )

        return RagQueryResponse(
            answer=answer,
            citations=citations,
            metrics=metrics,
            debug={"note": "openai response"} if req.options and req.options.returnDebug else None,
        )

    except HTTPException as exc:
        status = "error"
        if isinstance(exc.detail, dict):
            err = exc.detail.get("error")
            if isinstance(err, dict):
                error_code = err.get("code")
                error_message = err.get("message")
        error_code = error_code or "INTERNAL_ERROR"
        error_message = error_message or str(exc)
        raise

    except Exception as exc:
        status = "error"
        error_code = "INTERNAL_ERROR"
        error_message = str(exc)
        raise

    finally:
        latency_ms = max(int((time.perf_counter() - start_time) * 1000), 1)
        try:
            insert_query_run(
                backend="python",
                query=req.query,
                top_k=req.topK,
                latency_ms=latency_ms,
                retrieved_count=retrieved_count,
                status=status,
                error_code=error_code,
                error_message=error_message,
            )
        except Exception as exc:
            logger.warning("Failed to record query run", exc_info=exc)


@app.get("/api/v1/runs", response_model=List[QueryRun])
def list_runs(
    limit: int = Query(default=25, ge=1, le=100),
    backend: Optional[Backend] = Query(default=None),
) -> List[QueryRun]:
    return fetch_query_runs(limit, backend)


@app.post("/api/v1/runs/clear")
def clear_runs():
    try:
        clear_query_runs()
        return {"ok": True}
    except Exception as e:
        logger.exception("Failed to clear query_runs")
        raise HTTPException(status_code=500, detail=str(e))
