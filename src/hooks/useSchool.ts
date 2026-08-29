"use client";

import { useSyncExternalStore } from "react";
import { useRepositories } from "@/lib/providers/RepositoryProvider";
import type {
  Organization,
  Classroom,
  ClassroomStudent,
  ClassroomTeacher,
  CreateOrganizationInput,
  CreateClassroomInput,
  UpdateClassroomInput,
  CreateClassroomStudentInput,
  ClassroomStudentDetail,
  TeacherStudentDirectoryEntry,
  UserDisplayInfo,
  StudentParentLinkInfo,
} from "@/types/school";

// Module-level stable refs required by useSyncExternalStore
const _noopSub = () => () => {};
const _serverOrgs: Organization[] = [];
const _serverClassrooms: Classroom[] = [];

function _serverSnapshot(): Organization[] {
  return _serverOrgs;
}

function _serverClassroomsSnapshot(): Classroom[] {
  return _serverClassrooms;
}

/**
 * React hook for school/classroom data.
 *
 * Reads from ISchoolRepository (local or Supabase depending on env).
 * All writes are async and update the cache via the repository's subscribe/notify
 * mechanism — callers do not need to manually refresh.
 */
export function useSchool() {
  const { school } = useRepositories();

  const organizations = useSyncExternalStore(
    school?.subscribe.bind(school) ?? _noopSub,
    school?.listMyOrganizations.bind(school) ?? (() => _serverOrgs),
    school?.getServerOrganizations.bind(school) ?? _serverSnapshot,
  );

  // Separate subscription for classrooms: its snapshot reference changes on
  // every classroom mutation (create / rename / archive) even when the
  // organizations snapshot is untouched, so components re-render on a
  // classroom-only change. `allClassrooms` is every cached classroom
  // (active + archived) across all orgs the caller can see.
  const allClassrooms = useSyncExternalStore(
    school?.subscribe.bind(school) ?? _noopSub,
    school?.getClassroomsSnapshot.bind(school) ?? _serverClassroomsSnapshot,
    school?.getServerClassroomsSnapshot.bind(school) ?? _serverClassroomsSnapshot,
  );

  function listClassrooms(organizationId: string): Classroom[] {
    return allClassrooms.filter((c) => c.organizationId === organizationId);
  }

  function listActiveClassrooms(organizationId: string): Classroom[] {
    return allClassrooms.filter(
      (c) => c.organizationId === organizationId && c.archivedAt === null,
    );
  }

  function listArchivedClassrooms(organizationId: string): Classroom[] {
    return allClassrooms.filter(
      (c) => c.organizationId === organizationId && c.archivedAt !== null,
    );
  }

  function getClassroom(classroomId: string): Classroom | null {
    return allClassrooms.find((c) => c.id === classroomId) ?? null;
  }

  function listChildrenForClassroom(classroomId: string): ClassroomStudent[] {
    return school?.listChildrenForClassroom(classroomId) ?? [];
  }

  function listClassroomsForTeacher(userId: string): Classroom[] {
    return school?.listClassroomsForTeacher(userId) ?? [];
  }

  function listTeachersForClassroom(classroomId: string): ClassroomTeacher[] {
    return school?.listTeachersForClassroom(classroomId) ?? [];
  }

  async function createOrganization(input: CreateOrganizationInput): Promise<Organization> {
    if (!school) throw new Error("School repository not available");
    return school.createSchoolOrganization(input);
  }

  async function createClassroom(input: CreateClassroomInput): Promise<Classroom> {
    if (!school) throw new Error("School repository not available");
    return school.createClassroom(input);
  }

  async function createClassroomForTeacher(
    input: CreateClassroomInput,
    teacherUserId: string,
  ): Promise<Classroom> {
    if (!school) throw new Error("School repository not available");
    return school.createClassroomForTeacher(input, teacherUserId);
  }

  async function updateClassroom(
    classroomId: string,
    patch: UpdateClassroomInput,
  ): Promise<Classroom> {
    if (!school) throw new Error("School repository not available");
    return school.updateClassroom(classroomId, patch);
  }

  async function setClassroomArchived(
    classroomId: string,
    archived: boolean,
  ): Promise<Classroom> {
    if (!school) throw new Error("School repository not available");
    return school.setClassroomArchived(classroomId, archived);
  }

  async function createStudentInClassroom(
    classroomId: string,
    organizationId: string,
    teacherUserId: string,
    input: CreateClassroomStudentInput,
  ): Promise<ClassroomStudent> {
    if (!school) throw new Error("School repository not available");
    return school.createStudentInClassroom(classroomId, organizationId, teacherUserId, input);
  }

  async function moveStudentBetweenClassrooms(
    childId: string,
    fromClassroomId: string,
    toClassroomId: string,
  ): Promise<void> {
    if (!school) throw new Error("School repository not available");
    return school.moveStudentBetweenClassrooms(childId, fromClassroomId, toClassroomId);
  }

  async function listClassroomStudentDetails(
    classroomId: string,
  ): Promise<ClassroomStudentDetail[]> {
    if (!school) return [];
    return school.listClassroomStudentDetails(classroomId);
  }

  async function listTeacherStudentDirectory(
    userId: string,
  ): Promise<TeacherStudentDirectoryEntry[]> {
    if (!school) return [];
    return school.listTeacherStudentDirectory(userId);
  }

  async function assignTeacher(classroomId: string, teacherUserId: string): Promise<ClassroomTeacher> {
    if (!school) throw new Error("School repository not available");
    return school.assignTeacherToClassroom(classroomId, teacherUserId);
  }

  async function removeTeacher(classroomId: string, teacherUserId: string): Promise<void> {
    if (!school) throw new Error("School repository not available");
    return school.removeTeacherFromClassroom(classroomId, teacherUserId);
  }

  async function addChild(classroomId: string, childId: string): Promise<ClassroomStudent> {
    if (!school) throw new Error("School repository not available");
    return school.addChildToClassroom(classroomId, childId);
  }

  async function removeChild(classroomId: string, childId: string): Promise<void> {
    if (!school) throw new Error("School repository not available");
    return school.removeChildFromClassroom(classroomId, childId);
  }

  async function findTeacherByEmail(email: string): Promise<UserDisplayInfo | null> {
    if (!school) return null;
    return school.findTeacherByEmail(email);
  }

  async function resolveUserDisplays(userIds: string[]): Promise<Map<string, UserDisplayInfo>> {
    if (!school) return new Map();
    return school.resolveUserDisplays(userIds);
  }

  async function resolveStudentProfiles(
    childIds: string[],
  ): Promise<Map<string, { name: string; nickname: string | null }>> {
    if (!school) return new Map();
    return school.resolveStudentProfiles(childIds);
  }

  async function archiveStudent(childId: string): Promise<void> {
    if (!school) throw new Error("School repository not available");
    return school.archiveStudent(childId);
  }

  async function listStudentParentLinks(
    classroomId: string,
    organizationId: string,
  ): Promise<StudentParentLinkInfo[]> {
    if (!school) return [];
    return school.listStudentParentLinks(classroomId, organizationId);
  }

  async function ensureParentInvitationForChild(
    childId: string,
    parentEmail: string,
    invitedBy: string,
    inviterEmail?: string,
  ): Promise<{ id: string; token: string }> {
    if (!school) throw new Error("School repository not available");
    return school.ensureParentInvitationForChild(childId, parentEmail, invitedBy, inviterEmail);
  }

  async function revokeParentLink(childId: string): Promise<void> {
    if (!school) throw new Error("School repository not available");
    return school.revokeParentLink(childId);
  }

  async function ensureTeacherOrganization(userId: string): Promise<{ organizationId: string }> {
    if (!school) throw new Error("School repository not available");
    return school.ensureTeacherOrganization(userId);
  }

  return {
    organizations,
    listClassrooms,
    listActiveClassrooms,
    listArchivedClassrooms,
    getClassroom,
    listChildrenForClassroom,
    listClassroomsForTeacher,
    listTeachersForClassroom,
    createOrganization,
    createClassroom,
    createClassroomForTeacher,
    updateClassroom,
    setClassroomArchived,
    createStudentInClassroom,
    moveStudentBetweenClassrooms,
    listClassroomStudentDetails,
    listTeacherStudentDirectory,
    assignTeacher,
    removeTeacher,
    addChild,
    removeChild,
    findTeacherByEmail,
    resolveUserDisplays,
    resolveStudentProfiles,
    archiveStudent,
    listStudentParentLinks,
    ensureParentInvitationForChild,
    revokeParentLink,
    ensureTeacherOrganization,
  };
}
