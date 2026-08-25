-- ============================================================
-- Migration: 013 — Teacher self-serve organization provisioning
-- Project:   Speech Adventure — Teacher V2 Phase 1
-- Date:      2026-08-25
-- ============================================================
-- Problem:
--   classrooms.organization_id is NOT NULL, and "classrooms: admin insert"
--   (20260527000100_school_classrooms.sql) only allows an org admin/owner to
--   create a classroom. Teacher V2 requires a teacher to use classrooms
--   without any School Admin ever creating an organization for them.
--
-- Fix:
--   ensure_teacher_organization() is an idempotent SECURITY DEFINER RPC:
--     1. Verifies the caller is an authenticated user whose application role
--        is 'teacher', per a server-trusted role source (see below) — not
--        the client-editable auth.users.user_metadata.
--     2. Returns the caller's existing organization if they already own or
--        administer one (reuses the organizations/organization_members
--        tables and RLS from 20260527000100 — no schema changes there).
--     3. Otherwise creates a new organization owned by the caller, using an
--        internal default name (see DEFAULT_TEACHER_ORGANIZATION_NAME in
--        src/types/school.ts) that is never surfaced to the teacher as a
--        School Admin concept.
--   An advisory lock scoped to the caller's user id serializes concurrent
--   calls so repeated/parallel invocations cannot create duplicate orgs —
--   this is the guarantee create_school_organization() alone does not give,
--   since it always creates a new organization unconditionally.
--
-- Trusted role source:
--   Neither existing place a role is stored is safe to use as an
--   authorization check:
--     - auth.users.raw_user_meta_data ('user_metadata') is, by Supabase's
--       own design, freely editable by the signed-in user themselves via
--       supabase.auth.updateUser({ data: { role: ... } }).
--     - public.user_display_profiles.role (20260527000300) is only ever a
--       mirror of the same untrusted value — it re-syncs from
--       raw_user_meta_data on every auth.users UPDATE (including routine
--       ones like login timestamps), and its own RLS policy additionally
--       lets a user UPDATE the row directly.
--   public.user_app_roles is a new, minimal table that closes this gap:
--   populated ONLY by an INSERT-only (never UPDATE) SECURITY DEFINER
--   trigger at account-creation time, with NO client-facing write policy of
--   any kind — only the trigger and service_role can ever write to it. A
--   user changing their own user_metadata after signup has no effect on it.
--
-- Role capture is restrictive, not a pass-through:
--   raw_user_meta_data originates from self-service signup — it is
--   user-supplied input, not a trusted claim. public.normalize_signup_role()
--   promotes ONLY 'teacher'; every other value (parent, school_admin,
--   therapist, anything else, or absent) becomes 'parent'. This matches
--   current product state: public self-service registration only offers
--   parent/teacher (src/lib/auth/roleHelpers.ts:isSignupRoleAllowed —
--   school_admin/therapist are feature-flagged off, see
--   src/lib/config/featureFlags.ts). It means arbitrary metadata can never
--   mint a privileged role in this table, now or if the client-side gate is
--   ever bypassed.
--
--   Checked before writing this backfill: a read-only query against the
--   linked project (`supabase db query --linked`) shows the current user
--   base is 3 accounts — one 'parent', two with no role set (both already
--   treated as 'parent' by the app's own fallback, FALLBACK_ROLE in
--   src/lib/auth/supabaseAuth.ts). There are no existing school_admin or
--   therapist accounts to preserve. Even if there were, this backfill would
--   still be safe to apply uniformly: public.user_app_roles is NOT the
--   account's role of record (that remains auth.users.user_metadata,
--   completely untouched by this migration) and has no consumer besides
--   ensure_teacher_organization() below — a school_admin account has no
--   legitimate reason to call it, since they provision organizations via
--   the pre-existing create_school_organization() RPC, a separate code path
--   this migration does not touch. Restricting this table to teacher/parent
--   cannot downgrade any account's actual role, access, or data.
--
-- SECURITY DEFINER hardening:
--   search_path is set to '' (empty) rather than 'public' on every function
--   below, and every table/function reference is fully schema-qualified
--   (public.*, pg_catalog.*). This eliminates object-resolution risk from a
--   SECURITY DEFINER context entirely, rather than relying on 'public' not
--   being writable by unprivileged roles.
--
-- Explicit EXECUTE privileges:
--   PostgreSQL grants EXECUTE to PUBLIC by default on function creation.
--   Every function below has that default explicitly revoked, then EXECUTE
--   re-granted only to the specific role(s) that legitimately need it — see
--   the REVOKE/GRANT block after each function.
-- ============================================================

