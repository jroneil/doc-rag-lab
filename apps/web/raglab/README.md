# RagLab Web UI

A clean, demo-ready Next.js 16 App Router UI for comparing the Python FastAPI and Java Spring Boot RAG backends.

## Requirements

- Node.js 18+
- One or both backends running locally

## Environment variables

Create a `.env.local` file in `apps/web/raglab`:

```bash
PY_API_BASE_URL=http://localhost:8000
JAVA_API_BASE_URL=http://localhost:8080
```

## Run the dev server

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Example backend curl

```bash
curl -X POST http://localhost:8000/api/v1/rag/query \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What is the warranty period for the product?",
    "topK": 5,
    "options": {
      "returnCitations": true,
      "returnDebug": false
    }
  }'
```

## Expected screen behavior

- Left pane: enter a question, choose backend, set `topK`, and toggle citations/debug.
- Right pane: see the answer, metrics (latency, model, tokens), and citations if provided.
- Errors from the backend show in a banner with the `{ error: { code, message, details } }` envelope.

## Architecture note

The browser only calls the Next.js `/api/rag` route handler, which proxies to the selected backend
using the `PY_API_BASE_URL` or `JAVA_API_BASE_URL` environment variables.
