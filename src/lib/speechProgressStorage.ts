import type {
  SpeechProgress,
  PracticeAttempt,
  PracticeSession,
  ProgressSummary,
} from "@/types/speechAdventure";
import {
  STORAGE_KEYS,
  getScopedStorageKey,
  getLegacyClaimedFlagKey,
} from "@/lib/storage/storageKeys";
import { localRead, localWrite, localRemove } from "@/lib/storage/local/localStorageClient";
import { SpeechProgressSchema, parseOrDefault } from "@/lib/validation";

const STORAGE_KEY = STORAGE_KEYS.PROGRESS;
const SOUND_STORAGE_KEY = STORAGE_KEYS.SELECTED_SOUND;

// ── User scope ────────────────────────────────────────────────────────────────
let _scopeUserId: string | null = null;

function getProgressKey(): string {
  return getScopedStorageKey(STORAGE_KEY, _scopeUserId);
}
function getSoundKey(): string {
  return getScopedStorageKey(SOUND_STORAGE_KEY, _scopeUserId);
}

function tryMigrateLegacy(): void {
  if (_scopeUserId === null) return;
  // Migrate progress key
  if (!localRead(getProgressKey())) {
    const claimFlag = getLegacyClaimedFlagKey(STORAGE_KEY);
    if (!localRead(claimFlag)) {
      const legacy = localRead(STORAGE_KEY);
      if (legacy) { localWrite(getProgressKey(), legacy); localWrite(claimFlag, _scopeUserId); }
    }
  }
  // Migrate sound key
  if (!localRead(getSoundKey())) {
    const claimFlag = getLegacyClaimedFlagKey(SOUND_STORAGE_KEY);
    if (!localRead(claimFlag)) {
      const legacy = localRead(SOUND_STORAGE_KEY);
      if (legacy) { localWrite(getSoundKey(), legacy); localWrite(claimFlag, _scopeUserId); }
    }
  }
}

export function setScope(userId: string | null): void {
  if (userId === _scopeUserId && isClientInitialized && isSoundInitialized) return;
  _scopeUserId = userId;
  isClientInitialized = false;
  isSoundInitialized = false;
  tryMigrateLegacy();
  initializeIfNeeded();
  initializeSoundIfNeeded();
  if (process.env.NODE_ENV !== "production") {
    console.debug(
      "[speechProgressStorage] setScope:",
      { userId, attempts: currentProgress.attempts.length, sessions: currentProgress.sessions.length },
    );
  }
  notifyListeners();
  soundListeners.forEach((fn) => fn());
}

const DEFAULT_CHILD_ID = "";
const DEFAULT_TARGET_SOUND = "ช";
const DEFAULT_SOUND_ID = "ก";

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
  sessions: [],
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
    // For anonymous scope fall back to the legacy unscoped key.
    const raw = localRead(getProgressKey()) ?? (_scopeUserId === null ? localRead(STORAGE_KEY) : null);
    if (!raw) return SERVER_PROGRESS;
    return parseOrDefault(
      SpeechProgressSchema,
      JSON.parse(raw),
      SERVER_PROGRESS,
      "progress",
    ) as SpeechProgress;
  } catch {
    return SERVER_PROGRESS;
  }
}

/** Populate currentProgress from storage exactly once per page load. */
function initializeIfNeeded(): void {
  if (!isBrowser() || isClientInitialized) return;
  isClientInitialized = true;
  currentProgress = readFromLocalStorage();
}

function writeToLocalStorage(progress: SpeechProgress): void {
  localWrite(getProgressKey(), JSON.stringify(progress));
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
    sessions: currentProgress.sessions,
    updatedAt: new Date().toISOString(),
  };

  currentProgress = next;
  writeToLocalStorage(currentProgress);
  notifyListeners();
  return currentProgress;
}

/** Clear all progress from storage and reset the in-memory cache. */
export function clearProgress(): void {
  if (!isBrowser()) return;
  localRemove(getProgressKey());
  currentProgress = SERVER_PROGRESS;
  notifyListeners();
}

