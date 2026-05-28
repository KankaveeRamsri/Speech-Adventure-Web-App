import type { SampleAudioInput, SampleAudioResult, SampleAudioProviderClient } from "../types";

export class MockSampleAudioProvider implements SampleAudioProviderClient {
  async generate(
    input: SampleAudioInput & { cacheKey: string },
  ): Promise<SampleAudioResult> {
    return {
      provider: "mock",
      mimeType: "text/plain",
      cacheKey: input.cacheKey,
      useBrowserTTS: true,
      browserTTSText: input.expectedText,
      browserTTSLang: input.locale ?? "th-TH",
    };
  }
}
