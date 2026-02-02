package io.raglab.api.service;

import com.openai.client.OpenAIClient;
import com.openai.client.okhttp.OpenAIOkHttpClient;
import com.openai.models.ChatModel;
import com.openai.models.chat.completions.ChatCompletion;
import com.openai.models.chat.completions.ChatCompletionCreateParams;
import com.openai.models.completions.CompletionUsage;
import io.raglab.api.error.ApiErrorException;
import io.raglab.api.error.ErrorBody;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

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
      // Easiest “manual” config is still fromEnv(); it reads OPENAI_API_KEY, etc.
      // If you prefer explicit apiKey only, you can keep builder(), but fromEnv() is the standard path.
      this.client = OpenAIOkHttpClient.fromEnv();
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
        // If you want env-driven dynamic model strings, use ChatModel.of(model)
        .model(ChatModel.of(model))
        .addSystemMessage(SYSTEM_PROMPT)
        .addUserMessage(prompt)
        .temperature(0.2)
        .build();

    final ChatCompletion response;
    try {
      response = client.chat().completions().create(params);
    } catch (Exception ex) {
      throw new ApiErrorException(
          HttpStatus.BAD_GATEWAY,
          new ErrorBody("AI_UPSTREAM_ERROR", "OpenAI request failed: " + ex.getMessage(), null)
      );
    }

    Optional<String> answer = response.choices().get(0).message().content();
    if (answer == null || answer.isEmpty()) {
      throw new ApiErrorException(
          HttpStatus.INTERNAL_SERVER_ERROR,
          new ErrorBody("AI_ERROR", "OpenAI response was invalid", null)
      );
    }

    CompletionUsage usage = response.usage().orElse(null);
    Long promptTokens = usage != null ? usage.promptTokens() : null;
    Long completionTokens = usage != null ? usage.completionTokens() : null;
    Long totalTokens = usage != null ? usage.totalTokens() : null;

    return new ChatResult(answer.get().trim(), model, promptTokens, completionTokens, totalTokens);
  }

  public record ChatResult(
      String answer,
      String model,
      Long promptTokens,
      Long completionTokens,
      Long totalTokens
  ) {}	
}
