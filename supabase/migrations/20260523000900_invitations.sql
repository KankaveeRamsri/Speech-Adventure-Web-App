-- ============================================================
-- Migration: 009 — Invitation System
-- Project:   Speech Adventure
-- Date:      2026-05-23 (revised 2026-05-26)
-- ============================================================
-- Creates the invitations table with full schema required for Phase 10:
--   • token stored as text (UUID string from crypto.randomUUID())
--   • inviter_email for display on accept page
--   • accepted_by / updated_at for audit trail
--   • Invitee RLS: can read pending invite by email match
--   • SECURITY DEFINER helpers for token lookup and accept
-- ============================================================

-- ── Safe teardown (idempotent) ────────────────────────────────────────────────
-- Drop functions first (they depend on the table via rowtype); drop table last.

drop function if exists get_invitation_by_token(uuid);
drop function if exists get_invitation_by_token(text);
drop function if exists accept_invitation_by_token(uuid);
drop function if exists accept_invitation_by_token(text);
drop function if exists expire_stale_invitations();
drop table  if exists invitations;
drop type   if exists invitation_status;
drop type   if exists invitation_role;

-- ── Enums ─────────────────────────────────────────────────────────────────────

create type invitation_role as enum (
  'parent', 'teacher', 'therapist', 'school_admin', 'viewer'
);

create type invitation_status as enum (
  'pending', 'accepted', 'expired', 'revoked'
);

-- ── Table ─────────────────────────────────────────────────────────────────────

create table invitations (
  id            uuid              primary key default gen_random_uuid(),
  email         text              not null,
  role          invitation_role   not null default 'parent',
  child_id      uuid              references child_profiles(id) on delete cascade,
  invited_by    uuid              not null references auth.users(id) on delete cascade,
  inviter_email text,
  token         text              not null unique,
  status        invitation_status not null default 'pending',
  expires_at    timestamptz       not null,
  accepted_at   timestamptz,
  accepted_by   uuid              references auth.users(id),
  created_at    timestamptz       not null default now(),
  updated_at    timestamptz       not null default now()
);

-- ── Indexes ───────────────────────────────────────────────────────────────────

create index invitations_invited_by_idx on invitations(invited_by);
create index invitations_token_idx      on invitations(token);
create index invitations_email_idx      on invitations(email);
create index invitations_child_id_idx   on invitations(child_id) where child_id is not null;
create index invitations_status_idx     on invitations(status);

-- ── Row Level Security ────────────────────────────────────────────────────────

alter table invitations enable row level security;

-- Inviter: full control over invitations they created
create policy "invitations: owner select"
  on invitations for select
  using (auth.uid() = invited_by);

create policy "invitations: owner insert"
  on invitations for insert
  with check (auth.uid() = invited_by);

create policy "invitations: owner update"
  on invitations for update
  using  (auth.uid() = invited_by)
  with check (auth.uid() = invited_by);

create policy "invitations: owner delete"
  on invitations for delete
  using (auth.uid() = invited_by);

-- Invitee: can read pending invitations sent to their email
create policy "invitations: invitee select"
  on invitations for select
  using (
    lower(email) = lower((select u.email from auth.users u where u.id = auth.uid()))
  );

-- Invitee: can accept (update status/accepted fields) on pending invites to their email
create policy "invitations: invitee accept"
  on invitations for update
  using (
    lower(email) = lower((select u.email from auth.users u where u.id = auth.uid()))
    and status = 'pending'
  )
  with check (
    lower(email) = lower((select u.email from auth.users u where u.id = auth.uid()))
  );

-- ── SECURITY DEFINER: public token lookup ─────────────────────────────────────
-- Allows unauthenticated visitors to read invite details by token
-- (needed to show invite card before sign-in/up).

create or replace function get_invitation_by_token(p_token text)
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

-- ── SECURITY DEFINER: mark accepted ──────────────────────────────────────────
-- Simple accept — only updates status.
-- Used by legacy flows; prefer accept_invitation_with_access (Phase 10) instead.

create or replace function accept_invitation_by_token(p_token text)
returns void
language sql
security definer
set search_path = public
as $$
  update invitations
  set    status      = 'accepted',
         accepted_at = now(),
         accepted_by = auth.uid(),
         updated_at  = now()
  where  token      = p_token
    and  status     = 'pending'
    and  expires_at > now();
$$;

-- ── SECURITY DEFINER: expire stale invitations ────────────────────────────────
-- Call periodically from pg_cron or a background job.

create or replace function expire_stale_invitations()
returns void
language sql
security definer
set search_path = public
as $$
  update invitations
  set    status     = 'expired',
         updated_at = now()
  where  status     = 'pending'
    and  expires_at < now();
$$;
