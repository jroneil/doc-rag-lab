package io.raglab.api.controller;

import io.raglab.api.model.RagQueryRequest;
import io.raglab.api.model.RagQueryResponse;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/rag")
public class RagController {
  private final JdbcTemplate jdbcTemplate;
  private static final Logger logger = LoggerFactory.getLogger(RagController.class);

  public RagController(JdbcTemplate jdbcTemplate) {
    this.jdbcTemplate = jdbcTemplate;
  }

  @PostMapping("/query")
  public RagQueryResponse query(@Valid @RequestBody RagQueryRequest req) {
    long start = System.nanoTime();
    String status = "ok";
    String errorCode = null;
    String errorMessage = null;
    int retrievedCount = 0;
    long latencyMs = 0;

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
                "(stub) This is a placeholder citation chunk returned by Java backend.",
                0.80,
                Map.of("source", "stub")
            )
        );
      }

      retrievedCount = citations.size();
      latencyMs = (System.nanoTime() - start) / 1_000_000;
      latencyMs = Math.max(latencyMs, 1);

      RagQueryResponse.Metrics metrics = new RagQueryResponse.Metrics(
          "java",
          (int) latencyMs,
          retrievedCount,
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

      return response;
    } catch (RuntimeException ex) {
      status = "error";
      errorCode = "INTERNAL_ERROR";
      errorMessage = ex.toString();
      latencyMs = (System.nanoTime() - start) / 1_000_000;
      throw ex;
    } finally {
      if (latencyMs == 0) {
        latencyMs = (System.nanoTime() - start) / 1_000_000;
      }
      latencyMs = Math.max(latencyMs, 1);
      insertQueryRun(
          req.getQuery(),
          req.getTopK(),
          latencyMs,
          retrievedCount,
          status,
          errorCode,
          errorMessage
      );
    }
  }

  private void insertQueryRun(
      String query,
      int topK,
      long latencyMs,
      int retrievedCount,
      String status,
      String errorCode,
      String errorMessage
  ) {
    try {
      jdbcTemplate.update(
          """
          INSERT INTO query_runs (
            id,
            backend,
            query,
            top_k,
            latency_ms,
            retrieved_count,
            status,
            error_code,
            error_message
          )
          VALUES (gen_random_uuid(), ?, ?, ?, ?, ?, ?, ?, ?)
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
    } catch (RuntimeException ex) {
      logger.warn(
          "Failed to insert query run (backend=java status={} errorCode={}).",
          status,
          errorCode,
          ex
      );
    }
  }
}
