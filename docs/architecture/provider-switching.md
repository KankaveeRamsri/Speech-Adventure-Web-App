# Provider Switching

**Current status (2026-05-29):** Implemented. `local` is default. `supabase` is production-ready. `hybrid` behaves like `supabase` (no offline-write queue yet).

---

## Storage Providers

| Value | Behaviour |
|---|---|
| `local` (default) | All 6 repos backed by localStorage. No Supabase needed. |
| `supabase` | All 6 repos backed by Supabase. Falls back to local if env vars missing. |
| `hybrid` | Currently identical to `supabase`. Future: offline-write queue. |

Set in `.env.local`:

```bash
NEXT_PUBLIC_STORAGE_PROVIDER=local        # default
# NEXT_PUBLIC_STORAGE_PROVIDER=supabase
# NEXT_PUBLIC_STORAGE_PROVIDER=hybrid
```

Any unrecognised value → `"local"`.

---

## Resolution Flow

```
NEXT_PUBLIC_STORAGE_PROVIDER
    │
    ├─ "local" (or missing) ──────────────────────────── LocalRepositories
    │
    └─ "supabase" / "hybrid"
          │
          ├─ Supabase env vars missing? ──── [warn] ──── LocalRepositories
          │
          └─ createSupabaseRepositories() → null? ─── LocalRepositories
                │
                └─ Supabase repos ✓
```

Dev warnings are logged but suppressed in `NODE_ENV=production`.

---

## AI Provider Env Vars (separate from storage)

| Env Var | Values | Side |
|---|---|---|
| `SPEECH_EVALUATION_PROVIDER` | `mock` (default) / `openai` | Server only |
| `OPENAI_API_KEY` | your key | Server only |
| `SAMPLE_AUDIO_PROVIDER` | `mock` (default) / `openai` | Server only |
| `OPENAI_TTS_MODEL` | `tts-1` (default) | Server only |
| `OPENAI_TTS_VOICE` | `alloy` (default) | Server only |

---

## Rollback

Set `NEXT_PUBLIC_STORAGE_PROVIDER=local` and restart. localStorage data is untouched.

---

## Key Files

| File | Role |
|---|---|
| `src/lib/config/storageProvider.ts` | Reads env var, defines `StorageProvider` type |
| `src/lib/providers/RepositoryProvider.tsx` | Resolves + injects all 6 repositories |
| `src/lib/storage/supabase/createSupabaseRepositories.ts` | Supabase factory |
| `src/lib/storage/local/Local*Repository.ts` | localStorage implementations |
| `src/lib/storage/supabase/Supabase*Repository.ts` | Supabase implementations |
| `src/lib/sync/` | Conflict detection + sync plan types |
