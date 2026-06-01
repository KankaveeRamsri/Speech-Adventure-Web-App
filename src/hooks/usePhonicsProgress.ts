"use client";

import { useEffect, useSyncExternalStore } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useChildProfile } from "@/hooks/useChildProfile";
import * as storage from "@/lib/storage/phonicsProgressStorage";
import type {
  PhonicsAttempt,
  PhonicsProgress,
  PhonicsProgressSummary,
} from "@/types/phonics";
import { getPhonicsUnits } from "@/data/kindergartenCurriculum";

const noopSubscribe = () => () => {};
const serverNull = (): null => null;

export function usePhonicsProgress() {
  const { user } = useAuth();
  const { profile } = useChildProfile();

  // Sync storage scope with auth user
  useEffect(() => {
    storage.setScope(user?.id ?? null);
  }, [user?.id]);

  // Sync active child
  useEffect(() => {
    storage.setActiveChild(profile?.id ?? null);
  }, [profile?.id]);

  const progress = useSyncExternalStore<PhonicsProgress | null>(
    storage.subscribe,
    storage.getProgress,
    serverNull,
  );

  // Hydration flag: true only on the client after first mount
  const isHydrated = useSyncExternalStore(noopSubscribe, () => true as const, () => false as const);

  // ── Computed summary ────────────────────────────────────────────────────────

  const completedLessonIds: Set<string> = profile?.id
    ? storage.getCompletedLessonIds(profile.id)
    : new Set();

  const completedUnitIds: Set<string> = (() => {
    const s = new Set<string>();
    getPhonicsUnits().forEach((unit) => {
      const allLessonsDone = unit.lessons.every((l) => completedLessonIds.has(l.id));
      if (allLessonsDone && unit.lessons.length > 0) s.add(unit.id);
    });
    return s;
  })();

  const summary: PhonicsProgressSummary = {
    totalAttempts: progress?.attempts.length ?? 0,
    totalSessions: progress?.sessions.filter((s) => s.status === "completed").length ?? 0,
    completedLessonIds: [...completedLessonIds],
    completedUnitIds: [...completedUnitIds],
    lessonPassRate: {},
  };

  // ── Write helpers ───────────────────────────────────────────────────────────

  const startSession = (
    unitId: string,
    lessonId: string,
    totalItems: number,
  ): import("@/types/phonics").PhonicsSession | null => {
    if (!profile?.id) return null;
    try {
      return storage.startPhonicsSession({
        childId: profile.id,
        unitId,
        lessonId,
        totalItems,
      });
    } catch {
      return null;
    }
  };

  const addAttempt = (attempt: PhonicsAttempt): void => {
    if (!attempt.childId) return;
    storage.addPhonicsAttempt(attempt);
  };

  const completeSession = (sessionId: string): void => {
    if (!profile?.id) return;
    storage.completePhonicsSession(sessionId, profile.id);
  };

  return {
    progress,
    summary,
    completedLessonIds,
    completedUnitIds,
    isHydrated,
    startSession,
    addAttempt,
    completeSession,
  };
}
