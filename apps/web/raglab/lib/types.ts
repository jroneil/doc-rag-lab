export type BackendKey = 'python' | 'java';

export interface RagQueryOptions {
  returnCitations?: boolean;
  returnDebug?: boolean;
}

export interface RagQueryFilters {
  tags?: string[];
}

export interface RagQueryRequest {
  query: string;
  topK: number;
  filters?: RagQueryFilters | null;
  options?: RagQueryOptions | null;
}

export interface Citation {
  docId: string;
  chunkId: string;
  text: string;
  score: number;
  meta?: Record<string, unknown>;
}

export interface Metrics {
  backend: BackendKey | string;
  latencyMs: number;
  retrievedCount: number;
  model?: string | null;
  promptTokens?: number | null;
  completionTokens?: number | null;
  totalTokens?: number | null;
}

export interface RagResponse {
  answer: string;
  citations: Citation[];
  metrics: Metrics;
  debug?: Record<string, unknown> | null;
}

export interface ErrorEnvelope {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown> | string | null;
  };
}
