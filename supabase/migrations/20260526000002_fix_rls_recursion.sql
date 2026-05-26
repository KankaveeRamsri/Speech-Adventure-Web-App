-- ============================================================
-- Migration: 010 — Fix RLS Infinite Recursion
-- Project:   Speech Adventure
-- Date:      2026-05-26
-- ============================================================
-- Root cause:
--   child_access policy  → queries child_profiles (to check ownership)
--   child_profiles policy → queries child_access  (to check grantee)
--   → infinite recursion when either table is accessed
--
-- Fix strategy:
--   1. Create SECURITY DEFINER helpers that bypass RLS on internal lookups.
--   2. Replace recursive policies with helpers.
--   3. Fix accept_invitation_with_access token param (uuid → text).
--   4. Add revoke_child_access SECURITY DEFINER for safe owner-only revoke.
-- ============================================================

-- ── SECURITY DEFINER helpers ──────────────────────────────────────────────────
-- These run as the function owner (postgres), bypassing RLS on every table
-- they query. This is the standard Supabase pattern for breaking recursive
-- policy chains.

-- is_child_owner: returns true when auth.uid() owns the given child profile.
-- Queries child_profiles WITHOUT triggering child_profiles RLS.
CREATE OR REPLACE FUNCTION is_child_owner(p_child_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM child_profiles
    WHERE id      = p_child_id
      AND user_id = auth.uid()
  );
$$;

-- is_child_grantee: returns true when auth.uid() has an active (non-revoked)
-- child_access grant for the given child.
-- Queries child_access WITHOUT triggering child_access RLS.
CREATE OR REPLACE FUNCTION is_child_grantee(p_child_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM child_access
    WHERE child_id   = p_child_id
      AND user_id    = auth.uid()
      AND revoked_at IS NULL
  );
$$;

-- ── child_profiles: fix grantee policy (was recursive) ───────────────────────
-- The old policy queried child_access directly, triggering child_access RLS
-- which in turn queried child_profiles → infinite loop.
-- Replacement: call is_child_grantee() which bypasses RLS.

DROP POLICY IF EXISTS "grantee can view shared child profile" ON child_profiles;

CREATE POLICY "child_profiles: grantee select"
  ON child_profiles FOR SELECT
  USING (is_child_grantee(id));

-- ── child_access: replace recursive ALL policy with 4 safe policies ───────────
-- The old "FOR ALL" policy queried child_profiles directly, triggering
-- child_profiles RLS which queried child_access → infinite loop.
-- Replacement: call is_child_owner() which bypasses RLS.

DROP POLICY IF EXISTS "child owner can manage grants" ON child_access;

CREATE POLICY "child_access: owner select"
  ON child_access FOR SELECT
  USING (is_child_owner(child_id));

CREATE POLICY "child_access: owner insert"
  ON child_access FOR INSERT
  WITH CHECK (is_child_owner(child_id));

CREATE POLICY "child_access: owner update"
  ON child_access FOR UPDATE
  USING  (is_child_owner(child_id))
  WITH CHECK (is_child_owner(child_id));

CREATE POLICY "child_access: owner delete"
  ON child_access FOR DELETE
  USING (is_child_owner(child_id));

-- ── Fix accept_invitation_with_access: token uuid → text ─────────────────────
-- invitations.token is now stored as text (crypto.randomUUID() returns a string,
-- not a PostgreSQL uuid). The old signature used uuid which caused a cast error.

DROP FUNCTION IF EXISTS accept_invitation_with_access(uuid, uuid);

CREATE OR REPLACE FUNCTION accept_invitation_with_access(
  p_token   text,
  p_user_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_inv  invitations%ROWTYPE;
  v_role access_role;
BEGIN
  -- Fetch and lock pending invitation by token
  SELECT * INTO v_inv
  FROM   invitations
  WHERE  token      = p_token
    AND  status     = 'pending'
    AND  expires_at > now()
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'invitation not found, already used, or expired';
  END IF;

  -- Mark invitation accepted
  UPDATE invitations
  SET  status      = 'accepted',
       accepted_at = now(),
       accepted_by = p_user_id,
       updated_at  = now()
  WHERE id = v_inv.id;

  -- Skip child_access creation when no child is attached
  IF v_inv.child_id IS NULL THEN
    RETURN;
  END IF;

  -- Map invitation role → access role
  v_role := CASE v_inv.role
    WHEN 'parent'       THEN 'guardian'::access_role
    WHEN 'teacher'      THEN 'teacher'::access_role
    WHEN 'therapist'    THEN 'therapist'::access_role
    WHEN 'school_admin' THEN 'guardian'::access_role
    WHEN 'viewer'       THEN 'viewer'::access_role
    ELSE                     'viewer'::access_role
  END;

  -- Upsert child_access — idempotent; re-accepting the same invite re-activates
  INSERT INTO child_access (
    child_id, user_id, role, granted_by,
    can_view_progress, can_view_audio, can_assign_practice,
    can_edit_child,    can_export_report
  )
  VALUES (
    v_inv.child_id, p_user_id, v_role, v_inv.invited_by,
    true,
    (v_role IN ('guardian', 'therapist')),
    (v_role =  'teacher'),
    (v_role =  'guardian'),
    (v_role <> 'viewer')
  )
  ON CONFLICT (child_id, user_id) DO UPDATE
    SET role                = EXCLUDED.role,
        granted_by          = EXCLUDED.granted_by,
        revoked_at          = NULL,
        can_view_progress   = EXCLUDED.can_view_progress,
        can_view_audio      = EXCLUDED.can_view_audio,
        can_assign_practice = EXCLUDED.can_assign_practice,
        can_edit_child      = EXCLUDED.can_edit_child,
        can_export_report   = EXCLUDED.can_export_report;
END;
$$;

GRANT EXECUTE ON FUNCTION accept_invitation_with_access(text, uuid) TO authenticated;

-- ── revoke_child_access: SECURITY DEFINER for owner-only revoke ──────────────
-- The child owner calls this to soft-revoke an access grant.
-- Using SECURITY DEFINER ensures the UPDATE succeeds without relying on
-- complex RLS UPDATE policies that could re-introduce recursion.
-- Auth check is explicit inside the function — no policy bypass for unrelated data.

CREATE OR REPLACE FUNCTION revoke_child_access(p_access_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow if auth.uid() owns the child profile linked to this grant
  UPDATE child_access ca
  SET    revoked_at = now()
  FROM   child_profiles cp
  WHERE  ca.id        = p_access_id
    AND  cp.id        = ca.child_id
    AND  cp.user_id   = auth.uid()
    AND  ca.revoked_at IS NULL;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'access grant not found or you do not own the child';
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION revoke_child_access(uuid) TO authenticated;
