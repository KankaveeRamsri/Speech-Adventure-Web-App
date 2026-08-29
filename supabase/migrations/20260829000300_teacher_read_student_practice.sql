-- ============================================================
-- Migration: Teacher V2 Phase 3 — authorized read of a student's speech-practice data
-- Project:   Speech Adventure
-- Date:      2026-08-29
-- ============================================================
-- Gap: practice_sessions / practice_attempts SELECT is owner-only
--   ( EXISTS (SELECT 1 FROM child_profiles
--             WHERE child_profiles.id = <table>.child_id
--               AND child_profiles.user_id = auth.uid()) )
-- so a teacher can read a classroom student's child_profiles row (four
-- SELECT policies already permit that) but NOT their practice history.
-- Phase 3 (Student Detail) needs that history.
--
-- Fix: one SECURITY DEFINER helper expressing exactly "may the caller read
-- this child's speech-practice data?" and a broadened SELECT policy on both
-- practice tables that calls it.
--
-- The helper returns true ONLY when the authenticated caller:
--   (a) OWNS the child (a parent, or a teacher-managed student's teacher), OR
--   (b) has a CURRENTLY-VALID child_access grant that allows progress
--       visibility — audited canonical "active" definition is revoked_at IS
--       NULL (child_access has no status / expires_at / accepted_at column;
--       grants never expire — invitations.expires_at only gates acceptance),
--       AND can_view_progress = true, OR
--   (c) is assigned as a teacher to a classroom that CURRENTLY contains the
--       child (Phase 2 "remove from classroom" hard-deletes the
--       classroom_students join row, so this access is lost immediately when
--       the child leaves the classroom).
--
-- Deliberately NOT included: organization-admin access. A Teacher-Workspace
-- owner can see child_profiles for org students via is_org_admin, but a
-- child's practice history is scoped more narrowly — to a real
-- teaching/access relationship only.
--
-- INSERT / UPDATE / DELETE on both practice tables stay OWNER-ONLY
-- (unchanged) — a teacher never writes a child's practice data.
--
-- SECURITY DEFINER hardening (matches 20260825000100 / 20260829000200):
--   SET search_path = '' and every object/function fully schema-qualified;
--   EXECUTE revoked from PUBLIC and anon, granted only to authenticated.
--   No service_role. RLS stays ENABLED on both tables.
--
-- Recursion-safe: the helper is SECURITY DEFINER so its reads of
-- child_profiles / child_access / classroom_students / classroom_teachers
-- bypass RLS, and none of those tables' policies reference the practice
-- tables.
--
-- Indexes: practice_attempts_child_id_idx,
-- practice_attempts_created_at_idx (child_id, created_at desc), and
-- practice_sessions_child_id_idx already exist and cover both the
-- per-child detail query and the batched "child_id IN (...)" directory
-- query. No index change needed.
-- ============================================================

CREATE OR REPLACE FUNCTION public.can_read_child_practice(p_child_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT
    -- (a) the child's owner — a parent, or a teacher-managed student's teacher
    public.is_child_owner(p_child_id)
    -- (b) a currently-valid child_access grant that allows progress visibility
    OR EXISTS (
      SELECT 1
      FROM public.child_access ca
      WHERE ca.child_id    = p_child_id
        AND ca.user_id     = auth.uid()
        AND ca.revoked_at IS NULL
        AND ca.can_view_progress
    )
    -- (c) the caller teaches a classroom that currently contains the child
    OR EXISTS (
      SELECT 1
      FROM public.classroom_students cs
      JOIN public.classroom_teachers ct ON ct.classroom_id = cs.classroom_id
      WHERE cs.child_id        = p_child_id
        AND ct.teacher_user_id = auth.uid()
    );
$$;

REVOKE ALL ON FUNCTION public.can_read_child_practice(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.can_read_child_practice(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.can_read_child_practice(uuid) TO authenticated;

-- ── practice_sessions: broaden SELECT from owner-only to authorized read ─────
DROP POLICY IF EXISTS "practice_sessions: owner select" ON public.practice_sessions;
CREATE POLICY "practice_sessions: authorized read"
  ON public.practice_sessions FOR SELECT
  USING (public.can_read_child_practice(child_id));

-- ── practice_attempts: broaden SELECT from owner-only to authorized read ─────
DROP POLICY IF EXISTS "practice_attempts: owner select" ON public.practice_attempts;
CREATE POLICY "practice_attempts: authorized read"
  ON public.practice_attempts FOR SELECT
  USING (public.can_read_child_practice(child_id));
