# Audio Storage Architecture

## Overview

Practice audio recordings are stored in **Supabase Storage** — a private S3-compatible
object store. The feature is gated behind Supabase configuration; when Supabase is not
configured the app continues to work without any audio storage.

Phase 35 adds the **foundation**: bucket, policies, upload service, and wiring to the
practice flow. Real AI evaluation using the stored audio is a future phase.

---

## Bucket

| Property | Value |
|---|---|
| Bucket name | `practice-audio` |
| Visibility | **Private** — no public URLs |
| Max file size | 10 MB per recording |
| Allowed MIME types | `audio/webm`, `audio/ogg`, `audio/mp4`, `audio/mpeg`, `audio/wav` |
| Access | Signed URLs (1-hour expiry by default) |

---

## Path Convention

```
users/{userId}/children/{childId}/attempts/{attemptId}.{ext}
```

| Segment | Value | Notes |
|---|---|---|
| `users` | literal | Fixed prefix |
| `{userId}` | `auth.uid()` | Supabase Auth user ID (UUID) |
| `children` | literal | Fixed prefix |
| `{childId}` | `child_profiles.id` | May be localStorage placeholder in pre-migration state |
| `attempts` | literal | Fixed prefix |
| `{attemptId}.{ext}` | attempt ID + audio extension | e.g. `attempt-1716301200000-abc12.webm` |

**Extension mapping:**

| MIME type | Extension |
|---|---|
| `audio/webm` | `.webm` (Chrome default) |
| `audio/mp4` / `audio/mpeg` | `.mp4` |
| `audio/ogg` | `.ogg` |
| `audio/wav` | `.wav` |
| *(fallback)* | `.webm` |

### Why this path structure?

- The `userId` segment at position 2 is what the RLS policy checks — one string comparison
  enforces ownership across all child folders.
- Separating `userId` from `childId` allows future multi-child support without policy changes.
- The path is **deterministic** — it can be computed from metadata before the upload starts,
  so `attempt.audioPath` can be set even if the upload is asynchronous.

---

## RLS Policies

Defined in `supabase/migrations/20260521000700_practice_audio_bucket.sql`.

```sql
-- All three policies share the same ownership check:
(storage.foldername(name))[2] = auth.uid()::text
```

| Operation | Allowed when |
|---|---|
| INSERT (upload) | `foldername[2] = auth.uid()` |
| SELECT (download/signed URL) | `foldername[2] = auth.uid()` |
| DELETE | `foldername[2] = auth.uid()` |
| UPDATE | **Not granted** — recordings are immutable |

The `childId` segment is **not validated** by the policy — it is for organisational
purposes only. The `userId` check is sufficient to prevent cross-user access.

---

## Service API

```typescript
// src/lib/storage/supabase/audioStorage.ts

uploadPracticeAudio(blob: Blob, meta: AudioUploadMetadata): Promise<AudioUploadResult>
getPracticeAudioUrl(path: string, expiresIn?: number): Promise<AudioUrlResult>
deletePracticeAudio(path: string): Promise<AudioDeleteResult>

// Helper — no Supabase call needed
buildAudioPath(meta: AudioUploadMetadata): string
```

All functions return a result object `{ path/url, error }` — they never throw.
When Supabase is not configured, `error = "supabase_not_configured"` is returned
and the UI continues normally without audio storage.

---

## Upload Flow

```
User records audio (MediaRecorder → useAudioRecorder)
  │
  ├─ recorder.blob  = Blob
  ├─ recorder.mimeType = "audio/webm" (or mp4/ogg)
  │
User clicks evaluate → mock API → evaluation result shown
  │
User clicks accept (handleAccept in PracticeCard)
  │
  ├─ buildAttempt() → attempt object with generated ID
  │
  ├─ [Gate] isAuthenticated && user?.id && profile?.id && isSupabaseConfigured()?
  │     YES → uploadPracticeAudio(blob, { userId, childId, attemptId, mimeType })
  │               success → attempt.audioPath = path
  │               failure → attempt.audioPath = undefined (graceful fallback)
  │     NO  → skip upload (provider=local, not signed in, or blob missing)
  │
  ├─ onSaveAttempt(attempt) → addAttempt(attempt)
  │     └─ domainToDbAttempt: audio_path = attempt.audioPath ?? null
  │
  └─ phase = "saved" → UI advances
```

---

## Domain Type

`PracticeAttempt` in `src/types/speechAdventure.ts`:

```typescript
interface PracticeAttempt {
  // ... existing fields ...
  /** Supabase Storage path set after a successful audio upload (Phase 35+). */
  audioPath?: string;
}
```

`DbPracticeAttempt` in `src/types/database.ts` already has `audio_path: string | null`.
The mapper `domainToDbAttempt` now writes `attempt.audioPath ?? null` to that column.

---

## Graceful Fallback Behaviour

| Condition | Outcome |
|---|---|
| Supabase not configured | Upload skipped — attempt saved without `audioPath` |
| User not authenticated | Upload skipped — attempt saved without `audioPath` |
| Profile not loaded (`profile.id` undefined) | Upload skipped |
| No audio blob (non-recorder item types: oral_motor, sound_choice) | Upload skipped |
| Upload network error | `audioPath` remains undefined — attempt still saved |
| Bucket policy rejects upload | Same as above — no crash |

---

## Playback (Phase 36)

Stored recordings are played back via a short-lived signed URL. The playback UI
lives in `AttemptDetailDrawer` and is rendered only when `attempt.audioPath` is set.

### Playback Flow

