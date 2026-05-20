-- ============================================================
-- Migration: 006 — Supabase Storage Bucket + Policies
-- Project:   Speech Adventure
-- Phase:     25
-- Depends:   001_initial_schema, 004_helper_functions
-- ============================================================
-- Creates the audio-recordings bucket for storing practice audio.
-- Object path convention: {child_id}/{attempt_id}.webm
--
-- Idempotent:
--   Bucket insert uses ON CONFLICT DO NOTHING (already safe).
--   Storage policies use DROP POLICY IF EXISTS before CREATE POLICY
--   because PostgreSQL has no CREATE POLICY IF NOT EXISTS syntax.
--
-- The bucket stays empty until Phase 5 (audio upload feature).
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
  'audio-recordings',
  'audio-recordings',
  false,            -- private: URLs require signed access
  10485760,         -- 10 MB per file (webm recordings are typically < 2 MB)
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
-- Path structure enforces ownership: the first folder segment MUST be a
-- child_id that belongs to the calling user.
-- Example: audio-recordings/550e8400-e29b-41d4-a716-446655440000/attempt-abc.webm
--                            ┗━━━━━━━━━━━━━━ child_id ━━━━━━━━━━━━━━━┛

-- Upload: owner of the child folder may upload files
drop policy if exists "audio_recordings: owner upload" on storage.objects;
create policy "audio_recordings: owner upload"
  on storage.objects
  for insert
  with check (
    bucket_id = 'audio-recordings'
    and (storage.foldername(name))[1]::uuid in (
      select id from child_profiles where user_id = auth.uid()
    )
  );

-- Download: owner of the child folder may read files
drop policy if exists "audio_recordings: owner download" on storage.objects;
create policy "audio_recordings: owner download"
  on storage.objects
  for select
  using (
    bucket_id = 'audio-recordings'
    and (storage.foldername(name))[1]::uuid in (
      select id from child_profiles where user_id = auth.uid()
    )
  );

-- Delete: owner may delete their own recordings
--   (Service-role key can always delete — used by cleanup jobs.)
drop policy if exists "audio_recordings: owner delete" on storage.objects;
create policy "audio_recordings: owner delete"
  on storage.objects
  for delete
  using (
    bucket_id = 'audio-recordings'
    and (storage.foldername(name))[1]::uuid in (
      select id from child_profiles where user_id = auth.uid()
    )
  );

-- UPDATE is intentionally not granted (recordings are immutable once saved).
