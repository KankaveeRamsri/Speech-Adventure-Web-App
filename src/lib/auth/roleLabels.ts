import type { TrustedAppRole } from "@/lib/auth/trustedRole";
import type { TrustedAppRoleStatus } from "@/providers/TrustedRoleProvider";

export const ROLE_LABELS: Record<string, string> = {
  parent: "ผู้ปกครอง",
  teacher: "ครูผู้สอน",
  school_admin: "ผู้ดูแลโรงเรียน",
  therapist: "นักบำบัด",
};

/**
 * Resolves which role KEY (not label text) a piece of UI should display —
 * shared by UserMenu and the Settings account card so there's one place
 * this decision is made.
 *
 * School Admin isn't part of the trusted-role scheme (public.user_app_roles
 * only ever resolves to "teacher" | "parent" — a real school_admin account
 * normalizes to "parent" there, see src/lib/auth/trustedRole.ts), so that
 * case still reads user_metadata directly, immediately (no async wait).
 *
 * Teacher/Parent ONLY resolve once the trusted role is "ready" — returns
 * null while loading, idle, or on error, rather than guessing from
 * user_metadata.role. A caller must render a neutral placeholder for null,
 * never a Parent/Teacher label.
 */
export function resolveDisplayRole(
  metadataRole: string,
  roleStatus: TrustedAppRoleStatus,
  trustedRole: TrustedAppRole | null,
): string | null {
  if (metadataRole === "school_admin") return "school_admin";
  if (roleStatus === "ready" && trustedRole) return trustedRole;
  return null;
}
