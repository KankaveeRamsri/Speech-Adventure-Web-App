import type {
  SpeechProgress,
  PracticeAttempt,
  ProgressSummary,
} from "@/types/speechAdventure";

const STORAGE_KEY = "speech-adventure-progress-v1";

const DEFAULT_CHILD_ID = "child-001";
const DEFAULT_TARGET_SOUND = "ช";

const STAGE_ORDER = [
  "pretest",
  "level-1",
  "level-2",
  "level-3",
  "level-4",
  "level-5",
  "review",
];

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function createEmptyProgress(): SpeechProgress {
  return {
    childId: DEFAULT_CHILD_ID,
    targetSound: DEFAULT_TARGET_SOUND,
    attempts: [],
    updatedAt: new Date().toISOString(),
  };
}

export function getProgress(): SpeechProgress {
  if (!isBrowser()) return createEmptyProgress();

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createEmptyProgress();

    const parsed = JSON.parse(raw) as SpeechProgress;
    if (!parsed || !Array.isArray(parsed.attempts)) {
      return createEmptyProgress();
    }

    return parsed;
  } catch {
    return createEmptyProgress();
  }
}

export function saveProgress(progress: SpeechProgress): void {
  if (!isBrowser()) return;

  try {
    progress.updatedAt = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // Storage full or unavailable — silently fail for prototype
  }
}

export function addAttempt(attempt: PracticeAttempt): SpeechProgress {
  const progress = getProgress();
  progress.attempts.push(attempt);
  saveProgress(progress);
  return progress;
}

export function clearProgress(): void {
  if (!isBrowser()) return;

  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Silently fail
  }
}

function isStageCompleted(attempts: PracticeAttempt[], stageId: string): boolean {
  const stageAttempts = attempts.filter((a) => a.stageId === stageId);
  if (stageAttempts.length === 0) return false;

  // Pretest and review: any attempt counts as completed
  if (stageId === "pretest" || stageId === "review") {
    return true;
  }

  // Levels 1–5: at least one attempt with score >= 70
  return stageAttempts.some((a) => a.score >= 70);
}

function findCurrentStageId(attempts: PracticeAttempt[]): string {
  for (const stageId of STAGE_ORDER) {
    if (!isStageCompleted(attempts, stageId)) {
      return stageId;
    }
  }
  // All stages completed
  return STAGE_ORDER[STAGE_ORDER.length - 1];
}

export function getStageStatus(
  attempts: PracticeAttempt[],
  stageId: string
): "locked" | "current" | "completed" | "review" {
  const stageIndex = STAGE_ORDER.indexOf(stageId);
  if (stageIndex === -1) return "locked";

  if (isStageCompleted(attempts, stageId)) {
    return "completed";
  }

  const currentStageId = findCurrentStageId(attempts);

  if (stageId === currentStageId) {
    return stageId === "review" ? "review" : "current";
  }

  return "locked";
}

export function getStageAttempts(
  attempts: PracticeAttempt[],
  stageId: string
): PracticeAttempt[] {
  return attempts.filter((a) => a.stageId === stageId);
}

export function calculateProgressSummary(
  progress: SpeechProgress
): ProgressSummary {
  const { attempts } = progress;

  const totalAttempts = attempts.length;
  const averageScore =
    totalAttempts > 0
      ? Math.round(
          attempts.reduce((sum, a) => sum + a.score, 0) / totalAttempts
        )
      : 0;
  const starsEarned = attempts.reduce((sum, a) => sum + a.starsEarned, 0);
  const accuracy = averageScore;

  // Completed stages
  const completedStageIds = new Set<string>();
  for (const stageId of STAGE_ORDER) {
    if (isStageCompleted(attempts, stageId)) {
      completedStageIds.add(stageId);
    }
  }
  const completedStages = completedStageIds.size;

  // Current stage
  const currentStageId = findCurrentStageId(attempts) as string;

  const stageNames: Record<string, string> = {
    pretest: "Pre-test",
    "level-1": "Level 1: Oral Motor",
    "level-2": "Level 2: Sound Familiarity",
    "level-3": "Level 3: Sound Production",
    "level-4": "Level 4: Word Practice",
    "level-5": "Level 5: Sentence Practice",
    review: "Review / Post-test",
  };

  // Pretest / Review scores
  const pretestAttempts = attempts.filter((a) => a.stageId === "pretest");
  const reviewAttempts = attempts.filter((a) => a.stageId === "review");

  const pretestScore =
    pretestAttempts.length > 0
      ? Math.round(
          pretestAttempts.reduce((s, a) => s + a.score, 0) /
            pretestAttempts.length
        )
      : 0;

  const reviewScore =
    reviewAttempts.length > 0
      ? Math.round(
          reviewAttempts.reduce((s, a) => s + a.score, 0) /
            reviewAttempts.length
        )
      : 0;

  const improvement =
    pretestScore > 0 && reviewScore > 0 ? reviewScore - pretestScore : 0;

  // Difficult items (score < 60, at least 1 attempt)
  const itemMap = new Map<
    string,
    { promptText: string; totalScore: number; count: number }
  >();
  for (const a of attempts) {
    const existing = itemMap.get(a.practiceItemId);
    if (existing) {
      existing.totalScore += a.score;
      existing.count += 1;
    } else {
      itemMap.set(a.practiceItemId, {
        promptText: a.promptText,
        totalScore: a.score,
        count: 1,
      });
    }
  }

  const difficultItems = Array.from(itemMap.entries())
    .map(([id, data]) => ({
      practiceItemId: id,
      promptText: data.promptText,
      averageScore: Math.round(data.totalScore / data.count),
      attempts: data.count,
    }))
    .filter((item) => item.averageScore < 60)
    .sort((a, b) => a.averageScore - b.averageScore)
    .slice(0, 5);

  // Difficult sounds from difficult items
  const difficultSounds = difficultItems.map((d) => d.promptText).slice(0, 3);

  // Recent attempts (last 10)
  const recentAttempts = [...attempts]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    .slice(0, 10);

  return {
    totalAttempts,
    averageScore,
    starsEarned,
    completedStages,
    currentStageId,
    pretestScore,
    reviewScore,
    improvement,
    accuracy,
    currentLevel: stageNames[currentStageId] || "Pre-test",
    difficultSounds,
    difficultItems,
    recentAttempts,
  };
}
