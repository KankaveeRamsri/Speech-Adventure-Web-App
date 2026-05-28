import type { SampleAudioInput, SampleAudioResult } from "./types";
import { MockSampleAudioProvider } from "./providers/mock";
import { OpenAISampleAudioProvider } from "./providers/openai";

export const MAX_SAMPLE_TEXT_LENGTH = 200;

// Server-process in-memory cache: cacheKey → result.
// Only real audio (audioBase64 present) is cached — mock/browser-TTS responses
// are regenerated cheaply on each call.
const _audioCache = new Map<string, SampleAudioResult>();

function simpleHash(str: string): string {
  let h = 5381;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) + h) ^ str.charCodeAt(i);
  }
  return (h >>> 0).toString(36);
}

function buildCacheKey(input: SampleAudioInput): string {
  const locale = input.locale ?? "th-TH";
  const voice = input.voice ?? process.env.OPENAI_TTS_VOICE ?? "alloy";
  const textHash = simpleHash(input.expectedText.trim().toLowerCase());
  return `${locale}/${voice}/${input.stageId}/${input.targetSound ?? "none"}/${textHash}`;
}

function buildProvider() {
  const providerName = process.env.SAMPLE_AUDIO_PROVIDER ?? "mock";

  if (providerName === "openai") {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      console.warn(
        "[SampleAudioService] SAMPLE_AUDIO_PROVIDER=openai but OPENAI_API_KEY is missing — falling back to mock",
      );
      return new MockSampleAudioProvider();
    }
    // Default to tts-1 (widely available); override via OPENAI_TTS_MODEL env var
    const model = process.env.OPENAI_TTS_MODEL ?? "tts-1";
    const voice = process.env.OPENAI_TTS_VOICE ?? "alloy";
    return new OpenAISampleAudioProvider(apiKey, model, voice);
  }

  return new MockSampleAudioProvider();
}

export async function generateSampleAudio(
  input: SampleAudioInput,
): Promise<SampleAudioResult> {
  const text = input.expectedText.trim();
  if (!text) throw new Error("expectedText is empty");
  if (text.length > MAX_SAMPLE_TEXT_LENGTH) {
    throw new Error(`expectedText exceeds ${MAX_SAMPLE_TEXT_LENGTH} characters`);
  }

  const cacheKey = buildCacheKey(input);

  const cached = _audioCache.get(cacheKey);
  if (cached) {
    console.log(`[SampleAudioService] cache hit: ${cacheKey}`);
    return cached;
  }

  const provider = buildProvider();
  console.log(`[SampleAudioService] generate: provider=${provider.constructor.name} cacheKey=${cacheKey}`);

  const result = await provider.generate({ ...input, cacheKey });

  // Only persist real audio to cache (not mock browser-TTS instructions)
  if (result.audioBase64) {
    _audioCache.set(cacheKey, result);
  }

  return result;
}
