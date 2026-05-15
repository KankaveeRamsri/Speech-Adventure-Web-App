---
name: speech-adventure-project-status
description: Current phase, completed features, and architecture decisions for Speech Adventure web app
metadata:
  type: project
---

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

Completed features:
- Core training flow (pretest → level 1–5 → review)
- Multi-mission practice flow
- Audio recording (useAudioRecorder hook)
- Progress tracking (localStorage, useSyncExternalStore)
- Target-sound content system (mockPracticeItemsBySound)
- Premium light/dark UI redesign (ThemeProvider, Tailwind tokens)
- Central speech evaluation service (Phase 7)
