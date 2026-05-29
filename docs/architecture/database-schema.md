# Database Schema

**Current status (2026-05-29):** Supabase migrations exist in `supabase/migrations/`. Core tables are live. Multi-child schema uses a list (not unique constraint per user_id).

---

## localStorage → PostgreSQL Mapping

```
speech-adventure-profiles-{userId}-v1  → child_profiles (multi-row per user_id)
speech-adventure-progress-{userId}-v1  → practice_sessions + practice_attempts
speech-adventure-sound-{userId}-v1     → child_profiles.selected_sound_id
observations                           → observation_notes
invitations                            → child_invitations
child access                           → child_access_grants
school                                 → organizations, classrooms, org_members, ...
```

---

## Core Tables

### child_profiles

```sql
create table child_profiles (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  name            text not null,
  age             smallint not null check (age between 1 and 18),
  target_sound    text not null,            -- ก / ค / ต / ช
  training_goal   text not null default '',
  selected_sound_id text not null default 'ก',
  avatar_emoji    text not null default '🧒',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
-- Multiple children per user are supported (no unique index on user_id)
```

### practice_sessions

```sql
create type session_status as enum ('active', 'completed', 'abandoned');

create table practice_sessions (
  id                uuid primary key,
  child_id          uuid not null references child_profiles(id) on delete cascade,
  target_sound      text not null,
  stage_id          text not null,         -- pretest, level-1, ..., review
  started_at        timestamptz not null default now(),
  ended_at          timestamptz,
  duration_ms       integer,
  completed_missions smallint not null default 0,
  total_missions    smallint not null default 0,
  average_score     smallint not null default 0,
  stars_earned      smallint not null default 0,
  status            session_status not null default 'active',
  created_at        timestamptz not null default now()
);
```

### practice_attempts

```sql
create type evaluation_status as enum ('passed', 'almost', 'retry');

create table practice_attempts (
  id                uuid primary key,
  child_id          uuid not null references child_profiles(id) on delete cascade,
  session_id        uuid references practice_sessions(id) on delete set null,
  stage_id          text not null,
  practice_item_id  text not null,
  target_sound      text not null,
  prompt_text       text not null,
  duration_ms       integer not null default 0,
  score             smallint not null check (score between 0 and 100),
  confidence        real not null default 0,
  status            evaluation_status not null,
  feedback          text not null default '',
  recommendation    text,
  stars_earned      smallint not null default 0 check (stars_earned between 0 and 3),
  is_mock           boolean not null default true,
  audio_path        text,    -- Supabase Storage path (practice-audio bucket)
  created_at        timestamptz not null default now()
);
```

### observation_notes

```sql
create table observation_notes (
  id          uuid primary key,
  child_id    uuid not null references child_profiles(id) on delete cascade,
  author_id   uuid not null references auth.users(id),
  target_type text not null default 'general',  -- session | attempt | general
  target_id   uuid,
  category    text not null default 'other',
  title       text not null,
  content     text not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
```

---

## School Tables (Foundation)

`organizations`, `org_members`, `classrooms`, `classroom_members` — see school migrations.

---

## Supabase Storage

```
practice-audio/
└── users/{userId}/children/{childId}/attempts/{attemptId}.{ext}
```

- Private bucket, signed URLs (1-hour expiry)
- RLS: `(storage.foldername(name))[2] = auth.uid()::text`

---

## Known Issues

- **`stars_earned` scale** — UI may display different value than saved in DB (P1 fix)
- **`session_status = 'active'`** — abandoned sessions may remain active (P1 fix)
- **`child_id` validation** — session creation may proceed with empty childId (P1 fix)
- Supabase multi-child: fully supported (no unique constraint on `user_id`)

---

## Migration Files

`supabase/migrations/` — numbered SQL files. Run in Supabase dashboard or via Supabase CLI.
