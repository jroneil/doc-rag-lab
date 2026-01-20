/*
Talking points:
- single provider (OpenAI)
- two backends (python/java)
- UI calls Next server, which proxies to backend
*/

'use client';

import type { FormEvent } from 'react';
import { useMemo, useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import type { BackendKey, ErrorEnvelope, RagQueryResponse } from '@/lib/types';

const backendOptions: Array<{ label: string; value: BackendKey }> = [
  { label: 'Python', value: 'python' },
  { label: 'Java', value: 'java' },
];

const defaultAnswer = 'Ask a question to see the answer and metrics.';

export default function HomePage() {
  const [backend, setBackend] = useState<BackendKey>('python');
  const [question, setQuestion] = useState('');
  const [topK, setTopK] = useState(5);
  const [returnCitations, setReturnCitations] = useState(true);
  const [returnDebug, setReturnDebug] = useState(false);
  const [response, setResponse] = useState<RagQueryResponse | null>(null);
  const [error, setError] = useState<ErrorEnvelope['error'] | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const tokenSummary = useMemo(() => {
    const metrics = response?.metrics;
    if (!metrics) return null;
    const { promptTokens, completionTokens, totalTokens } = metrics;
    if (promptTokens == null && completionTokens == null && totalTokens == null) return null;
    return {
      prompt: promptTokens ?? '—',
      completion: completionTokens ?? '—',
      total: totalTokens ?? '—',
    };
  }, [response]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    if (!question.trim()) {
      setIsLoading(false);
      setError({ code: 'BAD_REQUEST', message: 'Please enter a question.' });
      return;
    }

    try {
      const res = await fetch('/api/rag', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          backend,
          query: question,
          topK,
          options: {
            returnCitations,
            returnDebug,
          },
        }),
      });

      const data = (await res.json()) as RagQueryResponse | ErrorEnvelope;

      if (!res.ok) {
        const envelope = data as ErrorEnvelope;
        setResponse(null);
        setError(
          envelope.error ?? {
            code: 'UPSTREAM_ERROR',
            message: 'The backend returned an error response.',
          },
        );
        return;
      }

      setResponse(data as RagQueryResponse);
    } catch (err) {
      setResponse(null);
      setError({
        code: 'UPSTREAM_ERROR',
        message: err instanceof Error ? err.message : 'Unable to reach the backend.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-2">
        <Badge className="w-fit">RAG demo lab</Badge>
        <h1 className="text-3xl font-semibold text-slate-900">RagLab UI</h1>
        <p className="max-w-2xl text-sm text-slate-600">
          Compare the Python FastAPI and Java Spring Boot RAG backends side-by-side with a single,
          clean UI. All requests flow through the Next.js server for consistency and security.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Ask a question</CardTitle>
            <CardDescription>Configure the backend and retrieval settings.</CardDescription>
          </CardHeader>
          <CardContent>
            <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
              <div className="flex flex-col gap-2">
                <Label htmlFor="question">Question</Label>
                <Textarea
                  id="question"
                  placeholder="e.g. What is the warranty period for the product?"
                  value={question}
                  onChange={(event) => setQuestion(event.target.value)}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="topk">Top K</Label>
                  <Input
                    id="topk"
                    type="number"
                    min={1}
                    max={50}
                    value={topK}
                    onChange={(event) => {
                      const value = event.currentTarget.valueAsNumber;
                      if (Number.isNaN(value)) {
                        setTopK(1);
                        return;
                      }
                      setTopK(Math.max(1, Math.min(50, value)));
                    }}
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <Label>Backend</Label>
                  <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-1">
                    {backendOptions.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setBackend(option.value)}
                        className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
                          backend === option.value
                            ? 'bg-white text-slate-900 shadow-sm'
                            : 'text-slate-500 hover:text-slate-900'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="returnCitations">Return citations</Label>
                    <p className="text-xs text-slate-500">Include retrieved chunks in the response.</p>
                  </div>
                  <Switch
                    id="returnCitations"
                    checked={returnCitations}
                    onChange={(event) => setReturnCitations(event.currentTarget.checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="returnDebug">Return debug</Label>
                    <p className="text-xs text-slate-500">Expose backend debugging metadata.</p>
                  </div>
                  <Switch
                    id="returnDebug"
                    checked={returnDebug}
                    onChange={(event) => setReturnDebug(event.currentTarget.checked)}
                  />
                </div>
              </div>

              <Button type="submit" size="lg" disabled={isLoading}>
                {isLoading ? 'Asking…' : 'Ask'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-6">
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              <div className="font-semibold">{error.code}</div>
              <div>{error.message}</div>
              {error.details && (
                <pre className="mt-2 max-h-32 overflow-auto rounded-md bg-white/60 p-2 text-xs text-red-700">
                  {JSON.stringify(error.details, null, 2)}
                </pre>
              )}
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Answer</CardTitle>
              <CardDescription>The model response for your query.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm text-slate-800">
                {response?.answer ?? defaultAnswer}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Metrics</CardTitle>
              <CardDescription>Latency and model stats from the backend.</CardDescription>
            </CardHeader>
            <CardContent>
              {response?.metrics ? (
                <dl className="grid gap-3 text-sm">
                  <div className="flex items-center justify-between">
                    <dt className="text-slate-500">Backend</dt>
                    <dd className="font-medium text-slate-900">{response.metrics.backend}</dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-slate-500">Latency</dt>
                    <dd className="font-medium text-slate-900">{response.metrics.latencyMs} ms</dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-slate-500">Retrieved</dt>
                    <dd className="font-medium text-slate-900">{response.metrics.retrievedCount}</dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-slate-500">Model</dt>
                    <dd className="font-medium text-slate-900">
                      {response.metrics.model ?? '—'}
                    </dd>
                  </div>
                  {tokenSummary && (
                    <div className="flex items-center justify-between">
                      <dt className="text-slate-500">Tokens</dt>
                      <dd className="font-medium text-slate-900">
                        {tokenSummary.prompt} / {tokenSummary.completion} / {tokenSummary.total}
                      </dd>
                    </div>
                  )}
                </dl>
              ) : (
                <p className="text-sm text-slate-500">Run a query to populate metrics.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Citations</CardTitle>
          <CardDescription>Retrieved context chunks (if returned).</CardDescription>
        </CardHeader>
        <CardContent>
          {response?.citations && response.citations.length > 0 ? (
            <div className="flex flex-col gap-4">
              {response.citations.map((citation, index) => (
                <div key={`${citation.docId}-${citation.chunkId}-${index}`} className="rounded-lg border border-slate-200 p-4">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span className="font-semibold text-slate-700">{citation.docId}</span>
                    <span>Chunk {citation.chunkId}</span>
                    <span>Score {citation.score.toFixed(2)}</span>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">{citation.text}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">No citations returned yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
