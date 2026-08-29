"use client";

import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useSchool } from "@/hooks/useSchool";
import { useTeacherClassrooms } from "@/hooks/useTeacherClassrooms";
import type {
  Classroom,
  ClassroomStudentDetail,
  CreateClassroomStudentInput,
} from "@/types/school";

export type ClassroomStatus = "loading" | "ready" | "not-found";

/**
 * Teacher V2 Phase 2 — a single classroom the current teacher manages, its
 * roster, and membership operations.
 *
 * Access boundary: the classroom row is only ever read from the school
 * repository cache, which is populated exclusively by RLS-scoped queries
 * (classrooms: member select). A classroom in another organization is never
 * in the cache, so `status` resolves to "not-found" and the detail page
 * renders a safe not-found state — direct-URL navigation cannot leak data.
 */
export function useClassroom(classroomId: string) {
  const { user } = useAuth();
  const {
    organizations,
    getClassroom,
    listChildrenForClassroom,
    listClassroomStudentDetails,
    createStudentInClassroom,
    addChild,
    removeChild,
    moveStudentBetweenClassrooms,
  } = useSchool();
  const { organizationId, active: activeClassrooms, status: listStatus } = useTeacherClassrooms();

  const classroom: Classroom | null = getClassroom(classroomId);
  const membership = listChildrenForClassroom(classroomId);
  const membershipKey = membership.map((m) => m.childId).sort().join(",");

  // "not-found" is only safe to show once the school cache has actually
  // hydrated — organizations is populated by the same hydrate pass that
  // loads classrooms, so a non-empty list means "classrooms are loaded and
  // this id genuinely isn't among the ones RLS lets me see".
  const status: ClassroomStatus = classroom
    ? "ready"
    : listStatus === "error"
      ? "not-found"
      : organizations.length > 0
        ? "not-found"
        : "loading";

  // ── Roster detail (async: joins child_profiles) ────────────────────────────
  // Only ever calls setState from inside a resolved promise — never
  // synchronously in the effect body — so the loading flag is derived from
  // whether the currently-loaded key matches the live membership key.
  const [roster, setRoster] = useState<ClassroomStudentDetail[]>([]);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [rosterError, setRosterError] = useState(false);
  const [reloadTick, setReloadTick] = useState(0);

  const currentKey = `${classroomId}:${membershipKey}:${reloadTick}`;
  const rosterSettled = loadedKey === currentKey;
  const rosterLoading = status === "ready" && !rosterSettled;
  const showRosterError = rosterError && rosterSettled;

  useEffect(() => {
    if (status !== "ready") return;
    let cancelled = false;
    listClassroomStudentDetails(classroomId)
      .then((rows) => {
        if (cancelled) return;
        setRoster(rows);
        setRosterError(false);
        setLoadedKey(currentKey);
      })
      .catch(() => {
        if (cancelled) return;
        setRosterError(true);
        setLoadedKey(currentKey);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classroomId, status, currentKey]);

  const reloadRoster = useCallback(() => setReloadTick((n) => n + 1), []);

  // ── Membership operations ─────────────────────────────────────────────────
  const createStudent = useCallback(
    async (input: CreateClassroomStudentInput) => {
      if (!organizationId || !user) throw new Error("ยังไม่พร้อม กรุณาลองใหม่");
      await createStudentInClassroom(classroomId, organizationId, user.id, input);
    },
    [classroomId, organizationId, user, createStudentInClassroom],
  );

  const addExistingChild = useCallback(
    async (childId: string) => {
      await addChild(classroomId, childId);
    },
    [classroomId, addChild],
  );

  const removeStudent = useCallback(
    async (childId: string) => {
      await removeChild(classroomId, childId);
    },
    [classroomId, removeChild],
  );

  const moveStudent = useCallback(
    async (childId: string, toClassroomId: string) => {
      await moveStudentBetweenClassrooms(childId, classroomId, toClassroomId);
    },
    [classroomId, moveStudentBetweenClassrooms],
  );

  // Other active classrooms in the same org — destinations for "move".
  const moveTargets = activeClassrooms.filter((c) => c.id !== classroomId);

  return {
    classroom,
    status,
    studentCount: membership.length,
    roster,
    rosterLoading,
    rosterError: showRosterError,
    reloadRoster,
    moveTargets,
    createStudent,
    addExistingChild,
    removeStudent,
    moveStudent,
  };
}
