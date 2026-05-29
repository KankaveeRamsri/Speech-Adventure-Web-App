---
name: speech-adventure-project-status
description: Current phase, completed features, known issues, and next steps for Speech Adventure — updated 2026-05-29
metadata:
  type: project
---

## Current Status (2026-05-29)

**Next phase: P1 — Parent Data Integrity and Persistence Fix**

Build: ✅ passes | tsc: ✅ no errors | lint: ⚠ 11 errors (React compiler warnings, no crashes)

---

## Completed Work (summary)

### Auth & Roles
- Supabase Auth with email/password sign-up/sign-in
- Roles: `parent` (default), `teacher`, `school_admin` (all active); `therapist` defined but disabled
- AuthGuard, useAuth hook, roleHelpers
- `/auth/signin`, `/auth/signup`, redirect aliases `/sign-in`, `/sign-up`

### Parent System
- Child onboarding wizard (`/onboarding`, 5 steps)
- Multi-child support: `childProfileListStorage`, `listProfiles()`, `selectedChildId`
- Owned vs shared child: `useCurrentChildAccess`, `IChildAccessRepository`
- Child selector in sidebar (`ChildSelector`)
- 4 target sounds: **ก / ค / ต / ช** with full phonetic rubrics
- 7-stage training flow: pre-test → level 1–5 → review
- Practice session management (start/complete/abandon)
- Progress tracking by targetSound (`getSoundSummary`, `progressUtils.ts`)
- Progress dashboard at `/progress` with session detail drawer + attempt detail drawer
- Audio playback for saved attempts (`AttemptAudioPlayer` — Supabase only)
- Attempt history and parent review
- Observation notes (parent can write; CRUD)

### AI System
- Speech evaluation: OpenAI (`SPEECH_EVALUATION_PROVIDER=openai`) or mock (default)
- `targetSoundRubric.ts` — ก/ค/ต/ช phonetic rubrics for AI prompt
- Transcript reliability/sanity checks, audio quality checks
- OpenAI provider: Whisper transcription + scoring via Chat Completion
- Sample audio / TTS: OpenAI TTS (`SAMPLE_AUDIO_PROVIDER=openai`) or mock
- In-process audio cache for sample audio
- API routes: `/api/speech/evaluate`, `/api/audio/sample`

### Storage & Repository
- Repository pattern: 6 interfaces (progress, profile, observations, invitations, childAccess, school)
- Local implementations: `src/lib/storage/local/Local*Repository.ts`
- Supabase implementations: `src/lib/storage/supabase/Supabase*Repository.ts`
- `RepositoryProvider` at `src/lib/providers/RepositoryProvider.tsx`
- Cloud read mode: `rehydrate()` on sign-in, `reset()` on sign-out
- Auth transition matrix in RepositoryProvider (handles null→user, user→null, user→user-B)
- User-scoped localStorage keys (keyed by userId)
- Supabase Storage bucket `practice-audio` for audio recordings
- Sync/migration foundation: conflict detection, manual upload flow

### School/Admin System (Foundation)
- School org creation, classroom creation
- Teacher/student assignment foundation
- CSV student import, student cleanup/archive
- Parent linking from imported students (foundation)
- `/school` and `/teacher` routes exist

### Supabase
- Migrations 001–00x in `supabase/migrations/`
- RLS for all tables (owner-based via `is_own_child()`)
- Supabase Storage bucket + RLS for `practice-audio`

---

## Known Issues / Risks (P1 Priority)

1. **Progress summary may not fully scope by targetSound** — `calculateProgressSummary` may include all sounds when it should filter to selected sound
2. **Active sessions can be abandoned and remain "active"** — no auto-cleanup of stuck sessions
3. **child-001 legacy/mock ID risk** — hardcoded `child-001` IDs in mock data may cause data integrity issues
4. **Empty childId risk** — `PracticeCard`/session creation may receive empty childId if profile not yet loaded
5. **Inconsistent star scale** — star count shown in result UI vs star count saved in attempt may differ
6. **Onboarding guard** — guard may not reliably redirect unauthenticated users or users without profile
7. **Progress page is large** — may need future splitting for performance
8. **Parent review/audio playback** — may need polish; only works when Supabase configured

---

## Lint Errors (not blocking build)

11 React compiler errors in school/teacher components:
- "Calling setState synchronously within an effect" (5× school + teacher pages)
- "Cannot create components during render" (school page)
- "Compilation Skipped: Existing memoization could not be preserved"

These are in `school`/`teacher` routes — not in the parent training flow. Document for later.

---

## Next Phase: P1 — Parent Data Integrity

Fix the known risks above before adding new features:
1. Validate childId before session creation in PracticeCard
2. Audit `calculateProgressSummary` — ensure targetSound scoping
3. Session cleanup: auto-abandon stale active sessions on page load
4. Star scale consistency across evaluation result and saved attempt
5. Onboarding guard reliability (redirect if no profile)

---

## Start Here for Future Claude Sessions

### Read first (in order)
1. `memory/MEMORY.md` — index
2. `memory/project_status.md` — this file (current phase, known issues)
3. `memory/project-overview.md` — routes, components, hooks, conventions

### Architecture docs (read only what's relevant)
- `docs/architecture/backend-architecture.md` — service boundaries, eval flow
- `docs/architecture/repository-pattern.md` — interfaces, actual file locations
- `docs/architecture/provider-switching.md` — storage provider config
- `docs/architecture/database-schema.md` — Supabase schema
- `docs/architecture/audio-storage.md` — audio bucket, upload/playback
- `docs/architecture/cloud-read-mode.md` — rehydrate/reset on auth transitions
- `docs/architecture/conflict-strategy.md` — sync safety rules
- `docs/architecture/rls-strategy.md` — row-level security
- `docs/architecture/migration-strategy.md` — localStorage → Supabase phases

### Source files to inspect only if needed
| What you need | Where to look |
|---|---|
| Repository interfaces | `src/lib/repositories/I*Repository.ts` |
| Local implementations | `src/lib/storage/local/Local*Repository.ts` |
| Supabase implementations | `src/lib/storage/supabase/Supabase*Repository.ts` |
| Repository provider | `src/lib/providers/RepositoryProvider.tsx` |
| Speech eval providers | `src/lib/speech-evaluation/providers/` |
| Sample audio providers | `src/lib/sample-audio/providers/` |
| Target sound rubric | `src/lib/speech-evaluation/targetSoundRubric.ts` |
| Training flow page | `src/app/training/[stage]/page.tsx` |
| Practice component | `src/components/speech-adventure/PracticeCard.tsx` |
| Progress hooks | `src/hooks/useSpeechProgress.ts`, `src/hooks/useChildProfile.ts` |
| Progress page | `src/app/progress/page.tsx` |
| Attempt history | `src/components/details/AttemptDetailDrawer.tsx` |
| Auth helpers | `src/lib/auth/roleHelpers.ts`, `src/hooks/useAuth.ts` |
| Storage keys | `src/lib/storage/storageKeys.ts` |
| Child profile list | `src/lib/child-profile/childProfileListStorage.ts` |
| Progress storage | `src/lib/speechProgressStorage.ts` |

### Do NOT scan the whole repo unless necessary
Use the table above to jump directly to relevant files.
Do not start Phase P1 unless explicitly instructed.
