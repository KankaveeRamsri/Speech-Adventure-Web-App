import type { SpeechEvaluationInput, SpeechEvaluationResult } from "./types";

const EVALUATE_ENDPOINT = "/api/speech/evaluate";

/**
 * Client-side wrapper that calls the speech evaluation API route.
 * Use this in React client components instead of calling evaluateSpeech() directly.
 * audioBlob is intentionally excluded from the JSON payload.
 */
export async function evaluateSpeechViaApi(
  input: SpeechEvaluationInput
): Promise<SpeechEvaluationResult> {
  const payload = {
    stageId: input.stageId,
    practiceItemId: input.practiceItemId,
    targetSound: input.targetSound,
    promptText: input.promptText,
    itemType: input.itemType,
    durationMs: input.durationMs,
    audioUrl: input.audioUrl,
    selectedChoice: input.selectedChoice,
  };

  const response = await fetch(EVALUATE_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(
      (errorBody as { error?: string }).error ??
        `Speech evaluation API returned ${response.status}`
    );
  }

  return response.json() as Promise<SpeechEvaluationResult>;
}
