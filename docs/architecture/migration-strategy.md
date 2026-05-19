# Migration Strategy: localStorage → Supabase

## Guiding Principles

1. **Zero data loss** — ผู้ใช้ปัจจุบันต้อง import ข้อมูลเดิมได้
2. **No big bang** — migrate ทีละ domain, ไม่ rewrite ทุกอย่างพร้อมกัน
3. **Feature flag per repository** — swap storage backend ด้วย env var หรือ config
4. **localStorage as fallback** — offline-first ยังคง work ได้แม้ Supabase ล่ม

---

## Phase Overview

```
Phase 1: Auth + Profile       (ไม่กระทบ data flow เดิม)
Phase 2: Repository Pattern   (refactor ภายใน — ไม่เปลี่ยน UX)
Phase 3: Progress Sync        (core migration — attempts + sessions)
Phase 4: Observations         (ง่ายสุด — volume ต่ำ)
Phase 5: Audio Storage        (ต้องการ Supabase Storage)
Phase 6: Analytics + Reports  (server-side aggregation)
```

---

## Phase 1: Supabase Auth + Child Profile

**เป้าหมาย:** เพิ่ม auth layer โดยไม่แตะ progress data

### Steps
1. ติดตั้ง `@supabase/supabase-js` และ `@supabase/ssr`
2. สร้าง `src/lib/supabase/client.ts` และ `server.ts`
3. เพิ่ม `app/auth/` routes (login, callback, logout)
4. สร้าง `child_profiles` table + RLS
5. เชื่อม `childProfileStorage.ts` ให้ sync ไป Supabase หลัง login
6. localStorage ยังทำงานเป็น cache สำหรับ offline

**Risk:** ต่ำ — ไม่กระทบ training flow หลัก

**Rollback:** ลบ Supabase client, ไม่ต้อง revert ไฟล์อื่น

---

## Phase 2: Repository Pattern

**เป้าหมาย:** แทรก interface ระหว่าง hook กับ storage module

### Steps
1. สร้าง `src/lib/repositories/IProgressRepository.ts`
2. สร้าง `src/lib/repositories/IProfileRepository.ts`
3. สร้าง `src/lib/repositories/IObservationRepository.ts`
4. wrap `*Storage.ts` ทุกตัวให้ implement interface
5. hooks รับ repository instance แทนที่จะ import storage module โดยตรง
6. สร้าง `RepositoryProvider` context inject implementation

**ไม่เปลี่ยน:** types, UI components, hook API

**Risk:** refactor ภายใน — ถ้า test ครบจะไม่มี regression

---

## Phase 3: Progress Sync (Core Migration)

**เป้าหมาย:** `practice_attempts` + `practice_sessions` ไป PostgreSQL

### Steps
1. สร้าง `SupabaseProgressRepository` implement `IProgressRepository`
2. สร้าง `LocalStorageProgressRepository` (wrap existing storage)
3. สร้าง `HybridProgressRepository`:
   - Write ไปทั้ง localStorage (fast) และ Supabase (durable)
   - Read จาก Supabase เป็นหลัก, fallback localStorage เมื่อ offline
4. เปิดใช้ด้วย env var: `NEXT_PUBLIC_STORAGE_BACKEND=hybrid`
5. Migration UI: ปุ่ม "อัปโหลดข้อมูลเดิมไปยัง Cloud" ใน profile/data manager

### localStorage → Supabase Data Migration (one-time)

```typescript
// pseudocode: ใน MigrationService
async function migrateLocalDataToSupabase(childId: string) {
  const localProgress = readFromLocalStorage();
  
  // upsert sessions ก่อน (attempts reference sessions)
  await supabase.from('practice_sessions').upsert(
    localProgress.sessions.map(toDbSession)
  );
  
  // upsert attempts
  await supabase.from('practice_attempts').upsert(
    localProgress.attempts.map(toDbAttempt)
  );
  
  localStorage.setItem('migration-completed-v1', 'true');
}
```

**ID mapping:** localStorage ใช้ string ID เช่น `session-1716134400000-abc12`
→ ใช้เป็น `id` column โดยตรง (text) ช่วง migration, แล้วค่อย migrate เป็น uuid ใน Phase ถัดไป

**Risk:** สูงสุดในทุก Phase — ต้องมี comprehensive test

---

## Phase 4: Observation Notes

