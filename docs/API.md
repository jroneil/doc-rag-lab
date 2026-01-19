
Absolutely — **API.md** is the next “keystone” doc, especially because your whole RagLab pitch depends on **one UI + swappable backends**.

Below is a ready-to-paste **`docs/API.md`** that’s intentionally minimal but senior-grade: shared contract, versioning, endpoints, examples, and error shape. You can tighten naming later without breaking the doc.

---

# API.md

## 1. Purpose

RagLab exposes a **shared API contract** implemented by multiple backends (Python FastAPI, Java Spring Boot).
The UI can switch between backends at runtime, so the contract must remain stable and consistent.

**Design goals**

* Same request/response schema across backends
* Predictable errors
* Observable metrics for comparison
* Minimal surface area (lab-first)

---

## 2. Base URLs

The UI selects the backend via environment variables:

* `NEXT_PUBLIC_API_PY_BASE_URL` (Python API)
* `NEXT_PUBLIC_API_JAVA_BASE_URL` (Java API)

Example (local):

* Python: `http://localhost:8000`
* Java: `http://localhost:8080`

---

## 3. Versioning

All endpoints are prefixed with:

* `/api/v1`

Changes follow:

* Backward-compatible additions → minor doc update
* Breaking changes → new version (`/api/v2`) or explicit migration plan

---

## 4. Endpoints (v1)

### 4.1 Health check

**GET** `/api/v1/health`

Used by:

* UI startup checks
* docker-compose readiness
* “Backend Switch” validation

**Response 200**

```json
{
  "status": "ok",
  "service": "raglab-api",
  "backend": "python",
  "version": "1.0.0",
  "time": "2026-01-19T12:00:00Z"
}
```

Notes:

* `backend` MUST be one of: `python`, `java`
* `time` should be ISO-8601

---

### 4.2 Query (RAG)

**POST** `/api/v1/rag/query`

Runs retrieval + answer generation (implementation can vary by backend), returning:

* final answer
* citations (retrieved chunks)
* metrics (for comparison)

**Request**

```json
{
  "query": "What is the warranty period for the product?",
  "topK": 5,
  "filters": {
    "docIds": ["handbook-2024", "policy-abc"],
    "tags": ["warranty", "returns"]
  },
  "options": {
    "returnCitations": true,
    "returnDebug": false
  }
}
```

**Request fields**

* `query` (string, required): user question
* `topK` (number, optional, default 5): number of retrieved chunks
* `filters` (optional):

  * `docIds` (string[]): restrict retrieval to specific documents
  * `tags` (string[]): optional tag filter
* `options` (optional):

  * `returnCitations` (boolean, default true)
  * `returnDebug` (boolean, default false)

**Response 200**

```json
{
  "answer": "The warranty period is 12 months from the date of purchase.",
  "citations": [
    {
      "docId": "policy-abc",
      "chunkId": "policy-abc#12",
      "text": "Warranty coverage lasts 12 months from the purchase date...",
      "score": 0.82,
      "meta": {
        "page": 3,
        "source": "pdf"
      }
    }
  ],
  "metrics": {
    "backend": "python",
    "latencyMs": 214,
    "retrievedCount": 5,
    "model": "gpt-4o-mini",
    "promptTokens": 420,
    "completionTokens": 96,
    "totalTokens": 516
  },
  "debug": null
}
```

**Response field requirements**

* `answer` (string, required)
* `citations` (array, optional but recommended)
* `metrics` (object, required)

  * `backend` MUST be `python` or `java`
  * `latencyMs` MUST be present
  * token fields MAY be null if backend cannot measure them
* `debug` included only if `options.returnDebug=true` (otherwise null)

---

### 4.3 Ingest (optional early milestone)

**POST** `/api/v1/rag/ingest`

Used to add documents into the lab corpus.

This endpoint may be introduced later; if present it should support:

* ingesting raw text
* ingesting metadata
* returning a stable `docId`

**Request**

```json
{
  "docId": "handbook-2024",
  "title": "Employee Handbook 2024",
  "text": "....",
  "tags": ["hr", "policy"]
}
```

**Response 200**

```json
{
  "docId": "handbook-2024",
  "status": "indexed",
  "chunkCount": 120
}
```

---

## 5. Error Model (Required)

All errors MUST return JSON using this shape:

**Response 4xx/5xx**

```json
{
  "error": {
    "code": "BAD_REQUEST",
    "message": "query is required",
    "details": {
      "field": "query"
    }
  }
}
```

**Standard codes**

* `BAD_REQUEST` (400)
* `NOT_FOUND` (404)
* `CONFLICT` (409)
* `RATE_LIMITED` (429)
* `INTERNAL_ERROR` (500)
* `UPSTREAM_ERROR` (502/503) (LLM provider, vector DB, etc.)

---

## 6. CORS & Local Dev Notes

Local dev options:

* Direct calls from the UI to each backend base URL (may require CORS)
* Proxy via nginx or Next.js rewrites for a single origin

This is a lab; the simplest working approach is acceptable.

---

## 7. Compatibility Requirements (Python vs Java)

Both backends MUST:

* Implement the same endpoints
* Accept the same request fields
* Return the same response shape
* Include `metrics.backend` and `metrics.latencyMs`

Differences are allowed internally (retrieval algo, model, libraries) but must not break the contract.

---

## 8. Examples (curl)

**Health**

```bash
curl -s http://localhost:8000/api/v1/health | jq
curl -s http://localhost:8080/api/v1/health | jq
```

**Query**

```bash
curl -s http://localhost:8000/api/v1/rag/query \
  -H "Content-Type: application/json" \
  -d '{"query":"What is the warranty period?","topK":5}' | jq
```

---

## 9. Future Extensions (Non-binding)

Potential future endpoints:

* `/api/v1/compare/query` (server-side parallel compare)
* `/api/v1/eval/run` (quality scoring harness)
* `/api/v1/corpus/list` (UI document picker)

---


