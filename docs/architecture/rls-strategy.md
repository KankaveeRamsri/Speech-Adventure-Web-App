# Row Level Security (RLS) Strategy

## Model

Speech Adventure มี 2 user roles หลัก:

| Role | คำอธิบาย | สิทธิ์ |
|---|---|---|
| **parent** | ผู้ปกครอง / เจ้าของ account | CRUD ข้อมูลลูกตัวเอง |
| **therapist** | นักบำบัด (future) | Read ข้อมูลเด็กที่ได้รับมอบหมาย, Write observation notes |
| **service_role** | Supabase backend / admin | Full access (bypass RLS) |

MVP: ใช้ `parent` role เท่านั้น — therapist เป็น future feature

---

## Core Isolation Rule

**ทุก row ต้องอ่าน/เขียนได้เฉพาะ user ที่ own child_profile นั้น**

```
user_id (auth.users) → child_profiles.user_id → child_id (FK ทุกตาราง)
```

---

## RLS Policies

### child_profiles

```sql
alter table child_profiles enable row level security;

-- SELECT: เห็นเฉพาะ profile ของตัวเอง
create policy "owner_select" on child_profiles
  for select using (user_id = auth.uid());

-- INSERT: สร้าง profile ให้ตัวเอง
create policy "owner_insert" on child_profiles
  for insert with check (user_id = auth.uid());

-- UPDATE: แก้ไข profile ของตัวเอง
create policy "owner_update" on child_profiles
  for update using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- DELETE: ลบ profile ตัวเอง (cascade ลบทุก child data)
create policy "owner_delete" on child_profiles
  for delete using (user_id = auth.uid());
```

---

### practice_attempts

```sql
alter table practice_attempts enable row level security;

-- Helper function: ตรวจว่า child_id เป็นของ current user
create function is_own_child(cid uuid) returns boolean
  language sql security definer stable as $$
    select exists (
      select 1 from child_profiles
      where id = cid and user_id = auth.uid()
    )
  $$;

create policy "owner_select" on practice_attempts
  for select using (is_own_child(child_id));

create policy "owner_insert" on practice_attempts
  for insert with check (is_own_child(child_id));

create policy "owner_update" on practice_attempts
  for update using (is_own_child(child_id));

-- ไม่อนุญาต DELETE attempts (audit trail)
-- ถ้าต้องการ soft delete: เพิ่ม column deleted_at แทน
```

---

### practice_sessions

```sql
alter table practice_sessions enable row level security;

create policy "owner_select" on practice_sessions
  for select using (is_own_child(child_id));

create policy "owner_insert" on practice_sessions
  for insert with check (is_own_child(child_id));

create policy "owner_update" on practice_sessions
  for update using (is_own_child(child_id));
```

---

### observation_notes

```sql
alter table observation_notes enable row level security;

-- Parent: เห็นและแก้ไข notes ของ child ตัวเอง
create policy "parent_select" on observation_notes
  for select using (is_own_child(child_id));

create policy "parent_insert" on observation_notes
  for insert with check (
    is_own_child(child_id) and author_id = auth.uid()
  );

create policy "parent_update" on observation_notes
  for update using (
    is_own_child(child_id) and author_id = auth.uid()
  );

create policy "parent_delete" on observation_notes
  for delete using (
    is_own_child(child_id) and author_id = auth.uid()
  );

-- Future: therapist policy (เมื่อ add therapist_assignments table)
-- create policy "therapist_select" on observation_notes
--   for select using (
--     exists (select 1 from therapist_assignments
--             where therapist_id = auth.uid() and child_id = observation_notes.child_id)
--   );
```

---

## Supabase Storage RLS

### audio-recordings bucket

```sql
-- Object path: {child_id}/{attempt_id}.webm

-- SELECT (download): owner เท่านั้น
create policy "owner_download" on storage.objects
  for select using (
    bucket_id = 'audio-recordings'
    and (storage.foldername(name))[1]::uuid in (
      select id from child_profiles where user_id = auth.uid()
    )
  );

-- INSERT (upload): owner เท่านั้น
create policy "owner_upload" on storage.objects
  for insert with check (
    bucket_id = 'audio-recordings'
    and (storage.foldername(name))[1]::uuid in (
      select id from child_profiles where user_id = auth.uid()
    )
  );

-- DELETE: ไม่อนุญาต client-side delete (ทำผ่าน service_role เท่านั้น)
```

---

## RLS Testing Checklist

การทดสอบ RLS ต้องทำใน integration test (ไม่ใช่ unit test):

```typescript
// ตัวอย่าง test pattern
describe('RLS isolation', () => {
  it('user A cannot read user B child_profile', async () => {
    const userA = await signIn('a@test.com');
    const userB = await signIn('b@test.com');
    
    const profileB = await createProfile(userB, { name: 'Child B' });
    
    const { data, error } = await supabaseAs(userA)
      .from('child_profiles')
      .select()
      .eq('id', profileB.id);
    
    expect(data).toHaveLength(0); // RLS hides the row
  });
  
  it('user cannot insert attempt for another user child', async () => {
    // ...
  });
  
  it('therapist can read assigned child observations', async () => {
    // future
  });
});
```

**ข้อสำคัญ:** ใช้ anon key ใน test (ไม่ใช่ service_role) เพื่อให้ RLS มีผล

---

## Service Role Usage

`service_role` key ใช้เฉพาะใน:
- Next.js API routes ที่ต้องการ bypass RLS (เช่น migration script, admin)
- Supabase Edge Functions
- CI migration scripts

**ห้าม:** expose service_role key ใน client-side code หรือ env vars ที่ prefix `NEXT_PUBLIC_`

```typescript
// src/lib/supabase/server.ts — ใช้ service_role สำหรับ admin ops
import { createClient } from '@supabase/supabase-js';

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!, // ไม่มี NEXT_PUBLIC_
);
```

---

## Future: Therapist Access Model

เมื่อ add therapist role (Phase ถัดจาก MVP):

```sql
create table therapist_assignments (
  id             uuid primary key default gen_random_uuid(),
  therapist_id   uuid not null references auth.users(id),
  child_id       uuid not null references child_profiles(id) on delete cascade,
  granted_by     uuid not null references auth.users(id), -- parent
  granted_at     timestamptz not null default now(),
  expires_at     timestamptz,
  can_write_notes boolean not null default true,
  unique (therapist_id, child_id)
);

alter table therapist_assignments enable row level security;

create policy "parent_manage" on therapist_assignments
  for all using (
    child_id in (select id from child_profiles where user_id = auth.uid())
  );
```
