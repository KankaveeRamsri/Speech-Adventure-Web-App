# Known Issues & Technical Debt

## Hydration
- `suppressHydrationWarning` on `<html>` is required because theme class and sidebar state are applied client-side from localStorage.
- All storage hooks use the stable-snapshot pattern specifically to avoid infinite `useSyncExternalStore` loops. **Do not refactor this pattern without understanding the constraint** — returning new object references from `getSnapshot` causes infinite renders.
- `isHydrated` flag in `useSpeechProgress` gates UI that depends on localStorage being read; UI shows loading state until hydration completes.

## localStorage Dependency
- App is fully non-functional without localStorage (e.g., private browsing with storage blocked).
- No graceful degradation — silent failures in `writeToLocalStorage` are swallowed.
- Data is device-specific; no cross-device sync until Supabase is integrated.
- No storage quota management — large audio blob counts could fill localStorage (audio is not stored currently, only metadata).

## Single Child / Single Sound
- `DEFAULT_CHILD_ID = "child-001"` is hardcoded; progress is not namespaced by real child ID.
- Only one active target sound at a time — multi-sound parallel tracking requires schema change.
- Profile stores one child; multi-child support needs a profile list structure.

## Mock AI Evaluation
- All scores are randomly generated — progress data is not meaningful until real AI is wired.
- `isMock: true` flag must be checked before surfacing scores to parents/therapists as clinical data.

## Architecture Risks
- `speechProgressStorage.ts` is large (553 lines) — consider splitting session management into `sessionStorage.ts`.
- `speechAdventureMockData.ts` contains curriculum content that should eventually move to a CMS or database table.
- `calculateProgressSummary()` runs on every render via `useSyncExternalStore` — may need memoization for large attempt arrays.

## Future Migration Concerns
- localStorage key versioning (`-v1` suffix) — when schema changes, need a migration function to transform old data before reading.
- Backup file format versioning (`BACKUP_VERSION = 1`) — import must handle future version upgrades.
- When Supabase replaces localStorage, `replaceProgress()` / `replaceObservations()` used by the import flow will need to also write to Supabase.

## Minor
- `MockEvaluationResult` type alias in `speechAdventure.ts` is marked `@deprecated` — should be removed once all call sites use `SpeechEvaluationResult` directly.
- `src/data/speechAdventureMockData.ts` is imported by many pages — changes affect the entire curriculum.
