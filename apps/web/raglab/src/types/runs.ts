export const BACKENDS = ["python", "java"] as const;

export type BackendKey = (typeof BACKENDS)[number];

export type QueryRun = {
  id: string;
  createdAt: string;
  backend: BackendKey;
  query: string;
  topK: number;
  latencyMs: number;
  retrievedCount: number;
  status: "ok" | "error";
  errorCode?: string | null;
  errorMessage?: string | null;
};
