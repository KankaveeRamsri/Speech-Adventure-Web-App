# Architecture

## App Architecture
- Next.js App Router, fully client-side data (no server DB yet)
- Pages are thin orchestrators; business logic lives in `src/lib` and `src/hooks`
- Client Components (`"use client"`) everywhere data touches the DOM

## Frontend Structure
```
Layout:   RootLayout → ThemeProvider → AppShell
AppShell: SidebarProvider → AppTopBar + AppSidebar + MobileNav + <main>
Pages:    wrap content in AppShell (except Landing & Onboarding which are standalone)
```

## Storage Abstraction Direction
Each domain gets a dedicated module in `src/lib/<domain>/<domain>Storage.ts`:
- `speechProgressStorage.ts` — attempts, sessions, stage status
- `childProfileStorage.ts` — profile (name, age, targetSound, trainingGoal)
- `observationStorage.ts` — therapist/parent observation notes
- `localDataBackup.ts` — export / import / clear all data

All modules implement the same **stable-snapshot pattern**:
1. `SERVER_*` constant — stable empty object for SSR
2. `currentX` in-memory cache — mutated only in write ops
3. `useSyncExternalStore` compatibility: `getX()` + `subscribeToX()`
4. `initializeIfNeeded()` — reads localStorage exactly once per page load

## Repository / Service Direction
- No repository pattern yet — direct module function calls from hooks
- When Supabase arrives: wrap each storage module behind a Repository interface
- Hooks (`useSpeechProgress`, `useChildProfile`, `useObservationNotes`) are the seam for swapping storage backends

## Data Flow Overview
```
User action → Hook write fn → *Storage.ts write op
  → mutates currentX (new object reference)
  → writeToLocalStorage()
  → notifyListeners()
    → React re-renders via useSyncExternalStore
```

## Speech Evaluation Flow
```
AudioRecorder (Blob) → evaluateSpeech() → mockEvaluate() (now)
                                        → API route /api/speech/evaluate (future)
→ SpeechEvaluationResult → addAttempt() → progress store
```
