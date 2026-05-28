import type { PracticeAttempt } from "@/types/speechAdventure";

export type SoundPracticeStatus = "not_started" | "needs_practice" | "improving" | "good";

export interface SoundSummary {
  soundId: string;
  totalAttempts: number;
  averageScore: number;
  bestScore: number;
  lastPracticedAt: string | null;
  status: SoundPracticeStatus;
}

export function getSoundSummary(
  attempts: PracticeAttempt[],
  soundId: string,
): SoundSummary {
  const soundAttempts = attempts.filter((a) => a.targetSound === soundId);

  if (soundAttempts.length === 0) {
    return {
      soundId,
      totalAttempts: 0,
      averageScore: 0,
      bestScore: 0,
      lastPracticedAt: null,
      status: "not_started",
    };
  }

  const bestScore = Math.max(...soundAttempts.map((a) => a.score));
  const averageScore = Math.round(
    soundAttempts.reduce((s, a) => s + a.score, 0) / soundAttempts.length,
  );
  const sorted = [...soundAttempts].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  const lastPracticedAt = sorted[0]?.createdAt ?? null;

  let status: SoundPracticeStatus;
  if (averageScore >= 70) status = "good";
  else if (averageScore >= 50) status = "improving";
  else status = "needs_practice";

  return { soundId, totalAttempts: soundAttempts.length, averageScore, bestScore, lastPracticedAt, status };
}
