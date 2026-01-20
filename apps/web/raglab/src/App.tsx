import { useMemo, useState } from "react";

const BACKENDS = ["python", "java"] as const;

type BackendKey = (typeof BACKENDS)[number];

type RagMetrics = {
  backend: BackendKey;
  latencyMs: number;
  retrievedCount: number;
  model?: string | null;
  promptTokens?: number | null;
  completionTokens?: number | null;
  totalTokens?: number | null;
};

type RagResponse = {
  answer: string;
  metrics: RagMetrics;
  citations?: unknown[];
  debug?: unknown;
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "";

function buildBackendBase(backend: BackendKey) {
  const trimmed = API_BASE_URL.replace(/\/$/, "");

  if (!trimmed) {
    return `/api/${backend}`;
  }

  // If the base already ends with /api/<backend>, keep it.
  if (trimmed.endsWith(`/api/${backend}`)) {
    return trimmed;
  }

  // Otherwise, treat the base URL as the shared origin and append /api/<backend>.
  return `${trimmed}/api/${backend}`;
}

function formatNumber(value?: number | null) {
  if (value === null || value === undefined) {
    return "n/a";
  }

  return value.toLocaleString();
}

export default function App() {
  const [backend, setBackend] = useState<BackendKey>("python");
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<RagResponse | null>(null);
  const [showRaw, setShowRaw] = useState(false);

  const endpoint = useMemo(() => {
    // Demo talking point: UI switches the backend by changing only the base URL.
    const base = buildBackendBase(backend);
    return `${base}/api/v1/rag/query`;
  }, [backend]);

  const backendLabel = backend === "python" ? "Python" : "Java";

  async function handleAsk() {
    if (!question.trim()) {
      setError("Please enter a question before asking.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        // Demo talking point: the payload stays identical across Python/Java.
        body: JSON.stringify({
          query: question,
          topK: 5,
          options: {
            returnCitations: true,
            returnDebug: false,
          },
        }),
      });

      if (!result.ok) {
        throw new Error(`Request failed: ${result.status}`);
      }

      const payload = (await result.json()) as RagResponse;
      setResponse(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="page">
      <header className="header">
        <div>
          <p className="eyebrow">RagLab • System Design Demo</p>
          <h1>RAG Query Console</h1>
          <p className="subtitle">
            A minimal UI for comparing Python and Java RAG backends with the same
            contract.
          </p>
        </div>
        <span className="backend-badge">Backend: {backendLabel}</span>
      </header>

      <section className="panel">
        <div className="field">
          <label htmlFor="backend">Backend</label>
          <select
            id="backend"
            value={backend}
            onChange={(event) => setBackend(event.target.value as BackendKey)}
          >
            {BACKENDS.map((value) => (
              <option key={value} value={value}>
                {value === "python" ? "Python" : "Java"}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="question">Question</label>
          <textarea
            id="question"
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="Ask a question about the document corpus..."
            rows={5}
          />
          <p className="helper">
            Demo talking point: This payload stays identical across backends.
          </p>
        </div>

        <div className="actions">
          <button type="button" onClick={handleAsk} disabled={loading}>
            {loading ? "Asking..." : "Ask"}
          </button>
          <span className="status">{loading ? "Query in flight" : "Ready"}</span>
        </div>

        {error && <p className="error">{error}</p>}
      </section>

      <section className="panel">
        <h2>Answer</h2>
        <p className="answer">
          {response?.answer ?? "Ask a question to see the answer here."}
        </p>

        <div className="metrics">
          <div>
            <span>Latency</span>
            <strong>{formatNumber(response?.metrics.latencyMs)} ms</strong>
          </div>
          <div>
            <span>Model</span>
            <strong>{response?.metrics.model ?? "n/a"}</strong>
          </div>
          <div>
            <span>Tokens (prompt/completion/total)</span>
            <strong>
              {formatNumber(response?.metrics.promptTokens)} /{" "}
              {formatNumber(response?.metrics.completionTokens)} /{" "}
              {formatNumber(response?.metrics.totalTokens)}
            </strong>
          </div>
          <div>
            <span>Retrieved</span>
            <strong>{formatNumber(response?.metrics.retrievedCount)}</strong>
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="toggle-row">
          <h2>Raw Response</h2>
          <label className="toggle">
            <input
              type="checkbox"
              checked={showRaw}
              onChange={(event) => setShowRaw(event.target.checked)}
            />
            Show JSON
          </label>
        </div>
        {showRaw ? (
          <pre className="raw">
            {response ? JSON.stringify(response, null, 2) : "No response yet."}
          </pre>
        ) : (
          <p className="helper">Toggle on to inspect the backend payload.</p>
        )}
      </section>

      <footer className="footer">
        <p>
          Using <code>fetch</code> against <code>{endpoint}</code>
        </p>
      </footer>
    </main>
  );
}
