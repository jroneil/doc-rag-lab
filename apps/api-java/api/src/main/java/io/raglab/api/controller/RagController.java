package io.raglab.api.controller;

import io.raglab.api.model.RagQueryRequest;
import io.raglab.api.model.RagQueryResponse;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/rag")
public class RagController {

  @PostMapping("/query")
  public RagQueryResponse query(@Valid @RequestBody RagQueryRequest req) {
    long start = System.nanoTime();

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

    return new RagQueryResponse(
        "(stub) Java backend received: " + req.getQuery(),
        citations,
        metrics,
        debug
    );
  }
}
