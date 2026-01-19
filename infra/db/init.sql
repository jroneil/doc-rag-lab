 
-- RagLab init.sql (Postgres)
-- Purpose: minimal schema for documents, chunks, optional embeddings, and query logging.
-- Safe to run multiple times.

BEGIN;

-- Useful for UUIDs
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Optional: pgvector (for embeddings). If not installed, schema still works without embeddings.
DO $$
BEGIN
  CREATE EXTENSION IF NOT EXISTS vector;
EXCEPTION
  WHEN OTHERS THEN
    -- pgvector not available; embeddings table will still be created but vector column may fail
    -- If you don't have pgvector, either install it or change embedding column to BYTEA/TEXT.
    RAISE NOTICE 'pgvector extension not available; install pgvector or adjust embeddings column type.';
END $$;

-- =========================
-- Core tables
-- =========================

CREATE TABLE IF NOT EXISTS documents (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doc_id       TEXT UNIQUE NOT NULL,                -- stable external id like "handbook-2024"
  title        TEXT,
  source_type  TEXT NOT NULL DEFAULT 'text',        -- text|pdf|url|etc
  source_uri   TEXT,                                -- file path / url / etc
  tags         TEXT[] NOT NULL DEFAULT '{}',
  meta         JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_documents_tags_gin ON documents USING GIN (tags);
CREATE INDEX IF NOT EXISTS idx_documents_meta_gin ON documents USING GIN (meta);

CREATE TABLE IF NOT EXISTS chunks (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id   UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  chunk_id      TEXT NOT NULL,                      -- stable per-doc id like "handbook-2024#12"
  ordinal       INT  NOT NULL DEFAULT 0,            -- chunk order within doc
  text          TEXT NOT NULL,
  token_count   INT,
  page          INT,
  start_offset  INT,
  end_offset    INT,
  meta          JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (document_id, chunk_id)
);

CREATE INDEX IF NOT EXISTS idx_chunks_document_id ON chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_chunks_ordinal ON chunks(document_id, ordinal);

-- =========================
-- Optional embeddings
-- =========================
-- If pgvector is installed, this will work as-is.
-- If not, change "embedding VECTOR(1536)" to "embedding BYTEA" or "embedding TEXT".
CREATE TABLE IF NOT EXISTS chunk_embeddings (
  chunk_id      UUID PRIMARY KEY REFERENCES chunks(id) ON DELETE CASCADE,
  model         TEXT NOT NULL DEFAULT 'unknown',
  dim           INT  NOT NULL DEFAULT 1536,
  embedding     VECTOR(1536),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Helpful index if pgvector is installed (comment out if it errors)
-- You can choose cosine distance by using vector_cosine_ops
DO $$
BEGIN
  CREATE INDEX IF NOT EXISTS idx_chunk_embeddings_vec
    ON chunk_embeddings USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Vector index not created (pgvector not available or config not supported).';
END $$;

-- =========================
-- Query / run logging (for experiments + comparison)
-- =========================

CREATE TABLE IF NOT EXISTS query_runs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  backend         TEXT NOT NULL,                     -- python|java
  query           TEXT NOT NULL,
  top_k           INT NOT NULL DEFAULT 5,
  latency_ms      BIGINT NOT NULL,
  retrieved_count INT NOT NULL,
  status          TEXT NOT NULL,                     -- ok|error
  error_code      TEXT,
  error_message   TEXT
);

CREATE INDEX IF NOT EXISTS idx_query_runs_created_at ON query_runs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_query_runs_backend_created_at ON query_runs(backend, created_at DESC);

-- =========================
-- Trigger: updated_at on documents
-- =========================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_documents_updated_at ON documents;
CREATE TRIGGER trg_documents_updated_at
BEFORE UPDATE ON documents
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

COMMIT;
