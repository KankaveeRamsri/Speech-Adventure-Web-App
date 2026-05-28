import type { SpeechEvaluationInput, SpeechEvaluationResult } from "./types";

const EVALUATE_ENDPOINT = "/api/speech/evaluate";

/**
 * Client-side wrapper that calls the speech evaluation API route.
 * Sends FormData (with audio blob) when audioBlob is present,
 * otherwise falls back to JSON for backward-compatibility.
 */
export async function evaluateSpeechViaApi(
  input: SpeechEvaluationInput,
): Promise<SpeechEvaluationResult> {
  let body: FormData | string;
  const headers: Record<string, string> = {};

  if (input.audioBlob) {
    const formData = new FormData();
    formData.append("audio", input.audioBlob, "recording");
    formData.append("stageId", input.stageId);
    formData.append("practiceItemId", input.practiceItemId);
    formData.append("targetSound", input.targetSound);
    formData.append("promptText", input.promptText);
    formData.append("itemType", input.itemType);
    formData.append("durationMs", String(input.durationMs));
    if (input.audioUrl) formData.append("audioUrl", input.audioUrl);
    if (input.selectedChoice) formData.append("selectedChoice", input.selectedChoice);
    if (input.childId) formData.append("childId", input.childId);
    body = formData;
    // Browser sets Content-Type with boundary automatically for FormData
  } else {
    body = JSON.stringify({
      stageId: input.stageId,
      practiceItemId: input.practiceItemId,
      targetSound: input.targetSound,
      promptText: input.promptText,
      itemType: input.itemType,
      durationMs: input.durationMs,
      audioUrl: input.audioUrl,
      selectedChoice: input.selectedChoice,
      childId: input.childId,
    });
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(EVALUATE_ENDPOINT, {
    method: "POST",
    headers,
    body,
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(
      (errorBody as { error?: string }).error ??
        `Speech evaluation API returned ${response.status}`,
    );
  }

  return response.json() as Promise<SpeechEvaluationResult>;
}
