-- ─────────────────────────────────────────────────────────────────────────────
-- Migration: child_access grants
-- Phase 10 — connect invitation acceptance to real child access permissions
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Enums ─────────────────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE access_role AS ENUM ('guardian', 'teacher', 'therapist', 'viewer');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ── Table ─────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS child_access (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id    uuid NOT NULL REFERENCES child_profiles(id) ON DELETE CASCADE,
  user_id     uuid NOT NULL REFERENCES auth.users(id)     ON DELETE CASCADE,
  role        access_role NOT NULL,
  -- permissions stored as individual boolean columns for easy RLS expressions
  can_view_progress   boolean NOT NULL DEFAULT true,
  can_view_audio      boolean NOT NULL DEFAULT false,
  can_assign_practice boolean NOT NULL DEFAULT false,
  can_edit_child      boolean NOT NULL DEFAULT false,
  can_export_report   boolean NOT NULL DEFAULT false,
  granted_by  uuid NOT NULL REFERENCES auth.users(id),
  created_at  timestamptz NOT NULL DEFAULT now(),
  revoked_at  timestamptz,
  UNIQUE (child_id, user_id)
);

-- ── Indexes ───────────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS child_access_user_id_idx   ON child_access (user_id);
CREATE INDEX IF NOT EXISTS child_access_child_id_idx  ON child_access (child_id);
CREATE INDEX IF NOT EXISTS child_access_granted_by_idx ON child_access (granted_by);

-- ── RLS ───────────────────────────────────────────────────────────────────────

ALTER TABLE child_access ENABLE ROW LEVEL SECURITY;

-- Owner of the child can read and manage all grants for that child
CREATE POLICY "child owner can manage grants"
  ON child_access
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM child_profiles
      WHERE child_profiles.id = child_access.child_id
        AND child_profiles.user_id = auth.uid()
    )
  );

-- Grantee can read their own active grant
CREATE POLICY "grantee can read own grant"
  ON child_access
  FOR SELECT
  USING (user_id = auth.uid() AND revoked_at IS NULL);

-- ── Patch child_profiles RLS to allow shared access ───────────────────────────
-- Grantees with an active child_access grant can read the profile.
-- We add a new SELECT policy; the existing owner policy is preserved.

DROP POLICY IF EXISTS "grantee can view shared child profile" ON child_profiles;

CREATE POLICY "grantee can view shared child profile"
  ON child_profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM child_access
      WHERE child_access.child_id = child_profiles.id
        AND child_access.user_id  = auth.uid()
        AND child_access.revoked_at IS NULL
    )
  );

-- ── SECURITY DEFINER helper: accept invitation and create grant ───────────────

CREATE OR REPLACE FUNCTION accept_invitation_with_access(
  p_token     uuid,
  p_user_id   uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_inv       invitations%ROWTYPE;
  v_role      access_role;
BEGIN
  -- Fetch and lock invitation
  SELECT * INTO v_inv
  FROM invitations
  WHERE token = p_token
    AND status = 'pending'
    AND expires_at > now()
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'invitation not found or already used';
  END IF;

  -- Mark accepted
  UPDATE invitations
  SET status = 'accepted', accepted_at = now()
  WHERE id = v_inv.id;

  -- Only create child_access when the invitation is tied to a specific child
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

  -- Upsert child_access (idempotent — re-accepting same invite re-activates grant)
  INSERT INTO child_access (
    child_id, user_id, role, granted_by,
    can_view_progress, can_view_audio, can_assign_practice,
    can_edit_child,    can_export_report
  )
  VALUES (
    v_inv.child_id,
    p_user_id,
    v_role,
    v_inv.invited_by,
    -- default permissions per role
    true,
    (v_role IN ('guardian', 'therapist')),
    (v_role IN ('teacher')),
    (v_role IN ('guardian')),
    (v_role <> 'viewer')
  )
  ON CONFLICT (child_id, user_id) DO UPDATE
    SET role       = EXCLUDED.role,
        granted_by = EXCLUDED.granted_by,
        revoked_at = NULL,
        can_view_progress   = EXCLUDED.can_view_progress,
        can_view_audio      = EXCLUDED.can_view_audio,
        can_assign_practice = EXCLUDED.can_assign_practice,
        can_edit_child      = EXCLUDED.can_edit_child,
        can_export_report   = EXCLUDED.can_export_report;
END;
$$;

GRANT EXECUTE ON FUNCTION accept_invitation_with_access(uuid, uuid) TO authenticated;
