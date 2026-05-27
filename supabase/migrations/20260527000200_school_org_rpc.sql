-- ============================================================
-- Migration: 012 — School Organization Creation Helper
-- Project:   Speech Adventure
-- Date:      2026-05-27
-- ============================================================
-- Problem:
--   organizations INSERT policy: WITH CHECK (created_by = auth.uid())
--   organization_members INSERT policy: WITH CHECK (is_org_admin(organization_id))
--
--   Chicken-and-egg: the owner membership row does not exist yet when the
--   first member is being inserted, so is_org_admin() returns false and the
--   member INSERT fails (42501).
--
-- Fix:
--   A SECURITY DEFINER function atomically inserts both rows as the DB owner,
--   then returns the new organization id.  The caller then SELECTs the org
--   through normal RLS (which now passes because the member row exists).
--
--   Also adds is_org_creator() helper used by other policies.
-- ============================================================

-- ── SECURITY DEFINER helper ───────────────────────────────────────────────────

-- Returns true when auth.uid() is the creator of the given organization.
-- Bypasses RLS — safe because this function only exposes a boolean.
CREATE OR REPLACE FUNCTION is_org_creator(p_org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM organizations
    WHERE id         = p_org_id
      AND created_by = auth.uid()
  );
$$;

GRANT EXECUTE ON FUNCTION is_org_creator(uuid) TO authenticated;

-- ── Atomic org + owner-member creation ───────────────────────────────────────
--
-- create_school_organization:
--   1. Validates auth.uid() is non-null.
--   2. Inserts the organization with created_by = auth.uid().
--   3. Inserts the caller as owner/active member.
--   4. Returns the new organization id so the caller can SELECT it.
--
-- The caller can read back the org row via the normal SELECT policy because
-- the member row now exists (is_org_member() returns true).

CREATE OR REPLACE FUNCTION create_school_organization(
  p_name text,
  p_type organization_type
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  INSERT INTO organizations (name, type, created_by)
  VALUES (p_name, p_type, auth.uid())
  RETURNING id INTO v_org_id;

  INSERT INTO organization_members (organization_id, user_id, role, status)
  VALUES (v_org_id, auth.uid(), 'owner', 'active');

  RETURN v_org_id;
END;
$$;

GRANT EXECUTE ON FUNCTION create_school_organization(text, organization_type) TO authenticated;

-- ── Fix org_members bootstrap INSERT policy ───────────────────────────────────
--
-- The original "org_members: admin insert" policy blocks the very first
-- member insertion because is_org_admin() finds no existing admin rows.
--
-- Replace it with a two-clause policy:
--   a) org admins can insert new members (existing behaviour)
--   b) the org creator can insert their own first membership
--      (uses is_org_creator() which bypasses RLS so no recursion)

DROP POLICY IF EXISTS "org_members: admin insert" ON organization_members;

CREATE POLICY "org_members: admin or creator insert"
  ON organization_members FOR INSERT
  WITH CHECK (
    is_org_admin(organization_id)
    OR (user_id = auth.uid() AND is_org_creator(organization_id))
  );
