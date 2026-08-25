// Trusted application-role resolution (Teacher V2 Phase 1.1).
//
// auth.users.user_metadata.role (read by roleHelpers.ts / AuthUser.role) is
// freely editable by the signed-in user themselves via
// supabase.auth.updateUser() — it must never be trusted for an authorization
// decision. public.user_app_roles.role is the authoritative source: it's
// populated once, server-side, by an INSERT-only trigger at signup, with no
// client write path at all (see
// supabase/migrations/20260825000100_ensure_teacher_organization.sql).
//
// This is the ONLY module that queries user_app_roles. Every authorization
// decision (Teacher route access, organization provisioning) should go
// through useTrustedAppRole() (src/hooks/useTrustedAppRole.ts) rather than
// querying this table directly from a component.

import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/client";

/**
 * The only two roles the trusted source can ever produce today — School
 * Admin and Therapist are feature-flagged off and were never candidates for
 * this resolver (see normalize_signup_role() in the Phase 1 migration).
 */
export type TrustedAppRole = "parent" | "teacher";

// Session-lifetime cache, keyed by user id. Avoids a redundant query when
// multiple components resolve the trusted role for the same user (e.g. the
// Teacher route guard and useTeacherOrganization both call this per page
// load) — only the first caller hits the network.
const _cache = new Map<string, TrustedAppRole | null>();

/** Forces the next fetchTrustedAppRole(userId) call to hit the network again. */
export function invalidateTrustedAppRole(userId: string): void {
  _cache.delete(userId);
}

/**
 * Resolves userId's authorization-grade role from public.user_app_roles.
 *
 * Returns null — never "teacher" — when: Supabase isn't configured, no row
 * exists yet for this user, or its value isn't a recognized role. A missing
 * or ambiguous row must never be treated as an implicit grant.
 *
 * Throws on a genuine query failure so the caller can fail closed and offer
 * a retry, rather than silently treating an error as "not a teacher" (which
 * would be indistinguishable from a real non-teacher to the caller and
 * would hide a transient outage behind a confident-looking denial).
 */
export async function fetchTrustedAppRole(userId: string): Promise<TrustedAppRole | null> {
  const cached = _cache.get(userId);
  if (cached !== undefined) return cached;

  if (!isSupabaseConfigured()) return null;
  const client = getSupabaseClient();
  if (!client) return null;

  const { data, error } = await client
    .from("user_app_roles")
    .select("role")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) throw error;

  const role: TrustedAppRole | null =
    data?.role === "teacher" ? "teacher" : data?.role === "parent" ? "parent" : null;

  _cache.set(userId, role);
  return role;
}
