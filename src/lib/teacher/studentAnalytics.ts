/**
 * Teacher V2 Phase 3 — pure, deterministic analytics for one student's
 * Speech-Clarity practice history.
 *
 * Raw data retrieval (IProgressRepository.getChildProgress) stays separate
 * from these derived calculations, which reuse the app's existing tested
 * helpers wherever possible:
 *   - calculateProgressSummary  (speechProgressStorage.ts)
 *   - getSoundSummary           (progressUtils.ts)
 *
 * Phonics is NOT covered — phonics progress is localStorage-only and never
 * reaches a teacher. Callers gate on training_mode before showing analytics.
 *
 * Score scale: practice_attempts.score is an integer 0–100 (DB CHECK). No
 * conversion is applied anywhere below.
 */

import type { PracticeAttempt, SpeechProgress, DifficultItem } from "@/types/speechAdventure";
import { calculateProgressSummary } from "@/lib/speechProgressStorage";
import { getSoundSummary } from "@/lib/progressUtils";
import { mockTargetSounds } from "@/data/speechAdventureMockData";

// ── Tunables (documented in the Phase 3 report) ──────────────────────────────

/** Minimum scored attempts for a target sound before it is classified as
 *  "ทำได้ดี" / "ควรฝึกเพิ่มเติม"; below this it shows "ยังมีข้อมูลไม่เพียงพอ". */
export const MIN_SOUND_SAMPLE = 4;
/** Minimum scored attempts for a target sound before first-vs-latest is shown. */
export const MIN_DELTA_SAMPLE = 2;
/** Difficult-word rows with fewer attempts than this are flagged "ข้อมูลน้อย"
 *  (still shown — never hidden — per Phase 3 §8). */
export const LOW_SAMPLE_ITEM = 3;
/** At or below this many scored attempts the trend plots each real attempt;
 *  above it, weekly averages. */
export const TREND_ATTEMPT_LIMIT = 12;

const STAGE_ORDER = [
  "pretest",
  "level-1",
  "level-2",
  "level-3",
  "level-4",
  "level-5",
  "review",
] as const;

const STAGE_LABELS_TH: Record<string, string> = {
  pretest: "ประเมินเบื้องต้น",
  "level-1": "ระดับ 1",
  "level-2": "ระดับ 2",
  "level-3": "ระดับ 3",
  "level-4": "ระดับ 4",
  "level-5": "ระดับ 5",
  review: "ทบทวน",
};

// ── Types ───────────────────────────────────────────────────────────────────

export type SoundClassification = "good" | "practice_more" | "insufficient";

export interface SoundBreakdown {
  soundId: string;
  /** e.g. "ก". */
  label: string;
  /** e.g. "กอ ไก่" when known, else null. */
  description: string | null;
  averageScore: number;
  bestScore: number;
  attemptCount: number;
  lastPracticedAt: string | null;
  classification: SoundClassification;
}

export interface SoundDelta {
  soundId: string;
  label: string;
  first: number | null;
  latest: number | null;
  /** latest - first; null when fewer than MIN_DELTA_SAMPLE scored attempts. */
  change: number | null;
  attemptCount: number;
}

export interface TrendPoint {
  /** ISO timestamp of the point (first attempt of the bucket in weekly mode). */
  iso: string;
  /** Mean score for the point, rounded 0–100. */
  score: number;
  /** How many attempts this point aggregates (1 in per-attempt mode). */
  count: number;
}

export interface DifficultWord extends DifficultItem {
  /** attempts < LOW_SAMPLE_ITEM. */
  lowSample: boolean;
}

