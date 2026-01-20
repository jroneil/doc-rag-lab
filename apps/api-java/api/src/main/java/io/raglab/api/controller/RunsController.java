package io.raglab.api.controller;

import io.raglab.api.model.QueryRun;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.List;

@RestController
public class RunsController {
  private final JdbcTemplate jdbcTemplate;
  private static final Logger logger = LoggerFactory.getLogger(RunsController.class);

  public RunsController(JdbcTemplate jdbcTemplate) {
    this.jdbcTemplate = jdbcTemplate;
  }

  @GetMapping("/api/v1/runs")
  public List<QueryRun> runs(
      @RequestParam(defaultValue = "25") int limit,
      @RequestParam(required = false) String backend
  ) {
    int safeLimit = Math.min(Math.max(limit, 1), 100);
    String backendClause = "";
    List<Object> params = new ArrayList<>();
    if (backend != null && !backend.isBlank()) {
      backendClause = " WHERE backend = ? ";
      params.add(backend);
    }
    params.add(safeLimit);

    try {
      String sql = """
          SELECT
            id,
            created_at,
            backend,
            query,
            top_k,
            latency_ms,
            retrieved_count,
            status,
            error_code,
            error_message
          FROM query_runs
          """ + backendClause + """
          ORDER BY created_at DESC
          LIMIT ?
          """;
      return jdbcTemplate.query(
          sql,
          (rs, rowNum) -> new QueryRun(
              rs.getObject("id").toString(),
              rs.getTimestamp("created_at").toInstant(),
              rs.getString("backend"),
              rs.getString("query"),
              rs.getInt("top_k"),
              rs.getLong("latency_ms"),
              rs.getInt("retrieved_count"),
              rs.getString("status"),
              rs.getString("error_code"),
              rs.getString("error_message")
          ),
          params.toArray()
      );
    } catch (RuntimeException ex) {
      logger.warn("Failed to fetch query runs (backend={}).", backend, ex);
      return List.of();
    }
  }
}
