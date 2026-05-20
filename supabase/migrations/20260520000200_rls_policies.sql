-- ============================================================
-- Migration: 002 — Row Level Security Policies
-- Project:   Speech Adventure
-- Date:      2026-05-20
-- ============================================================
-- Run AFTER 001_initial_schema.sql.
-- All policies are "owner-only" — a user can only read/write
-- their own data. Therapist/multi-user roles are future work.
-- Idempotent: DROP POLICY IF EXISTS before every CREATE POLICY
-- because PostgreSQL has no CREATE POLICY IF NOT EXISTS.
-- ============================================================

-- ── Enable RLS on all tables ──────────────────────────────────────────────────
-- ALTER TABLE ENABLE ROW LEVEL SECURITY is idempotent (safe to re-run).

alter table child_profiles      enable row level security;
alter table practice_sessions   enable row level security;
alter table practice_attempts   enable row level security;
alter table observation_notes   enable row level security;

-- ── child_profiles ────────────────────────────────────────────────────────────

drop policy if exists "child_profiles: owner select" on child_profiles;
create policy "child_profiles: owner select"
  on child_profiles for select
  using (auth.uid() = user_id);

drop policy if exists "child_profiles: owner insert" on child_profiles;
create policy "child_profiles: owner insert"
  on child_profiles for insert
  with check (auth.uid() = user_id);

drop policy if exists "child_profiles: owner update" on child_profiles;
create policy "child_profiles: owner update"
  on child_profiles for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "child_profiles: owner delete" on child_profiles;
create policy "child_profiles: owner delete"
  on child_profiles for delete
  using (auth.uid() = user_id);

-- ── practice_sessions ─────────────────────────────────────────────────────────
-- Routed through child_profiles to identify the owner.

drop policy if exists "practice_sessions: owner select" on practice_sessions;
create policy "practice_sessions: owner select"
  on practice_sessions for select
  using (
    exists (
      select 1 from child_profiles
      where child_profiles.id = practice_sessions.child_id
        and child_profiles.user_id = auth.uid()
    )
  );

drop policy if exists "practice_sessions: owner insert" on practice_sessions;
create policy "practice_sessions: owner insert"
  on practice_sessions for insert
  with check (
    exists (
      select 1 from child_profiles
      where child_profiles.id = practice_sessions.child_id
        and child_profiles.user_id = auth.uid()
    )
  );

drop policy if exists "practice_sessions: owner update" on practice_sessions;
create policy "practice_sessions: owner update"
  on practice_sessions for update
  using (
    exists (
      select 1 from child_profiles
      where child_profiles.id = practice_sessions.child_id
        and child_profiles.user_id = auth.uid()
    )
  );

drop policy if exists "practice_sessions: owner delete" on practice_sessions;
create policy "practice_sessions: owner delete"
  on practice_sessions for delete
  using (
    exists (
      select 1 from child_profiles
      where child_profiles.id = practice_sessions.child_id
        and child_profiles.user_id = auth.uid()
    )
  );

-- ── practice_attempts ─────────────────────────────────────────────────────────

drop policy if exists "practice_attempts: owner select" on practice_attempts;
create policy "practice_attempts: owner select"
  on practice_attempts for select
  using (
    exists (
      select 1 from child_profiles
      where child_profiles.id = practice_attempts.child_id
        and child_profiles.user_id = auth.uid()
    )
  );

drop policy if exists "practice_attempts: owner insert" on practice_attempts;
create policy "practice_attempts: owner insert"
  on practice_attempts for insert
  with check (
    exists (
      select 1 from child_profiles
      where child_profiles.id = practice_attempts.child_id
        and child_profiles.user_id = auth.uid()
    )
  );

drop policy if exists "practice_attempts: owner update" on practice_attempts;
create policy "practice_attempts: owner update"
  on practice_attempts for update
  using (
    exists (
      select 1 from child_profiles
      where child_profiles.id = practice_attempts.child_id
        and child_profiles.user_id = auth.uid()
    )
  );

drop policy if exists "practice_attempts: owner delete" on practice_attempts;
create policy "practice_attempts: owner delete"
  on practice_attempts for delete
  using (
    exists (
      select 1 from child_profiles
      where child_profiles.id = practice_attempts.child_id
        and child_profiles.user_id = auth.uid()
    )
  );

-- ── observation_notes ─────────────────────────────────────────────────────────
-- NOTE: These author-only policies are superseded by migration 005.
-- Migration 005 drops these and replaces them with stricter owner+author policies.
-- They are created here for completeness in case 005 hasn't run yet,
-- and are idempotent via DROP IF EXISTS.

drop policy if exists "observation_notes: author select" on observation_notes;
create policy "observation_notes: author select"
  on observation_notes for select
  using (auth.uid() = author_id);

drop policy if exists "observation_notes: author insert" on observation_notes;
create policy "observation_notes: author insert"
  on observation_notes for insert
  with check (auth.uid() = author_id);

drop policy if exists "observation_notes: author update" on observation_notes;
create policy "observation_notes: author update"
  on observation_notes for update
  using (auth.uid() = author_id)
  with check (auth.uid() = author_id);

drop policy if exists "observation_notes: author delete" on observation_notes;
create policy "observation_notes: author delete"
  on observation_notes for delete
  using (auth.uid() = author_id);
