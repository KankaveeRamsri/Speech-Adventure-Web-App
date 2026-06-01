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

## Phase P1 — Parent Data Integrity (Done 2026-05-29)

All 5 data integrity issues fixed:

1. ✅ **targetSound scoping** — `calculateProgressSummary(progress, targetSound?)` accepts optional sound; `useSpeechProgress.summary` is now scoped by `selectedSoundId`; `getStageStatus` already sound-scoped
2. ✅ **Stale session cleanup** — `_cleanupStaleSessions()` runs on init; sessions > 30 min old auto-abandoned
3. ✅ **child-001 contained** — confirmed child-001 only in demo/mock display paths, never in session/attempt creation at runtime
4. ✅ **Empty childId blocked** — `addAttempt` returns early; `startPracticeSession` throws; training page guard prevents session start without profile; shows onboarding CTA
5. ✅ **Star scale unified** — `toUIResult()` and `computeStars()` both use 1–3 scale; `EvaluationResultCard` shows 3 star slots (/3)

### Remaining / Lower Priority Issues

6. **Onboarding guard** — guard may not reliably redirect unauthenticated users without profile (training map shows banner, practice page shows CTA — OK for now)
7. **Progress page is large** — may need future splitting for performance
8. **Parent review/audio playback** — may need polish; only works when Supabase configured
9. **Supabase stale session cleanup** — not implemented (only local storage cleanup added in P1; Supabase sessions need server-side cleanup)

---

## Lint Errors (not blocking build)

11 React compiler errors in school/teacher components:
- "Calling setState synchronously within an effect" (5× school + teacher pages)
- "Cannot create components during render" (school page)
- "Compilation Skipped: Existing memoization could not be preserved"

These are in `school`/`teacher` routes — not in the parent training flow. Document for later.

---

## Phase P2 — Parent Onboarding & Route Guard (Done 2026-05-29)

1. ✅ **Onboarding redirect guard** — `/onboarding` redirects to `/training` if profile already exists; `?edit=true` allows editing; uses Suspense + `useSearchParams`
2. ✅ **DataManagerSection moved to Settings** — removed from onboarding step 4; added as "จัดการข้อมูล" section in `/settings` (parent-only)
3. ✅ **Training page redirect** — authenticated parent with no profile → `router.replace("/onboarding")` on hydration; anonymous user → large hero CTA (not redirect)
4. ✅ **Post-auth chain** — signin/signup → `/training` → `/onboarding` if authenticated + no profile
5. ✅ **Edit profile link** — onboarding edit mode shows link to `/settings` instead of DataManagerSection

## Phase P3 — Parent Progress Dashboard Accuracy (Done 2026-05-29)

1. ✅ **displaySummary** — progress page computes `displaySummary` from `selectedSoundFilter` (UI state); all overview stats, report, next-action card now respect the sound tab the user is viewing
2. ✅ **Sessions tab** — uses `allSessions` (all child sessions, no sound filter) + `allSessionsStats`; not scoped to sound
3. ✅ **Mock footnote** — removed hardcoded note; shows conditionally only if all attempts have `isMock=true` and none have `isMock=false`
4. ✅ **`isMock` field** — added to `PracticeAttempt` type; saved from `evalResult.isMock` in `buildAttempt`; Supabase mapper uses `attempt.isMock ?? true`
5. ✅ **Edit profile links** — fixed `/onboarding` → `/onboarding?edit=true` in: `AppSidebar`, `rewards/page.tsx`, `progress/page.tsx`; new-user links (no profile) correctly keep `/onboarding`
6. ✅ **Per-sound cards** — added "ฝึกต่อ →" / "เริ่มฝึก →" CTA text
7. ✅ **Current level label** — shows "เสียง X" badge when sound filter is active
8. ✅ **report tab** — uses `displaySummary.difficultItems`; shows sound filter note when active

## Phase P4 — Parent Training UX Enhancement (Done 2026-05-29)

1. ✅ **SampleAudioButton prominent** — primary-colored, larger, `onPlayed` callback, helper text "ฟังก่อน แล้วลองพูดตามนะ 🎧"
2. ✅ **Listen-first nudge** — `hasListenedRef` in PracticeCard; soft blue banner "ลองฟังเสียงตัวอย่างก่อนนะ" if recording starts without listening; dismissable; NOT a block
3. ✅ **Retry flow** — when `!isPassed`: practiceTip shown in highlighted info box; "ลองอีกครั้ง" is primary button; "บันทึกและต่อไป" is secondary
4. ✅ **LevelCard locked state** — message "ทำด่านก่อนหน้าให้เสร็จก่อน" on all screen sizes; slightly more visible opacity
5. ✅ **PracticeSessionSummary per-item** — `sessionAttempts?: PracticeAttempt[]` prop; per-item breakdown shows score, promptText, status, stars; training/[stage] page passes `sessionAttempts`

## Phase P5 — Parent Review and Attempt Detail (Done 2026-05-29)

