# RagLab Vite UI

A minimal React (Vite + TypeScript) UI for demoing the shared RAG API contract.

## Features

- Text area for questions
- Backend selector (Python | Java)
- Metrics display (latency, model, token usage, retrieved count)
- Loading + error states
- Raw JSON response toggle

## Requirements

- Node.js 20+

## Environment

Set the API base URL with:

```bash
VITE_API_BASE_URL=http://localhost
```

The UI will call:

- Python: `${VITE_API_BASE_URL}/api/python/api/v1/rag/query`
- Java: `${VITE_API_BASE_URL}/api/java/api/v1/rag/query`

If `VITE_API_BASE_URL` is omitted, the app defaults to `/api/python` and
`/api/java` on the current origin.

This aligns with the Nginx single-origin routing from `docker-compose.yml`.

## Run locally

```bash
npm install
npm run dev
```

Then open [http://localhost:5173](http://localhost:5173).

## Build for production

```bash
npm run build
npm run preview -- --host 0.0.0.0 --port 3000
```

## Demo talking points

- One UI, two backends, same API payload.
- Latency + token metrics shown for side-by-side comparison.
- Raw response toggle makes backend debugging easy.
