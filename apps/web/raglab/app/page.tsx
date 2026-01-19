'use client';

import { useEffect, useMemo, useState } from 'react';

type Backend = 'python' | 'java';

type QueryRun = {
  id: string;
  createdAt: string;
  backend: Backend;
  query: string;
  topK: number;
  latencyMs: number;
  retrievedCount: number;
  status: 'ok' | 'error';
  errorCode?: string | null;
  errorMessage?: string | null;
};

type RagResponse = {
  answer: string;
  metrics: {
    backend: Backend;
    latencyMs: number;
    retrievedCount: number;
  };
};

const backendLabels: Record<Backend, string> = {
  python: 'Python',
  java: 'Java',
};

const baseUrlFallbacks: Record<Backend, string> = {
  python: '/api/python',
  java: '/api/java',
};

export default function HomePage() {
  const [backend, setBackend] = useState<Backend>('python');
  const [query, setQuery] = useState('');
  const [answer, setAnswer] = useState('Run a query to see the response here.');
  const [metrics, setMetrics] = useState<RagResponse['metrics'] | null>(null);
  const [runs, setRuns] = useState<QueryRun[]>([]);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [runsError, setRunsError] = useState<string | null>(null);

  const baseUrl = useMemo(() => {
    if (backend === 'python') {
      return process.env.NEXT_PUBLIC_API_PY_BASE_URL ?? baseUrlFallbacks.python;
    }
    return process.env.NEXT_PUBLIC_API_JAVA_BASE_URL ?? baseUrlFallbacks.java;
  }, [backend]);

  const fetchRuns = async () => {
    setRunsError(null);
    try {
      const response = await fetch(
        `${baseUrl}/api/v1/runs?limit=20&backend=${encodeURIComponent(backend)}`,
      );
      if (!response.ok) {
        throw new Error('Failed to load runs');
      }
      const data = (await response.json()) as QueryRun[];
      setRuns(data);
    } catch (error) {
      setRuns([]);
      setRunsError('Unable to load recent runs.');
    }
  };

  const handleSubmit = async () => {
    setStatusMessage(null);
    try {
      const response = await fetch(`${baseUrl}/api/v1/rag/query`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          topK: 5,
          options: {
            returnCitations: false,
            returnDebug: false,
          },
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error?.message ?? 'Query failed');
      }

      setAnswer(payload.answer);
      setMetrics(payload.metrics);
      await fetchRuns();
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : 'Query failed');
    }
  };

  useEffect(() => {
    fetchRuns();
  }, [baseUrl]);

  return (
    <div>
      <h1>RagLab</h1>
      <section className="controls">
        <label htmlFor="backend">Backend</label>
        <select
          id="backend"
          value={backend}
          onChange={(event) => setBackend(event.target.value as Backend)}
        >
          {Object.entries(backendLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Ask a question"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <button type="button" onClick={handleSubmit}>
          Run query
        </button>
      </section>

      {statusMessage && (
        <section>
          <strong>{statusMessage}</strong>
        </section>
      )}

      <section>
        <h2>Answer</h2>
        <div className="answer-card">
          <p>{answer}</p>
          {metrics && (
            <p>
              Backend: {metrics.backend} · Latency: {metrics.latencyMs}ms · Retrieved: {metrics.retrievedCount}
            </p>
          )}
        </div>
      </section>

      <section>
        <h2>Recent Runs</h2>
        {runsError && <p>{runsError}</p>}
        <table className="runs-table">
          <thead>
            <tr>
              <th>Time</th>
              <th>Backend</th>
              <th>Latency (ms)</th>
              <th>Retrieved</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {runs.length === 0 && !runsError ? (
              <tr>
                <td colSpan={5}>No recent runs.</td>
              </tr>
            ) : (
              runs.map((run) => (
                <tr key={run.id}>
                  <td>{new Date(run.createdAt).toLocaleString()}</td>
                  <td>{run.backend}</td>
                  <td>{run.latencyMs}</td>
                  <td>{run.retrievedCount}</td>
                  <td className={run.status === 'ok' ? 'status-ok' : 'status-error'}>{run.status}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
}