-- ── Trusted role source ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.user_app_roles (
  user_id    uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role       text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_app_roles ENABLE ROW LEVEL SECURITY;

-- Users may read their own captured role (harmless, useful for future
-- client-side checks). No INSERT/UPDATE/DELETE policy exists for
-- "authenticated" or "anon" — this table has exactly one writer: the
-- trigger below (SECURITY DEFINER) and service_role/migrations.
CREATE POLICY "user_app_roles: self select"
  ON public.user_app_roles FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Single source of truth for "which signup-supplied role values are ever
-- promoted into public.user_app_roles". Used by both the trigger and the
-- backfill below, so there is exactly one place this rule is defined.
CREATE OR REPLACE FUNCTION public.normalize_signup_role(p_role text)
RETURNS text
LANGUAGE sql
IMMUTABLE
SECURITY INVOKER
SET search_path = ''
AS $$
  SELECT CASE WHEN p_role = 'teacher' THEN 'teacher' ELSE 'parent' END;
$$;

-- Not SECURITY DEFINER and touches no table — carries no privilege-
-- escalation risk either way. Revoked from all client roles anyway, on the
-- same "decide explicitly, don't rely on defaults" principle as the rest of
-- this migration; it has no legitimate direct caller besides the two
-- internal call sites below (which invoke it as the function owner, so the
-- revocation does not affect them — see the confirmation notes at the
-- bottom of this file).
REVOKE ALL ON FUNCTION public.normalize_signup_role(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.normalize_signup_role(text) FROM anon;
REVOKE ALL ON FUNCTION public.normalize_signup_role(text) FROM authenticated;

CREATE OR REPLACE FUNCTION public.capture_user_app_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.user_app_roles (user_id, role)
  VALUES (NEW.id, public.normalize_signup_role(NEW.raw_user_meta_data ->> 'role'))
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Internal trigger function only — never intended to be called directly by
-- any client. Trigger firing does not require EXECUTE privilege (Postgres
-- invokes trigger functions through the trigger manager, not as a plain
-- function call subject to the standard ACL check), so this revocation does
-- not affect the trigger below. See confirmation notes at the bottom of
-- this file.
REVOKE ALL ON FUNCTION public.capture_user_app_role() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.capture_user_app_role() FROM anon;
REVOKE ALL ON FUNCTION public.capture_user_app_role() FROM authenticated;

-- AFTER INSERT only — deliberately never fires on UPDATE, so a user who
-- later edits their own raw_user_meta_data cannot cause this table to be
-- re-synced with an elevated role.
DROP TRIGGER IF EXISTS on_auth_user_role_capture ON auth.users;
CREATE TRIGGER on_auth_user_role_capture
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.capture_user_app_role();

-- One-time backfill for existing users. Additive only: adds a row per
-- existing user derived from their current user_metadata.role, restricted
-- through the same normalize_signup_role() rule as new signups. Does not
-- read, modify, or delete anything else — in particular, it never writes to
-- auth.users itself.
INSERT INTO public.user_app_roles (user_id, role)
SELECT id, public.normalize_signup_role(raw_user_meta_data ->> 'role')
FROM auth.users
ON CONFLICT (user_id) DO NOTHING;

-- ── ensure_teacher_organization ────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.ensure_teacher_organization(p_name text DEFAULT 'Teacher Workspace')
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_org_id uuid;
  v_role   text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  -- Authorization check against the trusted role source — not
  -- auth.users.user_metadata, which the caller can freely edit.
  SELECT role INTO v_role
  FROM public.user_app_roles
  WHERE user_id = auth.uid();

  IF v_role IS DISTINCT FROM 'teacher' THEN
    RAISE EXCEPTION 'only teacher accounts can provision a workspace organization';
  END IF;

  -- Serialize concurrent calls for the same user so the check-then-create
  -- below cannot race into duplicate organizations. Lock is released
  -- automatically at transaction end.
  PERFORM pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtext('ensure_teacher_organization:' || auth.uid()::text)
  );

  SELECT organization_id INTO v_org_id
  FROM public.organization_members
  WHERE user_id = auth.uid()
    AND role IN ('owner', 'admin')
    AND status = 'active'
  ORDER BY created_at ASC
  LIMIT 1;

  IF v_org_id IS NOT NULL THEN
    RETURN v_org_id;
  END IF;

  INSERT INTO public.organizations (name, type, created_by)
  VALUES (p_name, 'school', auth.uid())
  RETURNING id INTO v_org_id;

  INSERT INTO public.organization_members (organization_id, user_id, role, status)
  VALUES (v_org_id, auth.uid(), 'owner', 'active');

  RETURN v_org_id;
END;
$$;

-- Explicit privilege model: revoke the PostgreSQL default (EXECUTE granted
-- to PUBLIC on function creation) and re-grant only to "authenticated".
-- "anon" is revoked explicitly even though it was never granted, so the
-- privilege model doesn't depend on that default having been correct.
REVOKE ALL ON FUNCTION public.ensure_teacher_organization(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.ensure_teacher_organization(text) FROM anon;
GRANT EXECUTE ON FUNCTION public.ensure_teacher_organization(text) TO authenticated;
