export type BackendKey = 'python' | 'java';

export interface RagQueryRequest {
  query: string;
  topK?: number;
  filters?: {
    docIds?: string[];
    tags?: string[];
  };
  options?: {
    returnCitations?: boolean;
    returnDebug?: boolean;
  };
}

export interface RagResponse {
  answer: string;
  citations?: Citation[];
  metrics?: Metrics;
  debug?: Record<string, unknown>;
}

export interface Citation {
  docId: string;
  chunkId: string;
  text: string;
  score: number;
  meta?: Record<string, unknown>;
}

export interface Metrics {
  backend: string;
  latencyMs: number;
  retrievedCount: number;
  model: string;
  promptTokens?: number | null;
  completionTokens?: number | null;
  totalTokens?: number | null;
}

export interface ErrorEnvelope {
  error: ErrorBody;
}

export interface ErrorBody {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}