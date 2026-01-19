package io.raglab.api.error;

import java.util.Map;

public class ErrorBody {
  private String code;
  private String message;
  private Map<String, Object> details;

  public ErrorBody() {
  }

  public ErrorBody(String code, String message, Map<String, Object> details) {
    this.code = code;
    this.message = message;
    this.details = details;
  }

  public String getCode() {
    return code;
  }

  public void setCode(String code) {
    this.code = code;
  }

  public String getMessage() {
    return message;
  }

  public void setMessage(String message) {
    this.message = message;
  }

  public Map<String, Object> getDetails() {
    return details;
  }

  public void setDetails(Map<String, Object> details) {
    this.details = details;
  }
}
