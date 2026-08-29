"use client";

import { useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useSchool } from "@/hooks/useSchool";
import { useTeacherOrganization } from "@/hooks/useTeacherOrganization";
import type { Classroom, CreateClassroomInput, UpdateClassroomInput } from "@/types/school";

export type TeacherClassroomsStatus = "loading" | "ready" | "error";

/**
 * Teacher V2 Phase 2 — the teacher's classroom list, scoped to their internal
 * workspace organization (resolved by useTeacherOrganization; the teacher
 * never sees "organization" as a concept).
 *
 * `active` / `archived` are partitioned in the repository (listActiveClassrooms
 * / listArchivedClassrooms) — the archived filter is never left to the UI.
 * The list re-renders reactively through useSchool()'s store subscription
 * whenever a classroom is created / renamed / archived.
 */
export function useTeacherClassrooms() {
  const { user } = useAuth();
  const { organizationId: provisionedOrgId, status: provisionStatus } = useTeacherOrganization();
  const {
    organizations,
    listActiveClassrooms,
    listArchivedClassrooms,
    listChildrenForClassroom,
    createClassroomForTeacher,
    updateClassroom,
    setClassroomArchived,
  } = useSchool();

  // Prefer the org already in the hydrated cache; fall back to the id the
  // provisioning RPC just returned (first-ever load, before rehydrate lands).
  const organizationId =
    organizations.find((o) => o.type === "school")?.id ?? provisionedOrgId ?? null;

  const status: TeacherClassroomsStatus =
    provisionStatus === "error"
      ? "error"
      : organizationId
        ? "ready"
        : "loading";

  const active = organizationId ? listActiveClassrooms(organizationId) : [];
  const archived = organizationId ? listArchivedClassrooms(organizationId) : [];

  const studentCount = useCallback(
    (classroomId: string) => listChildrenForClassroom(classroomId).length,
    [listChildrenForClassroom],
  );

  const createClassroom = useCallback(
    async (input: Omit<CreateClassroomInput, "organizationId">): Promise<Classroom> => {
      if (!organizationId) throw new Error("ยังไม่พร้อมสร้างห้องเรียน กรุณาลองใหม่");
      if (!user) throw new Error("ไม่พบผู้ใช้");
      return createClassroomForTeacher({ ...input, organizationId }, user.id);
    },
    [organizationId, user, createClassroomForTeacher],
  );

  const renameClassroom = useCallback(
    (classroomId: string, patch: UpdateClassroomInput) => updateClassroom(classroomId, patch),
    [updateClassroom],
  );

  const archiveClassroom = useCallback(
    (classroomId: string) => setClassroomArchived(classroomId, true),
    [setClassroomArchived],
  );

  const unarchiveClassroom = useCallback(
    (classroomId: string) => setClassroomArchived(classroomId, false),
    [setClassroomArchived],
  );

  return {
    organizationId,
    status,
    active,
    archived,
    studentCount,
    createClassroom,
    renameClassroom,
    archiveClassroom,
    unarchiveClassroom,
  };
}
