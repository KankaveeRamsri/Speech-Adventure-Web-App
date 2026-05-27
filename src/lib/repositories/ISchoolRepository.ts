import type {
  Organization,
  Classroom,
  ClassroomStudent,
  ClassroomTeacher,
  CreateOrganizationInput,
  CreateClassroomInput,
  UserDisplayInfo,
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
  removeTeacherFromClassroom(classroomId: string, teacherUserId: string): Promise<void>;
  addChildToClassroom(classroomId: string, childId: string): Promise<ClassroomStudent>;
  removeChildFromClassroom(classroomId: string, childId: string): Promise<void>;
  listChildrenForClassroom(classroomId: string): ClassroomStudent[];
  listClassroomsForTeacher(userId: string): Classroom[];
  listTeachersForClassroom(classroomId: string): ClassroomTeacher[];

  // ── User display (for teacher search / list display) ─────────────────────────
  /** Find a user by exact email match — returns null if not found. */
  findTeacherByEmail(email: string): Promise<UserDisplayInfo | null>;
  /** Resolve display info for a batch of user IDs (best-effort; missing IDs are omitted). */
  resolveUserDisplays(userIds: string[]): Promise<Map<string, UserDisplayInfo>>;

  // ── Scope ─────────────────────────────────────────────────────────────────────
  setScope(userId: string | null): void;
}
