package io.raglab.api.model;

import java.time.Instant;

public class QueryRun {
  private String id;
  private Instant createdAt;
  private String backend;
  private String query;
  private int topK;
  private long latencyMs;
  private int retrievedCount;
  private String status;
  private String errorCode;
  private String errorMessage;

  public QueryRun() {}

  public QueryRun(
      String id,
      Instant createdAt,
      String backend,
      String query,
      int topK,
      long latencyMs,
      int retrievedCount,
      String status,
      String errorCode,
      String errorMessage
  ) {
    this.id = id;
    this.createdAt = createdAt;
    this.backend = backend;
    this.query = query;
    this.topK = topK;
    this.latencyMs = latencyMs;
    this.retrievedCount = retrievedCount;
    this.status = status;
    this.errorCode = errorCode;
    this.errorMessage = errorMessage;
  }

  public String getId() { return id; }
  public Instant getCreatedAt() { return createdAt; }
  public String getBackend() { return backend; }
  public String getQuery() { return query; }
  public int getTopK() { return topK; }
  public long getLatencyMs() { return latencyMs; }
  public int getRetrievedCount() { return retrievedCount; }
  public String getStatus() { return status; }
  public String getErrorCode() { return errorCode; }
  public String getErrorMessage() { return errorMessage; }

  public void setId(String id) { this.id = id; }
  public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
  public void setBackend(String backend) { this.backend = backend; }
  public void setQuery(String query) { this.query = query; }
  public void setTopK(int topK) { this.topK = topK; }
  public void setLatencyMs(long latencyMs) { this.latencyMs = latencyMs; }
  public void setRetrievedCount(int retrievedCount) { this.retrievedCount = retrievedCount; }
  public void setStatus(String status) { this.status = status; }
  public void setErrorCode(String errorCode) { this.errorCode = errorCode; }
  public void setErrorMessage(String errorMessage) { this.errorMessage = errorMessage; }
}
