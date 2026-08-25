import type { AuthUser } from "@/types/auth";
import { FEATURES } from "@/lib/config/featureFlags";

/**
 * Single source of truth for where a user lands after successful auth
 * (sign up, sign in, or session restore). Both auth pages call this instead
 * of duplicating role-branch logic — extend here when a role's destination
 * changes (e.g. when School Admin is re-enabled).
 */
export function getPostAuthDestination(user: AuthUser | null): string {
  if (!user) return "/training";

  switch (user.role) {
    case "teacher":
      return "/teacher";
    case "school_admin":
      // School Admin UI is hidden while the flag is off — send even an
      // existing school_admin account into the normal flow instead of a
      // route that will immediately bounce them back out.
      return FEATURES.schoolAdmin ? "/school" : "/training";
    case "therapist":
      // Therapist product surface does not exist yet.
      return "/training";
    case "parent":
    default:
      return "/training";
  }
}
