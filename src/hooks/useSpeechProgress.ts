"use client";

import { useCallback, useSyncExternalStore } from "react";
import type {
  SpeechProgress,
  PracticeAttempt,
  PracticeSession,
  ProgressSummary,
  StageStatus,
} from "@/types/speechAdventure";
import {
  calculateProgressSummary,
  getStageStatus as computeStageStatus,
  getStageAttempts as computeStageAttempts,
  getSessionSummary as storageGetSessionSummary,
} from "@/lib/speechProgressStorage";
import { useRepositories } from "@/lib/providers/RepositoryProvider";

// ── isHydrated detection ──────────────────────────────────────────────────────
// useSyncExternalStore with different server/client snapshots:
// • Server + client hydration → false  (matches → no hydration mismatch)
// • After hydration            → true   (React re-renders once, synchronously)

const noopSubscribe = () => () => {};
const clientSnapshot = () => true as const;
const serverSnapshot = () => false as const;

// ─────────────────────────────────────────────────────────────────────────────

export function useSpeechProgress() {
  const { progress: repo } = useRepositories();

  // progress is synchronized via the repository's pub-sub.
  // getServerProgress() is used on the server AND during client hydration so
  // the initial HTML matches — no hydration mismatch.
  const progress = useSyncExternalStore<SpeechProgress>(
    repo.subscribe.bind(repo),
    repo.getProgress.bind(repo),
    repo.getServerProgress.bind(repo),
  );

  // isHydrated: false during SSR + hydration, true right after.
  const isHydrated = useSyncExternalStore(
    noopSubscribe,
    clientSnapshot,
    serverSnapshot,
  );

  const selectedSoundId = useSyncExternalStore(
    repo.subscribeToSelectedSound.bind(repo),
    repo.getSelectedSoundId.bind(repo),
    repo.getServerSoundId.bind(repo),
  );

  const summary: ProgressSummary = calculateProgressSummary(progress);

  const addAttempt = useCallback((attempt: PracticeAttempt) => {
    // repo.addAttempt persists and notifies listeners, which triggers
    // useSyncExternalStore to re-read getProgress().
    repo.addAttempt(attempt);
  }, [repo]);

  const clearAllProgress = useCallback(() => {
    repo.clearProgress();
  }, [repo]);

  const clearProgressForChild = useCallback(
    (childId: string) => {
      repo.clearProgressForChild(childId);
    },
    [repo],
  );

  const refreshProgress = useCallback(() => {
    // With useSyncExternalStore the snapshot is re-read automatically
    // whenever notifyListeners fires. Kept for API compatibility.
  }, []);

  const setSelectedSound = useCallback((id: string) => {
    repo.setSelectedSoundId(id);
  }, [repo]);

  const getStageStatus = useCallback(
    (stageId: string, targetSoundId?: string): StageStatus => {
      return computeStageStatus(progress.attempts, stageId, targetSoundId);
    },
    [progress.attempts],
  );

  const getStageAttempts = useCallback(
    (stageId: string, targetSoundId?: string): PracticeAttempt[] => {
      return computeStageAttempts(progress.attempts, stageId, targetSoundId);
    },
    [progress.attempts],
  );

  const startSession = useCallback(
    (input: { childId: string; targetSound: string; stageId: string; totalMissions: number }) => {
      return repo.startSession(input);
    },
    [repo],
  );

  const completeSession = useCallback((sessionId: string) => {
    return repo.completeSession(sessionId);
  }, [repo]);

  const abandonSession = useCallback((sessionId: string) => {
    return repo.abandonSession(sessionId);
  }, [repo]);

  const getActiveSessionForStage = useCallback(
    (stageId: string): PracticeSession | null => {
      return repo.getActiveSession(stageId);
    },
    [repo],
  );

  const getSessionById = useCallback(
    (sessionId: string): PracticeSession | null => {
      // Reads from the in-memory cache inside speechProgressStorage.
      // No async needed here because local reads are synchronous.
      return storageGetSessionSummary(sessionId);
    },
    [],
  );

  return {
    progress,
    summary,
    attempts: progress.attempts,
    sessions: progress.sessions,
    isHydrated,
    selectedSoundId,
    setSelectedSound,
    addAttempt,
    clearProgress: clearAllProgress,
    clearProgressForChild,
    refreshProgress,
    getStageStatus,
    getStageAttempts,
    startSession,
    completeSession,
    abandonSession,
    getActiveSessionForStage,
    getSessionById,
  };
}
