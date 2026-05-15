import type { SpeechEvaluationInput, SpeechEvaluationResult } from "./types";

type EvalCore = Pick<
  SpeechEvaluationResult,
  "score" | "confidence" | "status" | "feedback" | "recommendation"
>;

const RECORDING_POOL: EvalCore[] = [
  {
    score: 95,
    confidence: 0.97,
    status: "passed",
    feedback: "ยอดเยี่ยม! เสียงออกมาชัดเจนมาก!",
    recommendation: "ลองฝึกระดับถัดไปได้เลยนะ",
  },
  {
    score: 82,
    confidence: 0.85,
    status: "passed",
    feedback: "ดีมาก! ออกเสียงได้ดีขึ้นแล้ว!",
    recommendation: "ลองฟังเสียงตัวอย่างแล้วฝึกตามอีกสักหน่อย",
  },
  {
    score: 68,
    confidence: 0.72,
    status: "almost",
    feedback: "เกือบจะผ่านแล้ว! ลองอีกสักครั้ง!",
    recommendation: "ออกเสียงให้ช้าลงและชัดขึ้นอีกนิด",
  },
  {
    score: 50,
    confidence: 0.55,
    status: "retry",
    feedback: "สู้ต่อนะ! ลองฟังเสียงตัวอย่างแล้วฝึกอีกครั้ง!",
    recommendation: "เริ่มจากการฟังเสียงตัวอย่างก่อน แล้วค่อยๆ ออกเสียงตาม",
  },
];

function evalOralMotor(): EvalCore {
  const score = 75 + Math.floor(Math.random() * 21);
  return {
    score,
    confidence: 0.9,
    status: "passed",
    feedback: "ทำภารกิจ Oral Motor สำเร็จ!",
    recommendation: undefined,
  };
}

function evalSoundChoice(promptText: string, selectedChoice?: string): EvalCore {
  const isCorrect = selectedChoice === promptText;
  const score = isCorrect
    ? 80 + Math.floor(Math.random() * 16)
    : 30 + Math.floor(Math.random() * 26);
  return {
    score,
    confidence: isCorrect ? 0.9 : 0.5,
    status: isCorrect ? "passed" : "retry",
    feedback: isCorrect
      ? `ถูกต้อง! "${selectedChoice}" ใช่เลย!`
      : `คำตอบที่ถูกคือ "${promptText}" ลองอีกครั้ง!`,
    recommendation: isCorrect ? undefined : "ฟังเสียงให้ดีแล้วลองเลือกใหม่",
  };
}

export function mockEvaluate(input: SpeechEvaluationInput): SpeechEvaluationResult {
  let core: EvalCore;

  if (input.itemType === "oral_motor") {
    core = evalOralMotor();
  } else if (input.itemType === "sound_choice") {
    core = evalSoundChoice(input.promptText, input.selectedChoice);
  } else {
    core = RECORDING_POOL[Math.floor(Math.random() * RECORDING_POOL.length)];
  }

  return {
    ...core,
    isMock: true,
    provider: "mock",
    createdAt: new Date().toISOString(),
  };
}
