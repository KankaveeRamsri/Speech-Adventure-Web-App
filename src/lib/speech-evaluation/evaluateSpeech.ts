import type { SpeechEvaluationInput, SpeechEvaluationResult } from "./types";
import { evaluateWithService } from "./service";

export async function evaluateSpeech(
  input: SpeechEvaluationInput,
): Promise<SpeechEvaluationResult> {
  return evaluateWithService(input);
}