**เป้าหมาย:** sync observation notes ไป Supabase

### Steps
1. สร้าง `SupabaseObservationRepository`
2. เพิ่ม `author_id` (user_id จาก auth) ใน write operations
3. `target_id` เปลี่ยนจาก string เป็น uuid — ต้อง lookup จาก migrated IDs

**Risk:** ต่ำ — volume น้อย, ไม่ real-time critical

---

## Phase 5: Audio Storage

**เป้าหมาย:** store audio recordings จริงใน Supabase Storage

### Steps
1. สร้าง bucket `audio-recordings` (private)
2. `useAudioRecorder` ส่ง Blob ไป `POST /api/audio/upload` แทน evaluate โดยตรง
3. API route upload ไป Storage แล้วส่ง path กลับ
4. เพิ่ม `audio_path` ใน `practice_attempts` table
5. Speech evaluation ทำงานกับ path แทน Blob (async)

**Risk:** ปานกลาง — เปลี่ยน UX flow ของ recording

---

## Phase 6: Analytics + Server-Side Reports

**เป้าหมาย:** ย้าย `calculateProgressSummary()` บางส่วนไป PostgreSQL

### Steps
1. สร้าง materialized view หรือ Supabase Edge Function สำหรับ aggregate
2. Report page ดึง data จาก server แทน client-side คำนวณ
3. เปิด Supabase Realtime สำหรับ live progress (optional)

**Risk:** ต่ำ — additive เท่านั้น

---

## Rollback Plan (ต่อ Phase)

| Phase | Rollback Action |
|---|---|
| 1 | ลบ Supabase client files, ไม่ต้องเปลี่ยน logic |
| 2 | revert repository wrapper files, hook กลับ import storage โดยตรง |
| 3 | set `NEXT_PUBLIC_STORAGE_BACKEND=local`, localStorage data ยังอยู่ |
| 4 | ลบ Supabase observation repo, กลับใช้ local |
| 5 | ไม่ upload audio, กลับ evaluate จาก Blob โดยตรง |
| 6 | revert report page ให้ client-side คำนวณ |

---

## Testing Checklist (ต่อ Phase)

### Phase 1
- [ ] Login/logout flow ทำงานถูก
- [ ] Profile save/load ผ่าน Supabase
- [ ] Profile ยังโหลดได้เมื่อ offline (localStorage fallback)
- [ ] Onboarding wizard ยังทำงานได้ไม่มี auth

### Phase 2
- [ ] Repository interface มี type coverage ครบ
- [ ] `LocalStorageProgressRepository` pass unit tests เดิมได้
- [ ] Hook API ไม่เปลี่ยน (ไม่ break UI)

### Phase 3
- [ ] Migration script: attempts ทุก record migrate ครบ
- [ ] Migration script: sessions ทุก record migrate ครบ
- [ ] Stage unlock logic ทำงานเหมือนเดิมบน Supabase data
- [ ] `calculateProgressSummary()` ให้ผลเดิม
- [ ] Offline write sync ถูกเมื่อกลับมา online
- [ ] ไม่มี duplicate records เมื่อ migrate 2 ครั้ง (upsert safe)

### Phase 4
- [ ] Observation CRUD ทำงานผ่าน Supabase
- [ ] `author_id` ถูก set ถูกต้องทุก note
- [ ] RLS ป้องกัน cross-child access

### Phase 5
- [ ] Audio upload ไม่ block UI
- [ ] Recording ยัง evaluate ได้ แม้ upload fail
- [ ] Audio path store ใน attempt record

### Phase 6
- [ ] Report data ตรงกับ client-side calculation
- [ ] Report page ยัง print ได้

---

## Risk Register

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| localStorage data loss ระหว่าง migration | ต่ำ | สูง | backup JSON ก่อน migrate |
| Supabase rate limit บน free tier | ปานกลาง | ปานกลาง | batch writes, retry |
| ID collision (string → uuid) | ปานกลาง | สูง | keep original string ID ใน legacy_id column |
| RLS policy ผิด — data leak | ต่ำ | สูงมาก | integration test RLS (ดู `rls-strategy.md`) |
| Offline sync conflict | ปานกลาง | ปานกลาง | last-write-wins, timestamp-based merge |
| Audio blob memory leak | ต่ำ | ปานกลาง | revoke object URLs หลัง upload |
