-- ============================================================
-- Migration: 007 — Practice Audio Storage Bucket + Policies
-- Project:   Speech Adventure
-- Phase:     35
-- Depends:   001_initial_schema, 004_helper_functions
-- ============================================================
-- Creates the practice-audio bucket for storing practice recordings.
--
-- Path convention:
--   users/{userId}/children/{childId}/attempts/{attemptId}.{ext}
--
-- Example:
--   users/550e8400-e29b-41d4-a716-446655440000/
--     children/6ba7b810-9dad-11d1-80b4-00c04fd430c8/
--       attempts/attempt-1716301200000-abc12.webm
--
-- Access policy: authenticated user may only access paths where
--   foldername[2] (the userId segment) equals auth.uid().
--   This is a pure text comparison — childId format is not enforced here.
--
-- Idempotent: bucket INSERT uses ON CONFLICT DO NOTHING.
-- Policies use DROP … IF EXISTS because PostgreSQL has no CREATE … IF NOT EXISTS.
-- ============================================================

-- ── Create bucket ─────────────────────────────────────────────────────────────

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'practice-audio',
  'practice-audio',
  false,            -- private: access via signed URL only
  10485760,         -- 10 MB per file
  array[
    'audio/webm',
    'audio/ogg',
    'audio/mp4',
    'audio/mpeg',
    'audio/wav'
  ]
)
on conflict (id) do nothing;


-- ── Storage RLS policies ──────────────────────────────────────────────────────
--
-- Path segments (1-indexed via storage.foldername):
--   [1] = "users"      (literal)
--   [2] = {userId}     = auth.uid() — enforced here
--   [3] = "children"   (literal)
--   [4] = {childId}    (not enforced — pure text, may be a UUID or placeholder)
--   [5] = "attempts"   (literal)
--
-- Only segment [2] is checked; users cannot read or write to another user's
-- folder even if they guess a valid childId.

-- Upload: user may only upload to their own userId sub-path
drop policy if exists "practice_audio: owner upload" on storage.objects;
create policy "practice_audio: owner upload"
  on storage.objects
  for insert
  with check (
    bucket_id = 'practice-audio'
    and (storage.foldername(name))[2] = auth.uid()::text
  );

-- Download: user may only read from their own userId sub-path
drop policy if exists "practice_audio: owner download" on storage.objects;
create policy "practice_audio: owner download"
  on storage.objects
  for select
  using (
    bucket_id = 'practice-audio'
    and (storage.foldername(name))[2] = auth.uid()::text
  );

-- Delete: user may remove their own recordings
drop policy if exists "practice_audio: owner delete" on storage.objects;
create policy "practice_audio: owner delete"
  on storage.objects
  for delete
  using (
    bucket_id = 'practice-audio'
    and (storage.foldername(name))[2] = auth.uid()::text
  );

-- UPDATE intentionally omitted — recordings are immutable once stored.
