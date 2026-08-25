import type { AuthUser } from "@/types/auth";
import type { TrustedAppRole } from "@/lib/auth/trustedRole";
import { FEATURES } from "@/lib/config/featureFlags";

/**
 * Single source of truth for where a user lands after successful auth
 * (sign up, sign in, or session restore). Both auth pages call this instead
 * of duplicating role-branch logic — extend here when a role's destination
 * changes (e.g. when School Admin is re-enabled).
 *
 * `trustedRole` decides the teacher/parent branch (Phase 1.1) — it must be
 * the already-resolved value from useTrustedAppRole(), read from
 * public.user_app_roles, not inferred from user.role
 * (user_metadata.role, which the signed-in user can edit themselves). This
 * function stays synchronous/pure on purpose: the async resolution happens
 * once in the caller (see src/app/auth/signin/page.tsx,
 * src/app/auth/signup/page.tsx), not on every call here.
 *
 * Pass `null` for trustedRole while it's still resolving, on a query error,
 * or for a plain "parent"/unrecognized result — all three collapse to the
 * same safe destination (/training), matching the same "never assume
 * privileged access" rule the Teacher route guard itself enforces (with its
 * own stricter fail-closed + retry behavior — see
 * src/app/teacher/layout.tsx).
 *
 * School Admin / Therapist are untouched by Phase 1.1 — that branch still
 * reads user.role (user_metadata) exactly as before, since neither role
 * flows through the trusted resolver (only 'parent' | 'teacher' do) and
 * their own architecture/flag gating was out of scope for this phase.
 */
export function getPostAuthDestination(
  user: AuthUser | null,
  trustedRole: TrustedAppRole | null,
): string {
  if (!user) return "/training";

  if (trustedRole === "teacher") return "/teacher";

  if (user.role === "school_admin") {
    // School Admin UI is hidden while the flag is off — send even an
    // existing school_admin account into the normal flow instead of a
    // route that will immediately bounce them back out.
    return FEATURES.schoolAdmin ? "/school" : "/training";
  }

  // parent, therapist, or an unresolved/unrecognized trusted role.
  return "/training";
}