export interface StudentAnalytics {
  /** True when there is at least one scored attempt. */
  hasData: boolean;
  /** Completed + abandoned practice_sessions (rounds). */
  practiceRounds: number;
  /** practice_attempts (words practiced). */
  wordsPracticed: number;
  /** Mean attempt score 0–100; null when no attempts. */
  averageScore: number | null;
  /** ISO timestamp of the most recent attempt; null when none. */
  lastPracticedAt: string | null;
  /** null when the child has no scored attempts. */
  currentStage: { index: number; total: number; label: string } | null;
  /** Improvement = reviewScore − pretestScore, only when both exist (>0). */
  improvement: number | null;
  soundBreakdown: SoundBreakdown[];
  difficultWords: DifficultWord[];
  trend: { mode: "attempts" | "weekly"; points: TrendPoint[] };
  firstVsLatest: SoundDelta[];
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function soundLabel(soundId: string): { label: string; description: string | null } {
  const match = mockTargetSounds.find((s) => s.id === soundId);
  return { label: match?.label ?? soundId, description: match?.description ?? null };
}

function classify(avg: number, count: number): SoundClassification {
  if (count < MIN_SOUND_SAMPLE) return "insufficient";
  return avg >= 70 ? "good" : "practice_more";
}

/** ISO week key "YYYY-Www" in UTC — deterministic, timezone-stable. */
function isoWeekKey(iso: string): string {
  const d = new Date(iso);
  const day = (d.getUTCDay() + 6) % 7; // Mon=0
  const monday = new Date(d);
  monday.setUTCDate(d.getUTCDate() - day);
  monday.setUTCHours(0, 0, 0, 0);
  const jan1 = new Date(Date.UTC(monday.getUTCFullYear(), 0, 1));
  const week = Math.floor((monday.getTime() - jan1.getTime()) / (7 * 86400000)) + 1;
  return `${monday.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

// ── Main ────────────────────────────────────────────────────────────────────

export function calculateStudentAnalytics(progress: SpeechProgress): StudentAnalytics {
  const attempts = progress.attempts ?? [];
  const sessions = progress.sessions ?? [];

  // Chronological (oldest → newest) copy for trend / first-vs-latest.
  const chrono = [...attempts].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );

  const summary = calculateProgressSummary(progress); // no sound filter — whole history
  const hasData = attempts.length > 0;

  // ── Rounds / words / average / last ──
  const practiceRounds = sessions.filter((s) => s.status !== "active").length;
  const wordsPracticed = attempts.length;
  const averageScore = hasData ? summary.averageScore : null;
  const lastPracticedAt = chrono.length > 0 ? chrono[chrono.length - 1].createdAt : null;

  // ── Current stage ──
  const currentStage = hasData
    ? (() => {
        const idx = STAGE_ORDER.indexOf(summary.currentStageId as (typeof STAGE_ORDER)[number]);
        const position = idx >= 0 ? idx + 1 : 1;
        return {
          index: position,
          total: STAGE_ORDER.length,
          label: STAGE_LABELS_TH[summary.currentStageId] ?? summary.currentStageId,
        };
      })()
    : null;

  const improvement =
    summary.pretestScore > 0 && summary.reviewScore > 0
      ? summary.reviewScore - summary.pretestScore
      : null;

  // ── Sound breakdown ──
  const soundIds = [...new Set(attempts.map((a) => a.targetSound).filter(Boolean))];
  const soundBreakdown: SoundBreakdown[] = soundIds
    .map((soundId) => {
      const s = getSoundSummary(attempts, soundId);
      const { label, description } = soundLabel(soundId);
      return {
        soundId,
        label,
        description,
        averageScore: s.averageScore,
        bestScore: s.bestScore,
        attemptCount: s.totalAttempts,
        lastPracticedAt: s.lastPracticedAt,
        classification: classify(s.averageScore, s.totalAttempts),
      };
    })
    .sort((a, b) => {
      // good (by score desc) → practice_more (by score asc) → insufficient
      const rank = (c: SoundClassification) =>
        c === "good" ? 0 : c === "practice_more" ? 1 : 2;
      if (rank(a.classification) !== rank(b.classification)) {
        return rank(a.classification) - rank(b.classification);
      }
      return a.classification === "practice_more"
        ? a.averageScore - b.averageScore
        : b.averageScore - a.averageScore;
    });

  // ── First vs latest, per sound ──
  const firstVsLatest: SoundDelta[] = soundIds
    .map((soundId) => {
      const soundAttempts = chrono.filter((a) => a.targetSound === soundId);
      const { label } = soundLabel(soundId);
      if (soundAttempts.length < MIN_DELTA_SAMPLE) {
        return {
          soundId,
          label,
          first: soundAttempts[0]?.score ?? null,
          latest: soundAttempts[soundAttempts.length - 1]?.score ?? null,
          change: null,
          attemptCount: soundAttempts.length,
        };
      }
      const first = soundAttempts[0].score;
      const latest = soundAttempts[soundAttempts.length - 1].score;
      return { soundId, label, first, latest, change: latest - first, attemptCount: soundAttempts.length };
    })
    .sort((a, b) => (b.change ?? -999) - (a.change ?? -999));

  // ── Difficult words ── (reuse calculateProgressSummary.difficultItems)
  const difficultWords: DifficultWord[] = summary.difficultItems.map((d) => ({
    ...d,
    lowSample: d.attempts < LOW_SAMPLE_ITEM,
  }));

  // ── Trend ──
  const trend = buildTrend(chrono);

  return {
    hasData,
    practiceRounds,
    wordsPracticed,
    averageScore,
    lastPracticedAt,
    currentStage,
    improvement,
    soundBreakdown,
    difficultWords,
    trend,
    firstVsLatest,
  };
}

function buildTrend(chrono: PracticeAttempt[]): StudentAnalytics["trend"] {
  if (chrono.length === 0) return { mode: "attempts", points: [] };

  if (chrono.length <= TREND_ATTEMPT_LIMIT) {
    return {
      mode: "attempts",
      points: chrono.map((a) => ({ iso: a.createdAt, score: a.score, count: 1 })),
    };
  }

  // Weekly averages, chronological.
  const buckets = new Map<string, { total: number; count: number; firstIso: string }>();
  for (const a of chrono) {
    const key = isoWeekKey(a.createdAt);
    const b = buckets.get(key);
    if (b) {
      b.total += a.score;
      b.count += 1;
    } else {
      buckets.set(key, { total: a.score, count: 1, firstIso: a.createdAt });
    }
  }
  const points: TrendPoint[] = [...buckets.values()]
    .sort((x, y) => new Date(x.firstIso).getTime() - new Date(y.firstIso).getTime())
    .map((b) => ({ iso: b.firstIso, score: Math.round(b.total / b.count), count: b.count }));

  return { mode: "weekly", points };
}
