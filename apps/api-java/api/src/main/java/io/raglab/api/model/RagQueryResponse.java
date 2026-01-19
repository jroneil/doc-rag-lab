package io.raglab.api.model;

import java.util.List;
import java.util.Map;

public class RagQueryResponse {

  private String answer;
  private List<Citation> citations;
  private Metrics metrics;
  private Map<String, Object> debug;

  public RagQueryResponse() {}

  public RagQueryResponse(String answer, List<Citation> citations, Metrics metrics, Map<String, Object> debug) {
    this.answer = answer;
    this.citations = citations;
    this.metrics = metrics;
    this.debug = debug;
  }

  public String getAnswer() { return answer; }
  public void setAnswer(String answer) { this.answer = answer; }

  public List<Citation> getCitations() { return citations; }
  public void setCitations(List<Citation> citations) { this.citations = citations; }

  public Metrics getMetrics() { return metrics; }
  public void setMetrics(Metrics metrics) { this.metrics = metrics; }

  public Map<String, Object> getDebug() { return debug; }
  public void setDebug(Map<String, Object> debug) { this.debug = debug; }

  public static class Citation {
    private String docId;
    private String chunkId;
    private String text;
    private double score;
    private Map<String, Object> meta;

    public Citation() {}

    public Citation(String docId, String chunkId, String text, double score, Map<String, Object> meta) {
      this.docId = docId;
      this.chunkId = chunkId;
      this.text = text;
      this.score = score;
      this.meta = meta;
    }

    public String getDocId() { return docId; }
    public void setDocId(String docId) { this.docId = docId; }

    public String getChunkId() { return chunkId; }
    public void setChunkId(String chunkId) { this.chunkId = chunkId; }

    public String getText() { return text; }
    public void setText(String text) { this.text = text; }

    public double getScore() { return score; }
    public void setScore(double score) { this.score = score; }

    public Map<String, Object> getMeta() { return meta; }
    public void setMeta(Map<String, Object> meta) { this.meta = meta; }
  }

  public static class Metrics {
    private String backend;       // "java"
    private int latencyMs;
    private int retrievedCount;
    private String model;         // "stub"
    private Integer promptTokens; // nullable
    private Integer completionTokens;
    private Integer totalTokens;

    public Metrics() {}

    public Metrics(String backend, int latencyMs, int retrievedCount, String model,
                   Integer promptTokens, Integer completionTokens, Integer totalTokens) {
      this.backend = backend;
      this.latencyMs = latencyMs;
      this.retrievedCount = retrievedCount;
      this.model = model;
      this.promptTokens = promptTokens;
      this.completionTokens = completionTokens;
      this.totalTokens = totalTokens;
    }

    public String getBackend() { return backend; }
    public void setBackend(String backend) { this.backend = backend; }

    public int getLatencyMs() { return latencyMs; }
    public void setLatencyMs(int latencyMs) { this.latencyMs = latencyMs; }

    public int getRetrievedCount() { return retrievedCount; }
    public void setRetrievedCount(int retrievedCount) { this.retrievedCount = retrievedCount; }

    public String getModel() { return model; }
    public void setModel(String model) { this.model = model; }

    public Integer getPromptTokens() { return promptTokens; }
    public void setPromptTokens(Integer promptTokens) { this.promptTokens = promptTokens; }

    public Integer getCompletionTokens() { return completionTokens; }
    public void setCompletionTokens(Integer completionTokens) { this.completionTokens = completionTokens; }

    public Integer getTotalTokens() { return totalTokens; }
    public void setTotalTokens(Integer totalTokens) { this.totalTokens = totalTokens; }
  }
}
