import type { PracticeAttempt, PracticeSession, SpeechProgress } from "@/types/speechAdventure";
import type { ObservationNote } from "@/types/observations";
import {
  replaceProgress,
  clearProgress,
} from "@/lib/speechProgressStorage";
import {
  replaceObservations,
  clearObservations,
} from "@/lib/observations/observationStorage";

// ── Demo metadata ─────────────────────────────────────────────────────────────

export const DEMO_CHILD_ID = "child-001";
export const DEMO_TARGET_SOUND = "ก";

// Timestamps spread across the past 2 weeks (relative to 2026-05-15)
function ts(dateStr: string, hour = 9): string {
  return new Date(`${dateStr}T${String(hour).padStart(2, "0")}:00:00.000Z`).toISOString();
}

function stars(score: number): number {
  if (score >= 85) return 3;
  if (score >= 70) return 2;
  return 1;
}

function attempt(
  id: string,
  stageId: string,
  practiceItemId: string,
  targetSound: string,
  promptText: string,
  score: number,
  confidence: number,
  status: "passed" | "almost" | "retry",
  feedback: string,
  recommendation: string | undefined,
  durationMs: number,
  createdAt: string,
  sessionId?: string,
): PracticeAttempt {
  return {
    id,
    childId: DEMO_CHILD_ID,
    stageId,
    practiceItemId,
    targetSound,
    promptText,
    score,
    confidence,
    status,
    feedback,
    recommendation,
    starsEarned: stars(score),
    durationMs,
    sessionId,
    createdAt,
  };
}

// ── Demo Attempts ─────────────────────────────────────────────────────────────
// Covers: pretest → level-1 → level-2 → level-3 → level-4 → level-5 → review
// Designed so:
//   • pretestScore ≈ 48%   reviewScore ≈ 81%   improvement ≈ 33 pts
//   • 4 difficult items (avg < 60%) — appear in dashboard's "รายการที่ต้องฝึก"
//   • Total 31 attempts across 7 stages — looks like 2 weeks of real practice
//   • 7 sessions (one per stage) linked to attempts via sessionId

