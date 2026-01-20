'use client';

import { useCallback, useEffect, useState } from 'react';
import { ragQuery, getRuns, clearRuns, type BackendKey, type QueryRun } from '../lib/raglabApi';

type RagResponse = {
  answer: string;
  metrics: {
    backend: BackendKey;
    latencyMs: number;
    retrievedCount: number;
  };
};

const backendLabels: Record<BackendKey, string> = {
  python: 'Python',
  java: 'Java',
};

export default function HomePage() {
  const [backend, setBackend] = useState<BackendKey>('python');
  const [query, setQuery] = useState('');
  const [answer, setAnswer] = useState('Run a query to see the response here.');
  const [metrics, setMetrics] = useState<RagResponse['metrics'] | null>(null);
  const [runs, setRuns] = useState<QueryRun[]>([]);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [runsError, setRunsError] = useState<string | null>(null);


  const fetchRuns = useCallback(async () => {
    setRunsError(null);
    try {
      const data = await getRuns(backend, 20);
      setRuns(data);
    } catch (error) {
      setRuns([]);
      setRunsError('Unable to load recent runs.');
    }
  }, [backend]);


  const handleSubmit = async () => {
    setStatusMessage(null);
    try {
      const payload = await ragQuery(backend, {
        query,
        topK: 5,
        options: {
          returnCitations: false,
          returnDebug: false,
        },
      });

      setAnswer(payload.answer);
      setMetrics(payload.metrics);
      await fetchRuns();
    } catch (error) {
      setStatusMessage(error instanceof Error ? error.message : 'Query failed');
    }
  };

  const handleClearRuns = async () => {
    setRunsError(null);
    setStatusMessage(null);
    try {
      await clearRuns(backend);
      await fetchRuns();
    } catch (e) {
      setStatusMessage(e instanceof Error ? e.message : 'Clear failed');
    }
  };

  useEffect(() => {
    setAnswer('Run a query to see the response here.');
    setMetrics(null);
    setStatusMessage(null);
    fetchRuns();
  }, [backend, fetchRuns]);



  return (
    <div>
      <h1>RagLab</h1>
      <section className="controls">
        <label htmlFor="backend">Backend</label>
        <select
          id="backend"
          value={backend}
          onChange={(event) => setBackend(event.target.value as BackendKey)}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <h2 style={{ margin: 0 }}>Recent Runs</h2>
          <button type="button" onClick={handleClearRuns}>
            Clear runs
          </button>
        </div>
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
