# Row Level Security (RLS) Strategy

**Current status (2026-05-29):** Implemented for core tables. Multi-role support defined; therapist access not yet built.

---

## Roles

| Role | Description | Access |
|---|---|---|
| `parent` | Default role | CRUD own children's data |
| `teacher` | Assigned to school/classroom | Read students in their classroom |
| `school_admin` | Manages organization | Manage org, classrooms, members |
| `therapist` | **Defined, not yet built** | Future: read assigned child data |
| `service_role` | Supabase backend | Full access (bypass RLS) — server only |

---

## Core Isolation Rule

Every row is scoped to the user who owns the child profile:

```
auth.users.id → child_profiles.user_id → child_id (FK on all tables)
```

Helper function (defined once, used everywhere):

```sql
create function is_own_child(cid uuid) returns boolean
  language sql security definer stable as $$
    select exists (
      select 1 from child_profiles
      where id = cid and user_id = auth.uid()
    )
  $$;
```

---

## Policies Summary

| Table | SELECT | INSERT | UPDATE | DELETE |
|---|---|---|---|---|
| `child_profiles` | `user_id = auth.uid()` | same | same | same |
| `practice_attempts` | `is_own_child(child_id)` | same | same | **not granted** (audit trail) |
| `practice_sessions` | `is_own_child(child_id)` | same | same | — |
| `observation_notes` | `is_own_child(child_id)` | `+ author_id = auth.uid()` | same | same |

---

## Supabase Storage (practice-audio)

```sql
-- All three ops share same ownership check:
(storage.foldername(name))[2] = auth.uid()::text
-- Path: users/{userId}/children/{childId}/attempts/{attemptId}.ext
-- Position [2] = userId segment (1-indexed)
```

| Op | Allowed |
|---|---|
| INSERT | userId matches |
| SELECT | userId matches |
| DELETE | userId matches |
| UPDATE | **Not granted** — recordings are immutable |

---

## Service Role Usage

`SUPABASE_SERVICE_ROLE_KEY` (no `NEXT_PUBLIC_`) — used only in:
- Next.js API routes that need admin bypass
- Migration scripts
- Never in client-side code

---

## School RLS (Foundation)

School tables (`organizations`, `org_members`, `classrooms`, `classroom_members`) have separate policies scoped to org membership. See school migration files.

---

## Future: Therapist Access

```sql
create table therapist_assignments (
  therapist_id  uuid not null references auth.users(id),
  child_id      uuid not null references child_profiles(id) on delete cascade,
  granted_by    uuid not null references auth.users(id),  -- parent
  granted_at    timestamptz not null default now(),
  unique (therapist_id, child_id)
);
```

Not yet implemented.

---

## Testing

RLS must be tested with integration tests using `anon` key (not `service_role`):
- User A cannot read User B's child_profiles
- User A cannot insert practice_attempts for User B's child
- See `docs/architecture/auth-e2e-test.md` for test checklist
