-- ============================================================
-- Migration: 013 — User Display Profiles
-- Project:   Speech Adventure
-- Date:      2026-05-27
-- ============================================================
-- Problem:
--   classroom_teachers stores teacher_user_id (UUID) but there is no
--   way for school admins to look up a user by email or display their
--   name/email — auth.users is not accessible to authenticated clients.
--
-- Solution:
--   public.user_display_profiles mirrors email + role from auth.users.
--   A SECURITY DEFINER trigger keeps it in sync on every signup/update.
--   School admins can query this table to search by email, and classroom
--   teacher lists can display email instead of raw UUID.
--
-- RLS:
--   Any authenticated user can read profiles (needed for teacher search).
--   Users can only update their own row.
--   INSERT is handled exclusively by the trigger (no client INSERT policy).
-- ============================================================

CREATE TABLE IF NOT EXISTS public.user_display_profiles (
  user_id    uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email      text NOT NULL,
  role       text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ── Sync trigger ──────────────────────────────────────────────────────────────
-- Runs as SECURITY DEFINER so it can write to public.user_display_profiles
-- even though the trigger fires from the auth schema.

CREATE OR REPLACE FUNCTION public.sync_user_display_profile()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_display_profiles (user_id, email, role)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data ->> 'role'
  )
  ON CONFLICT (user_id) DO UPDATE
    SET email = EXCLUDED.email,
        role  = EXCLUDED.role;
  RETURN NEW;
END;
$$;

-- Fire after every INSERT or UPDATE on auth.users
DROP TRIGGER IF EXISTS on_auth_user_display_profile_sync ON auth.users;
CREATE TRIGGER on_auth_user_display_profile_sync
  AFTER INSERT OR UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_user_display_profile();

-- ── Backfill existing users ───────────────────────────────────────────────────
-- This INSERT runs with migration (service_role) permissions, so it can read
-- auth.users directly. New users are handled by the trigger above.

INSERT INTO public.user_display_profiles (user_id, email, role)
SELECT
  id,
  email,
  raw_user_meta_data ->> 'role'
FROM auth.users
ON CONFLICT (user_id) DO UPDATE
  SET email = EXCLUDED.email,
      role  = EXCLUDED.role;

-- ── RLS ───────────────────────────────────────────────────────────────────────

ALTER TABLE public.user_display_profiles ENABLE ROW LEVEL SECURITY;

-- Any authenticated user can search by email (needed for teacher assignment).
CREATE POLICY "user_display_profiles: auth select"
  ON public.user_display_profiles FOR SELECT
  TO authenticated
  USING (true);

-- Users can update only their own display profile (e.g. if role changes).
-- In practice, the trigger handles this — this policy is a safety valve.
CREATE POLICY "user_display_profiles: self update"
  ON public.user_display_profiles FOR UPDATE
  USING  (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
