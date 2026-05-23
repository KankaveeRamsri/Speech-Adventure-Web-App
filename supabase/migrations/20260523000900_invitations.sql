-- ============================================================
-- Migration: 009 — Invitation System Foundation
-- Project:   Speech Adventure
-- Date:      2026-05-23
-- ============================================================
-- Creates the invitations table and RLS policies.
-- Includes two SECURITY DEFINER helpers:
--   get_invitation_by_token(token)  — public read for accept page
--   accept_invitation_by_token(token)  — authenticated accept action
-- ============================================================

-- ── Enum ─────────────────────────────────────────────────────────────────────

do $$ begin
  create type invitation_role as enum (
    'parent', 'teacher', 'therapist', 'school_admin', 'viewer'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type invitation_status as enum (
    'pending', 'accepted', 'expired', 'revoked'
  );
exception when duplicate_object then null;
end $$;

-- ── invitations ───────────────────────────────────────────────────────────────

create table if not exists invitations (
  id           uuid             primary key default gen_random_uuid(),
  email        text             not null,
  role         invitation_role  not null default 'parent',
  child_id     uuid             references child_profiles(id) on delete set null,
  invited_by   uuid             not null references auth.users(id) on delete cascade,
  status       invitation_status not null default 'pending',
  token        uuid             not null default gen_random_uuid() unique,
  expires_at   timestamptz      not null default (now() + interval '7 days'),
  created_at   timestamptz      not null default now(),
  accepted_at  timestamptz
);

create index if not exists invitations_invited_by_idx on invitations(invited_by);
create index if not exists invitations_token_idx      on invitations(token);
create index if not exists invitations_email_idx      on invitations(email);

-- ── RLS ───────────────────────────────────────────────────────────────────────

alter table invitations enable row level security;

-- Owner: full control over their own invitations
drop policy if exists "invitations: owner select"  on invitations;
create policy "invitations: owner select"
  on invitations for select
  using (auth.uid() = invited_by);

drop policy if exists "invitations: owner insert"  on invitations;
create policy "invitations: owner insert"
  on invitations for insert
  with check (auth.uid() = invited_by);

drop policy if exists "invitations: owner update"  on invitations;
create policy "invitations: owner update"
  on invitations for update
  using (auth.uid() = invited_by)
  with check (auth.uid() = invited_by);

drop policy if exists "invitations: owner delete"  on invitations;
create policy "invitations: owner delete"
  on invitations for delete
  using (auth.uid() = invited_by);

-- ── Public token lookup (SECURITY DEFINER) ────────────────────────────────────
-- Allows unauthenticated users (e.g. from invite link) to read a single
-- invitation by its token — needed to show invite details on the accept page
-- before the user signs in/up.

create or replace function get_invitation_by_token(p_token uuid)
returns setof invitations
language sql
security definer
set search_path = public
as $$
  select *
  from   invitations
  where  token = p_token
  limit  1;
$$;

-- ── Accept invitation (SECURITY DEFINER) ─────────────────────────────────────
-- Marks a pending invitation as accepted. Called after the invitee signs in/up.
-- Only updates rows where status = 'pending' and expires_at > now().
-- NOTE: child_access grants are Phase 10 — this function only updates status.

create or replace function accept_invitation_by_token(p_token uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update invitations
  set    status      = 'accepted',
         accepted_at = now()
  where  token      = p_token
    and  status     = 'pending'
    and  expires_at > now();
$$;

-- ── Expire stale invitations ──────────────────────────────────────────────────
-- Update any pending invitations past their expiry time.
-- pg_cron or a scheduled call can invoke this periodically.

create or replace function expire_stale_invitations()
returns void
language sql
security definer
set search_path = public
as $$
  update invitations
  set    status = 'expired'
  where  status     = 'pending'
    and  expires_at < now();
$$;
