---
name: speech-adventure-project-status
description: Current phase, completed features, and architecture decisions for Speech Adventure web app
metadata:
  type: project
---

Phase 7-reboot (Child Selector + Multi-child Foundation) complete as of 2026-05-22.
- childProfileListStorage.ts — manages ChildProfileData[] + selectedChildId, migrates from legacy single-profile key on first init
- IProfileRepository extended: listProfiles(), getSelectedChildId(), setSelectedChildId()
- LocalProfileRepository: delegates getProfile/subscribe to childProfileListStorage; write-through to legacy childProfileStorage for compat
- SupabaseProfileRepository: stubs (listProfiles returns [cache], setSelectedChildId is no-op — DB schema still single-profile)
- useChildProfile: exposes profiles[], selectedChildId, selectChild(id)
- useSpeechProgress: filters attempts/sessions by profile.id when profiles.length > 1 (backward compat: single-child shows all)
- ChildSelector component: dropdown to switch between children, "เพิ่มเด็ก" links to /onboarding
- AppSidebar: replaced hardcoded child name with ChildSelector in both desktop + mobile sections
- INVARIANT: single-child users see no change — all their data still visible
- NOTE: Supabase child_profiles table still limited to 1 row per user_id (onConflict user_id). Multi-child in Supabase needs Phase 8 migration.
- KEY: When switching child, caller must also call setSelectedSound(child.targetSound) — ChildSelector handles this automatically

Phase 26 (Supabase Repository Adapter Drafts) complete as of 2026-05-20. TypeScript fix: `Db*` row types must be `type` aliases (not `interface`) so they get implicit index signatures and satisfy `Record<string, unknown>` required by supabase-js v2 `GenericTable` constraint. Also `InsertChildProfile` needs optional `id?: string` for upsert-with-id calls.

Phase 25 (Supabase Database Migration Foundation) complete as of 2026-05-20. SQL migrations 001–006 in `supabase/migrations/`.

Phase 24 (Supabase Auth Foundation) complete as of 2026-05-20. AuthProvider, useAuth, AuthGuard, sign-in/sign-up pages at `/auth/signin` and `/auth/signup` with redirect aliases at `/sign-in` and `/sign-up`.

Phase 11 (Onboarding and Child Profile Setup) complete as of 2026-05-15.
Phase 10 (Parent/Teacher Report View) complete as of 2026-05-15.
Phase 9 (Demo Data / Presentation Mode) complete as of 2026-05-15.
Phase 8 (Mock Speech Evaluation API Route) complete as of 2026-05-15.
Phase 7 (AI Evaluation Service Preparation) complete as of 2026-05-15.

Central evaluation service lives at `src/lib/speech-evaluation/`:
- `types.ts` — SpeechEvaluationInput, SpeechEvaluationResult, EvaluationProvider ("mock"|"api"), EvaluationStatus
- `mockEvaluator.ts` — all mock logic (recording pool, oral_motor, sound_choice branching)
- `evaluateSpeech.ts` — async entry point; swap ACTIVE_PROVIDER to "api" for real AI

`PracticeCard.tsx` now calls `evaluateSpeech(input)` instead of inline `generateMockEvaluation()`.
`MockEvaluationResult` in `speechAdventure.ts` is deprecated alias for `SpeechEvaluationResult`.

**Why:** Isolate mock logic so real AI can be dropped in by changing one constant.
**How to apply:** Next step is Phase 8 — real AI endpoint. Point `ACTIVE_PROVIDER = "api"` in evaluateSpeech.ts and implement `callAiEvaluationApi(input)`.

Phase 8 additions:
- API route `POST /api/speech/evaluate` in `src/app/api/speech/evaluate/route.ts`
- Client helper `src/lib/speech-evaluation/client.ts` with `evaluateSpeechViaApi()`
- PracticeCard now calls the API route (not the server service directly)
- Validation: returns 400 for missing/invalid fields; 405 handled by Next.js automatically

Phase 11 additions:
- `src/lib/child-profile/childProfileStorage.ts` — pub-sub localStorage store for `ChildProfileData` (id, name, age, targetSound, trainingGoal, createdAt, updatedAt)
- `src/hooks/useChildProfile.ts` — `useSyncExternalStore` hook; server snapshot = null (no profile on server)
- `src/app/onboarding/page.tsx` — 5-step form (welcome → name/age → sound → goal → confirm); edit mode skips welcome and routes back to /training on save
- `src/components/landing/LandingCTA.tsx` — client component; shows "ตั้งค่าเริ่มต้น" if no profile, "ฝึกต่อ, {name}" if profile exists
- Landing page uses LandingCTA; added "ตั้งค่า" nav link to /onboarding
- Training page: setup banner when no profile; edit button on ChildProfileCard; liveProfile merges real name/age
- Progress and Report pages: liveProfile merges real name/age from ChildProfileData; edit profile button in header

Completed features:
- Core training flow (pretest → level 1–5 → review)
- Multi-mission practice flow
- Audio recording (useAudioRecorder hook)
- Progress tracking (localStorage, useSyncExternalStore)
- Target-sound content system (mockPracticeItemsBySound)
- Premium light/dark UI redesign (ThemeProvider, Tailwind tokens)
- Central speech evaluation service (Phase 7)
