-- ============================================================
-- Migration: 014 — Child Profile School Fields
-- Project:   Speech Adventure
-- Date:      2026-05-27
-- ============================================================
-- Adds school-specific columns to child_profiles so imported
-- students carry their school identity (org, student_code, etc).
-- Adds RLS policies so classroom teachers and org admins can
-- read student profiles they manage.
-- ============================================================

-- ── Add nullable columns to child_profiles ────────────────────────────────────

ALTER TABLE child_profiles
  ADD COLUMN IF NOT EXISTS organization_id      uuid REFERENCES organizations(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS student_code         text,
  ADD COLUMN IF NOT EXISTS nickname             text,
  ADD COLUMN IF NOT EXISTS grade_level          text,
  ADD COLUMN IF NOT EXISTS parent_email_pending text;

-- Prevent duplicate student_code within the same organization.
-- Partial index: only applies when both fields are set and non-empty.
CREATE UNIQUE INDEX IF NOT EXISTS child_profiles_org_student_code_idx
  ON child_profiles(organization_id, student_code)
  WHERE organization_id IS NOT NULL
    AND student_code    IS NOT NULL
    AND student_code    <> '';

-- Index for fast org-scoped lookups.
CREATE INDEX IF NOT EXISTS child_profiles_organization_id_idx
  ON child_profiles(organization_id)
  WHERE organization_id IS NOT NULL;

-- ── RLS: classroom teachers can read student profiles ─────────────────────────
-- Teachers see profiles for students enrolled in their assigned classrooms.

DROP POLICY IF EXISTS "child_profiles: classroom teacher select" ON child_profiles;
CREATE POLICY "child_profiles: classroom teacher select"
  ON child_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM   classroom_students cs
      JOIN   classroom_teachers ct ON ct.classroom_id = cs.classroom_id
      WHERE  cs.child_id        = child_profiles.id
        AND  ct.teacher_user_id = auth.uid()
    )
  );

-- ── RLS: org admins can read all student profiles in their organization ────────

DROP POLICY IF EXISTS "child_profiles: org admin select" ON child_profiles;
CREATE POLICY "child_profiles: org admin select"
  ON child_profiles FOR SELECT
  USING (
    organization_id IS NOT NULL
    AND is_org_admin(organization_id)
  );
