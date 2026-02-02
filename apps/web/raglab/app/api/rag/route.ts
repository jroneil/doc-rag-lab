import { NextResponse } from 'next/server';

import type { BackendKey, ErrorEnvelope, RagQueryRequest, RagResponse } from '../../../lib/types';

const BACKEND_MAP: Record<BackendKey, string | undefined> = {
  python: process.env.PY_API_BASE_URL,
  java: process.env.JAVA_API_BASE_URL,
};

const errorResponse = (error: ErrorEnvelope['error'], status = 500) =>
  NextResponse.json({ error }, { status });

export async function POST(request: Request) {
  let payload: (RagQueryRequest & { backend?: BackendKey }) | null = null;

  try {
    payload = (await request.json()) as RagQueryRequest & { backend?: BackendKey };
  } catch {
    return errorResponse(
      {
        code: 'BAD_REQUEST',
        message: 'Invalid JSON payload.',
      },
      400,
    );
  }

  if (!payload?.backend) {
    return errorResponse(
      {
        code: 'BAD_REQUEST',
        message: 'backend is required.',
      },
      400,
    );
  }

  const baseUrl = BACKEND_MAP[payload.backend];
  if (!baseUrl) {
    return errorResponse({
      code: 'INTERNAL_ERROR',
      message: `Missing base URL for ${payload.backend} backend.`,
    });
  }

  const { backend, ...query } = payload;

  try {
    const response = await fetch(`${baseUrl.replace(/\/$/, '')}/api/v1/rag/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(query),
      cache: 'no-store',
    });

    const data = (await response.json()) as RagResponse | ErrorEnvelope;

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    return errorResponse(
      {
        code: 'UPSTREAM_ERROR',
        message: 'Unable to reach the selected backend.',
        details: { message: error instanceof Error ? error.message : String(error) },
      },
      502,
    );
  }
}
