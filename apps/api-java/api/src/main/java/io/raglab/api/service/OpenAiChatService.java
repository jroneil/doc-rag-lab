package io.raglab.api.service;

import com.openai.client.OpenAIClient;
import com.openai.models.ChatCompletion;
import com.openai.models.ChatCompletionCreateParams;
import com.openai.models.ChatCompletionMessageParam;
import com.openai.models.ChatCompletionUsage;
import io.raglab.api.error.ApiErrorException;
import io.raglab.api.error.ErrorBody;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class OpenAiChatService {
  private static final String DEFAULT_MODEL = "gpt-4.1-mini";
  private static final String SYSTEM_PROMPT = "You are a helpful AI assistant.";

  private final OpenAIClient client;
  private final String model;

  public OpenAiChatService() {
    String apiKey = System.getenv("OPENAI_API_KEY");
    this.model = Optional.ofNullable(System.getenv("OPENAI_MODEL"))
        .filter(value -> !value.isBlank())
        .orElse(DEFAULT_MODEL);

    if (apiKey == null || apiKey.isBlank()) {
      this.client = null;
    } else {
      this.client = OpenAIClient.builder()
          .apiKey(apiKey)
          .build();
    }
  }

  public ChatResult answerQuestion(String query) {
    if (client == null) {
      throw new ApiErrorException(
          HttpStatus.INTERNAL_SERVER_ERROR,
          new ErrorBody("AI_ERROR", "OPENAI_API_KEY is not configured", null)
      );
    }

    String prompt = "Answer the following question clearly and concisely:\n\n" + query;

    ChatCompletionCreateParams params = ChatCompletionCreateParams.builder()
        .model(model)
        .messages(List.of(
            ChatCompletionMessageParam.ofSystem(SYSTEM_PROMPT),
            ChatCompletionMessageParam.ofUser(prompt)
        ))
        .temperature(0.2)
        .build();

    ChatCompletion response;
    try {
      response = client.chat().completions().create(params);
    } catch (Exception ex) {
      throw new ApiErrorException(
          HttpStatus.BAD_GATEWAY,
          new ErrorBody("AI_UPSTREAM_ERROR", "OpenAI request failed: " + ex.getMessage(), null)
      );
    }

    String answer = response.choices().get(0).message().content();
    if (answer == null || answer.isBlank()) {
      throw new ApiErrorException(
          HttpStatus.INTERNAL_SERVER_ERROR,
          new ErrorBody("AI_ERROR", "OpenAI response was invalid", null)
      );
    }

    ChatCompletionUsage usage = response.usage();
    Integer promptTokens = usage != null ? usage.promptTokens() : null;
    Integer completionTokens = usage != null ? usage.completionTokens() : null;
    Integer totalTokens = usage != null ? usage.totalTokens() : null;

    return new ChatResult(answer.trim(), model, promptTokens, completionTokens, totalTokens);
  }

  public record ChatResult(
      String answer,
      String model,
      Integer promptTokens,
      Integer completionTokens,
      Integer totalTokens
  ) {}
}
