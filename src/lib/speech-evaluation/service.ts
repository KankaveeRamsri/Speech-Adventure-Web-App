import type {
  SpeechEvaluationInput,
  SpeechEvaluationResult,
  SpeechEvaluationProviderClient,
} from "./types";
import { MockSpeechEvaluationProvider } from "./providers/mock";
import { OpenAISpeechEvaluationProvider } from "./providers/openai";

function buildProvider(): SpeechEvaluationProviderClient {
  const providerName = process.env.SPEECH_EVALUATION_PROVIDER ?? "mock";

  if (providerName === "openai") {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.warn(
        "[SpeechEvaluationService] SPEECH_EVALUATION_PROVIDER=openai but OPENAI_API_KEY is missing — falling back to mock",
      );
      return new MockSpeechEvaluationProvider();
    }
    return new OpenAISpeechEvaluationProvider(apiKey);
  }

  return new MockSpeechEvaluationProvider();
}

export async function evaluateWithService(
  input: SpeechEvaluationInput,
): Promise<SpeechEvaluationResult> {
  const provider = buildProvider();
  const providerLabel = provider.constructor.name;

  console.log(`[SpeechEvaluationService] provider=${providerLabel} itemType=${input.itemType}`);

  try {
    const result = await provider.evaluate(input);
    console.log(
      `[SpeechEvaluationService] score=${result.score} transcribed=${!!result.transcript}`,
    );
    return result;
  } catch (err) {
    console.error(
      "[SpeechEvaluationService] evaluation failed, falling back to mock:",
      err instanceof Error ? err.message : err,
    );
    const mock = new MockSpeechEvaluationProvider();
    return mock.evaluate(input);
  }
}
