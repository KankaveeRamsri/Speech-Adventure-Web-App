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
  getProgress,
  getServerProgress,
  subscribeToProgress,
  addAttempt as storageAddAttempt,
  clearProgress as storageClearProgress,
  calculateProgressSummary,
  getStageStatus as computeStageStatus,
  getStageAttempts as computeStageAttempts,
  subscribeToSelectedSound,
  getSelectedSoundId,
  getServerSoundId,
  setSelectedSoundId,
  startPracticeSession as storageStartSession,
  completePracticeSession as storageCompleteSession,
  abandonPracticeSession as storageAbandonSession,
  getActiveSession as storageGetActiveSession,
  getSessionSummary as storageGetSessionSummary,
} from "@/lib/speechProgressStorage";

// ── isHydrated detection ──────────────────────────────────────────────────────
// useSyncExternalStore with different server/client snapshots:
// • Server + client hydration → false  (matches → no hydration mismatch)
// • After hydration            → true   (React re-renders once, synchronously)
// This avoids calling setState inside an effect entirely.

const noopSubscribe = () => () => {};
const clientSnapshot = () => true as const;
const serverSnapshot = () => false as const;

// ─────────────────────────────────────────────────────────────────────────────

export function useSpeechProgress() {
  // progress is synchronized with localStorage.
  // getServerProgress() is used on the server AND during client hydration so
  // the initial HTML matches — no hydration mismatch.
  const progress = useSyncExternalStore<SpeechProgress>(
    subscribeToProgress,
    getProgress,
    getServerProgress,
  );

  // isHydrated: false during SSR + hydration, true right after.
  const isHydrated = useSyncExternalStore(
    noopSubscribe,
    clientSnapshot,
    serverSnapshot,
  );

  const selectedSoundId = useSyncExternalStore(
    subscribeToSelectedSound,
    getSelectedSoundId,
    getServerSoundId,
  );

  const summary: ProgressSummary = calculateProgressSummary(progress);

  const addAttempt = useCallback((attempt: PracticeAttempt) => {
    // storageAddAttempt saves to localStorage and calls notifyListeners(),
    // which triggers useSyncExternalStore to re-read getProgress().
    storageAddAttempt(attempt);
  }, []);

  const clearAllProgress = useCallback(() => {
    storageClearProgress();
  }, []);

  const refreshProgress = useCallback(() => {
    // With useSyncExternalStore the snapshot is re-read automatically
    // whenever notifyListeners fires. This is kept for API compatibility.
  }, []);

  const setSelectedSound = useCallback((id: string) => {
    setSelectedSoundId(id);
  }, []);

  const getStageStatus = useCallback(
    (stageId: string): StageStatus => {
      return computeStageStatus(progress.attempts, stageId);
    },
    [progress.attempts],
  );

  const getStageAttempts = useCallback(
    (stageId: string): PracticeAttempt[] => {
      return computeStageAttempts(progress.attempts, stageId);
    },
    [progress.attempts],
  );

  const startSession = useCallback(
    (input: { childId: string; targetSound: string; stageId: string; totalMissions: number }) => {
      return storageStartSession(input);
    },
    []
  );

  const completeSession = useCallback((sessionId: string) => {
    return storageCompleteSession(sessionId);
  }, []);

  const abandonSession = useCallback((sessionId: string) => {
    return storageAbandonSession(sessionId);
  }, []);

  const getActiveSessionForStage = useCallback(
    (stageId: string): PracticeSession | null => {
      return storageGetActiveSession(stageId);
    },
    []
  );

  const getSessionById = useCallback(
    (sessionId: string): PracticeSession | null => {
      return storageGetSessionSummary(sessionId);
    },
    []
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
