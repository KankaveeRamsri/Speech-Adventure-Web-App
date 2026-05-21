# Conflict Strategy

## Overview

This document defines the data safety policy for synchronising local device data
with Supabase cloud storage. The core principle is **zero silent overwrite** — no
data in Supabase is ever deleted or replaced without explicit user action.

---

## Sync Policy Rules

| Rule | Detail |
|---|---|
| **localStorage is always safe** | Local data is never deleted by any sync or auth event. |
| **Cloud is source of truth after sign-in** | When `NEXT_PUBLIC_STORAGE_PROVIDER=supabase`, Supabase data is loaded on sign-in and shown in the UI. |
| **Upload is manual only** | No automatic upload ever occurs. The user must explicitly press the upload button and confirm. |
| **No automatic overwrite** | Upload appends new records to Supabase — existing cloud records are never deleted before upload. |
| **Conflict warning required** | If both local and cloud data exist, a warning is shown and the user must acknowledge the duplicate risk before the upload button becomes active. |
| **No auto-merge** | Merging local and cloud records is not implemented. Two-way sync is a future phase. |

---

## Conflict States

### Defined by `assessConflict()` in `src/lib/sync/conflictDetection.ts`

| State | `localHasData` | `cloudHasData` | `conflictRisk` | `recommendedAction` |
|---|---|---|---|---|
| Nothing anywhere | false | false | `none` | `none` |
| Local only | true | false | `none` | `upload` — safe, cloud is empty |
| Cloud only | false | true | `cloud_only` | `view_cloud` — nothing to upload |
| **Both have data** | true | true | **`both`** | `confirm_overwrite` — **warning required** |

### Detection logic (in `useSyncPlanPreview`)

- **`localHasData`** — always read from localStorage storage modules directly
  (`childProfileStorage`, `speechProgressStorage`, `observationStorage`), regardless
  of the active storage provider. Snapshot taken at mount.
- **`cloudHasData`** — when `provider !== "local"` AND user is authenticated AND
  repositories have hydrated AND any cloud data exists (profile/attempts/sessions/notes).
  Derived from the active hook values (which return cloud data when provider=supabase).

---

## Conflict Detection Flow

```
User views CloudSyncPreview
  │
  ├─ localHasData = read localStorage modules directly
  ├─ cloudHasData = active hook counts (cloud when provider=supabase)
  │
  ├─ buildSyncPlan(input) → plan.hasConflict
  │
  ├─ plan.hasConflict = false  →  normal upload flow
  │
  └─ plan.hasConflict = true
        │
        └─ ConflictWarningCard shown
              │
              ├─ User reads warning
              ├─ User ticks acknowledgement checkbox
              └─ Upload button becomes active
                    │
                    └─ ConfirmationCard (second gate)
                          │
                          └─ User confirms → upload starts
```

---

## Multi-Device Scenario

### Safe scenario (Device A → Device B, no local data on B)

```
Device A:  upload local data to cloud  →  cloud has data
Device B:  sign in  →  cloud data loads (via rehydrate)
Device B:  localHasData=false, cloudHasData=true  →  no conflict
Device B:  starts training (creates local data)
```

### Conflict scenario (Device A + Device B both have data)

```
Device A:  upload local data  →  cloud has data
Device B:  also has local data (offline training)
Device B:  signs in  →  cloud data loads
Device B:  localHasData=true, cloudHasData=true  →  CONFLICT DETECTED
Device B:  ConflictWarningCard shown
Device B:  must tick checkbox + confirm before upload
```

---

## What Upload Does (current behaviour — one-way append)

Sessions and attempts are inserted as **new rows** in Supabase.
The migration is **NOT idempotent for progress/observations**:
- Profile: upsert by `user_id` — always safe
- Sessions: `INSERT` — running twice creates duplicate rows
- Attempts: `INSERT` — running twice creates duplicate rows
- Notes: `INSERT` — running twice creates duplicate rows

The `MIGRATION_FLAG_KEY` localStorage flag prevents re-running migration from the
same device. The conflict warning protects against Device B running it when Device A
has already uploaded.

---

## What Is NOT Implemented (Future Phases)

| Feature | Phase |
|---|---|
| Two-way sync (merge cloud ↔ local) | Phase 35+ |
| Last-write-wins conflict resolution | Phase 35+ |
| Per-record conflict detection | Phase 35+ |
| Supabase Realtime live updates | Phase 35+ |
| Idempotent progress/observation upload | Phase 35+ |
| Automatic upload after sign-in | Never (always manual) |

---

## Key Files

| File | Role |
|---|---|
| `src/lib/sync/conflictDetection.ts` | Pure conflict assessment logic (`assessConflict`) |
| `src/lib/sync/syncPlan.ts` | `buildSyncPlan()` — computes `hasConflict`, `conflictSummary`, `recommendedAction` |
| `src/hooks/useSyncPlanPreview.ts` | Detects `localHasData` + `cloudHasData`; passes to `buildSyncPlan` |
| `src/components/sync/CloudSyncPreview.tsx` | Shows `ConflictWarningCard` + acknowledgement checkbox |

---

## Multi-Device Manual Test Checklist

### Setup
- Set `NEXT_PUBLIC_STORAGE_PROVIDER=supabase` in `.env.local`

### Test A — Single device, no conflict
1. Complete onboarding and some training sessions (local data created)
2. Sign in → cloud is empty → `cloudHasData=false`
3. Navigate to Settings → Cloud Sync Preview
4. Confirm: no conflict warning shown
5. Upload → confirm → data migrated successfully

### Test B — Device A → Device B flow (no conflict)
1. **Device A**: upload local data to cloud (Test A above)
2. **Device B** (or Incognito window): sign in with same account
3. **Device B**: cloud data loads automatically (via rehydrate)
4. **Device B**: `localHasData=false` (no localStorage on this device) → no conflict warning
5. **Device B**: upload button is disabled (no local data to upload) ✓

### Test C — Device B creates local data THEN tries to upload
1. **Device A**: upload local data to cloud
2. **Device B**: sign in → cloud data loads
3. **Device B**: do some training sessions (creates local data)
4. **Device B**: navigate to Settings → Cloud Sync Preview
5. **Confirm**: ConflictWarningCard is visible with warning message
6. **Confirm**: Upload button is disabled until checkbox ticked
7. **Device B**: tick acknowledgement checkbox → Upload button enables
8. **Confirm**: ConfirmationCard shows conflict warning message
9. **Device B**: confirm → upload proceeds (appends, does not overwrite)

### Test D — Rollback to local provider
1. Set `NEXT_PUBLIC_STORAGE_PROVIDER=local` in `.env.local`
2. Restart dev server
3. Confirm: app loads with localStorage data
4. Confirm: Cloud Sync Preview shows local provider badge
5. Confirm: Upload button disabled (blocked by provider=local check)
6. Confirm: No conflict warning (cloudHasData=false when provider=local)
