import type { SampleAudioInput, SampleAudioResult, SampleAudioProviderClient } from "../types";

const TTS_URL = "https://api.openai.com/v1/audio/speech";

export class OpenAISampleAudioProvider implements SampleAudioProviderClient {
  constructor(
    private readonly apiKey: string,
    private readonly model: string,
    private readonly defaultVoice: string,
  ) {}

  async generate(
    input: SampleAudioInput & { cacheKey: string },
  ): Promise<SampleAudioResult> {
    const voice = input.voice ?? this.defaultVoice;

    const response = await fetch(TTS_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: this.model,
        voice,
        input: input.expectedText,
        response_format: "mp3",
      }),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => "unknown");
      throw new Error(`OpenAI TTS ${response.status}: ${errText.slice(0, 200)}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const audioBase64 = Buffer.from(arrayBuffer).toString("base64");

    return {
      audioBase64,
      mimeType: "audio/mp3",
      provider: "openai",
      cacheKey: input.cacheKey,
    };
  }
}
