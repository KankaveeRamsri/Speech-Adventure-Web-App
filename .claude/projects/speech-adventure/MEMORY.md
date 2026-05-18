# Speech Adventure — AI Context Memory

## Project Purpose
Thai children's speech therapy web app (ระบบฝึกพูดสำหรับเด็กไทย).
Guides children through a 7-stage speech training curriculum with audio recording, AI evaluation, progress tracking, and rewards.

## Stack
- Next.js 16.2.6 · React 19.2.4 · TypeScript · Tailwind CSS v4
- No backend yet — 100% localStorage (Supabase planned on `feature/supabase`)
- Font: Kanit + Noto Sans Thai
- No third-party UI component library

## Architecture Philosophy
- Thin pages, logic in hooks and `src/lib`
- Stable-snapshot pub-sub pattern via `useSyncExternalStore` (avoids hydration loops)
- Storage abstraction: each domain has its own `*Storage.ts` module
- Mock AI evaluator now; real API slot is pre-wired in `evaluateSpeech.ts`

## Current Backend State
- **All data in localStorage** — progress, profile, observations
- Keys: `speech-adventure-progress-v1`, `speech-adventure-profile-v1`, `speech-adventure-observations-v1`, `speech-adventure-selected-sound-v1`
- Pub-sub listeners notify React without re-parsing localStorage on every render
- Export/import/clear via `localDataBackup.ts`

## Future AI Direction
- `evaluateSpeech.ts` has `ACTIVE_PROVIDER = "mock"` — swap to `"api"` to enable real evaluation
- `app/api/speech/evaluate/route.ts` is the Next.js API route stub for AI backend
- Supabase planned for auth, progress sync, and multi-device support

## Development Rules
- Read `node_modules/next/dist/docs/` before writing Next.js code (v16 has breaking changes)
- Never mutate `currentProgress` outside of write operations (breaks `useSyncExternalStore`)
- Storage modules follow: init-once pattern, stable SERVER_* constant, listeners Set
- Thai language UI — keep labels/messages in Thai
- No emoji-heavy design; clean, professional, warm tone
