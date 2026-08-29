-- ============================================================
-- Migration: Teacher V2 Phase 2 — Classroom archive + roster insert guard
-- Project:   Speech Adventure
-- Date:      2026-08-29
-- ============================================================
-- Additive only. No historical migration is edited. No policy is
-- weakened; the one policy replaced below is made STRICTER.
-- ============================================================

-- ── Part 1: Classroom archive support ────────────────────────────────────────
--
-- classrooms has no archive/status column. Teacher V2 Phase 2 must let a
-- teacher archive a classroom (hide from active lists, keep all student and
-- history relationships, still viewable in an "archived" section).
--
-- No new policy needed: "classrooms: admin update" already authorizes the
-- owning teacher (owner => is_org_admin) to set/clear archived_at. The SELECT
-- policy is deliberately left unchanged so archived classrooms remain
-- readable by their org for the archived-list view; "active only" filtering
-- happens in the repository/query layer.

ALTER TABLE public.classrooms
  ADD COLUMN IF NOT EXISTS archived_at timestamptz DEFAULT NULL;

COMMENT ON COLUMN public.classrooms.archived_at IS
  'When set, the classroom is archived: excluded from the default active list, '
  'retains all classroom_students / classroom_teachers / history relationships. '
  'Cleared to restore. Teacher V2 Phase 2.';

-- Partial index for the common "active classrooms in my org" query.
CREATE INDEX IF NOT EXISTS classrooms_org_active_idx
  ON public.classrooms (organization_id)
  WHERE archived_at IS NULL;


-- ── Part 2: Tighten classroom_students INSERT (security hardening) ────────────
--
-- Current policy (20260527000100) checks only that the caller is an org admin
-- of the CLASSROOM's organization. It does not constrain WHICH child may be
-- added. Under School-Admin-only this was low risk; Teacher V2 makes every
-- teacher an org admin of their workspace, so an authenticated teacher could
-- attach an arbitrary child_id (a parent-owned profile they otherwise cannot
-- see) to their own classroom and thereby gain child_profiles SELECT via the
-- "classroom teacher" policy.
--
-- Replacement keeps the existing org-admin requirement AND additionally
-- requires the child to be one the caller may legitimately enroll:
--   a) a profile the caller owns  (is_child_owner)  -- teacher-created student
--   b) a profile shared with the caller via an active grant (is_child_grantee)
--   c) a profile that already belongs to the same organization as the
--      classroom (covers the existing School-Admin CSV import flow, which
--      sets child_profiles.organization_id before inserting the join row)
--
-- This is strictly narrower than the current policy — nothing that is
-- permitted after this migration was denied before, except the arbitrary
-- cross-tenant case that is the whole point of the change.

DROP POLICY IF EXISTS "classroom_students: admin insert" ON public.classroom_students;

CREATE POLICY "classroom_students: admin insert"
  ON public.classroom_students FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.classrooms c
      WHERE c.id = classroom_students.classroom_id
        AND public.is_org_admin(c.organization_id)
    )
    AND (
      public.is_child_owner(classroom_students.child_id)
      OR public.is_child_grantee(classroom_students.child_id)
      OR EXISTS (
        SELECT 1
        FROM public.child_profiles cp
        JOIN public.classrooms  c2 ON c2.id = classroom_students.classroom_id
        WHERE cp.id = classroom_students.child_id
          AND cp.organization_id = c2.organization_id
      )
    )
  );
