import type {
  SpeechEvaluationProviderClient,
  SpeechEvaluationInput,
  SpeechEvaluationResult,
  EvaluationStatus,
} from "../types";
import { mockEvaluate } from "../mockEvaluator";
import { getRubric, getStageLabel } from "../targetSoundRubric";

const OPENAI_TRANSCRIPTION_URL = "https://api.openai.com/v1/audio/transcriptions";
const OPENAI_CHAT_URL = "https://api.openai.com/v1/chat/completions";

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function scoreToStatus(score: number): EvaluationStatus {
  if (score >= 70) return "passed";
  if (score >= 55) return "almost";
  return "retry";
}

// ── Transcript reliability check ──────────────────────────────────────────────

interface ReliabilityResult {
  reliable: boolean;
  reason?: string;
}

/**
 * Heuristic sanity check: determines whether a Whisper transcript is plausibly
 * related to the practice target. Catches hallucinations like "โชคดีครับ" when
 * the child was saying a short consonant-practice target such as "ชอช้าง".
 */
function checkTranscriptReliability(
  transcript: string,
  targetSound: string,
  promptText: string,
  candidates: string[],
): ReliabilityResult {
  const t = transcript.trim();

  if (!t) return { reliable: false, reason: "ไม่มีเสียง" };

  const normalizeStr = (s: string) => s.replace(/\s+/g, "");
  const normalT = normalizeStr(t);
  const expectedLen = normalizeStr(promptText).length;
  const isShortTask = expectedLen <= 8;

  // Short-target tasks: transcript must not be dramatically longer than expected.
  // e.g. expected "ชอช้าง" (6 chars), transcript "โชคดีมากเลยครับ" (15 chars) → suspicious.
  if (isShortTask && normalT.length > Math.max(expectedLen * 3, 12)) {
    return { reliable: false, reason: "transcript ยาวกว่าที่คาดไว้มาก" };
  }

  // Check whether transcript starts with the target consonant (first char).
  const targetFirstChar = targetSound.charAt(0);
  const startsWithTarget = t.charAt(0) === targetFirstChar;

  // Check whether transcript matches any expected candidate (space-normalised).
  const matchesCandidate = candidates.some((c) => {
    const nc = normalizeStr(c);
    return normalT === nc || normalT.includes(nc) || nc.includes(normalT);
  });

  // For short tasks: if transcript doesn't start with the target consonant
  // AND doesn't match any candidate, it's very likely a hallucination.
  if (isShortTask && !startsWithTarget && !matchesCandidate) {
    return { reliable: false, reason: "transcript ไม่ตรงกับเสียงที่คาดหวัง" };
  }

  return { reliable: true };
}

// ── GPT schema ────────────────────────────────────────────────────────────────

interface GptRawResponse {
  transcriptMatchScore: number;
  targetSoundScore: number;
  clarityScore: number;
  confidence: number;
  feedback: string;
  practiceTip?: string;
  detectedIssues?: string[];
}

// ── System prompt ─────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `คุณเป็นผู้ช่วยประเมินการออกเสียงภาษาไทยสำหรับเด็กในโปรแกรมฝึกการพูด

งาน: ประเมินว่าเด็กออกเสียงพยัญชนะเป้าหมายได้ดีแค่ไหน โดยพิจารณาจาก transcript และบริบทที่ให้ไว้

ตอบเป็น JSON object เท่านั้น ไม่มี markdown ไม่มีข้อความอื่น:
{
  "transcriptMatchScore": <จำนวนเต็ม 0-100>,
  "targetSoundScore": <จำนวนเต็ม 0-100>,
  "clarityScore": <จำนวนเต็ม 0-100>,
  "confidence": <ทศนิยม 0.0-1.0>,
  "feedback": <string ภาษาไทย ไม่เกิน 80 ตัวอักษร>,
  "practiceTip": <string ภาษาไทย ไม่เกิน 80 ตัวอักษร>,
  "detectedIssues": [<string สั้นๆ>, ...]
}

คำอธิบายแต่ละฟิลด์:
- transcriptMatchScore: transcript ตรงกับคำ/ประโยคที่คาดหวังมากแค่ไหน
- targetSoundScore: พยัญชนะเป้าหมายออกเสียงได้ชัดและถูกต้องแค่ไหน
- clarityScore: ความชัดเจนโดยรวมของเสียงที่ได้ยิน
- confidence: ความมั่นใจในการประเมินนี้
- feedback: คำชมหรือกำลังใจสั้นๆ เป็นมิตรกับเด็ก
- practiceTip: คำแนะนำปฏิบัติเพื่อพัฒนาครั้งต่อไป
- detectedIssues: ปัญหาเฉพาะที่พบ หรือ [] ถ้าไม่มี

