
Yep — your structure is already better than what I assumed. Let’s align the PRD to **DOC-RAG-LAB** as the umbrella, and make **“UI toggle switches which API is used”** a first-class requirement.

Below is a corrected PRD that matches your repo layout and design intent.

---

# PRD.md (Updated to match current structure)

## 1. Product overview

**Name:** DOC-RAG-LAB
**Goal:** A single lab repo that demonstrates **RAG + API polyglot backends** with a **web UI** that can switch between backends at runtime.

**Core differentiator:**
A UI “Backend Selector” toggle that routes the same user action to either:

* `apps/api-python` (Python FastAPI)
* `apps/api-java` (Spring Boot)

This proves real-world engineering: consistent contracts, cross-language parity, and measurable tradeoffs.

---

## 2. User story

As a user, I can:

1. Upload or select a document corpus
2. Ask a question
3. See the answer + supporting chunks
4. Flip a UI switch to use **Python API** or **Java API**
5. Re-run the same query and compare outcomes (latency, citations, quality)

---

## 3. Success criteria

* Same UI flow works with either backend
* Backends share a common API contract (request/response schema)
* Switching backend requires **no rebuild** (client-side selection)
* Logged metrics show meaningful comparison:

  * latency
  * token usage (if applicable)
  * retrieval count
  * answer length
  * errors

---

## 4. Non-goals

* Fine-tuning models
* Production auth (later maybe)
* Full admin portal
* Complex UI polish beyond what supports the experiment

---

## 5. Repo structure (as-is)

```text
DOC-RAG-LAB/
├── apps/
│   ├── web/                # UI
│   ├── api-java/           # Spring Boot API
│   └── api-python/         # FastAPI API
├── packages/
│   └── shared/
│       └── schemas/        # shared contract (OpenAPI/JSON schema)
├── infra/
│   ├── db/
│   │   └── init.sql        # DB bootstrap
│   └── nginx/
│       └── nginx.conf      # reverse proxy / routing (optional)
├── scripts/
│   ├── dev.sh
│   └── lint.sh
├── docs/
│   ├── API.md
│   ├── ARCHITECTURE.md
│   └── PRD.md
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## 6. Functional requirements

### FR-1: Backend switching (UI)

* UI must provide a toggle/dropdown: **Python** | **Java**
* The selection is stored in client state (and optionally localStorage)
* All API calls are routed based on the selection

**Acceptance test**

* Switch backend without refresh
* Same button click hits different backend base URL

---

### FR-2: Shared API contract

* All backends implement the same endpoints and schemas
* Source of truth lives in: `packages/shared/schemas`

**Acceptance test**

* Same request payload works unchanged for both backends
* Both backends respond with the same response structure

---

### FR-3: RAG core flow

Minimum endpoints (example naming; you can adjust):

* `POST /ingest` (optional Day 1+)
* `POST /query`
* `GET /health`

`/query` must return:

* `answer`
* `citations[]` (chunk text + doc id + offsets if available)
* `metrics` (latency, retrievedCount, model name, etc.)

---

### FR-4: Metrics + parity logging

* Each backend returns metrics in a consistent shape
* UI displays a small “Result card” with:

  * backend used (java/python)
  * latency
  * retrieved chunks
  * model (if relevant)

---

## 7. Non-functional requirements

* **Reproducible dev** via `docker-compose.yml`
* **Local-first** (no paid services required to run baseline)
* **Cost-aware**: default to cheaper model/provider if you use LLM calls

---

## 8. Architecture decision (important)

### Option A (recommended): UI chooses base URL directly

* UI has env vars like:

  * `WEB_API_PY_BASE_URL`
  * `WEB_API_JAVA_BASE_URL`
* Toggle selects which one to call

Pros: simplest, clearest
Cons: CORS considerations if not proxied

### Option B: Nginx single origin + header-based routing

* UI always calls `/api/...`
* Nginx routes based on:

  * header `X-Backend: python|java` or
  * cookie
    Pros: avoids CORS, cleaner URL surface
    Cons: nginx config complexity

Either option is fine; your `infra/nginx/nginx.conf` suggests you may want B.

---

## 9. Milestones

### Day 0 (now)

* PRD aligned to repo
* Define shared schemas for `/query` + `/health`
* UI toggle wired (even if endpoints are stubbed)

### Day 1

* Python backend implements `/health` + `/query` (stub answer)
* Java backend implements `/health` + `/query` (stub answer)
* UI proves switch works end-to-end

### Day 2+

* Add ingestion + real retrieval
* Add RAG evaluation notes

---

## 10. Open questions (I’ll assume defaults unless you say otherwise)

* Will the toggle be **dropdown** or **segmented control**?
* Do you want the UI to show **side-by-side results** (Python vs Java) or just “current backend”?

  * My default recommendation: **single result + quick toggle**, then later add “compare mode”.

---


