"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
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
import { useChildProfile } from "@/hooks/useChildProfile";

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
  const { profile } = useChildProfile();

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

  // Always filter by the selected child's ID so owned and shared children
  // never bleed into each other. When no child is selected (profile === null),
  // activeChildId = null and no filtering is applied (anonymous/legacy fallback).
  const activeChildId = profile?.id ?? null;

  const filteredAttempts = useMemo(
    () =>
      activeChildId
        ? progress.attempts.filter((a) => a.childId === activeChildId)
        : progress.attempts,
    [progress.attempts, activeChildId],
  );

  const filteredSessions = useMemo(
    () =>
      activeChildId
        ? progress.sessions.filter((s) => s.childId === activeChildId)
        : progress.sessions,
    [progress.sessions, activeChildId],
  );

  const summary: ProgressSummary = calculateProgressSummary({
    ...progress,
    attempts: filteredAttempts,
    sessions: filteredSessions,
  });

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

  // Notifies the progress repository that the selected child changed.
  // Only meaningful in Supabase mode (duck-typed — no-op for local repo).
  const switchChildProgress = useCallback((childId: string) => {
    const r = repo as { setSelectedChildId?: (id: string | null) => void };
    if (typeof r.setSelectedChildId === "function") {
      r.setSelectedChildId(childId);
    }
  }, [repo]);

  const getStageStatus = useCallback(
    (stageId: string, targetSoundId?: string): StageStatus => {
      return computeStageStatus(filteredAttempts, stageId, targetSoundId);
    },
    [filteredAttempts],
  );

  const getStageAttempts = useCallback(
    (stageId: string, targetSoundId?: string): PracticeAttempt[] => {
      return computeStageAttempts(filteredAttempts, stageId, targetSoundId);
    },
    [filteredAttempts],
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
    attempts: filteredAttempts,
    sessions: filteredSessions,
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
    switchChildProgress,
  };
}
