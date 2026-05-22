import type { AuthUser, UserRole } from "@/types/auth";

/**
 * Lightweight role predicate helpers.
 *
 * All functions accept null safely — returns false for unauthenticated users
 * except isParent(), which returns true (anonymous users default to the
 * parent flow until a role is explicitly set).
 */

export function getUserRole(user: AuthUser | null): UserRole {
  return user?.role ?? "parent";
}

export function isParent(user: AuthUser | null): boolean {
  return getUserRole(user) === "parent";
}

export function isTeacher(user: AuthUser | null): boolean {
  return user?.role === "teacher";
}

export function isTherapist(user: AuthUser | null): boolean {
  return user?.role === "therapist";
}

export function isSchoolAdmin(user: AuthUser | null): boolean {
  return user?.role === "school_admin";
}

/** True for roles that have access to multi-child / school features (not yet built). */
export function isProfessionalRole(user: AuthUser | null): boolean {
  const r = user?.role;
  return r === "teacher" || r === "therapist" || r === "school_admin";
}
