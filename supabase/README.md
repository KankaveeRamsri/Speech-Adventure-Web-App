# Supabase — Speech Adventure

Backend foundation for migrating from localStorage to Supabase PostgreSQL.

## Current Status

**localStorage is the active storage provider.**  
Supabase is wired up at the type and infrastructure level only — no data flows through it yet.  
See Phase 3 in the migration plan to activate it.

---

## Directory Structure

```
supabase/
├── migrations/
│   ├── 20260520_001_initial_schema.sql   — Tables + indexes + enums
│   ├── 20260520_002_rls_policies.sql     — Row Level Security (owner-only)
│   └── 20260520_003_views.sql            — Computed views (stage status, session summary)
├── seed/
│   └── seed.sql                          — Dev-only test data (all commented out by default)
└── README.md                             — This file
```

---

## Setup

### 1. Create a Supabase project

Go to [https://supabase.com](https://supabase.com) and create a new project.

### 2. Configure env vars

```bash
cp .env.local.example .env.local
# Then fill in NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
# from your project's Settings → API page
```

### 3. Run migrations

```bash
# Option A — Supabase CLI (recommended)
npx supabase link --project-ref <your-project-ref>
npx supabase db push

# Option B — Supabase dashboard SQL editor
# Paste each migration file in order: 001 → 002 → 003
```

### 4. Regenerate types (after schema changes)

```bash
npx supabase gen types typescript --project-id <your-project-ref> \
  > src/types/supabase.ts
```

---

## Activating Supabase as the Storage Provider (Phase 3)

1. Set env vars (step 2 above)
2. Implement `SupabaseProgressRepository`, `SupabaseProfileRepository`,  
   `SupabaseObservationRepository` in `src/lib/storage/supabase/`  
   (stubs are already there — remove the `throw new Error(...)` statements)
3. In `src/app/layout.tsx`, detect `NEXT_PUBLIC_STORAGE_BACKEND === "supabase"`  
   and pass the Supabase repositories as `overrides` to `<RepositoryProvider>`
4. Set `NEXT_PUBLIC_STORAGE_BACKEND=supabase` in `.env.local`
5. The localStorage repositories remain untouched — just not injected

---

## localStorage → Supabase Key Mapping

| localStorage key | Supabase table |
|---|---|
| `speech-adventure-profile-v1` | `child_profiles` |
| `speech-adventure-progress-v1` | `practice_attempts` + `practice_sessions` |
| `speech-adventure-observations-v1` | `observation_notes` |
| `speech-adventure-selected-sound-v1` | `child_profiles.selected_sound_id` |

See `docs/architecture/database-schema.md` for full field mappings.

---

## RLS Summary

All tables use owner-only Row Level Security. A user can only access rows
where `user_id` (or `author_id`) matches `auth.uid()`.  
Therapist / shared-access roles are planned for a future phase.

---

## Supabase Storage (Future)

Audio recordings will be stored in:
```
audio-recordings/{child_id}/{attempt_id}.webm
```
- Private bucket, accessible via signed URLs only
- 90-day retention (configurable)
- Max 10 MB per file

Referenced by `practice_attempts.audio_path` column.
