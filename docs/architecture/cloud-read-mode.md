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

## Affected Files

| File | Change |
|---|---|
| `src/lib/storage/supabase/SupabaseProfileRepository.ts` | + `rehydrate()`, `_hydrateGen`, generation guard in `_hydrate()` |
| `src/lib/storage/supabase/SupabaseProgressRepository.ts` | + `rehydrate()`, `_hydrateGen`, generation guard, localStorage fallback, `_readLocalProgress()` |
| `src/lib/storage/supabase/SupabaseObservationRepository.ts` | + `rehydrate()`, `_hydrateGen`, generation guard, localStorage fallback, `_readLocalNotes()` |
| `src/lib/providers/RepositoryProvider.tsx` | + `useAuth`, `useEffect`, `useRef`, `hasRehydrate`, rehydration effect |
| `docs/architecture/cloud-read-mode.md` | this document |

---

## Invariants Preserved

- **No localStorage data deleted** — fallback reads only; writes are unchanged.
- **No two-way sync** — cloud data is read-only in this phase; writes still go through
  the normal path (which handles auth internally via `_getCurrentUserId()`).
- **Repository abstraction intact** — `IProfileRepository`, `IProgressRepository`,
  `IObservationRepository` interfaces are unchanged. `rehydrate()` is a concrete method
  on Supabase implementations only, accessed via duck-typing.
- **No UI changes** — components continue calling `useSpeechProgress()`,
  `useChildProfile()`, `useObservationNotes()` with no modifications.

---

## Limitations

- **Sign-out does not clear cloud state** — after sign-out, the cache still holds
  the last-fetched data until the page is reloaded. Clearing on sign-out is a
  Phase 33+ concern.
- **No real-time updates** — Supabase Realtime is not wired; data is fetched once per
  sign-in. Subsequent cloud writes from other devices won't appear until refresh.
- **target_id string → UUID migration pending** — observation notes with string
  `target_id` values will fail the Supabase insert. Tracked in Phase 27.

---

## Testing

### Manual test checklist

1. Set `NEXT_PUBLIC_STORAGE_PROVIDER=supabase` in `.env.local`
2. Sign in → confirm profile/progress/observations load without refresh
3. Upload local data to cloud (migration button)
4. Refresh → confirm cloud data still loads
5. Open incognito → sign in same account → confirm cloud data appears (no localStorage)
6. Disable Supabase (set URL to invalid) → confirm app falls back to localStorage without crashing
7. Sign out → sign back in → confirm rehydration fires again (prevUserIdRef resets)
