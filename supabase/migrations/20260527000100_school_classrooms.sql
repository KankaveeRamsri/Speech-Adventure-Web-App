-- ============================================================
-- Migration: 011 — School and Classroom Foundation
-- Project:   Speech Adventure
-- Date:      2026-05-27
-- ============================================================
-- Adds:
--   organizations       — school / clinic / family groups
--   organization_members — membership with role + status
--   classrooms          — within an organization
--   classroom_students  — child ↔ classroom mapping
--   classroom_teachers  — teacher ↔ classroom mapping
--
-- RLS strategy:
--   SECURITY DEFINER helpers break any recursion between tables.
--   Members read their own organization; owners/admins manage classrooms;
--   teachers read classrooms they are assigned to.
-- ============================================================

-- ── Enums ─────────────────────────────────────────────────────────────────────

DO $$ BEGIN
  CREATE TYPE organization_type AS ENUM ('family', 'school', 'clinic');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE org_member_role AS ENUM (
    'owner', 'admin', 'teacher', 'therapist', 'parent', 'viewer'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE org_member_status AS ENUM ('active', 'invited', 'removed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── Tables ────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS organizations (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  type        organization_type NOT NULL DEFAULT 'school',
  created_by  uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS organization_members (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role            org_member_role NOT NULL DEFAULT 'viewer',
  status          org_member_status NOT NULL DEFAULT 'active',
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (organization_id, user_id)
);

CREATE TABLE IF NOT EXISTS classrooms (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name            text NOT NULL,
  grade_level     text,
  academic_year   text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS classroom_students (
  classroom_id uuid NOT NULL REFERENCES classrooms(id) ON DELETE CASCADE,
  child_id     uuid NOT NULL REFERENCES child_profiles(id) ON DELETE CASCADE,
  created_at   timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (classroom_id, child_id)
);

CREATE TABLE IF NOT EXISTS classroom_teachers (
  classroom_id    uuid NOT NULL REFERENCES classrooms(id) ON DELETE CASCADE,
  teacher_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at      timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (classroom_id, teacher_user_id)
);

-- ── updated_at triggers ───────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS organizations_updated_at ON organizations;
CREATE TRIGGER organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS organization_members_updated_at ON organization_members;
CREATE TRIGGER organization_members_updated_at
  BEFORE UPDATE ON organization_members
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS classrooms_updated_at ON classrooms;
CREATE TRIGGER classrooms_updated_at
  BEFORE UPDATE ON classrooms
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ── SECURITY DEFINER helpers ──────────────────────────────────────────────────
-- Bypass RLS for internal membership checks so policies stay non-recursive.

-- Returns true when auth.uid() is an active member of the given organization.
CREATE OR REPLACE FUNCTION is_org_member(p_org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_id = p_org_id
      AND user_id         = auth.uid()
      AND status          = 'active'
  );
$$;

-- Returns true when auth.uid() is an owner or admin of the given organization.
CREATE OR REPLACE FUNCTION is_org_admin(p_org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_id = p_org_id
      AND user_id         = auth.uid()
      AND role            IN ('owner', 'admin')
      AND status          = 'active'
  );
$$;

-- Returns true when auth.uid() is assigned as a teacher of the given classroom.
CREATE OR REPLACE FUNCTION is_classroom_teacher(p_classroom_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM classroom_teachers
    WHERE classroom_id    = p_classroom_id
      AND teacher_user_id = auth.uid()
  );
$$;

GRANT EXECUTE ON FUNCTION is_org_member(uuid)       TO authenticated;
GRANT EXECUTE ON FUNCTION is_org_admin(uuid)        TO authenticated;
GRANT EXECUTE ON FUNCTION is_classroom_teacher(uuid) TO authenticated;

-- ── Enable RLS ────────────────────────────────────────────────────────────────

ALTER TABLE organizations         ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members  ENABLE ROW LEVEL SECURITY;
ALTER TABLE classrooms            ENABLE ROW LEVEL SECURITY;
ALTER TABLE classroom_students    ENABLE ROW LEVEL SECURITY;
ALTER TABLE classroom_teachers    ENABLE ROW LEVEL SECURITY;

-- ── organizations policies ────────────────────────────────────────────────────

-- Members can read their organization.
CREATE POLICY "organizations: member select"
  ON organizations FOR SELECT
  USING (is_org_member(id));

-- Creator can insert (becomes owner via trigger or app logic).
CREATE POLICY "organizations: creator insert"
  ON organizations FOR INSERT
  WITH CHECK (created_by = auth.uid());

-- Only org admins/owners can update.
CREATE POLICY "organizations: admin update"
  ON organizations FOR UPDATE
  USING  (is_org_admin(id))
  WITH CHECK (is_org_admin(id));

-- Only creator (owner) can delete.
CREATE POLICY "organizations: owner delete"
  ON organizations FOR DELETE
  USING (created_by = auth.uid());

-- ── organization_members policies ─────────────────────────────────────────────

-- Members can read the membership list of their own organization.
CREATE POLICY "org_members: member select"
  ON organization_members FOR SELECT
  USING (is_org_member(organization_id));

-- Only org admins can insert new members.
CREATE POLICY "org_members: admin insert"
  ON organization_members FOR INSERT
  WITH CHECK (is_org_admin(organization_id));

-- Only org admins can update member records.
CREATE POLICY "org_members: admin update"
  ON organization_members FOR UPDATE
  USING  (is_org_admin(organization_id))
  WITH CHECK (is_org_admin(organization_id));

-- Only org admins can remove members.
CREATE POLICY "org_members: admin delete"
  ON organization_members FOR DELETE
  USING (is_org_admin(organization_id));

-- ── classrooms policies ───────────────────────────────────────────────────────

-- Org members can read classrooms in their organization.
-- Assigned teachers can also read their classrooms even if not org members.
CREATE POLICY "classrooms: member select"
  ON classrooms FOR SELECT
  USING (
    is_org_member(organization_id)
    OR is_classroom_teacher(id)
  );

-- Only org admins can create classrooms.
CREATE POLICY "classrooms: admin insert"
  ON classrooms FOR INSERT
  WITH CHECK (is_org_admin(organization_id));

-- Only org admins can update classrooms.
CREATE POLICY "classrooms: admin update"
  ON classrooms FOR UPDATE
  USING  (is_org_admin(organization_id))
  WITH CHECK (is_org_admin(organization_id));

-- Only org admins can delete classrooms.
CREATE POLICY "classrooms: admin delete"
  ON classrooms FOR DELETE
  USING (is_org_admin(organization_id));

-- ── classroom_students policies ───────────────────────────────────────────────

-- Assigned teachers and org members can read the student list.
CREATE POLICY "classroom_students: teacher or member select"
  ON classroom_students FOR SELECT
  USING (
    is_classroom_teacher(classroom_id)
    OR EXISTS (
      SELECT 1 FROM classrooms c
      WHERE c.id = classroom_students.classroom_id
        AND is_org_member(c.organization_id)
    )
  );

-- Org admins can add students.
CREATE POLICY "classroom_students: admin insert"
  ON classroom_students FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM classrooms c
      WHERE c.id = classroom_students.classroom_id
        AND is_org_admin(c.organization_id)
    )
  );

-- Org admins can remove students.
CREATE POLICY "classroom_students: admin delete"
  ON classroom_students FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM classrooms c
      WHERE c.id = classroom_students.classroom_id
        AND is_org_admin(c.organization_id)
    )
  );

-- ── classroom_teachers policies ───────────────────────────────────────────────

-- Assigned teachers can see their own assignments; org members see all.
CREATE POLICY "classroom_teachers: self or member select"
  ON classroom_teachers FOR SELECT
  USING (
    teacher_user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM classrooms c
      WHERE c.id = classroom_teachers.classroom_id
        AND is_org_member(c.organization_id)
    )
  );

-- Only org admins can assign teachers.
CREATE POLICY "classroom_teachers: admin insert"
  ON classroom_teachers FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM classrooms c
      WHERE c.id = classroom_teachers.classroom_id
        AND is_org_admin(c.organization_id)
    )
  );

-- Only org admins can remove teacher assignments.
CREATE POLICY "classroom_teachers: admin delete"
  ON classroom_teachers FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM classrooms c
      WHERE c.id = classroom_teachers.classroom_id
        AND is_org_admin(c.organization_id)
    )
  );
