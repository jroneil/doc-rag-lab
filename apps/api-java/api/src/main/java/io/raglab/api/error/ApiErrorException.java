package io.raglab.api.error;

import org.springframework.http.HttpStatus;

public class ApiErrorException extends RuntimeException {
  private final HttpStatus status;
  private final ErrorBody errorBody;

  public ApiErrorException(HttpStatus status, ErrorBody errorBody) {
    super(errorBody != null ? errorBody.getMessage() : null);
    this.status = status;
    this.errorBody = errorBody;
  }

  public HttpStatus getStatus() {
    return status;
  }

  public ErrorBody getErrorBody() {
    return errorBody;
  }
}
