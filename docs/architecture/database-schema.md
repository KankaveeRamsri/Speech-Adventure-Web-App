# Database Schema

## localStorage → PostgreSQL Mapping

### Current localStorage Keys

```
speech-adventure-profile-v1       → table: child_profiles
speech-adventure-progress-v1      → tables: practice_attempts, practice_sessions
speech-adventure-observations-v1  → table: observation_notes
speech-adventure-selected-sound-v1 → column: child_profiles.selected_sound_id
```

---

## Schema Definitions

### child_profiles

Maps from `ChildProfileData` in `src/lib/child-profile/childProfileStorage.ts`.

```sql
create table child_profiles (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  name            text not null,
  age             smallint not null check (age between 1 and 18),
  target_sound    text not null,
  training_goal   text not null default '',
  selected_sound_id text not null default 'ก',
  avatar_emoji    text not null default '🧒',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- One profile per user (MVP — expand to multi-child later)
create unique index child_profiles_user_id_idx on child_profiles(user_id);
```

**Mapping จาก localStorage:**
| localStorage field | column |
|---|---|
| `id` | `id` (migrate as seed or drop) |
| `name` | `name` |
| `age` | `age` |
| `targetSound` | `target_sound` |
| `trainingGoal` | `training_goal` |
| `createdAt` | `created_at` |
| `updatedAt` | `updated_at` |
| *(ไม่มี)* | `user_id` (จาก Supabase Auth) |

---

### practice_sessions

Maps from `PracticeSession` in `src/types/speechAdventure.ts`.

```sql
create type session_status as enum ('active', 'completed', 'abandoned');

create table practice_sessions (
  id                uuid primary key default gen_random_uuid(),
  child_id          uuid not null references child_profiles(id) on delete cascade,
  target_sound      text not null,
  stage_id          text not null,
  started_at        timestamptz not null default now(),
  ended_at          timestamptz,
  duration_ms       integer,
  completed_missions smallint not null default 0,
  total_missions    smallint not null default 0,
  average_score     smallint not null default 0 check (average_score between 0 and 100),
  stars_earned      smallint not null default 0,
  status            session_status not null default 'active',
  created_at        timestamptz not null default now()
);

create index practice_sessions_child_id_idx on practice_sessions(child_id);
create index practice_sessions_stage_id_idx on practice_sessions(child_id, stage_id);
```

**Note:** `attemptIds` array ใน localStorage ไม่ migrate — ใช้ JOIN แทน (`practice_attempts.session_id`)

---

### practice_attempts

Maps from `PracticeAttempt` in `src/types/speechAdventure.ts`.

```sql
create type evaluation_status as enum ('passed', 'almost', 'retry');

create table practice_attempts (
  id                uuid primary key default gen_random_uuid(),
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
  audio_path        text,  -- Supabase Storage path (future)
  created_at        timestamptz not null default now()
);

create index practice_attempts_child_id_idx on practice_attempts(child_id);
create index practice_attempts_stage_idx on practice_attempts(child_id, stage_id);
create index practice_attempts_session_idx on practice_attempts(session_id);
create index practice_attempts_created_at_idx on practice_attempts(child_id, created_at desc);
```

---

### observation_notes

Maps from `ObservationNote` in `src/types/observations.ts`.

```sql
create type observation_target_type as enum ('session', 'attempt', 'general');
create type observation_category as enum (
  'pronunciation', 'attention', 'progress', 'recommendation', 'other'
);

create table observation_notes (
  id          uuid primary key default gen_random_uuid(),
  child_id    uuid not null references child_profiles(id) on delete cascade,
  author_id   uuid not null references auth.users(id),
  target_type observation_target_type not null default 'general',
  target_id   uuid,  -- session_id or attempt_id
  category    observation_category not null default 'other',
  title       text not null,
  content     text not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index observation_notes_child_id_idx on observation_notes(child_id);
create index observation_notes_target_idx on observation_notes(target_type, target_id)
  where target_id is not null;
```

**Note:** `target_id` เปลี่ยนจาก `string` เป็น `uuid` — ต้อง migrate string IDs

---

## Computed / Derived Views

ไม่ store computed fields — คำนวณใน query หรือ `calculateProgressSummary()` คงเดิม

```sql
-- View: stage completion status per child
create view child_stage_status as
select
  child_id,
  stage_id,
  count(*) as attempt_count,
  max(score) as best_score,
  bool_or(score >= 70) as is_passed,
  min(created_at) as first_attempt_at,
  max(created_at) as last_attempt_at
from practice_attempts
group by child_id, stage_id;
```

---

## Supabase Storage Buckets (Future)

```
audio-recordings/
└── {child_id}/
    └── {attempt_id}.webm   -- raw MediaRecorder output
```

- Bucket policy: private, accessible only via signed URL
- Retention: 90 days default (configurable)
- Max file size: 10 MB per recording

---

## Schema Versioning

ใช้ Supabase migrations directory:
```
supabase/migrations/
├── 20260519_001_initial_schema.sql
├── 20260519_002_rls_policies.sql
└── 20260519_003_views.sql
```
