"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useSchool } from "@/hooks/useSchool";
import { useRepositories } from "@/lib/providers/RepositoryProvider";
import { calculateStudentAnalytics, type StudentAnalytics } from "@/lib/teacher/studentAnalytics";
import type { SpeechProgress } from "@/types/speechAdventure";
import type { TeacherStudentProfile } from "@/types/school";

export type StudentDetailStatus = "loading" | "ready" | "not-found";

interface Resolved {
  key: string;
  profile: TeacherStudentProfile | null;
  progress: SpeechProgress | null;
  analytics: StudentAnalytics | null;
}

/**
 * Teacher V2 Phase 3 — one student's profile + speech-practice analytics.
 *
 * Access boundary: `profile` is resolved through the RLS-scoped
 * child_profiles read (getStudentProfile). If it returns null the child
 * either does not exist or the teacher has no access — the page renders the
 * same "not found / no access" state either way (no existence disclosure).
 * Practice data is fetched separately and is likewise RLS-scoped
 * (can_read_child_practice — see 20260829000300).
 *
 * The loading flag is derived (never set synchronously in the effect); the
 * effect only writes state from inside the resolved promise.
 */
export function useStudentDetail(childId: string) {
  const { user } = useAuth();
  const { getStudentProfile } = useSchool();
  const { progress: progressRepo } = useRepositories();

  const [resolved, setResolved] = useState<Resolved | null>(null);
  const [reloadTick, setReloadTick] = useState(0);

  const key = `${user?.id ?? ""}:${childId}:${reloadTick}`;
  const settled = resolved?.key === key;

  useEffect(() => {
    if (!user || !childId) return;
    let cancelled = false;

    (async () => {
      const prof = await getStudentProfile(childId, user.id).catch(() => null);
      if (cancelled) return;

      if (!prof) {
        setResolved({ key, profile: null, progress: null, analytics: null });
        return;
      }

      const prog = await progressRepo.getChildProgress(childId).catch(
        (): SpeechProgress => ({
          childId,
          targetSound: prof.targetSound ?? "",
          attempts: [],
          sessions: [],
          updatedAt: new Date().toISOString(),
        }),
      );
      if (cancelled) return;

      setResolved({
        key,
        profile: prof,
        progress: prog,
        analytics: calculateStudentAnalytics(prog),
      });
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const status: StudentDetailStatus =
    !user || !childId || !settled
      ? "loading"
      : resolved.profile
        ? "ready"
        : "not-found";

  return {
    profile: settled ? resolved.profile : null,
    progress: settled ? resolved.progress : null,
    analytics: settled ? resolved.analytics : null,
    status,
    isPhonics: (settled && resolved.profile?.trainingMode === "kindergarten_phonics") || false,
    reload: () => setReloadTick((n) => n + 1),
  };
}
