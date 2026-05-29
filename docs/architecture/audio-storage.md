# Audio Storage Architecture

**Current status (2026-05-29):** Implemented. Upload in PracticeCard + playback in AttemptDetailDrawer. Feature gated behind Supabase configuration.

---

## Bucket

| Property | Value |
|---|---|
| Bucket name | `practice-audio` |
| Visibility | Private — signed URLs only |
| Max file size | 10 MB |
| Access | Signed URLs (1-hour expiry) |

## Path Convention

```
users/{userId}/children/{childId}/attempts/{attemptId}.{ext}
```

- `userId` at position 2 — RLS policy checks this segment
- Extensions: `.webm` (Chrome default), `.mp4`, `.ogg`, `.wav`

---

## Service API (`src/lib/storage/supabase/audioStorage.ts`)

```typescript
uploadPracticeAudio(blob, meta)        → { path?, error? }
getPracticeAudioUrl(path, expiresIn?)  → { url?, error? }
deletePracticeAudio(path)             → { error? }
buildAudioPath(meta)                  → string  (no Supabase call)
```

Never throws — always returns result object.

---

## Upload Flow

```
User records → Blob → evaluate → accept
    │
    ├─ Gate: isAuthenticated && userId && profile.id && isSupabaseConfigured?
    │     YES → uploadPracticeAudio(blob, meta)
    │               success → attempt.audioPath = path
    │               failure → attempt.audioPath = undefined (graceful)
    │     NO  → skip upload
    │
    └─ addAttempt(attempt) → saved (with or without audioPath)
```

---

## Playback Flow

```
AttemptDetailDrawer → <AttemptAudioPlayer audioPath={...} />
    │
    ├─ Check module-level URL_CACHE (50-min TTL)
    │     hit  → use cached URL
    │     miss → getPracticeAudioUrl(path)
    │
    └─ States: loading → ready → playing | error
```

- Module-level cache (`Map<path, {url, expiresAt}>`)
- Native `<audio>` element, hidden, programmatically controlled
- Only rendered when `attempt.audioPath` is set

---

## Graceful Fallbacks

| Condition | Outcome |
|---|---|
| Supabase not configured | Skip upload, no crash |
| User not authenticated | Skip upload |
| No audio blob (oral_motor, sound_choice) | Skip upload |
| Upload network error | Attempt saved without audioPath |

---

## Key Files

| File | Role |
|---|---|
| `src/lib/storage/supabase/audioStorage.ts` | Upload / URL / delete service |
| `src/hooks/useAudioRecorder.ts` | Exposes `blob` and `mimeType` |
| `src/components/speech-adventure/PracticeCard.tsx` | Calls `uploadPracticeAudio` in `handleAccept` |
| `src/components/details/AttemptAudioPlayer.tsx` | Playback UI + URL cache |
| `src/components/details/AttemptDetailDrawer.tsx` | Renders `<AttemptAudioPlayer>` |
| `src/types/speechAdventure.ts` | `PracticeAttempt.audioPath?: string` |
| `src/lib/storage/supabase/mappers.ts` | `audio_path` ↔ `audioPath` |
| `supabase/migrations/*_practice_audio_bucket.sql` | Bucket + RLS policies |

---

## Not Yet Implemented

- Upload progress indicator
- Automatic retry on upload failure
- Storage cleanup for orphaned recordings
- Real AI evaluation using stored audio
