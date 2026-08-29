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
import type { ValidatedImportRow, ImportResult } from "@/types/schoolImport";

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
  /**
   * All classrooms in the org the caller's cache holds (active + archived).
   * Kept for the legacy School Admin console. Teacher V2 should call
   * listActiveClassrooms / listArchivedClassrooms instead so the archived
   * filter is applied in the repository, never only in the UI.
   */
  listClassrooms(organizationId: string): Classroom[];
  /**
   * Stable-reference snapshot of every cached classroom, for
   * useSyncExternalStore. The array identity changes on every classroom
   * mutation (create / update / archive) and on hydrate, and never
   * otherwise — so a component subscribed to it re-renders exactly when
   * classroom data changes, including a classroom-only change that leaves
   * the organizations snapshot untouched.
   */
  getClassroomsSnapshot(): Classroom[];
  getServerClassroomsSnapshot(): Classroom[];
  /** Active (archivedAt === null) classrooms in the organization. */
  listActiveClassrooms(organizationId: string): Classroom[];
  /** Archived (archivedAt !== null) classrooms in the organization. */
  listArchivedClassrooms(organizationId: string): Classroom[];
  /** A single classroom from cache, or null when the caller cannot see it. */
  getClassroom(classroomId: string): Classroom | null;
  createClassroom(input: CreateClassroomInput): Promise<Classroom>;
  /**
   * Creates a classroom AND registers `teacherUserId` in classroom_teachers
   * as its first teacher, as one unit. If the teacher assignment fails the
   * just-created classroom is rolled back (deleted) so no partial state
   * (a classroom with no teacher) is left behind — see implementation.
   */
  createClassroomForTeacher(
    input: CreateClassroomInput,
    teacherUserId: string,
  ): Promise<Classroom>;
  /** Updates classroom metadata (name / grade / academic year). */
  updateClassroom(classroomId: string, patch: UpdateClassroomInput): Promise<Classroom>;
  /**
   * Archives (archived=true) or restores (archived=false) a classroom by
   * setting/clearing archived_at ONLY. Never deletes classroom_students,
   * classroom_teachers, child profiles, or practice history.
   */
  setClassroomArchived(classroomId: string, archived: boolean): Promise<Classroom>;

  // ── Classroom assignments ─────────────────────────────────────────────────────
  assignTeacherToClassroom(classroomId: string, teacherUserId: string): Promise<ClassroomTeacher>;
  removeTeacherFromClassroom(classroomId: string, teacherUserId: string): Promise<void>;
  addChildToClassroom(classroomId: string, childId: string): Promise<ClassroomStudent>;
  removeChildFromClassroom(classroomId: string, childId: string): Promise<void>;
  /**
   * Creates a teacher-managed student profile (owned by `teacherUserId`,
   * organization_id = `organizationId`) and enrolls it in the classroom, as
   * one unit. Rolls the profile back if enrollment fails. The profile is NOT
   * parent-linked (constraint B).
   */
  createStudentInClassroom(
    classroomId: string,
    organizationId: string,
    teacherUserId: string,
    input: CreateClassroomStudentInput,
  ): Promise<ClassroomStudent>;
  /**
   * Moves a child from one classroom to another. Both classrooms must belong
   * to the same organization. Changes classroom membership only — no child
   * profile or practice data is touched.
   */
  moveStudentBetweenClassrooms(
    childId: string,
    fromClassroomId: string,
    toClassroomId: string,
  ): Promise<void>;
  listChildrenForClassroom(classroomId: string): ClassroomStudent[];
  /** Roster rows for a classroom joined with each child's display data. */
  listClassroomStudentDetails(classroomId: string): Promise<ClassroomStudentDetail[]>;
  /** Every student across the teacher's active classrooms (Phase 2 §12). */
  listTeacherStudentDirectory(userId: string): Promise<TeacherStudentDirectoryEntry[]>;
  listClassroomsForTeacher(userId: string): Classroom[];
  listTeachersForClassroom(classroomId: string): ClassroomTeacher[];

  // ── User display (for teacher search / list display) ─────────────────────────
  /** Find a user by exact email match — returns null if not found. */
  findTeacherByEmail(email: string): Promise<UserDisplayInfo | null>;
  /** Resolve display info for a batch of user IDs (best-effort; missing IDs are omitted). */
  resolveUserDisplays(userIds: string[]): Promise<Map<string, UserDisplayInfo>>;

  // ── Student profile resolution ───────────────────────────────────────────────
  /**
   * Fetch display data (name + nickname) for a batch of child IDs.
   * Used to show human-readable names for imported students whose profiles
   * may not be in the profile repository's in-memory cache yet.
   * Missing IDs are silently omitted from the result map.
   */
  resolveStudentProfiles(
    childIds: string[],
  ): Promise<Map<string, { name: string; nickname: string | null }>>;

  // ── Student import ────────────────────────────────────────────────────────────
  /** Returns existing student_codes for duplicate detection before import. */
  listStudentCodes(organizationId: string): Promise<string[]>;
  /**
   * Bulk-create child_profiles + classroom_students for validated import rows.
   * Rows with status "error" or isExistingInDb are skipped automatically.
   * creatorUserId becomes the user_id on each created child_profile.
   */
  importStudents(
    rows: ValidatedImportRow[],
    classrooms: Classroom[],
    organizationId: string,
    creatorUserId: string,
  ): Promise<ImportResult>;

  /**
   * Soft-delete a student from the organisation: marks the profile archived,
   * removes classroom membership, and revokes parent access/invitations.
   * Practice data is NOT deleted.
   */
  archiveStudent(childId: string): Promise<void>;

  // ── Parent linking (Phase 15) ─────────────────────────────────────────────────

  /**
   * Returns parent-link status for every student in a classroom.
   * Combines child_profiles.parent_email_pending with the latest parent invitation per child.
   */
  listStudentParentLinks(classroomId: string, organizationId: string): Promise<StudentParentLinkInfo[]>;

  /**
   * Creates a pending parent invitation for the child if one does not already exist.
   * Idempotent: re-importing the same parent email will not create a duplicate pending invite.
   * Returns the invitation id and token.
   */
  ensureParentInvitationForChild(
    childId: string,
    parentEmail: string,
    invitedBy: string,
    inviterEmail?: string,
  ): Promise<{ id: string; token: string }>;

  /**
   * Revokes all active parent invitations and guardian child_access for a student.
   * Calls the revoke_parent_link_for_child SECURITY DEFINER RPC.
   * Practice data is NOT deleted.
   */
  revokeParentLink(childId: string): Promise<void>;

  // ── Teacher self-serve provisioning (Teacher V2 Phase 1) ──────────────────────

  /**
   * Idempotently ensures the given user has an organization they administer
   * (owner/admin membership), creating one internally if they don't have one
   * yet. Required because classrooms.organization_id is NOT NULL and only an
   * org admin can create a classroom — this lets a teacher use classrooms in
   * Phase 2+ without any School Admin ever provisioning an organization for
   * them. Safe to call on every Teacher V2 page load: reuses an existing
   * org/membership rather than creating a duplicate. Never call this for a
   * parent account.
   */
  ensureTeacherOrganization(userId: string): Promise<{ organizationId: string }>;

  // ── Scope ─────────────────────────────────────────────────────────────────────
  setScope(userId: string | null): void;
}
