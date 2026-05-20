# Speech Adventure — AI Context Memory

## Project Purpose
Thai children's speech therapy web app (ระบบฝึกพูดสำหรับเด็กไทย).
Guides children through a 7-stage speech training curriculum with audio recording, AI evaluation, progress tracking, and rewards.

## Stack
- Next.js 16.2.6 · React 19.2.4 · TypeScript · Tailwind CSS v4 · **Zod 4.4.3** · **@supabase/supabase-js ^2.106.0**
- localStorage still active provider — Supabase foundation wired (Phase 23), not yet activated
- Font: Kanit + Noto Sans Thai
- No third-party UI component library

## Architecture Philosophy
- Thin pages, logic in hooks and `src/lib`
- Stable-snapshot pub-sub pattern via `useSyncExternalStore` (avoids hydration loops)
- **Repository pattern (Phase 21):** hooks depend on `IProgressRepository`, `IProfileRepository`, `IObservationRepository` — not storage modules directly
- Storage abstraction: each domain has its own `*Storage.ts` module (still exists as backing store)
- Mock AI evaluator now; real API slot is pre-wired in `evaluateSpeech.ts`

## Current Backend State
- **All data in localStorage** — via `LocalProgressRepository`, `LocalProfileRepository`, `LocalObservationRepository`
- Storage keys centralized in `src/lib/storage/storageKeys.ts`
- Keys: `speech-adventure-progress-v1`, `speech-adventure-profile-v1`, `speech-adventure-observations-v1`, `speech-adventure-selected-sound-v1`
- Pub-sub listeners notify React without re-parsing localStorage on every render
- Export/import/clear via `localDataBackup.ts`

## Repository Architecture (Phase 21)
- Interfaces: `src/lib/repositories/I*Repository.ts`
- Local implementations: `src/lib/storage/local/Local*Repository.ts`
- DI Provider: `src/lib/providers/RepositoryProvider.tsx` (wraps app in `layout.tsx`)
- Hooks use `useRepositories()` — swap storage backend by injecting overrides into `RepositoryProvider`
- Type barrels: `src/types/domain.ts`, `src/types/repositories.ts`

## Validation Layer (Phase 22)
- Zod schemas: `src/lib/validation/schemas.ts` — covers all 6 core data types
- Helpers: `src/lib/validation/index.ts` — `parseOrDefault<T>()`, `parseOrNull<T>()`
- Database types: `src/types/database.ts` — snake_case mirror of Supabase schema (for future mapping)
- Validation wired into `readFromLocalStorage()` in all three storage modules:
  - `speechProgressStorage.ts` → `SpeechProgressSchema` + `parseOrDefault`
  - `childProfileStorage.ts` → `ChildProfileDataSchema` + `parseOrNull`
  - `observationStorage.ts` → `ObservationNotesArraySchema` + `parseOrDefault`
- Invalid localStorage data: logs dev warning, returns safe default — never crashes UI

## Supabase Foundation (Phase 23 — foundation only, not active)
- `src/lib/supabase/client.ts` — `getSupabaseClient()` returns null when env vars absent (localStorage mode)
- `src/types/supabase.ts` — typed `Database` placeholder; replace with `npx supabase gen types typescript`
- `src/lib/storage/supabase/Supabase*Repository.ts` — 3 stub classes, all throw "not implemented (Phase 3)"
- `supabase/migrations/` — 3 SQL files: initial schema, RLS policies, views
- `supabase/seed/seed.sql` — dev seed (all commented out by default)
- Env vars: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (see `.env.local.example`)
- Activation path: set `NEXT_PUBLIC_STORAGE_BACKEND=supabase` + inject Supabase repos via `RepositoryProvider overrides`

## Auth Foundation (Phase 24 — active, Supabase-gated)
- `src/types/auth.ts` — `AuthUser`, `AuthSession`, `AuthResult`, `AuthContextValue` types
- `src/lib/auth/supabaseAuth.ts` — Supabase Auth wrappers: `getInitialSession`, `subscribeToAuthChanges`, `signIn`, `signUp`, `signOut` — all return safe defaults when Supabase not configured
- `src/providers/AuthProvider.tsx` — React context; `isLoading=true` until session restored; graceful fallback when Supabase unconfigured
- `src/hooks/useAuth.ts` — `useAuth()` hook to read auth state from any component
- `src/components/auth/AuthGuard.tsx` — minimal protected-route wrapper; pass-through when Supabase not configured (localStorage mode stays open)
- Pages: `/auth/signin`, `/auth/signup` — standalone (no AppShell), Thai labels, show "Supabase not configured" notice in dev mode
- Provider hierarchy: `AuthProvider` → `RepositoryProvider` → `ThemeProvider` (auth outermost for future repo switching by auth state)
- localStorage stays fully active — auth does NOT affect repository layer yet
- Session restore: `getInitialSession()` in `useEffect` + `onAuthStateChange` listener; no hydration mismatch (isLoading initial value derived from `isSupabaseConfigured()` which is consistent server/client)

## Future AI Direction
- `evaluateSpeech.ts` has `ACTIVE_PROVIDER = "mock"` — swap to `"api"` to enable real evaluation
- `app/api/speech/evaluate/route.ts` is the Next.js API route stub for AI backend

## Development Rules
- Read `node_modules/next/dist/docs/` before writing Next.js code (v16 has breaking changes)
- Never mutate `currentProgress` outside of write operations (breaks `useSyncExternalStore`)
- Storage modules follow: init-once pattern, stable SERVER_* constant, listeners Set
- Repository write methods are async — callers must `await` or use `.then()`
- Thai language UI — keep labels/messages in Thai
- No emoji-heavy design; clean, professional, warm tone
