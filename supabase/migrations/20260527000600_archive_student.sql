-- Phase 15.0: Soft-delete (archive) for imported students
-- Adds archived_at to child_profiles and a SECURITY DEFINER helper that
-- atomically removes classroom membership, revokes access/invitations,
-- and marks the profile as archived — without touching practice data.

ALTER TABLE child_profiles
  ADD COLUMN IF NOT EXISTS archived_at timestamptz DEFAULT NULL;

-- ── archive_student ────────────────────────────────────────────────────────────
-- Only org admins may archive a student that belongs to their organisation.
-- Archived profiles are excluded from classroom lists but kept in
-- listStudentCodes so re-import shows "already exists" rather than crashing
-- on the student_code unique index.

CREATE OR REPLACE FUNCTION archive_student(p_child_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_org_id uuid;
BEGIN
  SELECT cp.organization_id INTO v_org_id
    FROM child_profiles cp
   WHERE cp.id = p_child_id;

  IF v_org_id IS NULL OR NOT is_org_admin(v_org_id) THEN
    RAISE EXCEPTION 'Not authorized: caller must be org admin for this student';
  END IF;

  -- Mark archived
  UPDATE child_profiles
     SET archived_at = now()
   WHERE id = p_child_id AND archived_at IS NULL;

  -- Remove from all classrooms
  DELETE FROM classroom_students WHERE child_id = p_child_id;

  -- Revoke guardian access
  UPDATE child_access
     SET revoked_at = now()
   WHERE child_id = p_child_id
     AND role = 'guardian'
     AND revoked_at IS NULL;

  -- Revoke / cancel pending or accepted parent invitations
  UPDATE invitations
     SET status = 'revoked', updated_at = now()
   WHERE child_id = p_child_id
     AND role = 'parent'
     AND status IN ('pending', 'accepted');
END;
$$;

GRANT EXECUTE ON FUNCTION archive_student(uuid) TO authenticated;
