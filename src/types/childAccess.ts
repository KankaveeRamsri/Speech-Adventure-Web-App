// Child access domain types for Speech Adventure.
// Represents the permissions a non-owner user has over a shared child profile.

import type { ChildProfileData } from "@/lib/child-profile/childProfileStorage";
import type { InvitationRole } from "@/types/invitations";

export type AccessRole = "guardian" | "teacher" | "therapist" | "viewer";

export interface ChildPermissions {
  canViewProgress: boolean;
  canViewAudio: boolean;
  /** User can start practice sessions, record audio, and create attempts. */
  canStartPractice: boolean;
  /** User can assign/plan practice for the child (separate from actually running it). */
  canAssignPractice: boolean;
  canEditChild: boolean;
  canExportReport: boolean;
}

export interface ChildAccess {
  id: string;
  /** The child this grant covers. */
  childId: string;
  /** User who received the access. */
  userId: string;
  role: AccessRole;
  permissions: ChildPermissions;
  /** User who granted the access (usually the child's owner). */
  grantedBy: string;
  createdAt: string;
  revokedAt?: string;
  /** Snapshot of the child profile at grant time — used in localStorage mode. */
  childSnapshot?: ChildProfileData;
}

export interface GrantChildAccessInput {
  childId: string;
  userId: string;
  role: AccessRole;
  permissions?: Partial<ChildPermissions>;
  grantedBy: string;
  childSnapshot?: ChildProfileData;
}

export const FULL_PERMISSIONS: ChildPermissions = {
  canViewProgress: true,
  canViewAudio: true,
  canStartPractice: true,
  canAssignPractice: true,
  canEditChild: true,
  canExportReport: true,
};

export const ROLE_DEFAULT_PERMISSIONS: Record<AccessRole, ChildPermissions> = {
  guardian:  { canViewProgress: true,  canViewAudio: true,  canStartPractice: true,  canAssignPractice: false, canEditChild: true,  canExportReport: true  },
  teacher:   { canViewProgress: true,  canViewAudio: false, canStartPractice: true,  canAssignPractice: true,  canEditChild: false, canExportReport: true  },
  therapist: { canViewProgress: true,  canViewAudio: true,  canStartPractice: true,  canAssignPractice: false, canEditChild: false, canExportReport: true  },
  viewer:    { canViewProgress: true,  canViewAudio: false, canStartPractice: false, canAssignPractice: false, canEditChild: false, canExportReport: false },
};

export const ACCESS_ROLE_LABELS: Record<AccessRole, string> = {
  guardian:  "ผู้ปกครองร่วม",
  teacher:   "ครู",
  therapist: "นักบำบัด",
  viewer:    "ผู้ชม",
};

/** Maps InvitationRole → AccessRole for use when accepting an invite. */
export function invitationRoleToAccessRole(role: InvitationRole): AccessRole {
  switch (role) {
    case "parent":      return "guardian";
    case "teacher":     return "teacher";
    case "therapist":   return "therapist";
    case "school_admin": return "guardian";
    case "viewer":      return "viewer";
  }
}