/**
 * Remove progress records belonging to childId only.
 * If no other children's data exists, performs a full clear.
 * Guard: no-ops when childId is empty (logs dev warning).
 */
export function clearProgressForChild(childId: string): void {
  if (!childId) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[speechProgressStorage] clearProgressForChild: childId is empty — skipped");
    }
    return;
  }

  initializeIfNeeded();

  const remainingAttempts = currentProgress.attempts.filter(
    (a) => a.childId !== childId,
  );
  const remainingSessions = currentProgress.sessions.filter(
    (s) => s.childId !== childId,
  );

  if (remainingAttempts.length === 0 && remainingSessions.length === 0) {
    clearProgress();
    return;
  }

  // Edge case: multiple children's data coexists — preserve the rest.
  const next: SpeechProgress = {
    ...currentProgress,
    attempts: remainingAttempts,
    sessions: remainingSessions,
    updatedAt: new Date().toISOString(),
  };
  currentProgress = next;
  writeToLocalStorage(currentProgress);
  notifyListeners();
}

/** Replace the entire progress snapshot (e.g., load demo data).
 *  Updates the in-memory cache, persists to localStorage, and notifies subscribers. */
export function replaceProgress(progress: SpeechProgress): void {
  currentProgress = progress;
  writeToLocalStorage(currentProgress);
  notifyListeners();
}

// ── Selected sound store ──────────────────────────────────────────────────────
// Separate from progress — just a string persisted in its own localStorage key.
// Follows the same stable-reference pattern as the progress store.

let currentSoundId: string = DEFAULT_SOUND_ID;
let isSoundInitialized = false;
const soundListeners = new Set<() => void>();

function initializeSoundIfNeeded(): void {
  if (!isBrowser() || isSoundInitialized) return;
  isSoundInitialized = true;
  // For anonymous scope fall back to the legacy unscoped key.
  const stored = localRead(getSoundKey()) ?? (_scopeUserId === null ? localRead(SOUND_STORAGE_KEY) : null);
  if (stored) currentSoundId = stored;
  else currentSoundId = DEFAULT_SOUND_ID;
}

export function subscribeToSelectedSound(callback: () => void): () => void {
  soundListeners.add(callback);
  return () => { soundListeners.delete(callback); };
}

export function getSelectedSoundId(): string {
  initializeSoundIfNeeded();
  return currentSoundId;
}

export function getServerSoundId(): string {
  return DEFAULT_SOUND_ID;
}

export function setSelectedSoundId(id: string): void {
  currentSoundId = id;
  localWrite(getSoundKey(), id);
  soundListeners.forEach((fn) => fn());
}

// ── Session management ─────────────────────────────────────────────────────────

function updateProgressWithSessions(
  sessions: PracticeSession[],
  attempts?: PracticeAttempt[]
): void {
  currentProgress = {
    childId: currentProgress.childId,
    targetSound: currentProgress.targetSound,
    attempts: attempts ?? currentProgress.attempts,
    sessions,
    updatedAt: new Date().toISOString(),
  };
  writeToLocalStorage(currentProgress);
  notifyListeners();
}

interface StartSessionInput {
  childId: string;
  targetSound: string;
  stageId: string;
  totalMissions: number;
}

