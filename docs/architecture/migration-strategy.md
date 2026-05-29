# Migration Strategy: localStorage → Supabase

**Current status (2026-05-29):** Phases 1–2 complete. Phase 3 (progress sync + manual upload UI) implemented as foundation. Phase 5 (audio storage) implemented.

---

## Guiding Principles

1. **Zero data loss** — users can always import existing localStorage data
2. **No big bang** — migrate domain by domain
3. **localStorage as fallback** — always works offline / without Supabase
4. **Manual migration only** — no automatic upload; always user-initiated

---

## Phase Status

| Phase | Description | Status |
|---|---|---|
| 1 | Supabase Auth + Child Profile | ✅ Done |
| 2 | Repository Pattern | ✅ Done (6 repositories) |
| 3 | Progress Sync (attempts + sessions) | ✅ Foundation done; manual upload UI exists |
| 4 | Observation Notes | ✅ Supabase repo exists |
| 5 | Audio Storage (Supabase Storage) | ✅ Upload + playback done |
| 6 | Analytics + Server-side Reports | 🔲 Future |
| Cloud Sync UI | Manual upload flow + conflict detection | ✅ Foundation done |

---

## Current Manual Upload Flow

```
User → /settings → Cloud Sync Preview
    │
    ├─ assessConflict() → localHasData? cloudHasData?
    │
    ├─ No conflict → Upload button active
    │
    └─ Both have data → ConflictWarningCard
          User ticks acknowledgement → ConfirmationCard → Upload
```

Upload appends new rows (not idempotent for sessions/attempts — flag in localStorage prevents re-run).

---

## Key Files

| File | Role |
|---|---|
| `src/lib/sync/conflictDetection.ts` | `assessConflict()` |
| `src/lib/sync/syncPlan.ts` | `buildSyncPlan()` |
| `src/hooks/useSyncPlanPreview.ts` | localHasData + cloudHasData detection |
| `src/components/sync/CloudSyncPreview.tsx` | Upload UI |
| `src/hooks/useMigration.ts` | Performs the actual data migration |

---

## What Is NOT Implemented

- Two-way sync / merge (cloud ↔ local) — future
- Idempotent progress/observation upload (duplicates possible if run twice from different devices)
- Supabase Realtime live updates — future
- Automatic upload on sign-in — by design never automatic

---

## Rollback

Set `NEXT_PUBLIC_STORAGE_PROVIDER=local` → restart. localStorage untouched.

---

## Risk Register

| Risk | Mitigation |
|---|---|
| Duplicate records on double-upload | `MIGRATION_FLAG_KEY` in localStorage; conflict warning |
| localStorage data loss during migration | JSON export before migrate (future) |
| RLS policy error — data leak | Integration test with anon key |
| ID collision (string → uuid) | Keep original string IDs in `id` column during migration |
