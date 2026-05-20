# Provider Switching

## Overview

Speech Adventure supports three storage providers that can be selected without changing any code.
The active provider is controlled by a single env var; all UI behaviour is identical across providers.

---

## Providers

### `local` (default)

All data stored in the browser's `localStorage`.

- No external dependencies
- Works offline
- Data is device-bound (not shared across devices)
- Zero configuration required

**When to use:** development, testing, demo mode, any deployment where Supabase is not yet set up.

---

### `supabase`

All three repositories are backed by Supabase (PostgreSQL + auth).

- Data persists across devices and browsers
- Requires a valid Supabase project (`NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
- Requires the user to be signed in
- Data migration from localStorage must be done manually (see [migration-strategy.md](./migration-strategy.md))

**When to use:** production, when cloud persistence is needed.

---

### `hybrid`

Supabase as the primary store; localStorage as fallback when offline.
(Planned for Phase 3+ — currently behaves identically to `supabase`.)

- Best for users who need offline resilience with cloud backup
- Requires all Supabase prerequisites (same as `supabase`)
- Conflict resolution strategy: last-write-wins by `updated_at` timestamp

**When to use:** after `supabase` is stable and offline-first reliability is required.

---

## Configuration

Set `NEXT_PUBLIC_STORAGE_PROVIDER` in `.env.local`:

```bash
# Always explicit — prevents accidental activation
NEXT_PUBLIC_STORAGE_PROVIDER=local        # default
# NEXT_PUBLIC_STORAGE_PROVIDER=supabase
# NEXT_PUBLIC_STORAGE_PROVIDER=hybrid
```

Any unrecognised value is treated as `"local"`.

---

## Fallback Behaviour

If `supabase` or `hybrid` is requested but cannot be activated, the provider
**silently demotes to `local`** and logs a dev-mode warning. The app never crashes.

Fallback triggers when:
1. `NEXT_PUBLIC_SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_ANON_KEY` is absent / placeholder
2. The Supabase client fails to initialize (e.g. network error at boot)

Fallback is **not** triggered by a failed database query mid-session — individual
repository operations handle errors internally.

The dev warning format:
```
[Storage] NEXT_PUBLIC_STORAGE_PROVIDER="supabase" but Supabase env vars are missing.
Falling back to localStorage.
```

Warnings are suppressed in `NODE_ENV=production` to avoid leaking config details.

---

## Repository Selection Flow

```
NEXT_PUBLIC_STORAGE_PROVIDER
        │
        ▼
   "local" ──────────────────────────────────────────────► LocalRepositories (default)
        │
   "supabase" / "hybrid"
        │
        ▼
   isSupabaseConfigured()?
        │
        ├── No ────────────────────────────── [warn] ────► LocalRepositories (fallback)
        │
        └── Yes
              │
              ▼
          createSupabaseRepositories()
              │
              ├── null ───────────────────── [warn] ────► LocalRepositories (fallback)
              │
              └── Repositories object ──────────────────► SupabaseRepositories
```

---

## Rollback

To revert from Supabase back to localStorage at any time:

1. Set `NEXT_PUBLIC_STORAGE_PROVIDER=local` in `.env.local`
2. Restart the dev server
3. localStorage data is untouched — the app continues working immediately

No code changes are required. The RepositoryProvider re-resolves to local repositories
on the next module initialization.

---

## Code Entry Points

| File | Role |
|---|---|
| `src/lib/config/storageProvider.ts` | Reads env var, defines `StorageProvider` type |
| `src/lib/providers/RepositoryProvider.tsx` | Resolves and injects active repositories |
| `src/lib/storage/supabase/createSupabaseRepositories.ts` | Factory for Supabase repos |
| `src/lib/storage/local/Local*Repository.ts` | localStorage implementations |
| `src/lib/storage/supabase/Supabase*Repository.ts` | Supabase implementations |
| `src/lib/sync/` | Sync status types and plan utilities (Phase 3+ migration UI) |

---

## Sync Foundation (Phase 3 preparation)

`src/lib/sync/` contains types and utilities for the future data migration UI.
No data is moved automatically — migration is always user-initiated.

- `syncStatus.ts` — `SyncStatus`, `SyncState`, `DomainSyncStatus` types
- `syncPlan.ts` — `buildSyncPlan()` — previews what would be migrated
- `index.ts` — barrel re-exports

See [migration-strategy.md](./migration-strategy.md) for the full migration roadmap.
