package io.raglab.api.controller;

import io.raglab.api.model.RagQueryRequest;
import io.raglab.api.model.RagQueryResponse;
import jakarta.validation.Valid;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/rag")
public class RagController {
  private final JdbcTemplate jdbcTemplate;

  public RagController(JdbcTemplate jdbcTemplate) {
    this.jdbcTemplate = jdbcTemplate;
  }

  @PostMapping("/query")
  public RagQueryResponse query(@Valid @RequestBody RagQueryRequest req) {
    long start = System.nanoTime();

    try {
      boolean returnCitations = (req.getOptions() == null) || req.getOptions().isReturnCitations();
      boolean returnDebug = (req.getOptions() != null) && req.getOptions().isReturnDebug();

      List<RagQueryResponse.Citation> citations = List.of();
      if (returnCitations) {
        String docId = "demo-doc";
        if (req.getFilters() != null && req.getFilters().getDocIds() != null && !req.getFilters().getDocIds().isEmpty()) {
          docId = req.getFilters().getDocIds().get(0);
        }

        citations = List.of(
            new RagQueryResponse.Citation(
                docId,
                "demo-doc#1",
                "(stub) This is a placeholder citation chunk returned by the Java backend.",
                0.80,
                Map.of("source", "stub")
            )
        );
      }

      int latencyMs = (int) ((System.nanoTime() - start) / 1_000_000);
      latencyMs = Math.max(latencyMs, 1);

      RagQueryResponse.Metrics metrics = new RagQueryResponse.Metrics(
          "java",
          latencyMs,
          req.getTopK(),
          "stub",
          null,
          null,
          null
      );

      Map<String, Object> debug = returnDebug ? Map.of("note", "stub response") : null;

      RagQueryResponse response = new RagQueryResponse(
          "(stub) Java backend received: " + req.getQuery(),
          citations,
          metrics,
          debug
      );

      insertQueryRun(
          req.getQuery(),
          req.getTopK(),
          metrics.getLatencyMs(),
          metrics.getRetrievedCount(),
          "ok",
          null,
          null
      );

      return response;
    } catch (RuntimeException ex) {
      int latencyMs = (int) ((System.nanoTime() - start) / 1_000_000);
      insertQueryRun(
          req.getQuery(),
          req.getTopK(),
          Math.max(latencyMs, 1),
          0,
          "error",
          "INTERNAL_ERROR",
          "Unexpected server error"
      );
      throw ex;
    }
  }

  private void insertQueryRun(
      String query,
      int topK,
      int latencyMs,
      int retrievedCount,
      String status,
      String errorCode,
      String errorMessage
  ) {
    try {
      jdbcTemplate.update(
          """
          INSERT INTO query_runs (
            backend,
            query,
            top_k,
            latency_ms,
            retrieved_count,
            status,
            error_code,
            error_message
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          """,
          "java",
          query,
          topK,
          latencyMs,
          retrievedCount,
          status,
          errorCode,
          errorMessage
      );
    } catch (RuntimeException ignored) {
      // Best effort logging.
    }
  }
}
