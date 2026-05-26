-- ============================================================
-- Migration: 012 — Idempotent revoke_child_access
-- Project:   Speech Adventure
-- Date:      2026-05-26
-- ============================================================
-- Bug:
--   The previous revoke_child_access raised "access grant not found
--   or you do not own the child" whenever the UPDATE matched 0 rows.
--   That includes the legitimate idempotent case where the grant was
--   already revoked, which made retries / double-clicks look like
--   real errors and rolled back the client's optimistic UI update.
--
-- Fix:
--   1. Look up the grant + owner separately so we can distinguish
--      "missing", "unauthorized", and "already revoked" cleanly.
--   2. Make the UPDATE itself idempotent — applying revoke twice is
--      a no-op, not an error.
-- ============================================================

CREATE OR REPLACE FUNCTION revoke_child_access(p_access_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner uuid;
BEGIN
  -- Step 1: locate the grant and the owner of its child profile.
  SELECT cp.user_id
    INTO v_owner
    FROM child_access ca
    JOIN child_profiles cp ON cp.id = ca.child_id
   WHERE ca.id = p_access_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'access grant not found'
      USING ERRCODE = 'P0002';
  END IF;

  -- Step 2: only the child owner may revoke. Invited users cannot
  -- revoke their own (or anyone else's) access via this function.
  IF v_owner IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'not authorized to revoke this access'
      USING ERRCODE = '42501';
  END IF;

  -- Step 3: idempotent soft revoke. A second call is a no-op.
  UPDATE child_access
     SET revoked_at = now()
   WHERE id         = p_access_id
     AND revoked_at IS NULL;
END;
$$;

GRANT EXECUTE ON FUNCTION revoke_child_access(uuid) TO authenticated;