export function startPracticeSession(input: StartSessionInput): PracticeSession {
  initializeIfNeeded();

  const session: PracticeSession = {
    id: `session-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    childId: input.childId,
    targetSound: input.targetSound,
    stageId: input.stageId,
    startedAt: new Date().toISOString(),
    endedAt: undefined,
    durationMs: undefined,
    completedMissions: 0,
    totalMissions: input.totalMissions,
    averageScore: 0,
    starsEarned: 0,
    attemptIds: [],
    status: "active",
  };

  updateProgressWithSessions([...currentProgress.sessions, session]);
  return session;
}

export function completePracticeSession(sessionId: string): PracticeSession | null {
  initializeIfNeeded();

  const sessions = currentProgress.sessions.map((s) => {
    if (s.id !== sessionId) return s;

    const sessionAttempts = currentProgress.attempts.filter((a) =>
      a.sessionId === sessionId
    );
    const completedMissions = new Set(
      sessionAttempts.map((a) => a.practiceItemId)
    ).size;
    const averageScore =
      sessionAttempts.length > 0
        ? Math.round(
            sessionAttempts.reduce((sum, a) => sum + a.score, 0) /
              sessionAttempts.length
          )
        : 0;
    const starsEarned = sessionAttempts.reduce(
      (sum, a) => sum + a.starsEarned,
      0
    );
    const now = new Date();
    const durationMs =
      now.getTime() - new Date(s.startedAt).getTime();

    return {
      ...s,
      endedAt: now.toISOString(),
      durationMs,
      completedMissions,
      averageScore,
      starsEarned,
      attemptIds: sessionAttempts.map((a) => a.id),
      status: "completed" as const,
    };
  });

  updateProgressWithSessions(sessions);

  return sessions.find((s) => s.id === sessionId) ?? null;
}

export function abandonPracticeSession(sessionId: string): PracticeSession | null {
  initializeIfNeeded();

  const sessions = currentProgress.sessions.map((s) => {
    if (s.id !== sessionId) return s;

    const sessionAttempts = currentProgress.attempts.filter(
      (a) => a.sessionId === sessionId
    );
    const completedMissions = new Set(
      sessionAttempts.map((a) => a.practiceItemId)
    ).size;
    const averageScore =
      sessionAttempts.length > 0
        ? Math.round(
            sessionAttempts.reduce((sum, a) => sum + a.score, 0) /
              sessionAttempts.length
          )
        : 0;
    const starsEarned = sessionAttempts.reduce(
      (sum, a) => sum + a.starsEarned,
      0
    );
    const now = new Date();
    const durationMs =
      now.getTime() - new Date(s.startedAt).getTime();

    return {
      ...s,
      endedAt: now.toISOString(),
      durationMs,
      completedMissions,
      averageScore,
      starsEarned,
      attemptIds: sessionAttempts.map((a) => a.id),
      status: "abandoned" as const,
    };
  });

  updateProgressWithSessions(sessions);

  return sessions.find((s) => s.id === sessionId) ?? null;
}

export function getActiveSession(stageId: string): PracticeSession | null {
  initializeIfNeeded();
  return (
    currentProgress.sessions.find(
      (s) => s.stageId === stageId && s.status === "active"
    ) ?? null
  );
}

export function getSessionSummary(sessionId: string): PracticeSession | null {
  initializeIfNeeded();
  return (
    currentProgress.sessions.find((s) => s.id === sessionId) ?? null
  );
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
  stageId: string,
  targetSoundId?: string,
): "locked" | "current" | "completed" | "review" {
  const stageIndex = STAGE_ORDER.indexOf(stageId);
  if (stageIndex === -1) return "locked";

  const scoped = targetSoundId
    ? attempts.filter((a) => a.targetSound === targetSoundId)
    : attempts;

  if (isStageCompleted(scoped, stageId)) {
    return "completed";
  }

  const currentStageId = findCurrentStageId(scoped);

  if (stageId === currentStageId) {
    return stageId === "review" ? "review" : "current";
  }

  return "locked";
}

export function getStageAttempts(
  attempts: PracticeAttempt[],
  stageId: string,
  targetSoundId?: string,
): PracticeAttempt[] {
  return attempts.filter(
    (a) =>
      a.stageId === stageId &&
      (targetSoundId == null || a.targetSound === targetSoundId),
  );
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

  const sessions = progress.sessions ?? [];
  const completedSessions = sessions.filter((s) => s.status === "completed");
  const totalSessions = completedSessions.length;
  const averageSessionScore =
    totalSessions > 0
      ? Math.round(
          completedSessions.reduce((sum, s) => sum + s.averageScore, 0) /
            totalSessions
        )
      : 0;

  const recentSessions = [...sessions]
    .filter((s) => s.status !== "active")
    .sort(
      (a, b) =>
        new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
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
    totalSessions,
    averageSessionScore,
    recentSessions,
  };
}
