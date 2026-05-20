-- ============================================================
-- Migration: 001 — Initial Schema
-- Project:   Speech Adventure
-- Date:      2026-05-20
-- Source:    docs/architecture/database-schema.md
-- ============================================================
-- Runs BEFORE enabling RLS (see 002_rls_policies.sql).
-- Requires: Supabase project with auth schema enabled (default).
-- ============================================================

-- ── Enums ─────────────────────────────────────────────────────────────────────

create type session_status as enum ('active', 'completed', 'abandoned');
create type evaluation_status as enum ('passed', 'almost', 'retry');
create type observation_target_type as enum ('session', 'attempt', 'general');
create type observation_category as enum (
  'pronunciation', 'attention', 'progress', 'recommendation', 'other'
);

-- ── child_profiles ────────────────────────────────────────────────────────────
-- Maps from: localStorage key `speech-adventure-profile-v1`
-- Domain type: ChildProfileData (src/lib/child-profile/childProfileStorage.ts)
-- DB type: DbChildProfile (src/types/database.ts)

create table child_profiles (
  id               uuid        primary key default gen_random_uuid(),
  user_id          uuid        not null references auth.users(id) on delete cascade,
  name             text        not null,
  age              smallint    not null check (age between 1 and 18),
  target_sound     text        not null,
  training_goal    text        not null default '',
  selected_sound_id text       not null default 'ก',
  avatar_emoji     text        not null default '🧒',
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- One profile per authenticated user (MVP — expand to multi-child later)
create unique index child_profiles_user_id_idx on child_profiles(user_id);

-- ── practice_sessions ─────────────────────────────────────────────────────────
-- Maps from: localStorage key `speech-adventure-progress-v1` → sessions[]
-- Domain type: PracticeSession (src/types/speechAdventure.ts)
-- DB type: DbPracticeSession (src/types/database.ts)
-- Note: attemptIds[] array in localStorage is NOT migrated — use JOIN instead

create table practice_sessions (
  id                  uuid          primary key default gen_random_uuid(),
  child_id            uuid          not null references child_profiles(id) on delete cascade,
  target_sound        text          not null,
  stage_id            text          not null,
  started_at          timestamptz   not null default now(),
  ended_at            timestamptz,
  duration_ms         integer,
  completed_missions  smallint      not null default 0,
  total_missions      smallint      not null default 0,
  average_score       smallint      not null default 0 check (average_score between 0 and 100),
  stars_earned        smallint      not null default 0,
  status              session_status not null default 'active',
  created_at          timestamptz   not null default now()
);

create index practice_sessions_child_id_idx on practice_sessions(child_id);
create index practice_sessions_stage_idx on practice_sessions(child_id, stage_id);

-- ── practice_attempts ─────────────────────────────────────────────────────────
-- Maps from: localStorage key `speech-adventure-progress-v1` → attempts[]
-- Domain type: PracticeAttempt (src/types/speechAdventure.ts)
-- DB type: DbPracticeAttempt (src/types/database.ts)

create table practice_attempts (
  id               uuid              primary key default gen_random_uuid(),
  child_id         uuid              not null references child_profiles(id) on delete cascade,
  session_id       uuid              references practice_sessions(id) on delete set null,
  stage_id         text              not null,
  practice_item_id text              not null,
  target_sound     text              not null,
  prompt_text      text              not null,
  duration_ms      integer           not null default 0,
  score            smallint          not null check (score between 0 and 100),
  confidence       real              not null default 0,
  status           evaluation_status not null,
  feedback         text              not null default '',
  recommendation   text,
  stars_earned     smallint          not null default 0 check (stars_earned between 0 and 3),
  is_mock          boolean           not null default true,
  audio_path       text,  -- Supabase Storage path (future: audio-recordings/{child_id}/{attempt_id}.webm)
  created_at       timestamptz       not null default now()
);

create index practice_attempts_child_id_idx on practice_attempts(child_id);
create index practice_attempts_stage_idx on practice_attempts(child_id, stage_id);
create index practice_attempts_session_idx on practice_attempts(session_id);
create index practice_attempts_created_at_idx on practice_attempts(child_id, created_at desc);

-- ── observation_notes ─────────────────────────────────────────────────────────
-- Maps from: localStorage key `speech-adventure-observations-v1`
-- Domain type: ObservationNote (src/types/observations.ts)
-- DB type: DbObservationNote (src/types/database.ts)
-- Note: target_id changes from string → uuid — string IDs need migration mapping

create table observation_notes (
  id          uuid                      primary key default gen_random_uuid(),
  child_id    uuid                      not null references child_profiles(id) on delete cascade,
  author_id   uuid                      not null references auth.users(id),
  target_type observation_target_type   not null default 'general',
  target_id   uuid,  -- session_id or attempt_id (nullable for 'general' notes)
  category    observation_category      not null default 'other',
  title       text                      not null,
  content     text                      not null,
  created_at  timestamptz               not null default now(),
  updated_at  timestamptz               not null default now()
);

create index observation_notes_child_id_idx on observation_notes(child_id);
create index observation_notes_target_idx on observation_notes(target_type, target_id)
  where target_id is not null;
