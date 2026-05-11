import type {
  SpeechProgress,
  PracticeAttempt,
  ProgressSummary,
} from "@/types/speechAdventure";

const STORAGE_KEY = "speech-adventure-progress-v1";

const DEFAULT_CHILD_ID = "child-001";
const DEFAULT_TARGET_SOUND = "ช";

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

const STAGE_ORDER = [
  "pretest",
  "level-1",
  "level-2",
  "level-3",
  "level-4",
  "level-5",
  "review",
];

export function getStageStatus(
  attempts: PracticeAttempt[],
  stageId: string
): "locked" | "current" | "completed" | "review" {
  if (attempts.length === 0) {
    return stageId === "pretest" ? "current" : "locked";
  }

  const stageIndex = STAGE_ORDER.indexOf(stageId);
  if (stageIndex === -1) return "locked";

  const stageAttempts = attempts.filter((a) => a.stageId === stageId);
  const hasAttempt = stageAttempts.length > 0;
  const hasPassing = stageAttempts.some((a) => a.score >= 70);

  // Review stage: completed after at least one attempt
  if (stageId === "review") {
    if (hasAttempt) return "completed";
    // Check if level-5 is completed
    const level5Attempts = attempts.filter((a) => a.stageId === "level-5");
    if (level5Attempts.some((a) => a.score >= 70)) return "current";
    return "locked";
  }

  // Pretest: completed once attempted
  if (stageId === "pretest") {
    return hasAttempt ? "completed" : "current";
  }

  // Regular levels
  if (hasPassing) return "completed";

  // Find the first stage that should be "current"
  for (let i = 0; i < STAGE_ORDER.length; i++) {
    const sid = STAGE_ORDER[i];
    const sAttempts = attempts.filter((a) => a.stageId === sid);

    if (sid === "pretest") {
      if (sAttempts.length === 0) {
        return stageId === "pretest" ? "current" : "locked";
      }
      continue;
    }

    if (sid === "review") {
      // Check if level-5 is done
      const l5 = attempts.filter((a) => a.stageId === "level-5");
      if (l5.some((a) => a.score >= 70)) {
        return stageId === "review" ? "current" : stageIndex < STAGE_ORDER.indexOf("review") ? "completed" : "locked";
      }
      // If we reach here, level-5 not done yet
      if (stageIndex >= STAGE_ORDER.indexOf("review")) return "locked";
    }

    if (!sAttempts.some((a) => a.score >= 70)) {
      return stageId === sid ? "current" : stageIndex < i ? "completed" : "locked";
    }
  }

  return "completed";
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
    const stageAttempts = attempts.filter((a) => a.stageId === stageId);
    if (stageId === "pretest" && stageAttempts.length > 0) {
      completedStageIds.add(stageId);
    } else if (stageAttempts.some((a) => a.score >= 70)) {
      completedStageIds.add(stageId);
    }
  }
  const completedStages = completedStageIds.size;

  // Current stage
  let currentStageId = "pretest";
  for (const stageId of STAGE_ORDER) {
    const status = getStageStatus(attempts, stageId);
    if (status === "current") {
      currentStageId = stageId;
      break;
    }
  }

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
