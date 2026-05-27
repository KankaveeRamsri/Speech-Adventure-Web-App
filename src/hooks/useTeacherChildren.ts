"use client";

import { useMemo, useSyncExternalStore } from "react";
import { useChildAccess } from "@/hooks/useChildAccess";
import { useRepositories } from "@/lib/providers/RepositoryProvider";
import { calculateProgressSummary } from "@/lib/speechProgressStorage";
import type { ChildAccess } from "@/types/childAccess";
import type { ChildProfileData } from "@/lib/child-profile/childProfileStorage";
import type { ProgressSummary } from "@/types/speechAdventure";

export interface TeacherChildSummary {
  grant: ChildAccess;
  child: ChildProfileData;
  progressSummary: ProgressSummary;
  lastActivityAt: string | null;
}

// Stable module-level references required by useSyncExternalStore
const _noopSub = () => () => {};
const _clientTrue = () => true as const;
const _serverFalse = () => false as const;

/**
 * Returns a summary for each child shared with the current user via child_access grants.
 * Progress is scoped by childId — data never bleeds across children.
 */
export function useTeacherChildren(): {
  children: TeacherChildSummary[];
  isHydrated: boolean;
} {
  const { receivedGrants } = useChildAccess();
  const { progress: repo } = useRepositories();

  const progress = useSyncExternalStore(
    repo.subscribe.bind(repo),
    repo.getProgress.bind(repo),
    repo.getServerProgress.bind(repo),
  );

  const isHydrated = useSyncExternalStore(_noopSub, _clientTrue, _serverFalse);

  const children = useMemo<TeacherChildSummary[]>(() => {
    return receivedGrants
      .filter((g) => !g.revokedAt && g.childSnapshot)
      .map((grant) => {
        const child = grant.childSnapshot!;

        const childAttempts = progress.attempts.filter((a) => a.childId === child.id);
        const childSessions = progress.sessions.filter((s) => s.childId === child.id);

        const progressSummary = calculateProgressSummary({
          ...progress,
          attempts: childAttempts,
          sessions: childSessions,
        });

        const lastActivityAt =
          childAttempts.length > 0
            ? childAttempts.reduce(
                (latest, a) =>
                  new Date(a.createdAt) > new Date(latest) ? a.createdAt : latest,
                childAttempts[0].createdAt,
              )
            : null;

        return { grant, child, progressSummary, lastActivityAt };
      });
  }, [receivedGrants, progress]);

  return { children, isHydrated };
}
