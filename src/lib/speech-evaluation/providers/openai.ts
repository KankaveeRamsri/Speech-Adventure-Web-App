import type {
  SpeechEvaluationProviderClient,
  SpeechEvaluationInput,
  SpeechEvaluationResult,
  EvaluationStatus,
} from "../types";
import { mockEvaluate } from "../mockEvaluator";

const OPENAI_TRANSCRIPTION_URL = "https://api.openai.com/v1/audio/transcriptions";
const OPENAI_CHAT_URL = "https://api.openai.com/v1/chat/completions";

const SYSTEM_PROMPT = `คุณเป็นผู้ช่วยประเมินการฝึกพูดภาษาไทยสำหรับเด็ก

งาน: ประเมินคุณภาพการออกเสียงของเด็กจาก transcript ที่ถอดมาจากเสียงพูด

ตอบเป็น JSON object ที่มีฟิลด์ดังนี้เท่านั้น:
- score: จำนวนเต็ม 0-100 (คุณภาพการออกเสียงเทียบกับเป้าหมาย)
- passed: boolean (true ถ้า score >= 70)
- confidence: ทศนิยม 0.0-1.0 (ความมั่นใจในการประเมิน)
- feedback: string ภาษาไทย ไม่เกิน 80 ตัวอักษร ให้กำลังใจเด็ก
- recommendation: string ภาษาไทย ไม่เกิน 80 ตัวอักษร หรือ null
- detectedIssues: array of string เช่น ["เสียงยังไม่ชัดเจน"] หรือ []

กฎสำคัญ:
- ห้ามวินิจฉัยโรคหรือความผิดปกติทางการพูด
- ใช้ภาษาอ่อนโยน ให้กำลังใจ ไม่ตำหนิ
- ใช้คำง่ายที่เด็กเข้าใจได้
- ถ้า transcript ว่างหรือไม่ตรงเลย ให้ score 50 และให้กำลังใจ
- เปรียบเทียบว่าเด็กพูดเสียงเป้าหมายได้ชัดแค่ไหน`;

interface GptEvalResponse {
  score: number;
  passed: boolean;
  confidence: number;
  feedback: string;
  recommendation?: string | null;
  detectedIssues?: string[];
}

function scoreToStatus(score: number): EvaluationStatus {
  if (score >= 70) return "passed";
  if (score >= 55) return "almost";
  return "retry";
}

export class OpenAISpeechEvaluationProvider implements SpeechEvaluationProviderClient {
  private readonly apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async evaluate(input: SpeechEvaluationInput): Promise<SpeechEvaluationResult> {
    // Non-recording types: use mock logic (deterministic, no AI needed)
    if (input.itemType === "oral_motor" || input.itemType === "sound_choice") {
      const mockResult = mockEvaluate(input);
      return { ...mockResult, provider: "openai", isMock: false };
    }

    let transcript: string | undefined;

    if (input.audioBuffer && input.audioBuffer.length > 0) {
      try {
        transcript = await this.transcribe(input.audioBuffer, input.audioMimeType);
        console.log("[OpenAI] transcription succeeded, length:", transcript.length);
      } catch (err) {
        console.warn("[OpenAI] transcription failed:", err instanceof Error ? err.message : err);
      }
    }

    try {
      const gptResult = await this.evaluateWithGpt(transcript, input);
      const status = scoreToStatus(gptResult.score);
      return {
        score: gptResult.score,
        confidence: gptResult.confidence,
        status,
        feedback: gptResult.feedback,
        recommendation: gptResult.recommendation ?? undefined,
        transcript,
        detectedIssues: gptResult.detectedIssues ?? [],
        isMock: false,
        provider: "openai",
        createdAt: new Date().toISOString(),
      };
    } catch (err) {
      console.warn("[OpenAI] GPT evaluation failed:", err instanceof Error ? err.message : err);
      // Safe fallback score when GPT fails but transcription succeeded
      const score = transcript ? 60 : 50;
      const status = scoreToStatus(score);
      return {
        score,
        confidence: 0.5,
        status,
        feedback: "เสียงใกล้เคียงแล้ว ลองออกเสียงให้ชัดขึ้นอีกนิดนะ",
        transcript,
        detectedIssues: [],
        isMock: false,
        provider: "openai",
        createdAt: new Date().toISOString(),
      };
    }
  }

  private async transcribe(buffer: Buffer, mimeType?: string): Promise<string> {
    const resolvedMime = mimeType ?? "audio/webm";
    const ext = resolvedMime.includes("mp4") ? "mp4" : resolvedMime.includes("ogg") ? "ogg" : "webm";

    const formData = new FormData();
    // Slice to get a plain ArrayBuffer (Node.js Buffers share pool memory).
    const arrayBuffer = buffer.buffer.slice(
      buffer.byteOffset,
      buffer.byteOffset + buffer.byteLength,
    ) as ArrayBuffer;
    const audioBlob = new Blob([arrayBuffer], { type: resolvedMime });
    formData.append("file", audioBlob, `audio.${ext}`);
    formData.append("model", "whisper-1");
    formData.append("language", "th");

    const response = await fetch(OPENAI_TRANSCRIPTION_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${this.apiKey}` },
      body: formData,
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      throw new Error(`Whisper API ${response.status}: ${errText.slice(0, 100)}`);
    }

    const data = (await response.json()) as { text: string };
    return data.text.trim();
  }

  private async evaluateWithGpt(
    transcript: string | undefined,
    input: SpeechEvaluationInput,
  ): Promise<GptEvalResponse> {
    const userPrompt = [
      `เสียงเป้าหมาย: "${input.targetSound}"`,
      `คำ/ประโยคที่ฝึก: "${input.promptText}"`,
      `ประเภทภารกิจ: ${input.itemType}`,
      `สิ่งที่เด็กพูด (transcript): ${transcript ? `"${transcript}"` : "(ไม่มีข้อมูล transcript)"}`,
      "",
      "ประเมินว่าเด็กออกเสียงเป้าหมายได้ดีแค่ไหน แล้วตอบ JSON ตามรูปแบบที่กำหนด",
    ].join("\n");

    const response = await fetch(OPENAI_CHAT_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        response_format: { type: "json_object" },
        temperature: 0.3,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      throw new Error(`GPT API ${response.status}: ${errText.slice(0, 100)}`);
    }

    const data = (await response.json()) as {
      choices: Array<{ message: { content: string } }>;
    };

    const raw = JSON.parse(data.choices[0].message.content) as GptEvalResponse;

    return {
      score: Math.max(0, Math.min(100, Math.round(raw.score ?? 50))),
      passed: !!raw.passed,
      confidence: Math.max(0, Math.min(1, raw.confidence ?? 0.7)),
      feedback: raw.feedback ?? "ทำได้ดีมาก ลองอีกครั้งนะ",
      recommendation: raw.recommendation ?? undefined,
      detectedIssues: Array.isArray(raw.detectedIssues) ? raw.detectedIssues : [],
    };
  }
}
