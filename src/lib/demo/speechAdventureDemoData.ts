import type { PracticeAttempt, SpeechProgress } from "@/types/speechAdventure";
import {
  replaceProgress,
  clearProgress,
} from "@/lib/speechProgressStorage";

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
  createdAt: string
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
    createdAt,
  };
}

// ── Demo Attempts ─────────────────────────────────────────────────────────────
// Covers: pretest → level-1 → level-2 → level-3 → level-4 → level-5 → review
// Designed so:
//   • pretestScore ≈ 48%   reviewScore ≈ 81%   improvement ≈ 33 pts
//   • 4 difficult items (avg < 60%) — appear in dashboard's "รายการที่ต้องฝึก"
//   • Total 31 attempts across 7 stages — looks like 2 weeks of real practice

export const DEMO_ATTEMPTS: PracticeAttempt[] = [

  // ── Pre-test (3 attempts, avg 48) ─────────────────────────────────────────
  // Note: low scores intentional — this is before training begins.
  // These also become "difficult items" on the dashboard (score < 60).
  attempt("demo-pt-1", "pretest", "pt-item-กา", "ก", "กา",
    45, 0.48, "retry",
    "สู้ต่อนะ! นี่แค่ Pre-test วัดระดับเสียงเริ่มต้นเท่านั้น",
    "ลองฟังเสียงตัวอย่างแล้วฝึกตามอีกสักหน่อย",
    1800, ts("2026-05-01", 9)),

  attempt("demo-pt-2", "pretest", "pt-item-กา", "ก", "กา",
    48, 0.52, "retry",
    "ดีขึ้นนิดหน่อยแล้ว! ฝึกต่อนะ",
    "ออกเสียงให้ช้าลงและชัดขึ้นอีกนิด",
    2100, ts("2026-05-01", 9)),

  attempt("demo-pt-3", "pretest", "pt-item-กี", "ก", "กี่",
    50, 0.54, "retry",
    "ดีขึ้นนิดหน่อยแล้ว! ฝึกต่อนะ",
    "เริ่มจากการฟังเสียงตัวอย่างก่อน แล้วค่อยๆ ออกเสียงตาม",
    1950, ts("2026-05-01", 10)),

  // ── Level 1: Oral Motor (4 attempts, avg 83) ──────────────────────────────
  attempt("demo-l1-1", "level-1", "l1-item-เป่า", "ก", "เป่าลม",
    78, 0.82, "passed",
    "ดีมาก! ทำภารกิจ Oral Motor สำเร็จ!",
    undefined,
    3000, ts("2026-05-03", 9)),

  attempt("demo-l1-2", "level-1", "l1-item-ยิ้ม", "ก", "ยิ้มกว้าง",
    82, 0.85, "passed",
    "ยอดเยี่ยม! กล้ามเนื้อในช่องปากแข็งแรงขึ้นแล้ว",
    undefined,
    2800, ts("2026-05-03", 10)),

  attempt("demo-l1-3", "level-1", "l1-item-ลิ้น", "ก", "ขยับลิ้น",
    85, 0.88, "passed",
    "ยอดเยี่ยม! ทำได้ดีมากค่ะ",
    "ลองฝึกระดับถัดไปได้เลยนะ",
    2500, ts("2026-05-04", 9)),

  attempt("demo-l1-4", "level-1", "l1-item-ปาก", "ก", "อ้าปากกว้าง",
    88, 0.90, "passed",
    "ยอดเยี่ยม! เก่งมากเลยนะ",
    "ลองฝึกระดับถัดไปได้เลยนะ",
    2200, ts("2026-05-04", 10)),

  // ── Level 2: Sound Familiarity (5 attempts, avg 71) ───────────────────────
  attempt("demo-l2-1", "level-2", "l2-item-ก1", "ก", "เสียง ก",
    62, 0.65, "almost",
    "เกือบจะผ่านแล้ว! ลองอีกสักครั้ง!",
    "ฟังเสียงให้ดีแล้วลองเลือกใหม่",
    1500, ts("2026-05-06", 9)),

  attempt("demo-l2-2", "level-2", "l2-item-ก2", "ก", "กา vs ขา",
    68, 0.70, "almost",
    "เกือบจะผ่านแล้ว! ลองอีกสักครั้ง!",
    "ออกเสียงให้ช้าลงและชัดขึ้นอีกนิด",
    1800, ts("2026-05-06", 10)),

  attempt("demo-l2-3", "level-2", "l2-item-ก3", "ก", "กา vs คา",
    72, 0.75, "passed",
    "ดีมาก! ออกเสียงได้ดีขึ้นแล้ว!",
    "ลองฟังเสียงตัวอย่างแล้วฝึกตามอีกสักหน่อย",
    1600, ts("2026-05-07", 9)),

  attempt("demo-l2-4", "level-2", "l2-item-ก4", "ก", "กี vs ขี",
    75, 0.78, "passed",
    "ดีมาก! ออกเสียงได้ดีขึ้นแล้ว!",
    undefined,
    1700, ts("2026-05-07", 10)),

  attempt("demo-l2-5", "level-2", "l2-item-ก5", "ก", "กู vs คู",
    80, 0.83, "passed",
    "ยอดเยี่ยม! เสียงออกมาชัดเจนมาก!",
    "ลองฝึกระดับถัดไปได้เลยนะ",
    1400, ts("2026-05-07", 11)),

  // ── Level 3: Sound Production (8 attempts on 4 items, avg 64) ────────────
  // "สระ กอ" has 2 attempts avg 52 → difficult item
  // "กระ" has 2 attempts avg 55 → difficult item
  attempt("demo-l3-1", "level-3", "l3-item-สระกอ", "ก", "สระ กอ",
    50, 0.53, "retry",
    "สู้ต่อนะ! ลองฟังเสียงตัวอย่างแล้วฝึกอีกครั้ง!",
    "เริ่มจากการฟังเสียงตัวอย่างก่อน แล้วค่อยๆ ออกเสียงตาม",
    2800, ts("2026-05-08", 9)),

  attempt("demo-l3-2", "level-3", "l3-item-สระกอ", "ก", "สระ กอ",
    55, 0.58, "retry",
    "สู้ต่อนะ! เกือบแล้ว!",
    "ออกเสียงให้ช้าลงและชัดขึ้นอีกนิด",
    3100, ts("2026-05-08", 10)),

  attempt("demo-l3-3", "level-3", "l3-item-กระ", "ก", "กระ",
    55, 0.58, "retry",
    "สู้ต่อนะ! ลองฟังเสียงตัวอย่างแล้วฝึกอีกครั้ง!",
    "เริ่มจากการฟังเสียงตัวอย่างก่อน",
    2600, ts("2026-05-09", 9)),

  attempt("demo-l3-4", "level-3", "l3-item-กระ", "ก", "กระ",
    58, 0.61, "almost",
    "เกือบจะผ่านแล้ว! ดีขึ้นมากเลย",
    "ออกเสียงให้ช้าลงอีกนิด",
    2900, ts("2026-05-09", 10)),

  attempt("demo-l3-5", "level-3", "l3-item-กลม", "ก", "กลม",
    68, 0.71, "almost",
    "เกือบจะผ่านแล้ว! ลองอีกสักครั้ง!",
    "ลองฟังเสียงตัวอย่างแล้วฝึกตามอีกสักหน่อย",
    2400, ts("2026-05-10", 9)),

  attempt("demo-l3-6", "level-3", "l3-item-กลม", "ก", "กลม",
    72, 0.75, "passed",
    "ดีมาก! ออกเสียงได้ดีขึ้นแล้ว!",
    undefined,
    2300, ts("2026-05-10", 10)),

  attempt("demo-l3-7", "level-3", "l3-item-กาน้ำ", "ก", "กาน้ำ",
    78, 0.81, "passed",
    "ดีมาก! ออกเสียงได้ดีขึ้นแล้ว!",
    "ลองฝึกระดับถัดไปได้เลยนะ",
    2100, ts("2026-05-10", 11)),

  attempt("demo-l3-8", "level-3", "l3-item-กาน้ำ", "ก", "กาน้ำ",
    82, 0.85, "passed",
    "ยอดเยี่ยม! เสียงออกมาชัดเจนมาก!",
    "ลองฝึกระดับถัดไปได้เลยนะ",
    1900, ts("2026-05-10", 14)),

  // ── Level 4: Word Practice (5 attempts, avg 72) ───────────────────────────
  attempt("demo-l4-1", "level-4", "l4-item-ไก่", "ก", "ไก่",
    60, 0.63, "almost",
    "เกือบจะผ่านแล้ว! ลองอีกสักครั้ง!",
    "ออกเสียงให้ช้าลงและชัดขึ้นอีกนิด",
    2500, ts("2026-05-11", 9)),

  attempt("demo-l4-2", "level-4", "l4-item-ไก่", "ก", "ไก่",
    68, 0.71, "almost",
    "เกือบจะผ่านแล้ว! ดีขึ้นมากเลย",
    "ลองฟังเสียงตัวอย่างแล้วฝึกตามอีกสักหน่อย",
    2300, ts("2026-05-11", 10)),

  attempt("demo-l4-3", "level-4", "l4-item-กวาง", "ก", "กวาง",
    72, 0.75, "passed",
    "ดีมาก! ออกเสียงได้ดีขึ้นแล้ว!",
    undefined,
    2100, ts("2026-05-12", 9)),

  attempt("demo-l4-4", "level-4", "l4-item-กลอง", "ก", "กลอง",
    78, 0.81, "passed",
    "ดีมาก! ออกเสียงได้ดีขึ้นแล้ว!",
    "ลองฝึกระดับถัดไปได้เลยนะ",
    1900, ts("2026-05-12", 10)),

  attempt("demo-l4-5", "level-4", "l4-item-กระต่าย", "ก", "กระต่าย",
    82, 0.85, "passed",
    "ยอดเยี่ยม! เสียงออกมาชัดเจนมาก!",
    "ลองฝึกระดับถัดไปได้เลยนะ",
    1700, ts("2026-05-12", 11)),

  // ── Level 5: Sentence Practice (4 attempts, avg 75) ──────────────────────
  attempt("demo-l5-1", "level-5", "l5-item-s1", "ก", "กาจิกเด็ก",
    68, 0.71, "almost",
    "เกือบจะผ่านแล้ว! ลองอีกสักครั้ง!",
    "ออกเสียงให้ช้าลงอีกนิด",
    3500, ts("2026-05-13", 9)),

  attempt("demo-l5-2", "level-5", "l5-item-s1", "ก", "กาจิกเด็ก",
    72, 0.75, "passed",
    "ดีมาก! ออกเสียงได้ดีขึ้นแล้ว!",
    undefined,
    3200, ts("2026-05-13", 10)),

  attempt("demo-l5-3", "level-5", "l5-item-s2", "ก", "กาน้ำสีแดง",
    78, 0.81, "passed",
    "ดีมาก! ออกเสียงได้ดีขึ้นแล้ว!",
    "ลองฝึกระดับถัดไปได้เลยนะ",
    3800, ts("2026-05-13", 11)),

  attempt("demo-l5-4", "level-5", "l5-item-s3", "ก", "กระต่ายกินหญ้า",
    82, 0.85, "passed",
    "ยอดเยี่ยม! ออกเสียงประโยคได้ชัดเจนมาก!",
    "ลองฝึกระดับถัดไปได้เลยนะ",
    4100, ts("2026-05-13", 14)),

  // ── Review / Post-test (3 attempts, avg 81) ───────────────────────────────
  // Showing clear improvement over pretest (48 → 81 = +33 pts)
  attempt("demo-rv-1", "review", "rv-item-กา", "ก", "กา",
    78, 0.81, "passed",
    "ดีมาก! พัฒนาขึ้นมากเลยนะ",
    undefined,
    2000, ts("2026-05-14", 9)),

  attempt("demo-rv-2", "review", "rv-item-กี", "ก", "กี่",
    82, 0.85, "passed",
    "ดีมาก! ออกเสียงได้ชัดขึ้นมากเลย",
    "ลองฝึกต่อเนื่องทุกวันนะคะ",
    1800, ts("2026-05-14", 10)),

  attempt("demo-rv-3", "review", "rv-item-กลม", "ก", "กลม",
    85, 0.88, "passed",
    "ยอดเยี่ยม! เสียงออกมาชัดเจนมาก!",
    "ลองฝึกระดับถัดไปได้เลยนะ",
    2200, ts("2026-05-14", 11)),
];

// ── Demo Progress Object ──────────────────────────────────────────────────────

export const DEMO_PROGRESS: SpeechProgress = {
  childId: DEMO_CHILD_ID,
  targetSound: DEMO_TARGET_SOUND,
  attempts: DEMO_ATTEMPTS,
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

export const DEMO_ATTEMPT_COUNT = DEMO_ATTEMPTS.length;

// ── Helper functions ──────────────────────────────────────────────────────────

/** Replace current progress with demo data and notify all React subscribers. */
export function loadDemoProgress(): void {
  replaceProgress(DEMO_PROGRESS);
}

/** Clear all progress (alias for clearProgress for symmetry). */
export function resetDemoProgress(): void {
  clearProgress();
}
