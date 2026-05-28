-- Phase 15.0 fix: re-add archived_at after remote schema dump removed it.
-- The remote_schema migration (20260527111110) was generated before archive_student
-- was applied to the remote database, so it dropped the column.  This migration
-- restores it.

ALTER TABLE public.child_profiles
  ADD COLUMN IF NOT EXISTS archived_at timestamptz DEFAULT NULL;

-- Index: active imported students by org (covers listStudentCodes + assignable lists)
CREATE INDEX IF NOT EXISTS child_profiles_org_active_idx
  ON public.child_profiles (organization_id, archived_at)
  WHERE archived_at IS NULL;

-- Restore archive_student function (also dropped by remote_schema dump)
CREATE OR REPLACE FUNCTION public.archive_student(p_child_id uuid)
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

  UPDATE child_profiles
     SET archived_at = now()
   WHERE id = p_child_id AND archived_at IS NULL;

  DELETE FROM classroom_students WHERE child_id = p_child_id;

  UPDATE child_access
     SET revoked_at = now()
   WHERE child_id = p_child_id
     AND role = 'guardian'
     AND revoked_at IS NULL;

  UPDATE invitations
     SET status = 'revoked', updated_at = now()
   WHERE child_id = p_child_id
     AND role = 'parent'
     AND status IN ('pending', 'accepted');
END;
$$;

GRANT EXECUTE ON FUNCTION public.archive_student(uuid) TO authenticated;
