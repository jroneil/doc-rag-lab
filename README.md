

# RagLab

**RagLab** is an experimental lab for building, comparing, and evaluating **document-centric AI systems** (RAG and beyond) across **multiple backend implementations**.

The project is intentionally designed as an **engineering lab**, not a product:

* one UI
* multiple backends
* shared API contract
* observable tradeoffs

---

## What this project demonstrates

RagLab focuses on **how engineers should approach AI systems**, not hype-driven demos.

It demonstrates:

* Treating LLM-backed systems as **software systems**
* Backend parity across **Python (FastAPI)** and **Java (Spring Boot)**
* Runtime backend switching from a single UI
* Clear API contracts and reproducible experiments
* Cost, latency, and behavior comparison

---

## High-level architecture

```
Browser
  |
  v
Next.js 16 UI (RagLab)
  |
  |  HTTP / JSON (shared contract)
  |
  +--> Python API (FastAPI)
  |
  +--> Java API (Spring Boot)
  |
  v
PostgreSQL (documents, chunks, runs)
```

* The UI can switch backends at runtime
* Backends implement the same API contract
* Internal implementations may differ by language or tooling

More detail is in [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

---

## Repository structure

```text
RagLab/
├── apps/
│   ├── web/           # Next.js 16 UI
│   ├── api-python/    # FastAPI backend
│   └── api-java/      # Spring Boot backend
├── infra/
│   ├── db/
│   │   └── init.sql   # Postgres schema
│   └── nginx/
│       └── nginx.conf
├── docs/
│   ├── PRD.md
│   ├── ARCHITECTURE.md
│   └── API.md
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## Core concepts

### Backend switching

The UI includes a backend selector (Python | Java).
The same user action can be routed to different backends **without redeploying** the UI.

This enables:

* direct comparison
* parity validation
* experimentation without duplication

### Shared API contract

All backends implement the same endpoints and schemas defined in [`docs/API.md`](docs/API.md).

The UI does not know *how* a backend works — only that it behaves correctly.

---

## Local development (Docker)

### Prerequisites

* Docker + Docker Compose

### Start everything

```bash
docker compose up --build
```

Once running:

* UI: [http://localhost/](http://localhost/)
* Python API: [http://localhost/api/python/api/v1/health](http://localhost/api/python/api/v1/health)
* Java API: [http://localhost/api/java/api/v1/health](http://localhost/api/java/api/v1/health)

---

## Current status

* Next.js 16 UI scaffolded
* Shared API contract defined
* Database schema defined
* Docker + nginx single-origin routing in place
* Backend stubs in progress

This repo is intentionally built **incrementally**, with architecture-first documentation.

---

## Non-goals

RagLab is **not**:

* a production system
* a hosted SaaS
* an AI “assistant”
* a fine-tuning or training platform

It is a **lab** for controlled experimentation and learning.

---

## Why this exists

This project exists to answer a simple question:

> *Can you design and reason about AI systems the same way you design and reason about any other software system?*

RagLab’s answer is: **yes — deliberately, transparently, and without hype.**

---

## License

MIT (or add later)

---

### Final note (important)

This README is intentionally restrained.
That restraint signals **engineering maturity**.

---


