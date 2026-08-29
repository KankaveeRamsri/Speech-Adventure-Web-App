-- ============================================================
-- Migration: Fix infinite recursion in classroom_students INSERT policy
-- Project:   Speech Adventure — Teacher V2 Phase 2
-- Date:      2026-08-29
-- ============================================================
-- The Part 2 policy added in 20260829000100 referenced public.child_profiles
-- directly in a subquery. child_profiles carries a SELECT policy
-- ("child_profiles: classroom teacher select", 20260527000400) that itself
-- queries classroom_students -> infinite recursion (42P17) on every
-- classroom_students INSERT.
--
-- Fix (same technique as 20260526000002_fix_rls_recursion.sql): move the
-- entire enrollment check into one SECURITY DEFINER helper that bypasses RLS
-- on the tables it reads, and reduce the policy to a single call to it.
--
-- Authorization semantics are UNCHANGED from the approved Part 2 intent:
--   caller is an org admin of the classroom's organization
--   AND ( owns the child
--         OR has an active child_access grant to the child
--         OR the child already belongs to the classroom's organization )
--
-- SECURITY DEFINER hardening (matches 20260825000100 conventions):
--   * SET search_path = '' and every object/function fully schema-qualified,
--     so object resolution cannot be influenced from the caller's context.
--   * EXECUTE revoked from PUBLIC and anon; granted only to authenticated.
--   * Auth identity still derives from auth.uid(), read inside the existing
--     public.is_org_admin / public.is_child_owner / public.is_child_grantee
--     helpers (auth.uid() reads the JWT claim, not the current role, so it
--     stays correct when invoked from a SECURITY DEFINER context).
-- ============================================================

CREATE OR REPLACE FUNCTION public.can_enroll_child_in_classroom(
  p_child_id     uuid,
  p_classroom_id uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT
    EXISTS (
      SELECT 1
      FROM public.classrooms c
      WHERE c.id = p_classroom_id
        AND public.is_org_admin(c.organization_id)
    )
    AND (
      public.is_child_owner(p_child_id)
      OR public.is_child_grantee(p_child_id)
      OR EXISTS (
        SELECT 1
        FROM public.child_profiles cp
        JOIN public.classrooms      c2 ON c2.id = p_classroom_id
        WHERE cp.id = p_child_id
          AND cp.organization_id = c2.organization_id
      )
    );
$$;

REVOKE ALL ON FUNCTION public.can_enroll_child_in_classroom(uuid, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.can_enroll_child_in_classroom(uuid, uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.can_enroll_child_in_classroom(uuid, uuid) TO authenticated;

-- ── Replace the recursive INSERT policy with a single helper call ────────────

DROP POLICY IF EXISTS "classroom_students: admin insert" ON public.classroom_students;

CREATE POLICY "classroom_students: admin insert"
  ON public.classroom_students FOR INSERT
  WITH CHECK (
    public.can_enroll_child_in_classroom(
      classroom_students.child_id,
      classroom_students.classroom_id
    )
  );
