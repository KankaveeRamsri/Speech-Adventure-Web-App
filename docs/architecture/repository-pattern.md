# Repository Pattern

## เหตุผล

ปัจจุบัน hooks (`useSpeechProgress`, `useChildProfile`, `useObservationNotes`) import `*Storage.ts` โดยตรง การ swap ไป Supabase ต้องไม่แก้ไข hook หรือ UI component — แค่เปลี่ยน implementation ที่ inject เข้าไป

---

## Interface Definitions

### IProgressRepository

```typescript
// src/lib/repositories/IProgressRepository.ts

import type {
  SpeechProgress,
  PracticeAttempt,
  PracticeSession,
} from "@/types/speechAdventure";

export interface IProgressRepository {
  getProgress(): SpeechProgress;
  getServerProgress(): SpeechProgress;
  subscribe(callback: () => void): () => void;

  addAttempt(attempt: PracticeAttempt): Promise<SpeechProgress>;
  replaceProgress(progress: SpeechProgress): Promise<void>;
  clearProgress(): Promise<void>;

  startSession(input: StartSessionInput): Promise<PracticeSession>;
  completeSession(sessionId: string): Promise<PracticeSession | null>;
  abandonSession(sessionId: string): Promise<PracticeSession | null>;
  getActiveSession(stageId: string): PracticeSession | null;

  getSelectedSoundId(): string;
  setSelectedSoundId(id: string): Promise<void>;
  subscribeToSelectedSound(callback: () => void): () => void;
}

export interface StartSessionInput {
  childId: string;
  targetSound: string;
  stageId: string;
  totalMissions: number;
}
```

---

### IProfileRepository

```typescript
// src/lib/repositories/IProfileRepository.ts

import type { ChildProfileData } from "@/lib/child-profile/childProfileStorage";

export interface IProfileRepository {
  getProfile(): ChildProfileData | null;
  getServerProfile(): ChildProfileData | null;
  subscribe(callback: () => void): () => void;

  saveProfile(profile: ChildProfileData): Promise<void>;
  clearProfile(): Promise<void>;
  replaceProfile(profile: ChildProfileData): Promise<void>;
}
```

---

### IObservationRepository

```typescript
// src/lib/repositories/IObservationRepository.ts

import type { ObservationNote } from "@/types/observations";

export interface IObservationRepository {
  getNotes(childId: string): ObservationNote[];
  getServerNotes(): ObservationNote[];
  subscribe(callback: () => void): () => void;

  addNote(note: ObservationNote): Promise<void>;
  updateNote(id: string, patch: Partial<ObservationNote>): Promise<void>;
  deleteNote(id: string): Promise<void>;
}
```

---

## Implementations

### LocalStorage (ปัจจุบัน)

```typescript
// src/lib/repositories/LocalStorageProgressRepository.ts

import * as storage from "@/lib/speechProgressStorage";
import type { IProgressRepository } from "./IProgressRepository";

export class LocalStorageProgressRepository implements IProgressRepository {
  getProgress() { return storage.getProgress(); }
  getServerProgress() { return storage.getServerProgress(); }
  subscribe(cb: () => void) { return storage.subscribeToProgress(cb); }

  async addAttempt(attempt) { return storage.addAttempt(attempt); }
  async replaceProgress(progress) { storage.replaceProgress(progress); }
  async clearProgress() { storage.clearProgress(); }

  async startSession(input) { return storage.startPracticeSession(input); }
  async completeSession(id) { return storage.completePracticeSession(id); }
  async abandonSession(id) { return storage.abandonPracticeSession(id); }
  getActiveSession(stageId) { return storage.getActiveSession(stageId); }

  getSelectedSoundId() { return storage.getSelectedSoundId(); }
  async setSelectedSoundId(id) { storage.setSelectedSoundId(id); }
  subscribeToSelectedSound(cb) { return storage.subscribeToSelectedSound(cb); }
}
```

### Supabase (เป้าหมาย Phase 3)

```typescript
// src/lib/repositories/SupabaseProgressRepository.ts
// — implement IProgressRepository กับ Supabase client
// — sync localStorage เป็น optimistic cache
// — ดู migration-strategy.md Phase 3
```

### Hybrid (Migration Period)

```typescript
// src/lib/repositories/HybridProgressRepository.ts
// — write ไปทั้ง localStorage และ Supabase
// — read จาก Supabase, fallback localStorage เมื่อ offline
// — เปิดด้วย NEXT_PUBLIC_STORAGE_BACKEND=hybrid
```

