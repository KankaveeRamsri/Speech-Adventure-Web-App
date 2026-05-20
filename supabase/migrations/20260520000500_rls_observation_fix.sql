-- ============================================================
-- Migration: 005 — Fix observation_notes RLS Policies
-- Project:   Speech Adventure
-- Phase:     25
-- Depends:   002_rls_policies, 004_helper_functions
-- ============================================================
-- PROBLEM (from 002_rls_policies.sql):
--   The observation_notes policies only checked author_id = auth.uid().
--   This allowed any authenticated user to INSERT or UPDATE notes for
--   any child, as long as they set themselves as the author.
--   Child ownership was never verified. This is a security bug.
--
-- FIX:
--   All four policies now require BOTH:
--     1. is_own_child(child_id)  — caller owns the child
--     2. author_id = auth.uid()  — caller is the note author
--
--   Uses is_own_child() from migration 004 (must run first).
-- Idempotent: DROP POLICY IF EXISTS before every CREATE POLICY.
-- ============================================================

-- Drop the author-only policies created in 002
drop policy if exists "observation_notes: author select" on observation_notes;
drop policy if exists "observation_notes: author insert" on observation_notes;
drop policy if exists "observation_notes: author update" on observation_notes;
drop policy if exists "observation_notes: author delete" on observation_notes;

-- Drop corrected owner policies (in case this migration is re-run)
drop policy if exists "observation_notes: owner select" on observation_notes;
drop policy if exists "observation_notes: owner insert" on observation_notes;
drop policy if exists "observation_notes: owner update" on observation_notes;
drop policy if exists "observation_notes: owner delete" on observation_notes;

-- ── Corrected policies ────────────────────────────────────────────────────────

-- SELECT: caller must own the child
--   Parent sees all notes on their child regardless of who wrote them.
--   (Future: therapist policy extends this via a separate migration.)
create policy "observation_notes: owner select"
  on observation_notes
  for select
  using (is_own_child(child_id));

-- INSERT: caller must own the child AND be the author
create policy "observation_notes: owner insert"
  on observation_notes
  for insert
  with check (
    is_own_child(child_id)
    and author_id = auth.uid()
  );

-- UPDATE: caller must own the child AND be the original author
--   Both USING (existing row) and WITH CHECK (new row) enforce this.
create policy "observation_notes: owner update"
  on observation_notes
  for update
  using  (is_own_child(child_id) and author_id = auth.uid())
  with check (is_own_child(child_id) and author_id = auth.uid());

-- DELETE: caller must own the child AND be the author
create policy "observation_notes: owner delete"
  on observation_notes
  for delete
  using (is_own_child(child_id) and author_id = auth.uid());
