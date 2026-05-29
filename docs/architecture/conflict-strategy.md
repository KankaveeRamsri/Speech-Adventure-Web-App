# Conflict Strategy

**Current status (2026-05-29):** Implemented. Manual-only upload with conflict detection. No automatic overwrite.

---

## Core Rules

| Rule | Detail |
|---|---|
| localStorage is always safe | Never deleted by sync or auth events |
| Cloud is source of truth after sign-in | Supabase data shown after rehydrate |
| Upload is manual only | No automatic upload ever |
| No automatic overwrite | Upload appends; existing cloud records untouched |
| Conflict warning required | Must acknowledge before upload if both local and cloud have data |
| No auto-merge | Two-way sync is future work |

---

## Conflict States

| State | localHasData | cloudHasData | conflictRisk | Action |
|---|---|---|---|---|
| Nothing | false | false | none | — |
| Local only | true | false | none | safe upload |
| Cloud only | false | true | cloud_only | view cloud |
| **Both** | true | true | **both** | warn + confirm |

---

## Upload Flow

```
/settings → Cloud Sync Preview
    │
    ├─ No conflict → Upload button active
    │
    └─ Both have data → ConflictWarningCard
          │
          User ticks checkbox → Upload enables
              │
              ConfirmationCard → User confirms → Upload
```

Upload appends new rows. Not idempotent for sessions/attempts (LocalStorage flag prevents re-run on same device).

---

## Key Files

| File | Role |
|---|---|
| `src/lib/sync/conflictDetection.ts` | `assessConflict()` |
| `src/lib/sync/syncPlan.ts` | `buildSyncPlan()` |
| `src/hooks/useSyncPlanPreview.ts` | Reads localHasData + cloudHasData |
| `src/components/sync/CloudSyncPreview.tsx` | Upload UI + ConflictWarningCard |

---

## Not Implemented (Future)

- Two-way sync / merge
- Idempotent progress upload
- Supabase Realtime
- Automatic upload on sign-in (by design: never)
