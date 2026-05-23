-- ============================================================
-- Migration: 008 — Multi-child profiles
-- Project:   Speech Adventure
-- Date:      2026-05-23
-- ============================================================
-- Removes the one-child-per-user UNIQUE constraint so each
-- authenticated user can have multiple child_profiles rows.
--
-- Safety guarantees:
--   • No rows are deleted or modified.
--   • DROP INDEX is idempotent (IF EXISTS).
--   • New indexes are created IF NOT EXISTS (safe to re-run).
--   • RLS policies in 002_rls_policies.sql remain unchanged —
--     users can only read/write their own rows (user_id = auth.uid()).
-- ============================================================

-- Remove the unique constraint that allowed only one child per user.
-- The comment in 001 explicitly noted "expand to multi-child later".
drop index if exists child_profiles_user_id_idx;

-- Non-unique index for fast filtering by owner (replaces the dropped one).
create index if not exists child_profiles_user_id_fk_idx
  on child_profiles(user_id);

-- Composite index for listing all children in creation order.
create index if not exists child_profiles_user_created_at_idx
  on child_profiles(user_id, created_at);
