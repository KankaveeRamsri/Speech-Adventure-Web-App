"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useSchool } from "@/hooks/useSchool";
import { useTeacherClassrooms } from "@/hooks/useTeacherClassrooms";
import { useRepositories } from "@/lib/providers/RepositoryProvider";
import type { TeacherStudentDirectoryEntry } from "@/types/school";
import type { ChildPracticeSummary } from "@/lib/repositories/IProgressRepository";

export type DirectoryStatus = "loading" | "ready";

export interface DirectoryRow extends TeacherStudentDirectoryEntry {
  /** null when the child has never practiced (Speech-Clarity). */
  practice: ChildPracticeSummary | null;
}

/**
 * Teacher V2 Phase 3 — the student directory: every child across the
 * teacher's active classrooms, each with a lightweight practice summary.
 *
 * The summaries come from ONE batched query over all child ids
 * (getChildrenPracticeSummaries) — never one query per child.
 */
export function useTeacherStudentDirectory() {
  const { user } = useAuth();
  const { listTeacherStudentDirectory } = useSchool();
  const { active: classrooms, status: classroomsStatus } = useTeacherClassrooms();
  const { progress: progressRepo } = useRepositories();

  const [rows, setRows] = useState<DirectoryRow[]>([]);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);

  const classroomsKey = classrooms.map((c) => c.id).sort().join(",");
  const fetchKey = `${user?.id ?? ""}:${classroomsKey}`;
  const status: DirectoryStatus =
    classroomsStatus === "loading" || loadedKey !== fetchKey ? "loading" : "ready";

  useEffect(() => {
    if (!user || classroomsStatus !== "ready") return;
    let cancelled = false;

    (async () => {
      const entries = await listTeacherStudentDirectory(user.id).catch(
        (): TeacherStudentDirectoryEntry[] => [],
      );
      if (cancelled) return;

      const summaries = await progressRepo
        .getChildrenPracticeSummaries(entries.map((e) => e.childId))
        .catch(() => new Map<string, ChildPracticeSummary>());
      if (cancelled) return;

      setRows(entries.map((e) => ({ ...e, practice: summaries.get(e.childId) ?? null })));
      setLoadedKey(fetchKey);
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, classroomsStatus, fetchKey]);

  return { rows, classrooms, status };
}
