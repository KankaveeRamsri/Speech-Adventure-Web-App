"use client";

import { useState, useCallback } from "react";
import type {
  SpeechProgress,
  PracticeAttempt,
  ProgressSummary,
  StageStatus,
} from "@/types/speechAdventure";
import {
  getProgress,
  addAttempt as storageAddAttempt,
  clearProgress as storageClearProgress,
  calculateProgressSummary,
  getStageStatus as computeStageStatus,
  getStageAttempts as computeStageAttempts,
} from "@/lib/speechProgressStorage";

export function useSpeechProgress() {
  // Lazy initializers read from localStorage on each component mount,
  // so navigating back to the training map always picks up the latest progress.
  const [progress, setProgress] = useState<SpeechProgress>(() => getProgress());
  const [summary, setSummary] = useState<ProgressSummary>(() =>
    calculateProgressSummary(getProgress())
  );

  const refreshProgress = useCallback(() => {
    const p = getProgress();
    setProgress(p);
    setSummary(calculateProgressSummary(p));
  }, []);

  const addAttempt = useCallback(
    (attempt: PracticeAttempt) => {
      const updated = storageAddAttempt(attempt);
      setProgress(updated);
      setSummary(calculateProgressSummary(updated));
    },
    []
  );

  const clearAllProgress = useCallback(() => {
    storageClearProgress();
    const empty = getProgress();
    setProgress(empty);
    setSummary(calculateProgressSummary(empty));
  }, []);

  const getStageStatus = useCallback(
    (stageId: string): StageStatus => {
      return computeStageStatus(progress.attempts, stageId);
    },
    [progress.attempts]
  );

  const getStageAttempts = useCallback(
    (stageId: string): PracticeAttempt[] => {
      return computeStageAttempts(progress.attempts, stageId);
    },
    [progress.attempts]
  );

  return {
    progress,
    summary,
    attempts: progress.attempts,
    addAttempt,
    clearProgress: clearAllProgress,
    refreshProgress,
    getStageStatus,
    getStageAttempts,
  };
}
