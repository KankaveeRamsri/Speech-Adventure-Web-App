"use client";

import { useState, useCallback, useEffect } from "react";
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
  const [progress, setProgress] = useState<SpeechProgress>({
    childId: "child-001",
    targetSound: "ช",
    attempts: [],
    updatedAt: new Date().toISOString(),
  });

  const [summary, setSummary] = useState<ProgressSummary>(
    calculateProgressSummary(progress)
  );

  const refreshProgress = useCallback(() => {
    const p = getProgress();
    setProgress(p);
    setSummary(calculateProgressSummary(p));
  }, []);

  useEffect(() => {
    refreshProgress();
  }, [refreshProgress]);

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
