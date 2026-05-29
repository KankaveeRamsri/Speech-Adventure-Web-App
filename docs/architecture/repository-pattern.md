# Repository Pattern

**Current status (2026-05-29):** Fully implemented. 6 repository interfaces with both local and Supabase implementations.

---

## Why

Hooks and UI components never import storage modules directly. Swapping providers (local ↔ Supabase) requires no UI changes.

---

## Repository Interfaces

All in `src/lib/repositories/`:

| Interface | File | Purpose |
|---|---|---|
| `IProgressRepository` | `IProgressRepository.ts` | Attempts, sessions, selected sound |
| `IProfileRepository` | `IProfileRepository.ts` | Child profiles, multi-child list, selectedChildId |
| `IObservationRepository` | `IObservationRepository.ts` | Observation notes |
| `IInvitationRepository` | `IInvitationRepository.ts` | Parent invitation links |
| `IChildAccessRepository` | `IChildAccessRepository.ts` | Shared-child access records |
| `ISchoolRepository` | `ISchoolRepository.ts` | School org, classroom, teacher/student |

---

## Implementations

### Local (localStorage) — default

`src/lib/storage/local/`

| Class | File |
|---|---|
| `LocalProgressRepository` | `LocalProgressRepository.ts` |
| `LocalProfileRepository` | `LocalProfileRepository.ts` |
| `LocalObservationRepository` | `LocalObservationRepository.ts` |
| `LocalInvitationRepository` | `LocalInvitationRepository.ts` |
| `LocalChildAccessRepository` | `LocalChildAccessRepository.ts` |
| `LocalSchoolRepository` | `LocalSchoolRepository.ts` |

### Supabase

`src/lib/storage/supabase/`

| Class | File |
|---|---|
| `SupabaseProgressRepository` | `SupabaseProgressRepository.ts` |
| `SupabaseProfileRepository` | `SupabaseProfileRepository.ts` |
| `SupabaseObservationRepository` | `SupabaseObservationRepository.ts` |
| `SupabaseInvitationRepository` | `SupabaseInvitationRepository.ts` |
| `SupabaseChildAccessRepository` | `SupabaseChildAccessRepository.ts` |
| `SupabaseSchoolRepository` | `SupabaseSchoolRepository.ts` |

Other files in `src/lib/storage/supabase/`:
- `createSupabaseRepositories.ts` — factory that builds all 6 at once
- `audioStorage.ts` — audio upload/signed URL service (not a repository)
- `mappers.ts` — domain ↔ DB row conversion
- `errors.ts` — Supabase error helpers

---

## Provider / DI

```
src/lib/providers/RepositoryProvider.tsx
```

- Resolves correct implementation at module init (based on `NEXT_PUBLIC_STORAGE_PROVIDER`)
- Injects all 6 repositories via React context
- Watches auth state: calls `rehydrate()` on sign-in, `reset()` on sign-out
- Local repos are module-level singletons (stable references for useSyncExternalStore)

```typescript
// Access in hooks and components
const { progress, profile, observations, invitations, childAccess, school } = useRepositories();
```

---

## IProfileRepository Extensions

`IProfileRepository` also exposes multi-child methods:

```typescript
listProfiles(): ChildProfileData[]
getSelectedChildId(): string | null
setSelectedChildId(id: string): Promise<void>
```

These are backed by `childProfileListStorage.ts` in the local implementation.

---

## IProgressRepository Key Methods

```typescript
// Session management
startSession(input: StartSessionInput): Promise<PracticeSession>
completeSession(sessionId: string): Promise<PracticeSession | null>
abandonSession(sessionId: string): Promise<PracticeSession | null>
getActiveSession(stageId: string): PracticeSession | null

// Data
addAttempt(attempt: PracticeAttempt): Promise<SpeechProgress>
getProgress(): SpeechProgress
subscribe(cb: () => void): () => void

// Sound
getSelectedSoundId(): string
setSelectedSoundId(id: string): Promise<void>
```

---

## Rehydrate / Reset (Supabase only)

Supabase repositories expose two additional methods (duck-typed, not in interface):

| Method | When called | Effect |
|---|---|---|
| `rehydrate()` | Sign-in, session restore | Clears hydrate state, fetches fresh from Supabase |
| `reset()` | Sign-out | Immediately clears cache + notifies subscribers |

`RepositoryProvider` calls these automatically on auth transitions.

---

## Do Not Break

- Never import `*Storage.ts` modules directly from pages or components
- Never import `Local*Repository` or `Supabase*Repository` directly from UI — use `useRepositories()`
- Server snapshots in useSyncExternalStore must return **same reference** on every call (no `new []` inside snapshot)
- `school` repository can be `undefined` in `Repositories` type — always guard with `?.`