1. ✅ **"สรุปสำหรับผู้ปกครอง" card** — plain-language summary at top: โจทย์, ระบบได้ยินว่า, ผลการฝึก (supportive), ควรทำต่อไป
2. ✅ **Status labels updated** — "ต้องฝึกเพิ่ม" → "ลองอีกครั้ง", "เกือบผ่าน" → "เสียงใกล้เคียงแล้ว"; with parentNote encouraging message
3. ✅ **Audio missing state** — shows "ยังไม่มีเสียงบันทึกสำหรับรายการนี้" when no audioPath
4. ✅ **canViewAudio text** — "ไม่มีสิทธิ์ฟังเสียงบันทึก" (clearer message)
5. ✅ **Footer CTAs** — "ฝึกอีกครั้ง" (links to training stage, gated by canStartPractice); "ดูความก้าวหน้า"; "ปิด"
6. ✅ **Detected issues framing** — "จุดที่ AI สังเกตเห็น" + "ลองฝึกซ้ำกับจุดเหล่านี้..." (supportive, not diagnostic)
7. ✅ **Stats reorganized** — quick 2-card row (score, stars) near top; confidence + duration below audio

## Phase K1 — Kindergarten Phonics Mode Foundation (Done 2026-06-01)

1. ✅ **TrainingMode type** — `"speech_clarity" | "kindergarten_phonics"` in `childProfileStorage.ts`; re-exported from `domain.ts`
2. ✅ **ChildProfileData.trainingMode** — required field; Zod schema defaults to `"speech_clarity"` for old profiles (migration-safe)
3. ✅ **Supabase mapper** — `dbToDomainProfile` hardcodes `trainingMode: "speech_clarity"` (no DB column yet in K1)
4. ✅ **Onboarding step 3** — new "เลือกโหมดการฝึก" step; speech_clarity → step 4 (sound); kindergarten → skip to step 5 (confirm)
5. ✅ **TrainingModeTabs component** — `src/components/speech-adventure/TrainingModeTabs.tsx`; 🎯 ฝึกเสียงให้ชัด / 🌟 เรียนเสียงไทย; orange/amber for kindergarten
6. ✅ **Training page tabs + guard** — shows tabs when hasProfile; kindergarten shows "coming soon" placeholder; speech_clarity renders existing flow unchanged
7. ✅ **AddChildModal fix** — added `trainingMode: "speech_clarity"` default

### K1 Remaining TODOs (for K2+)
- Add `training_mode` column to Supabase DB + migration
- Update `domainToDbProfile` mapper to write `training_mode`
- Build kindergarten phonics curriculum (phon. items, stages)
- Build phonics progress storage (separate from speech_progress)
- Implement "สวนเสียง" journey concept

---

## Phase K2 — Kindergarten Phonics Curriculum Config (Done 2026-06-01)

1. ✅ **`src/types/phonics.ts`** — `PhonicsUnit`, `PhonicsLesson`, `PhonicsPracticeItem`, `PhonicsActivityType`, `PhonicsEvaluationRubric`, `PhonicsEvaluationMode`
2. ✅ **`src/data/kindergartenCurriculum.ts`** — 7 units K1–K7 with sample lessons/items; helper functions: `getPhonicsUnits`, `getPhonicsUnit`, `getPhonicsLesson`, `getFirstPhonicsLesson`, `getNextPhonicsLesson`, `getPhonicsItem`
3. ✅ **`src/lib/speech-evaluation/phonicsRubric.ts`** — `PHONICS_LIGHT_RUBRIC` (passingScore 50, encouraging Thai feedback), `PHONICS_NONE_RUBRIC` (tap activities), `getPhonicsRubric(mode)`
4. ✅ **Training page updated** — kindergarten placeholder now lists K1–K7 unit names/descriptions

### K2 Remaining TODOs (for K3+)
- Build Phonics Journey Map UI (K3)
- Build phonics progress storage: `IPhonicsProgressRepository` + local/Supabase impls (K3+)
- Build activity renderer for each PhonicsActivityType (K4+)
- Add Supabase `training_mode` column + migration (K3)

---

## Phase K3 — Kindergarten Phonics Journey Map UI (Done 2026-06-01)

1. ✅ **`src/components/phonics/PhonicsJourneyMap.tsx`** — Self-contained component; reads from `kindergartenCurriculum`; no hooks/repos
2. ✅ **Unit cards K1–K7** — K1 available (expandable), K2–K7 locked ("ทำด่านก่อนหน้าให้เสร็จก่อน")
3. ✅ **Lesson panel** — expands inside K1 card; shows lesson title, activity type summary, item count; "เร็ว ๆ นี้" CTA (placeholder until K4 routes built)
4. ✅ **Training page** — `PhonicsJourneyMap canStart={canStartPractice}` replaces K2 placeholder; speech_clarity flow unchanged
5. ✅ **"สวนเสียง" header** — progress pill "เปิดใช้งาน 1/7"; footer note about unlock sequence

### K3 Remaining TODOs (for K4+)
- Build activity renderer pages `/phonics/[unit]/[lesson]` (K4)
- Build phonics progress storage: `IPhonicsProgressRepository` (K4)
- Unlock K2+ based on progress data (K4)
- Add Supabase `training_mode` column + migration

