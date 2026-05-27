// School / classroom domain types for Speech Adventure.
// Phase 13 foundation — full school admin and CSV import are later phases.

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
}

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

export const ORG_TYPE_LABELS: Record<OrganizationType, string> = {
  family: "ครอบครัว",
  school: "โรงเรียน",
  clinic: "คลินิก",
};

export const ORG_MEMBER_ROLE_LABELS: Record<OrgMemberRole, string> = {
  owner: "เจ้าของ",
  admin: "ผู้ดูแลระบบ",
  teacher: "ครู",
  therapist: "นักบำบัด",
  parent: "ผู้ปกครอง",
  viewer: "ผู้ชม",
};
