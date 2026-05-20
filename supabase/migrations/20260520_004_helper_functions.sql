-- ============================================================
-- Migration: 004 — Helper Functions + updated_at Triggers
-- Project:   Speech Adventure
-- Phase:     25
-- Depends:   001_initial_schema, 002_rls_policies
-- ============================================================
-- Creates:
--   1. is_own_child(uuid) — boolean helper used by RLS policies
--   2. handle_updated_at() — trigger function for auto-updating updated_at
--   3. Triggers on child_profiles and observation_notes
-- ============================================================


-- ── 1. is_own_child ───────────────────────────────────────────────────────────
--
-- Returns true when the given child_id belongs to the currently authenticated
-- user (auth.uid()). Used by RLS policies on practice_sessions,
-- practice_attempts, and observation_notes so each policy stays one line.
--
-- SECURITY DEFINER: runs with the function owner's privileges so it can read
-- child_profiles even when the caller would normally be filtered by RLS.
-- set search_path = public: prevents search_path injection attacks.
-- STABLE: the result is stable for a given child_id within one transaction,
-- allowing the planner to evaluate it once per row rather than per query.

create or replace function is_own_child(p_child_id uuid)
  returns boolean
  language sql
  security definer
  stable
  set search_path = public
as $$
  select exists (
    select 1
    from   child_profiles
    where  id      = p_child_id
    and    user_id = auth.uid()
  )
$$;

-- Grant execute to authenticated users (required for RLS policies).
grant execute on function is_own_child(uuid) to authenticated;


-- ── 2. handle_updated_at ─────────────────────────────────────────────────────
--
-- Trigger function: sets NEW.updated_at = now() before every UPDATE.
-- Applied to tables that have an updated_at column (child_profiles,
-- observation_notes). Practice_sessions and practice_attempts are
-- append-only — they do not have an updated_at column.

create or replace function handle_updated_at()
  returns trigger
  language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;


-- ── 3. Triggers ───────────────────────────────────────────────────────────────

-- child_profiles: auto-update updated_at on every row change
create trigger set_child_profiles_updated_at
  before update on child_profiles
  for each row
  execute function handle_updated_at();

-- observation_notes: auto-update updated_at on every row change
create trigger set_observation_notes_updated_at
  before update on observation_notes
  for each row
  execute function handle_updated_at();