export const DEMO_ATTEMPTS: PracticeAttempt[] = [

  // ── Pre-test (3 attempts, avg 48) ─────────────────────────────────────────
  attempt("demo-pt-1", "pretest", "pt-item-กา", "ก", "กา",
    45, 0.48, "retry",
    "สู้ต่อนะ! นี่แค่ Pre-test วัดระดับเสียงเริ่มต้นเท่านั้น",
    "ลองฟังเสียงตัวอย่างแล้วฝึกตามอีกสักหน่อย",
    1800, ts("2026-05-01", 9), "session-pretest"),

  attempt("demo-pt-2", "pretest", "pt-item-กา", "ก", "กา",
    48, 0.52, "retry",
    "ดีขึ้นนิดหน่อยแล้ว! ฝึกต่อนะ",
    "ออกเสียงให้ช้าลงและชัดขึ้นอีกนิด",
    2100, ts("2026-05-01", 9), "session-pretest"),

  attempt("demo-pt-3", "pretest", "pt-item-กี", "ก", "กี่",
    50, 0.54, "retry",
    "ดีขึ้นนิดหน่อยแล้ว! ฝึกต่อนะ",
    "เริ่มจากการฟังเสียงตัวอย่างก่อน แล้วค่อยๆ ออกเสียงตาม",
    1950, ts("2026-05-01", 10), "session-pretest"),

  // ── Level 1: Oral Motor (4 attempts, avg 83) ──────────────────────────────
  attempt("demo-l1-1", "level-1", "l1-item-เป่า", "ก", "เป่าลม",
    78, 0.82, "passed",
    "ดีมาก! ทำภารกิจ Oral Motor สำเร็จ!",
    undefined,
    3000, ts("2026-05-03", 9), "session-l1"),

  attempt("demo-l1-2", "level-1", "l1-item-ยิ้ม", "ก", "ยิ้มกว้าง",
    82, 0.85, "passed",
    "ยอดเยี่ยม! กล้ามเนื้อในช่องปากแข็งแรงขึ้นแล้ว",
    undefined,
    2800, ts("2026-05-03", 10), "session-l1"),

  attempt("demo-l1-3", "level-1", "l1-item-ลิ้น", "ก", "ขยับลิ้น",
    85, 0.88, "passed",
    "ยอดเยี่ยม! ทำได้ดีมากค่ะ",
    "ลองฝึกระดับถัดไปได้เลยนะ",
    2500, ts("2026-05-04", 9), "session-l1"),

  attempt("demo-l1-4", "level-1", "l1-item-ปาก", "ก", "อ้าปากกว้าง",
    88, 0.90, "passed",
    "ยอดเยี่ยม! เก่งมากเลยนะ",
    "ลองฝึกระดับถัดไปได้เลยนะ",
    2200, ts("2026-05-04", 10), "session-l1"),

  // ── Level 2: Sound Familiarity (5 attempts, avg 71) ───────────────────────
  attempt("demo-l2-1", "level-2", "l2-item-ก1", "ก", "เสียง ก",
    62, 0.65, "almost",
    "เกือบจะผ่านแล้ว! ลองอีกสักครั้ง!",
    "ฟังเสียงให้ดีแล้วลองเลือกใหม่",
    1500, ts("2026-05-06", 9), "session-l2"),

  attempt("demo-l2-2", "level-2", "l2-item-ก2", "ก", "กา vs ขา",
    68, 0.70, "almost",
    "เกือบจะผ่านแล้ว! ลองอีกสักครั้ง!",
    "ออกเสียงให้ช้าลงและชัดขึ้นอีกนิด",
    1800, ts("2026-05-06", 10), "session-l2"),

  attempt("demo-l2-3", "level-2", "l2-item-ก3", "ก", "กา vs คา",
    72, 0.75, "passed",
    "ดีมาก! ออกเสียงได้ดีขึ้นแล้ว!",
    "ลองฟังเสียงตัวอย่างแล้วฝึกตามอีกสักหน่อย",
    1600, ts("2026-05-07", 9), "session-l2"),

  attempt("demo-l2-4", "level-2", "l2-item-ก4", "ก", "กี vs ขี",
    75, 0.78, "passed",
    "ดีมาก! ออกเสียงได้ดีขึ้นแล้ว!",
    undefined,
    1700, ts("2026-05-07", 10), "session-l2"),

  attempt("demo-l2-5", "level-2", "l2-item-ก5", "ก", "กู vs คู",
    80, 0.83, "passed",
    "ยอดเยี่ยม! เสียงออกมาชัดเจนมาก!",
    "ลองฝึกระดับถัดไปได้เลยนะ",
    1400, ts("2026-05-07", 11), "session-l2"),

  // ── Level 3: Sound Production (8 attempts on 4 items, avg 64) ────────────
  attempt("demo-l3-1", "level-3", "l3-item-สระกอ", "ก", "สระ กอ",
    50, 0.53, "retry",
    "สู้ต่อนะ! ลองฟังเสียงตัวอย่างแล้วฝึกอีกครั้ง!",
    "เริ่มจากการฟังเสียงตัวอย่างก่อน แล้วค่อยๆ ออกเสียงตาม",
    2800, ts("2026-05-08", 9), "session-l3a"),

  attempt("demo-l3-2", "level-3", "l3-item-สระกอ", "ก", "สระ กอ",
    55, 0.58, "retry",
    "สู้ต่อนะ! เกือบแล้ว!",
    "ออกเสียงให้ช้าลงและชัดขึ้นอีกนิด",
    3100, ts("2026-05-08", 10), "session-l3a"),

  attempt("demo-l3-3", "level-3", "l3-item-กระ", "ก", "กระ",
    55, 0.58, "retry",
    "สู้ต่อนะ! ลองฟังเสียงตัวอย่างแล้วฝึกอีกครั้ง!",
    "เริ่มจากการฟังเสียงตัวอย่างก่อน",
    2600, ts("2026-05-09", 9), "session-l3a"),

  attempt("demo-l3-4", "level-3", "l3-item-กระ", "ก", "กระ",
    58, 0.61, "almost",
    "เกือบจะผ่านแล้ว! ดีขึ้นมากเลย",
    "ออกเสียงให้ช้าลงอีกนิด",
    2900, ts("2026-05-09", 10), "session-l3b"),

  attempt("demo-l3-5", "level-3", "l3-item-กลม", "ก", "กลม",
    68, 0.71, "almost",
    "เกือบจะผ่านแล้ว! ลองอีกสักครั้ง!",
    "ลองฟังเสียงตัวอย่างแล้วฝึกตามอีกสักหน่อย",
    2400, ts("2026-05-10", 9), "session-l3b"),

  attempt("demo-l3-6", "level-3", "l3-item-กลม", "ก", "กลม",
    72, 0.75, "passed",
    "ดีมาก! ออกเสียงได้ดีขึ้นแล้ว!",
    undefined,
    2300, ts("2026-05-10", 10), "session-l3b"),

  attempt("demo-l3-7", "level-3", "l3-item-กาน้ำ", "ก", "กาน้ำ",
    78, 0.81, "passed",
    "ดีมาก! ออกเสียงได้ดีขึ้นแล้ว!",
    "ลองฝึกระดับถัดไปได้เลยนะ",
    2100, ts("2026-05-10", 11), "session-l3b"),

  attempt("demo-l3-8", "level-3", "l3-item-กาน้ำ", "ก", "กาน้ำ",
    82, 0.85, "passed",
    "ยอดเยี่ยม! เสียงออกมาชัดเจนมาก!",
    "ลองฝึกระดับถัดไปได้เลยนะ",
    1900, ts("2026-05-10", 14), "session-l3b"),

  // ── Level 4: Word Practice (5 attempts, avg 72) ───────────────────────────
  attempt("demo-l4-1", "level-4", "l4-item-ไก่", "ก", "ไก่",
    60, 0.63, "almost",
    "เกือบจะผ่านแล้ว! ลองอีกสักครั้ง!",
    "ออกเสียงให้ช้าลงและชัดขึ้นอีกนิด",
    2500, ts("2026-05-11", 9), "session-l4"),

  attempt("demo-l4-2", "level-4", "l4-item-ไก่", "ก", "ไก่",
    68, 0.71, "almost",
    "เกือบจะผ่านแล้ว! ดีขึ้นมากเลย",
    "ลองฟังเสียงตัวอย่างแล้วฝึกตามอีกสักหน่อย",
    2300, ts("2026-05-11", 10), "session-l4"),

  attempt("demo-l4-3", "level-4", "l4-item-กวาง", "ก", "กวาง",
    72, 0.75, "passed",
    "ดีมาก! ออกเสียงได้ดีขึ้นแล้ว!",
    undefined,
    2100, ts("2026-05-12", 9), "session-l4"),

  attempt("demo-l4-4", "level-4", "l4-item-กลอง", "ก", "กลอง",
    78, 0.81, "passed",
    "ดีมาก! ออกเสียงได้ดีขึ้นแล้ว!",
    "ลองฝึกระดับถัดไปได้เลยนะ",
    1900, ts("2026-05-12", 10), "session-l4"),

  attempt("demo-l4-5", "level-4", "l4-item-กระต่าย", "ก", "กระต่าย",
    82, 0.85, "passed",
    "ยอดเยี่ยม! เสียงออกมาชัดเจนมาก!",
    "ลองฝึกระดับถัดไปได้เลยนะ",
    1700, ts("2026-05-12", 11), "session-l4"),

  // ── Level 5: Sentence Practice (4 attempts, avg 75) ──────────────────────
  attempt("demo-l5-1", "level-5", "l5-item-s1", "ก", "กาจิกเด็ก",
    68, 0.71, "almost",
    "เกือบจะผ่านแล้ว! ลองอีกสักครั้ง!",
    "ออกเสียงให้ช้าลงอีกนิด",
    3500, ts("2026-05-13", 9), "session-l5"),

  attempt("demo-l5-2", "level-5", "l5-item-s1", "ก", "กาจิกเด็ก",
    72, 0.75, "passed",
    "ดีมาก! ออกเสียงได้ดีขึ้นแล้ว!",
    undefined,
    3200, ts("2026-05-13", 10), "session-l5"),

  attempt("demo-l5-3", "level-5", "l5-item-s2", "ก", "กาน้ำสีแดง",
    78, 0.81, "passed",
    "ดีมาก! ออกเสียงได้ดีขึ้นแล้ว!",
    "ลองฝึกระดับถัดไปได้เลยนะ",
    3800, ts("2026-05-13", 11), "session-l5"),

  attempt("demo-l5-4", "level-5", "l5-item-s3", "ก", "กระต่ายกินหญ้า",
    82, 0.85, "passed",
    "ยอดเยี่ยม! ออกเสียงประโยคได้ชัดเจนมาก!",
    "ลองฝึกระดับถัดไปได้เลยนะ",
    4100, ts("2026-05-13", 14), "session-l5"),

  // ── Review / Post-test (3 attempts, avg 81) ───────────────────────────────
  attempt("demo-rv-1", "review", "rv-item-กา", "ก", "กา",
    78, 0.81, "passed",
    "ดีมาก! พัฒนาขึ้นมากเลยนะ",
    undefined,
    2000, ts("2026-05-14", 9), "session-review"),

  attempt("demo-rv-2", "review", "rv-item-กี", "ก", "กี่",
    82, 0.85, "passed",
    "ดีมาก! ออกเสียงได้ชัดขึ้นมากเลย",
    "ลองฝึกต่อเนื่องทุกวันนะคะ",
    1800, ts("2026-05-14", 10), "session-review"),

  attempt("demo-rv-3", "review", "rv-item-กลม", "ก", "กลม",
    85, 0.88, "passed",
    "ยอดเยี่ยม! เสียงออกมาชัดเจนมาก!",
    "ลองฝึกระดับถัดไปได้เลยนะ",
    2200, ts("2026-05-14", 11), "session-review"),
];