---

## Phase K4 — Kindergarten Phonics Activity Renderers MVP (Done 2026-06-01)

1. ✅ **`/training/phonics/[unitId]/[lessonId]`** — Lesson page with progress dots, activity card, summary screen
2. ✅ **`PhonicsActivityRenderer`** — Dispatches to correct renderer by `item.type`
3. ✅ **`ListenAndChooseActivity`** — Tap choice → correct/wrong feedback; "ถัดไป" unlocked after correct tap; no API call
4. ✅ **`SayAfterMeActivity`** — Listen (required) + record (optional) → "ถัดไป" enabled after `onPlayed` or recording; no AI eval yet
5. ✅ **`BlendSoundsActivity`** — Visual equation "ก + อา = กา" from `parseBlendEquation(instruction)`; same flow as SayAfterMe
6. ✅ **`WordPracticeActivity`** — Handles simple_word / final_consonant / short_sentence; sentence uses smaller font
7. ✅ **`PhonicsJourneyMap` updated** — Lesson CTA links to `/training/phonics/K1/K1-L1`; footer updated

### K4 Remaining TODOs (for K5+)
- Add light AI evaluation to SayAfterMe/Blend/Word activities (uses phonicsRubric LIGHT_RUBRIC)
- Build phonics progress storage `IPhonicsProgressRepository` (local + Supabase)
- Unlock K2+ based on K1 completion status
- Add Supabase `training_mode` column + migration

---

## Phase K5 — Phonics Progress Storage + Light Evaluation (Done 2026-06-01)

1. ✅ **`src/types/phonics.ts`** — Added `PhonicsAttempt`, `PhonicsSession`, `PhonicsProgress`, `PhonicsProgressSummary`, `PhonicsAttemptStatus`, `PhonicsActivityResult`, `PhonicsSessionStatus`
2. ✅ **`storageKeys.ts`** — Added `PHONICS_PROGRESS` key + included in `DATA_KEYS`
3. ✅ **`src/lib/storage/phonicsProgressStorage.ts`** — Standalone localStorage module (user+child scoped, stable snapshots, stale session cleanup, helper `getCompletedLessonIds`)
4. ✅ **`src/hooks/usePhonicsProgress.ts`** — Hook with auto scope-sync; exposes `startSession`, `addAttempt`, `completeSession`, `completedLessonIds`, `completedUnitIds`, `summary`
5. ✅ **`SpeechEvaluationInput`** — Added optional `trainingMode?` (non-breaking)
6. ✅ **API route + client.ts** — Parse + forward `trainingMode` to providers
7. ✅ **Mock provider** — Deterministic kindergarten mock pool (generous scores, cycles)
8. ✅ **OpenAI provider** — `evaluateKindergartenWithGpt()` method: lighter prompt, no therapy wording, passScore=50, weights: clarity 40% + transcriptMatch 40% + participation 20%
9. ✅ **Activity components** — All 4 use `PhonicsActivityResult` callback; production activities add "✨ ตรวจสอบเสียง" button; listen_and_choose returns score 100 client-side
10. ✅ **Lesson page** — Full session flow (start → attempt per item → complete); summary shows avgScore + stars + pass rate
11. ✅ **PhonicsJourneyMap** — `completedLessonIds` prop; K1→K2 unlock logic; "✓ ผ่านแล้ว" badge on completed units
12. ✅ **Training page** — Passes `completedLessonIds` from `usePhonicsProgress` to `PhonicsJourneyMap`

### K5 Remaining TODOs (for K6+)
- Phonics progress dashboard page `/phonics/progress`
- Supabase implementation (`IPhonicsProgressRepository`)
- Per-lesson detail view (attempt history)
- Unlock K3+ based on cascading progress

---

## Phase K6 — Phonics Progress Dashboard (Done 2026-06-01)

1. ✅ **`src/components/phonics/PhonicsProgressDashboard.tsx`** — Self-contained dashboard; uses `usePhonicsProgress` + `useChildProfile` + `useCurrentChildAccess`
2. ✅ **`src/app/progress/page.tsx`** — Mode-aware early return: `profile.trainingMode === "kindergarten_phonics"` → `PhonicsProgressDashboard`; speech_clarity unchanged

Features:
- Summary stats: total attempts, completed lessons, avg score, stars
- Next recommendation card ("วันนี้เรียนอะไรต่อดี") with link to lesson
- K1–K7 unit cards: status badge, progress bar, CTA (เริ่มเรียน/เรียนต่อ/ดูบทเรียน)
- Recent attempts (last 6) with score, activity type, status, stars, feedback
- Empty state with "เริ่มเรียนเสียงไทย" CTA
- "All completed" celebration state

### K6 Remaining TODOs (for K7+)
- Per-lesson detail drawer (attempt history per lesson)
- Supabase `IPhonicsProgressRepository` implementation
- K3–K7 cascading unlock based on progress
- Phonics rewards/badge system

---

## Next Phase: K7 — (TBD)

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
