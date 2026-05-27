import type {
  Organization,
  Classroom,
  ClassroomStudent,
  ClassroomTeacher,
  CreateOrganizationInput,
  CreateClassroomInput,
} from "@/types/school";

/**
 * Contract for school / classroom data.
 *
 * Follows the same useSyncExternalStore-compatible subscribe/snapshot pattern
 * as other Speech Adventure repositories.
 *
 * Scope is set via setScope(userId) — data is filtered by the calling user's
 * membership when possible.
 */
export interface ISchoolRepository {
  subscribe(callback: () => void): () => void;

  // ── Organizations ─────────────────────────────────────────────────────────────
  /** Organizations the current user is an active member of. */
  listMyOrganizations(): Organization[];
  getServerOrganizations(): Organization[];
  createSchoolOrganization(input: CreateOrganizationInput): Promise<Organization>;

  // ── Classrooms ────────────────────────────────────────────────────────────────
  listClassrooms(organizationId: string): Classroom[];
  createClassroom(input: CreateClassroomInput): Promise<Classroom>;

  // ── Classroom assignments ─────────────────────────────────────────────────────
  assignTeacherToClassroom(classroomId: string, teacherUserId: string): Promise<ClassroomTeacher>;
  addChildToClassroom(classroomId: string, childId: string): Promise<ClassroomStudent>;
  listChildrenForClassroom(classroomId: string): ClassroomStudent[];
  listClassroomsForTeacher(userId: string): Classroom[];
  listTeachersForClassroom(classroomId: string): ClassroomTeacher[];

  // ── Scope ─────────────────────────────────────────────────────────────────────
  setScope(userId: string | null): void;
}
