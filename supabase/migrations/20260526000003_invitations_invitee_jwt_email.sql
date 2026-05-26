-- ============================================================
-- Migration: 011 — Invitations: remove auth.users dependency from RLS
-- Project:   Speech Adventure
-- Date:      2026-05-26
-- ============================================================
-- Root cause:
--   The "invitee select" and "invitee accept" policies on `invitations`
--   contained a sub-select against auth.users:
--     lower(email) = lower((select u.email from auth.users u where u.id = auth.uid()))
--
--   The `authenticated` role has no SELECT privilege on auth.users, so any
--   query touching the invitations table failed with:
--     ERROR: 42501: permission denied for table users
--
-- Fix strategy:
--   Use auth.jwt() ->> 'email' — the email claim is already in the JWT,
--   accessible to the authenticated role without granting access to auth.users.
--   No changes needed to client code, application logic, or other tables.
-- ============================================================

DROP POLICY IF EXISTS "invitations: invitee select" ON invitations;
DROP POLICY IF EXISTS "invitations: invitee accept" ON invitations;

-- Invitee: can read pending invitations sent to their email
CREATE POLICY "invitations: invitee select"
  ON invitations FOR SELECT
  USING (
    lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );

-- Invitee: can accept (update status/accepted fields) on pending invites to their email
CREATE POLICY "invitations: invitee accept"
  ON invitations FOR UPDATE
  USING (
    lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
    AND status = 'pending'
  )
  WITH CHECK (
    lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
