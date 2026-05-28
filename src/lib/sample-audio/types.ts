export interface SampleAudioInput {
  expectedText: string;
  targetSound?: string;
  stageId: string;
  locale?: string;
  voice?: string;
}

export interface SampleAudioResult {
  mimeType: string;
  provider: "openai" | "mock";
  cacheKey: string;
  /** Base64-encoded audio bytes. Present for OpenAI provider. */
  audioBase64?: string;
  /** Mock provider: instruct the client to use browser speechSynthesis. */
  useBrowserTTS?: boolean;
  browserTTSText?: string;
  browserTTSLang?: string;
}

export interface SampleAudioProviderClient {
  generate(input: SampleAudioInput & { cacheKey: string }): Promise<SampleAudioResult>;
}
