// School / classroom domain types for Speech Adventure.
// Phase 13 foundation — full school admin and CSV import are later phases.

/**
 * Internal name used when an organization is auto-provisioned for a teacher
 * (Teacher V2 Phase 1 — see ISchoolRepository.ensureTeacherOrganization).
 * Never shown as a "create your organization" concept in Teacher UI — the
 * teacher experiences this as using Speech Adventure independently.
 */
export const DEFAULT_TEACHER_ORGANIZATION_NAME = "Teacher Workspace";

export type OrganizationType = "family" | "school" | "clinic";
export type OrgMemberRole = "owner" | "admin" | "teacher" | "therapist" | "parent" | "viewer";
export type OrgMemberStatus = "active" | "invited" | "removed";

export interface Organization {
  id: string;
  name: string;
  type: OrganizationType;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrganizationMember {
  id: string;
  organizationId: string;
  userId: string;
  role: OrgMemberRole;
  status: OrgMemberStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Classroom {
  id: string;
  organizationId: string;
  name: string;
  gradeLevel: string | null;
  academicYear: string | null;
  createdAt: string;
  updatedAt: string;
  /** null = active; ISO timestamp = archived (Teacher V2 Phase 2). */
  archivedAt: string | null;
}

/** Convenience view of {@link Classroom.archivedAt}. */
export function classroomStatus(c: Pick<Classroom, "archivedAt">): "active" | "archived" {
  return c.archivedAt ? "archived" : "active";
}

export const CLASSROOM_STATUS_LABELS: Record<"active" | "archived", string> = {
  active: "ใช้งานอยู่",
  archived: "เก็บไว้",
};

export interface ClassroomStudent {
  classroomId: string;
  childId: string;
  createdAt: string;
}

export interface ClassroomTeacher {
  classroomId: string;
  teacherUserId: string;
  createdAt: string;
}

export interface CreateOrganizationInput {
  name: string;
  type: OrganizationType;
  createdBy: string;
}

export interface CreateClassroomInput {
  organizationId: string;
  name: string;
  gradeLevel?: string;
  academicYear?: string;
}

/** Editable classroom metadata (Teacher V2 Phase 2). All fields optional. */
export interface UpdateClassroomInput {
  name?: string;
  gradeLevel?: string | null;
  academicYear?: string | null;
}

/**
 * Fields for a teacher-created ("school-managed") student profile.
 * The created child_profiles row is owned by the creating teacher and
 * carries organization_id = the teacher's workspace org. It is NOT
 * parent-linked (Teacher V2 Phase 2, constraint B).
 */
export interface CreateClassroomStudentInput {
  name: string;
  age?: number;
  nickname?: string;
  gradeLevel?: string;
}

/** A classroom roster row joined with the child's display data. */
export interface ClassroomStudentDetail {
  childId: string;
  classroomId: string;
  name: string;
  nickname: string | null;
  avatarEmoji: string | null;
  /** When the child was added to this classroom. */
  addedAt: string;
  /** True when the child_profiles row is owned by the current teacher. */
  teacherManaged: boolean;
}

/** A student in the teacher's cross-classroom directory (Phase 2 §12). */
export interface TeacherStudentDirectoryEntry {
  childId: string;
  name: string;
  nickname: string | null;
  avatarEmoji: string | null;
  /** Active (non-archived) classrooms this child belongs to. */
  classrooms: { id: string; name: string }[];
}

/**
 * Full profile of one student for the Teacher Student Detail header
 * (Phase 3). Resolved through the RLS-scoped child_profiles read — null
 * when the caller has no access to the child.
 */
export interface TeacherStudentProfile {
  childId: string;
  name: string;
  nickname: string | null;
  avatarEmoji: string | null;
  age: number | null;
  gradeLevel: string | null;
  /** "speech_clarity" | "kindergarten_phonics" | other string. */
  trainingMode: string;
  targetSound: string | null;
  /** True when the current teacher owns this child_profiles row. */
  teacherManaged: boolean;
  /** Active (non-archived) classrooms this child belongs to that the teacher teaches. */
  classrooms: { id: string; name: string }[];
}

export interface UserDisplayInfo {
  userId: string;
  email: string;
  role: string | null;
}

export const ORG_TYPE_LABELS: Record<OrganizationType, string> = {
  family: "ครอบครัว",
  school: "โรงเรียน",
  clinic: "คลินิก",
};

// ── Parent linking (Phase 15) ─────────────────────────────────────────────────

export type ParentLinkStatus =
  | "no_parent_email"
  | "pending"
  | "accepted"
  | "revoked"
  | "missing_invite";

export interface StudentParentLinkInfo {
  childId: string;
  name: string;
  nickname: string | null;
  studentCode: string | null;
  parentEmail: string | null;
  parentLinkStatus: ParentLinkStatus;
  invitationId: string | null;
  invitationToken: string | null;
}

export const PARENT_LINK_STATUS_LABELS: Record<ParentLinkStatus, string> = {
  no_parent_email: "ยังไม่มีอีเมลผู้ปกครอง",
  pending:         "รอตอบรับ",
  accepted:        "ตอบรับแล้ว",
  revoked:         "ยกเลิกแล้ว",
  missing_invite:  "ยังไม่ได้สร้างคำเชิญ",
};

export const ORG_MEMBER_ROLE_LABELS: Record<OrgMemberRole, string> = {
  owner: "เจ้าของ",
  admin: "ผู้ดูแลระบบ",
  teacher: "ครู",
  therapist: "นักบำบัด",
  parent: "ผู้ปกครอง",
  viewer: "ผู้ชม",
};
