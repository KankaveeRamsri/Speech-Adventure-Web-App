import type { AuthUser, UserRole } from "@/types/auth";
import { FEATURES } from "@/lib/config/featureFlags";

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

/**
 * True when `role` is selectable at signup given the current feature flags.
 *
 * `parent` and `teacher` are always allowed. `school_admin` and `therapist`
 * require their respective feature flag — this is the enforcement point, not
 * just the signup form's disabled-button styling, so a role gated off by a
 * flag cannot be created even if a caller bypasses the UI (e.g. by editing
 * client state before submit).
 */
export function isSignupRoleAllowed(role: UserRole | null | undefined): boolean {
  if (!role || role === "parent" || role === "teacher") return true;
  if (role === "school_admin") return FEATURES.schoolAdmin;
  if (role === "therapist") return FEATURES.therapist;
  return false;
}
