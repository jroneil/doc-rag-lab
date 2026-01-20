import { NextResponse } from 'next/server';

import type { BackendKey, ErrorEnvelope, RagProxyRequest } from '@/lib/types';

const backendEnvMap: Record<BackendKey, string | undefined> = {
  python: process.env.PY_API_BASE_URL,
  java: process.env.JAVA_API_BASE_URL,
};

function jsonError(status: number, error: ErrorEnvelope['error']) {
  return NextResponse.json({ error }, { status });
}

export async function POST(request: Request) {
  let payload: RagProxyRequest;

  try {
    payload = (await request.json()) as RagProxyRequest;
  } catch (error) {
    return jsonError(400, {
      code: 'BAD_REQUEST',
      message: 'Request body must be valid JSON.',
      details: error instanceof Error ? { reason: error.message } : undefined,
    });
  }

  if (!payload?.backend) {
    return jsonError(400, {
      code: 'BAD_REQUEST',
      message: 'backend is required.',
      details: { field: 'backend' },
    });
  }

  if (!payload?.query) {
    return jsonError(400, {
      code: 'BAD_REQUEST',
      message: 'query is required.',
      details: { field: 'query' },
    });
  }

  const baseUrl = backendEnvMap[payload.backend];

  if (!baseUrl) {
    return jsonError(500, {
      code: 'INTERNAL_ERROR',
      message: `Missing base URL for ${payload.backend} backend.`,
      details: { env: payload.backend === 'python' ? 'PY_API_BASE_URL' : 'JAVA_API_BASE_URL' },
    });
  }

  const { backend, ...ragRequest } = payload;
  const endpoint = new URL('/api/v1/rag/query', baseUrl).toString();

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(ragRequest),
    });

    const rawBody = await response.text();
    let parsedBody: unknown = null;

    if (rawBody) {
      try {
        parsedBody = JSON.parse(rawBody) as unknown;
      } catch (error) {
        return jsonError(502, {
          code: 'UPSTREAM_ERROR',
          message: 'Backend returned invalid JSON.',
          details: error instanceof Error ? { reason: error.message, backend } : { backend },
        });
      }
    }

    if (!response.ok) {
      const envelope = parsedBody as ErrorEnvelope | null;
      if (envelope?.error) {
        return NextResponse.json(envelope, { status: response.status });
      }

      return jsonError(response.status, {
        code: 'UPSTREAM_ERROR',
        message: 'Backend returned an error response.',
        details: {
          backend,
          status: response.status,
        },
      });
    }

    return NextResponse.json(parsedBody, { status: response.status });
  } catch (error) {
    return jsonError(502, {
      code: 'UPSTREAM_ERROR',
      message: 'Unable to reach the backend service.',
      details: error instanceof Error ? { reason: error.message, backend } : { backend },
    });
  }
}
