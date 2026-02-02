/**
 * Talking points:
 * - single provider (OpenAI)
 * - two backends (python/java)
 * - UI calls Next server, which proxies to backend
 */

'use client';

import { useMemo, useState } from 'react';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import type { BackendKey, Citation, ErrorEnvelope, RagResponse } from '@/lib/types';
import { cn } from '@/lib/utils';

const backendOptions: Array<{ label: string; value: BackendKey }> = [
  { label: 'Python', value: 'python' },
  { label: 'Java', value: 'java' },
];

const defaultQuestion = 'What is the warranty period for the product?';

export default function HomePage() {
  const [backend, setBackend] = useState<BackendKey>('python');
  const [query, setQuery] = useState(defaultQuestion);
  const [topK, setTopK] = useState(5);
  const [returnCitations, setReturnCitations] = useState(true);
  const [returnDebug, setReturnDebug] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<RagResponse | null>(null);
  const [error, setError] = useState<ErrorEnvelope['error'] | null>(null);

  const tokens = useMemo(() => {
    if (!response?.metrics) return null;
    const { promptTokens, completionTokens, totalTokens } = response.metrics;
    if (promptTokens == null && completionTokens == null && totalTokens == null) {
      return null;
    }
    return {
      promptTokens,
      completionTokens,
      totalTokens,
    };
  }, [response]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    const safeTopK = Number.isFinite(topK) ? Math.min(50, Math.max(1, topK)) : 5;

    try {
      const res = await fetch('/api/rag', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          backend,
          query,
          topK: safeTopK,
          options: {
            returnCitations,
            returnDebug,
          },
        }),
      });

      const data = (await res.json()) as RagResponse | ErrorEnvelope;

      if (!res.ok) {
        setResponse(null);
        setError(
          'error' in data
            ? data.error
            : {
                code: 'UPSTREAM_ERROR',
                message: 'Unexpected response from backend.',
              },
        );
        return;
      }

      setResponse(data as RagResponse);
    } catch (err) {
      setResponse(null);
      setError({
        code: 'UPSTREAM_ERROR',
        message: 'Failed to reach the Next.js API route.',
        details: { errorMessage: err instanceof Error ? err.message : String(err) },
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-wide text-slate-500">RAG Demo Lab</p>
        <h1 className="text-3xl font-semibold text-slate-900">RagLab query console</h1>
        <p className="max-w-3xl text-sm text-slate-600">
          Compare Python FastAPI and Java Spring Boot backends with the same question, keeping the
          UI simple and fast for demos.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Ask a question</CardTitle>
            <CardDescription>Configure the backend and retrieval options before sending.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="question">Question</Label>
                <Textarea
                  id="question"
                  rows={5}
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Ask about the product warranty, policies, or documentation."
                  required
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="topK">Top K</Label>
                  <Input
                    id="topK"
                    type="number"
                    min={1}
                    max={50}
                    value={topK}
                    onChange={(event) => {
                      const value = Number(event.target.value);
                      if (Number.isFinite(value)) {
                        setTopK(Math.min(50, Math.max(1, value)));
                      }
                    }}
                  />
                  <p className="text-xs text-slate-500">Choose 1-50 retrieved chunks (default 5).</p>
                </div>
                <div className="space-y-2">
                  <Label>Backend</Label>
                  <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1">
                    {backendOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setBackend(option.value)}
                        className={cn(
                          'rounded-md px-3 py-1.5 text-sm font-medium transition',
                          backend === option.value
                            ? 'bg-white text-slate-900 shadow-sm'
                            : 'text-slate-500 hover:text-slate-900',
                        )}
                        aria-pressed={backend === option.value}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-slate-500">Compare Python vs. Java pipelines.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2">
                  <div>
                    <p className="text-sm font-medium text-slate-700">Return citations</p>
                    <p className="text-xs text-slate-500">Show retrieved chunks in the response.</p>
                  </div>
                  <Switch checked={returnCitations} onChange={(event) => setReturnCitations(event.target.checked)} />
                </div>
                <div className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2">
                  <div>
                    <p className="text-sm font-medium text-slate-700">Return debug</p>
                    <p className="text-xs text-slate-500">Include backend debug payloads.</p>
                  </div>
                  <Switch checked={returnDebug} onChange={(event) => setReturnDebug(event.target.checked)} />
                </div>
              </div>

              <Button type="submit" disabled={isLoading || query.trim().length === 0}>
                {isLoading ? 'Asking…' : 'Ask'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-6">
          {error && (
            <Alert>
              <AlertTitle>{error.code}</AlertTitle>
              <AlertDescription>{error.message}</AlertDescription>
              {error.details && (
                <p className="mt-2 text-xs text-amber-900/80">Details: {JSON.stringify(error.details)}</p>
              )}
            </Alert>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Answer</CardTitle>
              <CardDescription>Generated response from the selected backend.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800">
                {response?.answer ?? 'Run a query to see the response here.'}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Metrics</CardTitle>
              <CardDescription>High-level telemetry for demo comparisons.</CardDescription>
            </CardHeader>
            <CardContent>
              {response?.metrics ? (
                <dl className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <dt className="text-xs uppercase text-slate-500">Backend</dt>
                    <dd className="font-medium text-slate-900">{response.metrics.backend}</dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase text-slate-500">Latency</dt>
                    <dd className="font-medium text-slate-900">{response.metrics.latencyMs} ms</dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase text-slate-500">Retrieved</dt>
                    <dd className="font-medium text-slate-900">{response.metrics.retrievedCount}</dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase text-slate-500">Model</dt>
                    <dd className="font-medium text-slate-900">{response.metrics.model ?? '—'}</dd>
                  </div>
                  {tokens && (
                    <div className="col-span-2">
                      <dt className="text-xs uppercase text-slate-500">Tokens</dt>
                      <dd className="font-medium text-slate-900">
                        prompt: {tokens.promptTokens ?? '—'} · completion: {tokens.completionTokens ?? '—'} · total:{' '}
                        {tokens.totalTokens ?? '—'}
                      </dd>
                    </div>
                  )}
                </dl>
              ) : (
                <p className="text-sm text-slate-500">Metrics will appear after your first query.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Citations</CardTitle>
              <CardDescription>Retrieved chunks used to form the answer.</CardDescription>
            </CardHeader>
            <CardContent>
              {response?.citations && response.citations.length > 0 ? (
                <div className="space-y-4">
                  {response.citations.map((citation: Citation, index: number) => (
                    <div key={`${citation.chunkId}-${index}`} className="rounded-lg border border-slate-200 p-3">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        <span className="font-semibold text-slate-700">{citation.docId}</span>
                        <span>•</span>
                        <span>{citation.chunkId}</span>
                        {citation.score != null && (
                          <>
                            <span>•</span>
                            <span>score: {citation.score.toFixed(2)}</span>
                          </>
                        )}
                      </div>
                      <p className="mt-2 text-sm text-slate-700">{citation.text}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500">No citations to display.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
