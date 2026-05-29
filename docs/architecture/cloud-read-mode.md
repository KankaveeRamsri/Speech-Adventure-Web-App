# Cloud Read Mode

**Current status (2026-05-29):** Implemented. `rehydrate()` on sign-in, `reset()` on sign-out. Generation counter prevents stale hydration race.

---

## Problem

Auth session restores asynchronously. Supabase repos may hydrate before the session is available → RLS returns 0 rows → UI appears empty until manual refresh.

---

## Solution

### `rehydrate()` on Supabase repositories

Each Supabase repo exposes:

```typescript
rehydrate(): void  // cancel in-flight, start fresh fetch with current session
reset(): void      // immediately clear cache + notify (no new fetch)
```

`_hydrateGen` counter prevents stale in-flight hydration from overwriting fresh data.

### `RepositoryProvider` auth transition matrix

```
prevUserId → userId     Action
──────────────────────────────────────────────────────
null       → "user-A"   rehydrate()
"user-A"   → null       reset()
"user-A"   → "user-B"   reset() then rehydrate()
same user  → same       no-op
```

---

## Hydration Sequence

```
App loads → RepositoryProvider mounts → initial hydrate (no session → empty)
AuthProvider restores session (async)
    │
    └─ RepositoryProvider useEffect:
          profile.rehydrate() + progress.rehydrate() + observations.rehydrate()
              → subscribers re-render with real data ✓
```

---

## Fallback

If Supabase query fails → each repo reads localStorage as fallback. UI is never blank.

---

## Limitations

- No Supabase Realtime — data fetched once per sign-in event
- Subsequent writes from other devices won't appear until next sign-in/refresh

---

## Key Files

| File | Role |
|---|---|
| `src/lib/storage/supabase/Supabase*Repository.ts` | `rehydrate()`, `reset()`, `_hydrateGen` |
| `src/lib/providers/RepositoryProvider.tsx` | auth transition matrix |
