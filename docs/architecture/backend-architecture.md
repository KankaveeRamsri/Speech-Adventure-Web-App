# Backend Architecture

**Current status (2026-05-29):** Supabase auth + storage implemented. localStorage is still the default provider. Speech evaluation and sample audio use OpenAI or mock.

---

## Storage Providers

| Provider | When used |
|---|---|
| `local` (default) | dev, demo, any deployment without Supabase |
| `supabase` | production — requires env vars |
| `hybrid` | planned; currently behaves like `supabase` |

Set via `NEXT_PUBLIC_STORAGE_PROVIDER` in `.env.local`.

### localStorage Keys (user-scoped)

```
speech-adventure-progress-{userId}-v1   attempts + sessions
speech-adventure-profiles-{userId}-v1   child profiles list
speech-adventure-selected-{userId}-v1   selected child ID
speech-adventure-sound-{userId}-v1      selected target sound
```

Legacy unscopeded keys are migrated on first use.

---

## Service Boundaries

```
┌─────────────────────────────────────────────────────────────┐
│  Next.js App                                                │
│                                                             │
│  Identity (Supabase Auth)   Progress Service               │
│  Child Profile Service      Observations Service           │
│  Speech Evaluation          Sample Audio / TTS             │
│  School/Classroom           Invitation / Child Access      │
└─────────────────────────────────────────────────────────────┘
         │
Supabase PostgreSQL + Storage + Auth
```

---

## Speech Evaluation Architecture

```
AudioRecorder → Blob
    │
    ▼  POST /api/speech/evaluate  (multipart)
    │
    ▼  evaluateSpeech(input)  [src/lib/speech-evaluation/]
    │
    ├── SPEECH_EVALUATION_PROVIDER=mock (default)
    │       → MockSpeechEvaluationProvider
    │
    └── SPEECH_EVALUATION_PROVIDER=openai
            → OpenAISpeechEvaluationProvider
                 ├── Whisper transcription
                 ├── Thai target sound rubric (targetSoundRubric.ts)
                 ├── Transcript reliability check
                 └── Scoring via Chat Completion
```

- `OPENAI_API_KEY` is server-side only (no `NEXT_PUBLIC_`)
- Fallback to mock if key missing or provider throws

### Key files
- `src/lib/speech-evaluation/service.ts` — provider selection + fallback
- `src/lib/speech-evaluation/evaluateSpeech.ts` — public entry point
- `src/lib/speech-evaluation/providers/openai.ts` — OpenAI implementation
- `src/lib/speech-evaluation/providers/mock.ts` — mock implementation
- `src/lib/speech-evaluation/targetSoundRubric.ts` — ก/ค/ต/ช rubrics
- `src/lib/speech-evaluation/types.ts` — SpeechEvaluationInput/Result
- `src/app/api/speech/evaluate/route.ts` — API route

---

## Sample Audio / TTS Architecture

```
SampleAudioButton → GET /api/audio/sample
    │
    ▼  generateSampleAudio(input)  [src/lib/sample-audio/]
    │
    ├── SAMPLE_AUDIO_PROVIDER=mock (default) → browser TTS instructions
    └── SAMPLE_AUDIO_PROVIDER=openai → OpenAI TTS (tts-1 model)
         └── in-process cache (Map<cacheKey, result>) — skips re-generation
```

- `OPENAI_TTS_MODEL` (default: `tts-1`), `OPENAI_TTS_VOICE` (default: `alloy`)
- Cache is process-lifetime; real audio only (not mock) is cached

### Key files
- `src/lib/sample-audio/service.ts` — provider selection + cache
- `src/lib/sample-audio/providers/openai.ts` — OpenAI TTS
- `src/lib/sample-audio/providers/mock.ts` — returns browser TTS hint
- `src/app/api/audio/sample/route.ts` — API route

---

## Data Access Pattern

```
React Component
    │
    ▼
Hook (useSpeechProgress, useChildProfile, …)
    │  useSyncExternalStore
    ▼
Repository Interface (IProgressRepository, IProfileRepository, …)
    │
    ├── Local*Repository (default)   src/lib/storage/local/
    └── Supabase*Repository          src/lib/storage/supabase/
```

See `repository-pattern.md` for full interface definitions and file list.

---

## API Route Structure

```
src/app/api/
├── speech/
│   └── evaluate/route.ts   POST — AI speech evaluation
└── audio/
    └── sample/route.ts     GET  — AI TTS sample audio
```

---

## Non-Functional Notes

| Concern | Current State |
|---|---|
| Auth | Supabase Auth (email/password) |
| Multi-device sync | Cloud read on sign-in; writes go to active provider |
| Offline | localStorage always available as fallback |
| Data privacy | RLS per-child isolation (see `rls-strategy.md`) |
| Audio storage | Supabase Storage `practice-audio` bucket (signed URLs) |
| Real-time | Not implemented — fetch on sign-in only |

---

## Do Not Break

- `OPENAI_API_KEY` must never be exposed in `NEXT_PUBLIC_` env vars
- Mock provider fallback must always work (no key needed)
- Repository interfaces must not change without updating all 2 implementations
- `useSyncExternalStore` server snapshot must return same reference every call