// ── Demo Sessions ─────────────────────────────────────────────────────────────

function session(
  id: string,
  stageId: string,
  startedAt: string,
  endedAt: string,
  totalMissions: number,
  attemptIds: string[],
  status: "completed" | "abandoned" = "completed",
): PracticeSession {
  const sessionAttempts = DEMO_ATTEMPTS.filter((a) => a.sessionId === id);
  const completedMissions = new Set(sessionAttempts.map((a) => a.practiceItemId)).size;
  const averageScore = sessionAttempts.length > 0
    ? Math.round(sessionAttempts.reduce((s, a) => s + a.score, 0) / sessionAttempts.length)
    : 0;
  const starsEarned = sessionAttempts.reduce((s, a) => s + a.starsEarned, 0);
  const durationMs = new Date(endedAt).getTime() - new Date(startedAt).getTime();

  return {
    id,
    childId: DEMO_CHILD_ID,
    targetSound: DEMO_TARGET_SOUND,
    stageId,
    startedAt,
    endedAt,
    durationMs,
    completedMissions,
    totalMissions,
    averageScore,
    starsEarned,
    attemptIds,
    status,
  };
}

export const DEMO_SESSIONS: PracticeSession[] = [
  session("session-pretest", "pretest", ts("2026-05-01", 9), ts("2026-05-01", 10), 3,
    ["demo-pt-1", "demo-pt-2", "demo-pt-3"]),

  session("session-l1", "level-1", ts("2026-05-03", 9), ts("2026-05-04", 10), 4,
    ["demo-l1-1", "demo-l1-2", "demo-l1-3", "demo-l1-4"]),

  session("session-l2", "level-2", ts("2026-05-06", 9), ts("2026-05-07", 11), 5,
    ["demo-l2-1", "demo-l2-2", "demo-l2-3", "demo-l2-4", "demo-l2-5"]),

  session("session-l3a", "level-3", ts("2026-05-08", 9), ts("2026-05-09", 10), 4,
    ["demo-l3-1", "demo-l3-2", "demo-l3-3"],
    "abandoned"),

  session("session-l3b", "level-3", ts("2026-05-09", 10), ts("2026-05-10", 14), 4,
    ["demo-l3-4", "demo-l3-5", "demo-l3-6", "demo-l3-7", "demo-l3-8"]),

  session("session-l4", "level-4", ts("2026-05-11", 9), ts("2026-05-12", 11), 5,
    ["demo-l4-1", "demo-l4-2", "demo-l4-3", "demo-l4-4", "demo-l4-5"]),

  session("session-l5", "level-5", ts("2026-05-13", 9), ts("2026-05-13", 14), 3,
    ["demo-l5-1", "demo-l5-2", "demo-l5-3", "demo-l5-4"]),

  session("session-review", "review", ts("2026-05-14", 9), ts("2026-05-14", 11), 3,
    ["demo-rv-1", "demo-rv-2", "demo-rv-3"]),
];

