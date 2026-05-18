# Database Plan

## Current State
- No database. All persistence via **localStorage**.
- Active branch: `feature/supabase` — migration is in progress or planned.

## Planned Backend: Supabase
- **PostgreSQL** via Supabase hosted service
- **Auth**: Supabase Auth (email/password or magic link for parents/therapists)
- **Storage**: Supabase Storage for audio recordings (blobs)
- **Realtime**: optional, for live session monitoring

## Repository Abstraction Strategy
When Supabase is introduced, each storage module becomes swappable:
```
src/lib/<domain>/<domain>Storage.ts   (current: localStorage)
                ↕ swap to
src/lib/<domain>/<domain>Repository.ts (future: Supabase calls)
```
Hooks (`useSpeechProgress`, etc.) call the storage module — they don't need to change.

## Planned Tables

| Table | Purpose |
|---|---|
| `profiles` | Child profiles (name, age, target_sound, training_goal) |
| `progress` | Aggregated progress per child + sound |
| `attempts` | Individual practice attempts with scores |
| `sessions` | Practice session records (start/end/status) |
| `observations` | Therapist/parent observation notes |
| `audio_files` | Metadata for recordings (blob in Storage) |
| `users` | Auth users (therapists, parents) |

## Row-Level Security (RLS) Direction
- Users can only read/write their own children's data
- Therapists may access multiple children (via a `child_therapist` join table)
- Public read on curriculum/content tables (no RLS needed)

## Migration Strategy
1. Keep `*Storage.ts` modules as the interface
2. Introduce `useSupabaseClient` hook
3. Replace `readFromLocalStorage` / `writeToLocalStorage` internals with Supabase calls
4. Add local→cloud migration utility on first login (reads localStorage, POSTs to Supabase, clears local)
5. Offline-first consideration: keep localStorage as write-through cache

## localStorage Keys (current)
| Key | Content |
|---|---|
| `speech-adventure-progress-v1` | `SpeechProgress` (attempts + sessions) |
| `speech-adventure-profile-v1` | `ChildProfile` |
| `speech-adventure-observations-v1` | `ObservationNote[]` |
| `speech-adventure-selected-sound-v1` | Sound ID string |
| `speech-adventure-theme` | `"dark"` \| `"light"` |
| `speech-adventure-sidebar-collapsed` | `"true"` \| `"false"` |
