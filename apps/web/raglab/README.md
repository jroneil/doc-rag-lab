# RagLab UI (Next.js)

Clean, single-screen RAG demo UI that proxies requests through Next.js to either the Python FastAPI or Java Spring Boot backend.

## Requirements

- Node.js 20+
- Python FastAPI backend (default: `http://localhost:8000`)
- Java Spring Boot backend (default: `http://localhost:8080`)

## Environment Variables

Create a `.env.local` file in `apps/web/raglab`:

```bash
PY_API_BASE_URL=http://localhost:8000
JAVA_API_BASE_URL=http://localhost:8080
```

## Run the Dev Server

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Example Backend Curl

```bash
curl -s http://localhost:8000/api/v1/rag/query \
  -H "Content-Type: application/json" \
  -d '{"query":"What is the warranty period?","topK":5}' | jq
```

## Expected Screen Behavior

- Left panel: question input, topK selector, backend toggle, and options switches.
- Right panel: answer, metrics (latency, model, tokens), and any API errors.
- Citations panel: lists retrieved chunks when `returnCitations` is enabled.

All browser requests hit `/api/rag` on the Next.js server, which selects the backend using the environment variables above.
