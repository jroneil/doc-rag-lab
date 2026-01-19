package io.raglab.api.error;

public class ErrorEnvelope {
  private ErrorBody error;

  public ErrorEnvelope() {
  }

  public ErrorEnvelope(ErrorBody error) {
    this.error = error;
  }

  public ErrorBody getError() {
    return error;
  }

  public void setError(ErrorBody error) {
    this.error = error;
  }
}