```
AttemptDetailDrawer renders attempt.audioPath
  │
  └─ <AttemptAudioPlayer audioPath={attempt.audioPath} />
       │
       ├─ useEffect([audioPath]) fires
       │     ├─ check module-level URL_CACHE (50-minute TTL)
       │     │     hit  → use cached URL  →  playerState = "ready"
       │     │     miss → getPracticeAudioUrl(path, 3600)
       │     │               success → cache + setSignedUrl + "ready"
       │     │               error   → playerState = "error"
       │     └─ cleanup: pause audio on unmount
       │
       ├─ playerState = "loading"  →  spinner + "กำลังโหลดเสียง…"
       ├─ playerState = "error"    →  info icon + "ไม่สามารถโหลดเสียงได้"
       ├─ playerState = "ready"    →  ▶ play button + "กดเพื่อเล่น"
       └─ playerState = "playing"  →  ⏸ pause button + "กำลังเล่น…"
```

### Signed URL Cache

`AttemptAudioPlayer` maintains a **module-level** `Map<path, { url, expiresAt }>` cache
so that closing and re-opening the drawer does not trigger redundant network requests.

| Property | Value |
|---|---|
| Cache scope | Module (page lifetime) |
| TTL | 50 minutes (10-minute safety buffer before 1-hour Supabase expiry) |
| Invalidation | Automatic on next render after `expiresAt` |

### Audio Element

- Native `<audio>` element — **hidden from UI**, controlled programmatically.
- `preload="none"` — no network fetch until the user presses play.
- No `autoplay` attribute — user interaction required.
- No browser-native controls shown — fully custom styled, dark-mode compatible.

### Error / Unavailable States

| Condition | `playerState` | UI |
|---|---|---|
| Supabase not configured | `"error"` | "ไม่สามารถโหลดเสียงได้" |
| Signed URL fetch fails | `"error"` | same |
| Audio decode/network error during playback | `"error"` | same |
| `attempt.audioPath` undefined / null | component not rendered | nothing shown |

### Key Files

| File | Role |
|---|---|
| `src/components/details/AttemptAudioPlayer.tsx` | Playback UI component + URL cache |
| `src/lib/storage/supabase/audioStorage.ts` | `getPracticeAudioUrl()` — all Supabase calls stay here |
| `src/components/details/AttemptDetailDrawer.tsx` | Renders `<AttemptAudioPlayer>` when `audioPath` set |

---

## Data Flow Summary

```
MediaRecorder  →  Blob (in-memory)
                    │
                    ▼ uploadPracticeAudio()
              Supabase Storage (practice-audio bucket)
                    │ path stored in
                    ▼
              practice_attempts.audio_path (PostgreSQL)
                    │ mapped to
                    ▼
              PracticeAttempt.audioPath (domain type)
```

---

## Key Files

| File | Role |
|---|---|
| `src/lib/storage/supabase/audioStorage.ts` | Upload / signed URL / delete service |
| `src/hooks/useAudioRecorder.ts` | Exposes `blob` and `mimeType` alongside `audioUrl` |
| `src/components/speech-adventure/PracticeCard.tsx` | Calls `uploadPracticeAudio` in `handleAccept` |
| `src/components/details/AttemptAudioPlayer.tsx` | Playback UI with signed URL cache |
| `src/components/details/AttemptDetailDrawer.tsx` | Renders `<AttemptAudioPlayer>` when `audioPath` present |
| `src/types/speechAdventure.ts` | `PracticeAttempt.audioPath?: string` |
| `src/lib/storage/supabase/mappers.ts` | `audio_path` ↔ `audioPath` mapping |
| `supabase/migrations/20260521000700_practice_audio_bucket.sql` | Bucket + RLS policies |

---

## What Is NOT Implemented (Future Phases)

| Feature | Phase |
|---|---|
| Real AI evaluation using stored audio | Future |
| Playback UI in detail drawers | **Done (Phase 36)** |
| Audio upload progress indicator | Future |
| Automatic retry on upload failure | Future |
| Storage cleanup for orphaned recordings | Future |
| Upload for oral_motor / sound_choice items (no recording) | N/A |

---

## Manual Test Checklist

### Setup
- `NEXT_PUBLIC_STORAGE_PROVIDER=supabase` in `.env.local`
- Real Supabase credentials configured
- Run `20260521000700_practice_audio_bucket.sql` migration in Supabase dashboard

### Test A — Upload succeeds (authenticated, cloud profile exists)
1. Sign in
2. Navigate to `/training` → select a stage
3. Record audio for a practice item
4. Click evaluate (mock result shown)
5. Click accept
6. Open Supabase Storage dashboard → `practice-audio` bucket
7. Confirm file appears at `users/{userId}/children/{childId}/attempts/{attemptId}.webm`
8. Check `practice_attempts` table → `audio_path` column is populated for the new row

### Test B — Graceful fallback (provider=local)
1. Set `NEXT_PUBLIC_STORAGE_PROVIDER=local` in `.env.local`
2. Record and accept a practice attempt
3. Confirm: no upload attempted (no network request to Supabase Storage)
4. Confirm: attempt is saved normally with `audio_path = null`
5. Confirm: UI does not crash

### Test C — Graceful fallback (signed out)
1. Sign out but keep `NEXT_PUBLIC_STORAGE_PROVIDER=supabase`
2. Record and accept a practice attempt
3. Confirm: no upload attempted (isAuthenticated = false)
4. Confirm: attempt saved with `audio_path = null`
5. Confirm: no error shown in UI

### Test D — Non-recorder practice items
1. Navigate to a stage with `oral_motor` or `sound_choice` items
2. Complete the item
3. Confirm: no audio upload (no blob produced by non-recorder items)
4. Confirm: attempt saved normally