---

## Provider / DI

```typescript
// src/lib/repositories/RepositoryProvider.tsx
"use client";

import { createContext, useContext } from "react";
import type { IProgressRepository } from "./IProgressRepository";
import type { IProfileRepository } from "./IProfileRepository";
import type { IObservationRepository } from "./IObservationRepository";
import { LocalStorageProgressRepository } from "./LocalStorageProgressRepository";
import { LocalStorageProfileRepository } from "./LocalStorageProfileRepository";
import { LocalStorageObservationRepository } from "./LocalStorageObservationRepository";

interface Repositories {
  progress: IProgressRepository;
  profile: IProfileRepository;
  observations: IObservationRepository;
}

const defaultRepos: Repositories = {
  progress: new LocalStorageProgressRepository(),
  profile: new LocalStorageProfileRepository(),
  observations: new LocalStorageObservationRepository(),
};

const RepositoryContext = createContext<Repositories>(defaultRepos);

export function RepositoryProvider({
  children,
  overrides,
}: {
  children: React.ReactNode;
  overrides?: Partial<Repositories>;
}) {
  return (
    <RepositoryContext.Provider value={{ ...defaultRepos, ...overrides }}>
      {children}
    </RepositoryContext.Provider>
  );
}

export function useRepositories() {
  return useContext(RepositoryContext);
}
```

---

## Hook Refactor

Hooks เปลี่ยนจาก import storage module โดยตรง เป็นรับ repository จาก context:

```typescript
// src/hooks/useSpeechProgress.ts (refactored)
import { useSyncExternalStore } from "react";
import { useRepositories } from "@/lib/repositories/RepositoryProvider";

export function useSpeechProgress() {
  const { progress: repo } = useRepositories();

  const data = useSyncExternalStore(
    repo.subscribe.bind(repo),
    repo.getProgress.bind(repo),
    repo.getServerProgress.bind(repo),
  );

  return {
    progress: data,
    addAttempt: repo.addAttempt.bind(repo),
    startSession: repo.startSession.bind(repo),
    completeSession: repo.completeSession.bind(repo),
    // ...
  };
}
```

**ข้อสำคัญ:** hook API ไม่เปลี่ยน — UI components ไม่ต้องแก้ไข

---

## Wiring ใน Layout

```typescript
// src/app/layout.tsx
import { RepositoryProvider } from "@/lib/repositories/RepositoryProvider";
import { createSupabaseRepositories } from "@/lib/repositories/supabaseRepositories";

export default function RootLayout({ children }) {
  // เลือก implementation ตาม env var หรือ auth state
  const repos = process.env.NEXT_PUBLIC_STORAGE_BACKEND === "supabase"
    ? createSupabaseRepositories()
    : undefined; // default = localStorage

  return (
    <html>
      <body>
        <RepositoryProvider overrides={repos}>
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </RepositoryProvider>
      </body>
    </html>
  );
}
```

---

## Test Strategy

```typescript
// ใน unit tests: inject mock repository
const mockRepo: IProgressRepository = {
  getProgress: () => mockProgress,
  subscribe: (cb) => () => {},
  addAttempt: jest.fn(),
  // ...
};

render(
  <RepositoryProvider overrides={{ progress: mockRepo }}>
    <TrainingPage />
  </RepositoryProvider>
);
```

ข้อดี: ไม่ต้อง mock localStorage, test เร็วขึ้น, isolate logic ได้ชัดเจน

---

## Migration Checklist

- [ ] สร้าง interface files (`I*Repository.ts`) ทั้ง 3
- [ ] wrap `speechProgressStorage.ts` เป็น `LocalStorageProgressRepository`
- [ ] wrap `childProfileStorage.ts` เป็น `LocalStorageProfileRepository`
- [ ] wrap `observationStorage.ts` เป็น `LocalStorageObservationRepository`
- [ ] สร้าง `RepositoryProvider` context
- [ ] refactor `useSpeechProgress` → ใช้ repository
- [ ] refactor `useChildProfile` → ใช้ repository
- [ ] refactor `useObservationNotes` → ใช้ repository
- [ ] verify: unit tests ทุกตัวผ่านโดยไม่มี localStorage mock
- [ ] verify: UI ทุกหน้าทำงานปกติ (smoke test)
