package io.raglab.api.controller;

import io.raglab.api.model.QueryRun;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
public class RunsController {
  private final JdbcTemplate jdbcTemplate;

  public RunsController(JdbcTemplate jdbcTemplate) {
    this.jdbcTemplate = jdbcTemplate;
  }

  @GetMapping("/api/v1/runs")
  public List<QueryRun> runs(@RequestParam(defaultValue = "20") int limit) {
    int safeLimit = Math.min(Math.max(limit, 1), 100);
    return jdbcTemplate.query(
        """
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
        ORDER BY created_at DESC
        LIMIT ?
        """,
        (rs, rowNum) -> new QueryRun(
            rs.getObject("id").toString(),
            rs.getTimestamp("created_at").toInstant(),
            rs.getString("backend"),
            rs.getString("query"),
            rs.getInt("top_k"),
            rs.getInt("latency_ms"),
            rs.getInt("retrieved_count"),
            rs.getString("status"),
            rs.getString("error_code"),
            rs.getString("error_message")
        ),
        safeLimit
    );
  }
}
