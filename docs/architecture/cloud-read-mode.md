# Cloud Read Mode

## Overview

Cloud Read Mode allows the app to display data from Supabase after a user signs in,
without requiring a page refresh. It solves the race between auth session restoration
and the initial repository hydration.

---

## The Problem (pre-Phase 32)

```
App loads
  │
  ├─ RepositoryProvider mounts (module-level singletons resolve)
  │
  ├─ React components subscribe → _triggerHydrate() fires immediately
  │     │
  │     └─ Supabase query runs … but auth session not yet restored
  │           → RLS returns 0 rows → cache stays empty
  │
  └─ AuthProvider restores session (async, via getInitialSession)
        │
        └─ isLoading: true → false   … but nothing triggers a re-fetch
```

Result: UI shows empty state until the user manually refreshes.

---

## The Fix (Phase 32)

### 1. `rehydrate()` on Supabase repositories

Each Supabase repository now exposes a public `rehydrate()` method:

```typescript
public rehydrate(): void {
  this._hydrated = false;
  this._hydratePromise = null;
  this._hydrateGen++;          // invalidates any in-flight _hydrate() call
  this._triggerHydrate();      // starts a fresh fetch
}
```

**Generation counter (`_hydrateGen`):** prevents a race condition where a slow
in-flight hydration (running without a session) completes AFTER a faster rehydration
(with a session) has already written real data to the cache.

- `_hydrate()` captures `myGen = this._hydrateGen` at start.
- Before writing to the cache it checks `if (this._hydrateGen !== myGen) return`.
- A `rehydrate()` call increments `_hydrateGen`, making the in-flight check fail.

### 2. `RepositoryProvider` watches auth state

```typescript
const { isLoading, user } = useAuth();
const prevUserIdRef = useRef<string | null>(null);

useEffect(() => {
  if (isLoading) return;           // wait for AuthProvider to settle

  const userId = user?.id ?? null;
  if (userId === prevUserIdRef.current) return;  // no change — skip
  prevUserIdRef.current = userId;

  if (!userId) return;             // signed out — no cloud data to fetch

  if (hasRehydrate(repos.profile)) repos.profile.rehydrate();
  if (hasRehydrate(repos.progress)) repos.progress.rehydrate();
  if (hasRehydrate(repos.observations)) repos.observations.rehydrate();
}, [isLoading, user?.id, value]);
```

- Runs once when `isLoading` transitions `true → false` with a valid user.
- Re-runs if the signed-in user changes (account switch, sign out then sign in as another user).
- Uses duck-typing (`hasRehydrate()`) so local repositories are never called — no interface changes required.

---

## Hydration Sequence (post-Phase 32)

```
App loads
  │
  ├─ RepositoryProvider mounts
  │     ├─ Supabase repos created as module-level singletons
  │     └─ components subscribe → initial _hydrate() fires (no session yet → empty)
  │
  ├─ AuthProvider restores session
  │     └─ isLoading: true → false, user: null → AuthUser
  │
  └─ RepositoryProvider useEffect fires
        ├─ profile.rehydrate()     → fetches child_profiles with session → notifies
        ├─ progress.rehydrate()    → fetches sessions + attempts → notifies
        └─ observations.rehydrate() → fetches observation_notes → notifies
                │
                └─ React re-renders with real cloud data ✓
```

---

## Fallback Behaviour

If a Supabase query fails or returns no data, each repository falls back to
`localStorage` so the UI is never blank:

| Repository | Error case | Empty case |
|---|---|---|
| `SupabaseProfileRepository` | read localStorage | read localStorage |
| `SupabaseProgressRepository` | read localStorage | read localStorage (if attempts/sessions exist) |
| `SupabaseObservationRepository` | read localStorage (if notes exist) | shows empty ([] is valid) |

Dev-mode warnings are logged when a fallback is triggered:
```
[SupabaseProgressRepository] cloud error — falling back to localStorage
[SupabaseProgressRepository] no cloud profile — falling back to localStorage
[SupabaseObservationRepository] cloud error — falling back to localStorage
```

Warnings are suppressed in `NODE_ENV=production`.

---

## Session Boundary Safety (Phase 33)

### Problem

