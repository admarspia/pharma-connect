import axios from "axios";
import { env } from "../../config/env";
import { logger } from "../../common/logger";
import { ApiError } from "../../common/ApiError";

/**
 * Thin client around an OpenAI-compatible chat completions endpoint
 * serving Qwen (e.g. Ollama `ollama run qwen2.5:7b-instruct` or a
 * vLLM OpenAI server). Real HTTP calls, no mocking.
 */
export async function completeJson<T = unknown>(
  systemPrompt: string,
  userPrompt: string
): Promise<T> {
  try {
    const { data } = await axios.post(
      `${env.ai.llmBaseUrl}/chat/completions`,
      {
        model: env.ai.llmModel,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.1,
        response_format: { type: "json_object" },
      },
      {
        headers: { Authorization: `Bearer ${env.ai.llmApiKey}` },
        timeout: env.ai.requestTimeoutMs,
      }
    );

    const content: string = data.choices?.[0]?.message?.content ?? "{}";
    return JSON.parse(content) as T;
  } catch (err) {
    logger.warn("Qwen LLM service call failed", { error: (err as Error).message });
    throw ApiError.internal("AI extraction service unavailable", { service: "qwen" });
  }
}