// ── Demo Progress Object ──────────────────────────────────────────────────────

export const DEMO_PROGRESS: SpeechProgress = {
  childId: DEMO_CHILD_ID,
  targetSound: DEMO_TARGET_SOUND,
  attempts: DEMO_ATTEMPTS,
  sessions: DEMO_SESSIONS,
  updatedAt: new Date("2026-05-14T11:00:00.000Z").toISOString(),
};

// ── Expected dashboard numbers (for documentation) ────────────────────────────
// totalAttempts: 31
// averageScore: ~71%
// pretestScore: ~48%  (attempts avg of stage "pretest")
// reviewScore:  ~81%  (attempts avg of stage "review")
// improvement:  ~33 pts
// starsEarned:  ~53
// completedStages: 7 (all stages have ≥1 passing attempt)
// difficultItems: pt-item-กา, pt-item-กี, l3-item-สระกอ, l3-item-กระ
// totalSessions: 8 (including 1 abandoned)
// averageSessionScore: ~69%

export const DEMO_ATTEMPT_COUNT = DEMO_ATTEMPTS.length;

// ── Demo Observation Notes ────────────────────────────────────────────────────

export const DEMO_OBSERVATIONS: ObservationNote[] = [
  {
    id: "demo-obs-001",
    childId: DEMO_CHILD_ID,
    targetType: "session",
    targetId: "session-l3b",
    category: "pronunciation",
    title: "สังเกตการออกเสียง Level 3",
    content: "น้องมีปัญหากับการออกเสียง 'กระ' ในช่วงต้น แต่พัฒนาขึ้นอย่างเห็นได้ชัดเมื่อฝึกซ้ำๆ ควรฝึก 'กระ' และ 'กลม' ก่อนนอนทุกคืน จะช่วยให้ออกเสียงได้ชัดขึ้นภายใน 1 สัปดาห์",
    createdAt: ts("2026-05-09", 15),
    updatedAt: ts("2026-05-09", 15),
  },
  {
    id: "demo-obs-002",
    childId: DEMO_CHILD_ID,
    targetType: "general",
    category: "attention",
    title: "ความตั้งใจระหว่างการฝึก",
    content: "น้องตั้งใจฝึกดีมากในช่วง 10 นาทีแรก แต่จะเริ่มเสียสมาธิหลังจากนั้น แนะนำให้แบ่งเซสชันเป็นช่วงสั้นๆ 10-15 นาที แล้วพักดูวิดีโอสั้น 5 นาทีระหว่างรอบ จะช่วยให้น้องรักษาสมาธิได้ดีขึ้น",
    createdAt: ts("2026-05-10", 16),
    updatedAt: ts("2026-05-10", 16),
  },
  {
    id: "demo-obs-003",
    childId: DEMO_CHILD_ID,
    targetType: "general",
    category: "progress",
    title: "พัฒนาการสัปดาห์ที่ 2",
    content: "เปรียบเทียบกับสัปดาห์แรก น้องออกเสียง 'ก' ได้ชัดขึ้นมากในระดับ Level 4 คะแนนเฉลี่ยขึ้นจาก 65% เป็น 78% ภายในสัปดาห์เดียว ถือว่าพัฒนาการดีมากค่ะ น้องมีความมั่นใจในการพูดมากขึ้นเห็นได้ชัด",
    createdAt: ts("2026-05-12", 17),
    updatedAt: ts("2026-05-12", 17),
  },
  {
    id: "demo-obs-004",
    childId: DEMO_CHILD_ID,
    targetType: "general",
    category: "recommendation",
    title: "คำแนะนำสำหรับผู้ปกครอง",
    content: "ควรฝึกร่วมกับน้องวันละ 10-15 นาทีอย่างสม่ำเสมอ เน้นคำที่ยากได้แก่ 'กระ' และ 'กลม' โดยออกเสียงช้าๆ ทีละพยางค์ก่อน ควรสร้างบรรยากาศสนุกสนาน ไม่กดดัน ชมเชยทุกครั้งที่น้องทำได้ดี",
    createdAt: ts("2026-05-13", 14),
    updatedAt: ts("2026-05-13", 14),
  },
  {
    id: "demo-obs-005",
    childId: DEMO_CHILD_ID,
    targetType: "session",
    targetId: "session-review",
    category: "progress",
    title: "บันทึกผลการทดสอบ Review",
    content: "น้องทำ Review ได้ดีมาก คะแนนเฉลี่ย 82% เทียบกับ Pre-test ที่ได้เพียง 48% พัฒนาการก้าวหน้าชัดเจนมาก ขอชมเชยน้องสำหรับความพยายามตลอด 2 สัปดาห์ที่ผ่านมา แนะนำให้เริ่มฝึกเสียง 'ค' ต่อไปในเดือนหน้า",
    createdAt: ts("2026-05-14", 12),
    updatedAt: ts("2026-05-14", 12),
  },
];

// ── Helper functions ──────────────────────────────────────────────────────────

/** Replace current progress and observations with demo data. */
export function loadDemoProgress(): void {
  replaceProgress(DEMO_PROGRESS);
  replaceObservations(DEMO_OBSERVATIONS);
}

/** Clear all progress and observations. */
export function resetDemoProgress(): void {
  clearProgress();
  clearObservations();
}
