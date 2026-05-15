import type { SpeechEvaluationInput, SpeechEvaluationResult } from "./types";
import { mockEvaluate } from "./mockEvaluator";

const ACTIVE_PROVIDER = "mock" as const;

/**
 * Central speech evaluation entry point.
 * Currently routes to the mock evaluator.
 * Swap ACTIVE_PROVIDER to "api" and add the real call below when ready.
 */
export async function evaluateSpeech(
  input: SpeechEvaluationInput
): Promise<SpeechEvaluationResult> {
  if (ACTIVE_PROVIDER === "mock") {
    return mockEvaluate(input);
  }

  // Future: real AI API call goes here
  // return callAiEvaluationApi(input);
  throw new Error(`Provider "${ACTIVE_PROVIDER}" is not configured.`);
}
