package io.raglab.api.error;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestControllerAdvice
public class ApiExceptionHandler {

  @ExceptionHandler(ApiErrorException.class)
  public ResponseEntity<ErrorEnvelope> handleApiError(ApiErrorException ex) {
    return ResponseEntity.status(ex.getStatus())
        .body(new ErrorEnvelope(ex.getErrorBody()));
  }

  @ExceptionHandler(MethodArgumentNotValidException.class)
  public ResponseEntity<ErrorEnvelope> handleValidation(MethodArgumentNotValidException ex) {
    List<Map<String, Object>> fieldErrors = ex.getBindingResult().getFieldErrors().stream()
        .map(this::toFieldError)
        .collect(Collectors.toList());
    Map<String, Object> details = Map.of("errors", fieldErrors);
    return ResponseEntity.status(HttpStatus.BAD_REQUEST)
        .body(new ErrorEnvelope(new ErrorBody("BAD_REQUEST", "Validation failed", details)));
  }

  @ExceptionHandler(HttpMessageNotReadableException.class)
  public ResponseEntity<ErrorEnvelope> handleMalformedJson(HttpMessageNotReadableException ex) {
    return ResponseEntity.status(HttpStatus.BAD_REQUEST)
        .body(new ErrorEnvelope(new ErrorBody("BAD_REQUEST", "Malformed JSON request", null)));
  }

  @ExceptionHandler(Exception.class)
  public ResponseEntity<ErrorEnvelope> handleUnexpected(Exception ex) {
    return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
        .body(new ErrorEnvelope(new ErrorBody("INTERNAL_ERROR", "Unexpected server error", null)));
  }

  private Map<String, Object> toFieldError(FieldError error) {
    Map<String, Object> payload = new HashMap<>();
    payload.put("field", error.getField());
    if (error.getRejectedValue() != null) {
      payload.put("rejectedValue", error.getRejectedValue());
    }
    payload.put("message", error.getDefaultMessage());
    return payload;
  }
}