After sign-out, the in-memory cache still held the previous user's data.
On account switch, there was a window where the new user could briefly see
the previous user's profile/progress.

### Solution: `reset()` + updated `RepositoryProvider` effect

Each Supabase repository now exposes a public `reset()` method alongside `rehydrate()`:

```typescript
public reset(): void {
  this._hydrateGen++;        // cancel any in-flight _hydrate()
  this._hydrated = false;
  this._hydratePromise = null;
  this._cache = SERVER_VALUE; // immediately return to empty snapshot
  this._notify();             // subscribers re-render with empty state at once
}
```

`reset()` differs from `rehydrate()`:

| | `reset()` | `rehydrate()` |
|---|---|---|
| Clears cache immediately | ✓ | ✗ (fetches first) |
| Notifies subscribers | ✓ | ✓ (after fetch) |
| Starts a new fetch | ✗ | ✓ |
| Use case | sign-out, pre-switch | sign-in, session restore |

### Auth transition matrix

`RepositoryProvider.useEffect` handles every auth transition:

```
prevUserId  →  userId     Action
──────────────────────────────────────────────────────
null        →  "user-A"   rehydrate()              (first sign-in / session restore)
"user-A"    →  null       reset()                  (sign-out)
"user-A"    →  "user-B"   reset() then rehydrate() (account switch)
null        →  null       (no-op — isLoading still settling)
"user-A"    →  "user-A"   (no-op — same user, equality check exits early)
```

### Dev-mode log messages

```
[RepositoryProvider] sign out — resetting cloud repositories
[RepositoryProvider] user switch — resetting before rehydrate
[RepositoryProvider] user <id> — rehydrating cloud repositories
[SupabaseProfileRepository] reset — clearing cache
[SupabaseProgressRepository] reset — clearing cache
[SupabaseObservationRepository] reset — clearing cache
```

---

## Affected Files

| File | Change |
|---|---|
| `src/lib/storage/supabase/SupabaseProfileRepository.ts` | + `reset()`, `rehydrate()`, `_hydrateGen`, generation guard |
| `src/lib/storage/supabase/SupabaseProgressRepository.ts` | + `reset()`, `rehydrate()`, `_hydrateGen`, generation guard, localStorage fallback |
| `src/lib/storage/supabase/SupabaseObservationRepository.ts` | + `reset()`, `rehydrate()`, `_hydrateGen`, generation guard, localStorage fallback |
| `src/lib/providers/RepositoryProvider.tsx` | + `hasReset()`, auth transition matrix in `useEffect` |
| `docs/architecture/cloud-read-mode.md` | this document |

---

## Invariants Preserved

- **No localStorage data deleted** — `reset()` only clears the in-memory cache;
  localStorage is untouched. Fallback reads are also unchanged.
- **No two-way sync** — cloud data is read-only in this phase; writes still go through
  the normal path (which handles auth internally via `_getCurrentUserId()`).
- **Repository abstraction intact** — `IProfileRepository`, `IProgressRepository`,
  `IObservationRepository` interfaces are unchanged. `reset()` and `rehydrate()` are
  concrete methods on Supabase implementations only, accessed via duck-typing.
- **No UI changes** — components continue calling `useSpeechProgress()`,
  `useChildProfile()`, `useObservationNotes()` with no modifications.

---

## Limitations

- **No real-time updates** — Supabase Realtime is not wired; data is fetched once per
  sign-in event. Subsequent cloud writes from other devices won't appear until refresh.
- **target_id string → UUID migration pending** — observation notes with string
  `target_id` values will fail the Supabase insert. Tracked in Phase 27.

---

## Testing

### Manual test checklist (full session boundary test)

1. Set `NEXT_PUBLIC_STORAGE_PROVIDER=supabase` in `.env.local`
2. Sign in account A → confirm cloud data loads
3. Sign out → confirm profile/progress disappear immediately (no refresh needed)
4. Sign in account B → confirm only account B data appears (no data from A)
5. Refresh page → confirm account B data still loads correctly
6. Switch `NEXT_PUBLIC_STORAGE_PROVIDER=local` → confirm app works with localStorage
7. Open DevTools console — confirm dev-mode logs appear on auth transitions
8. Disable Supabase URL → confirm fallback to localStorage without crash
