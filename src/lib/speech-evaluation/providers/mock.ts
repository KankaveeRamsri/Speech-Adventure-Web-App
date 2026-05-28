import type {
  SpeechEvaluationProviderClient,
  SpeechEvaluationInput,
  SpeechEvaluationResult,
} from "../types";
import { mockEvaluate } from "../mockEvaluator";

export class MockSpeechEvaluationProvider implements SpeechEvaluationProviderClient {
  async evaluate(input: SpeechEvaluationInput): Promise<SpeechEvaluationResult> {
    return mockEvaluate(input);
  }
}
