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

// ── Stable snapshots ──────────────────────────────────────────────────────────
//
// useSyncExternalStore uses Object.is() to compare snapshots on every render.
// If getSnapshot / getServerSnapshot return a new object reference each call,
// React sees a perpetual "change" and loops infinitely.
//
// Rules:
//  • SERVER_PROGRESS is a module-level constant — always the same reference.
//  • currentProgress is mutated ONLY in write operations (addAttempt /
//    clearProgress) by assigning a brand-new object. Between writes, getProgress()
//    returns the same reference, so React stays stable.

const SERVER_PROGRESS: SpeechProgress = {
  childId: DEFAULT_CHILD_ID,
  targetSound: DEFAULT_TARGET_SOUND,
  attempts: [],
  updatedAt: "",
};

// In-memory cache — the single source of truth for the client snapshot.
// Starts as SERVER_PROGRESS until the client initializes from localStorage.
let currentProgress: SpeechProgress = SERVER_PROGRESS;
let isClientInitialized = false;

// ── Helpers ───────────────────────────────────────────────────────────────────

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function readFromLocalStorage(): SpeechProgress {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return SERVER_PROGRESS;

    const parsed = JSON.parse(raw) as SpeechProgress;
    if (!parsed || !Array.isArray(parsed.attempts)) return SERVER_PROGRESS;

    return parsed;
  } catch {
    return SERVER_PROGRESS;
  }
}

/** Populate currentProgress from localStorage exactly once per page load. */
function initializeIfNeeded(): void {
  if (!isBrowser() || isClientInitialized) return;
  isClientInitialized = true;
  currentProgress = readFromLocalStorage();
}

function writeToLocalStorage(progress: SpeechProgress): void {
  if (!isBrowser()) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // Storage full or unavailable — silently fail for prototype
  }
}

// ── Pub-sub for useSyncExternalStore ─────────────────────────────────────────

const listeners = new Set<() => void>();

function notifyListeners(): void {
  listeners.forEach((fn) => fn());
}

/** Register a callback that fires whenever the progress store changes.
 *  Used by useSyncExternalStore in useSpeechProgress. */
export function subscribeToProgress(callback: () => void): () => void {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

// ── Snapshots (called by useSyncExternalStore during render) ──────────────────

/** Client snapshot: returns the stable in-memory reference.
 *  Never parses localStorage inside render — only changes after write ops. */
export function getProgress(): SpeechProgress {
  initializeIfNeeded();
  return currentProgress;
}

/** Server snapshot: always returns the exact same constant reference.
 *  React requires this to be cached (same object) to avoid infinite loops. */
export function getServerProgress(): SpeechProgress {
  return SERVER_PROGRESS;
}

// ── Write operations (update the cache, persist, then notify) ─────────────────
// These are the ONLY places that change currentProgress or call notifyListeners.
// Never call these inside a render path.

/** Persist an existing progress object without touching the in-memory cache.
 *  Useful for legacy call sites; prefer addAttempt() for new code. */
export function saveProgress(progress: SpeechProgress): void {
  writeToLocalStorage(progress);
}

/** Add a new attempt, update the in-memory cache, and notify subscribers. */
export function addAttempt(attempt: PracticeAttempt): SpeechProgress {
  initializeIfNeeded();

  // Spread into a fresh object so Object.is() detects the change.
  const next: SpeechProgress = {
    childId: currentProgress.childId,
    targetSound: currentProgress.targetSound,
    attempts: [...currentProgress.attempts, attempt],
    updatedAt: new Date().toISOString(),
  };

  currentProgress = next;
  writeToLocalStorage(currentProgress);
  notifyListeners();
  return currentProgress;
}

/** Clear all progress from localStorage and reset the in-memory cache. */
export function clearProgress(): void {
  if (!isBrowser()) return;

  try {
    localStorage.removeItem(STORAGE_KEY);
    // Reassign to SERVER_PROGRESS — this IS a new reference vs real data,
    // so Object.is detects the change and React re-renders once.
    currentProgress = SERVER_PROGRESS;
    // Keep isClientInitialized = true so we don't re-read a stale file.
    notifyListeners();
  } catch {
    // Silently fail
  }
}

// ── Stage logic ───────────────────────────────────────────────────────────────

function isStageCompleted(
  attempts: PracticeAttempt[],
  stageId: string
): boolean {
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

// ── Progress summary ──────────────────────────────────────────────────────────

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

  const completedStageIds = new Set<string>();
  for (const stageId of STAGE_ORDER) {
    if (isStageCompleted(attempts, stageId)) {
      completedStageIds.add(stageId);
    }
  }
  const completedStages = completedStageIds.size;

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

  const difficultSounds = difficultItems.map((d) => d.promptText).slice(0, 3);

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