กฎสำคัญ:
- ห้ามวินิจฉัยโรคหรือความผิดปกติทางการพูด
- ห้ามใช้คำว่า "ผิด" "ออกเสียงไม่ได้" หรือภาษาที่ทำให้เด็กรู้สึกแย่
- ถ้า transcript ไม่น่าเชื่อถือหรือว่าง ให้ confidence ≤ 0.4 และทุก score ≤ 45
- ถ้าไม่มั่นใจ ให้ score ต่ำกว่า อย่า over-score
- feedback และ practiceTip ต้องเป็นภาษาไทยที่เด็กเข้าใจง่าย ให้กำลังใจ`;

// ── Provider ──────────────────────────────────────────────────────────────────

export class OpenAISpeechEvaluationProvider implements SpeechEvaluationProviderClient {
  private readonly apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async evaluate(input: SpeechEvaluationInput): Promise<SpeechEvaluationResult> {
    // Non-recording types: use deterministic mock logic
    if (input.itemType === "oral_motor" || input.itemType === "sound_choice") {
      const mockResult = mockEvaluate(input);
      return { ...mockResult, provider: "openai", isMock: false };
    }

    let transcript: string | undefined;

    if (input.audioBuffer && input.audioBuffer.length > 0) {
      try {
        transcript = await this.transcribe(
          input.audioBuffer,
          input.audioMimeType,
          input.targetSound,
          input.promptText,
        );
        console.log("[OpenAI] transcription ok, chars:", transcript.length);
      } catch (err) {
        console.warn("[OpenAI] transcription failed:", err instanceof Error ? err.message : err);
      }
    }

    try {
      return await this.evaluateWithGpt(transcript, input);
    } catch (err) {
      console.warn("[OpenAI] GPT eval failed:", err instanceof Error ? err.message : err);
      const score = transcript ? 55 : 45;
      return {
        score,
        confidence: 0.4,
        status: scoreToStatus(score),
        feedback: "ลองฟังตัวอย่างแล้วพูดตามอีกครั้งนะ",
        practiceTip: "พูดใกล้ไมค์และออกเสียงให้ชัดขึ้นอีกนิด",
        transcript,
        detectedIssues: [],
        transcriptReliable: false,
        transcriptReliabilityReason: "ประเมินไม่ได้เนื่องจากข้อผิดพลาด",
        isMock: false,
        provider: "openai",
        createdAt: new Date().toISOString(),
      };
    }
  }

  private async transcribe(
    buffer: Buffer,
    mimeType?: string,
    targetSound?: string,
    expectedText?: string,
  ): Promise<string> {
    const resolvedMime = mimeType ?? "audio/webm";
    const ext = resolvedMime.includes("mp4") ? "mp4" : resolvedMime.includes("ogg") ? "ogg" : "webm";

    // Constrain Whisper: tell it this is a short consonant-practice clip, not conversation.
    const whisperPrompt = [
      "นี่คือเสียงเด็กกำลังฝึกออกเสียงพยัญชนะภาษาไทยแบบสั้น ๆ ไม่ใช่บทสนทนาทั่วไป",
      targetSound ? `เป้าหมายคือเสียง "${targetSound}"` : null,
      expectedText ? `ข้อความที่คาดหวังคือ "${expectedText}"` : null,
      "โปรดถอดเสียงตามเสียงที่ได้ยินแบบตรงตัว โดยเฉพาะคำฝึก เช่น กอไก่ คอควาย ตอเต่า ชอช้าง",
      "อย่าแปลงเสียงสั้น ๆ เป็นประโยคทั่วไป เช่น โชคดีครับ หากไม่ชัดให้ถอดใกล้เคียงที่สุด",
    ]
      .filter(Boolean)
      .join(" ");

    const formData = new FormData();
    const arrayBuffer = buffer.buffer.slice(
      buffer.byteOffset,
      buffer.byteOffset + buffer.byteLength,
    ) as ArrayBuffer;
    const audioBlob = new Blob([arrayBuffer], { type: resolvedMime });
    formData.append("file", audioBlob, `audio.${ext}`);
    formData.append("model", "whisper-1");
    formData.append("language", "th");
    formData.append("prompt", whisperPrompt);

    const response = await fetch(OPENAI_TRANSCRIPTION_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${this.apiKey}` },
      body: formData,
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      throw new Error(`Whisper ${response.status}: ${errText.slice(0, 80)}`);
    }

    const data = (await response.json()) as { text: string };
    return data.text.trim();
  }

  private async evaluateWithGpt(
    transcript: string | undefined,
    input: SpeechEvaluationInput,
  ): Promise<SpeechEvaluationResult> {
    const rubric = getRubric(input.targetSound);
    const stageLabel = getStageLabel(input.stageId);

    // Collect all known candidates for this target sound
    const allCandidates = rubric
      ? [...rubric.transcriptionCandidates, ...rubric.expectedExamples]
      : [];

    // Run sanity check on the transcript
    const { reliable: transcriptReliable, reason: transcriptReliabilityReason } =
      transcript
        ? checkTranscriptReliability(
            transcript,
            input.targetSound,
            input.promptText,
            allCandidates,
          )
        : { reliable: false, reason: "ไม่มีเสียง" };

    console.log(
      `[OpenAI] transcriptReliable=${transcriptReliable}${transcriptReliabilityReason ? ` (${transcriptReliabilityReason})` : ""}`,
    );

    const rubricSection = rubric
      ? [
          `== เกณฑ์การออกเสียง ${rubric.symbol} (${rubric.label}) ==`,
          `หมายเหตุ phonetic: ${rubric.phoneticNote}`,
          `ตัวอย่างที่ถูกต้อง: ${rubric.expectedExamples.join(", ")}`,
          `การออกเสียงผิดที่พบบ่อย: ${rubric.commonSubstitutions.join(", ")}`,
          `คำแนะนำสำหรับเด็ก: ${rubric.childFriendlyTips.join(" / ")}`,
          `แนวทางการให้คะแนน: ${rubric.scoringHints.join(" | ")}`,
        ].join("\n")
      : `เสียงเป้าหมาย: ${input.targetSound}`;

    const reliabilityNote = transcriptReliable
      ? "ความน่าเชื่อถือ: transcript น่าเชื่อถือ สามารถใช้ประเมินได้"
      : `ความน่าเชื่อถือ: transcript ไม่น่าเชื่อถือ (${transcriptReliabilityReason ?? "ไม่ทราบสาเหตุ"}) — ให้ confidence ≤ 0.4 และทุก score ≤ 45`;

    const userPrompt = [
      `== ข้อมูลภารกิจ ==`,
      `ระดับ/Stage: ${stageLabel}`,
      `เสียงเป้าหมาย: "${input.targetSound}"`,
      `คำ/ประโยคที่คาดหวัง: "${input.promptText}"`,
      `ประเภทภารกิจ: ${input.itemType}`,
      ``,
      rubricSection,
      ``,
      `== ผลจากเสียงของเด็ก ==`,
      `Transcript: ${transcript ? `"${transcript}"` : "(ไม่มีข้อมูล — เสียงไม่ชัดหรือว่าง)"}`,
      reliabilityNote,
      ``,
      `ประเมินตาม rubric และความน่าเชื่อถือของ transcript แล้วตอบ JSON ตามรูปแบบใน system prompt`,
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
        temperature: 0.2,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      throw new Error(`GPT ${response.status}: ${errText.slice(0, 80)}`);
    }

    const data = (await response.json()) as {
      choices: Array<{ message: { content: string } }>;
    };

    const raw = JSON.parse(data.choices[0].message.content) as GptRawResponse;

    // Server-side clamping
    let transcriptMatchScore = clamp(Math.round(raw.transcriptMatchScore ?? 50), 0, 100);
    let targetSoundScore = clamp(Math.round(raw.targetSoundScore ?? 50), 0, 100);
    let clarityScore = clamp(Math.round(raw.clarityScore ?? 50), 0, 100);
    let confidence = clamp(raw.confidence ?? 0.6, 0, 1);

    // Hard cap when transcript is unreliable — overrides GPT regardless of what it returns.
    if (!transcriptReliable) {
      confidence = Math.min(confidence, 0.4);
      transcriptMatchScore = Math.min(transcriptMatchScore, 45);
      targetSoundScore = Math.min(targetSoundScore, 45);
      clarityScore = Math.min(clarityScore, 45);
    }

    // Weighted average: targetSound 45%, transcriptMatch 35%, clarity 20%
    const score = clamp(
      Math.round(targetSoundScore * 0.45 + transcriptMatchScore * 0.35 + clarityScore * 0.2),
      0,
      100,
    );

    const hasUsableAudio = !!transcript && transcript.length > 0 && transcriptReliable;
    const passed = score >= 70 && confidence >= 0.55 && hasUsableAudio;
    const status = passed ? "passed" : score >= 55 ? "almost" : "retry";

    // Use safe feedback when transcript is unreliable to avoid confusing the child.
    const feedback = transcriptReliable
      ? (raw.feedback ?? "ลองฟังตัวอย่างแล้วพูดตามอีกครั้งนะ")
      : "ระบบยังฟังเสียงไม่ชัด ลองพูดใกล้ไมค์อีกครั้งนะ";

    console.log(
      `[OpenAI] tms=${transcriptMatchScore} tss=${targetSoundScore} cs=${clarityScore} → score=${score} passed=${passed} conf=${confidence.toFixed(2)}`,
    );

    return {
      score,
      confidence,
      status,
      feedback,
      practiceTip: transcriptReliable ? raw.practiceTip : "ลองพูดช้าๆ ใกล้ไมค์ แล้วออกเสียงให้ชัดขึ้น",
      transcript,
      detectedIssues: Array.isArray(raw.detectedIssues) ? raw.detectedIssues : [],
      transcriptMatchScore,
      targetSoundScore,
      clarityScore,
      transcriptReliable,
      transcriptReliabilityReason,
      isMock: false,
      provider: "openai",
      createdAt: new Date().toISOString(),
    };
  }
}
