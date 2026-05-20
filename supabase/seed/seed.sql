-- ============================================================
-- Seed Data — Speech Adventure (Development Only)
-- ============================================================
-- Run AFTER migrations 001–003.
-- This file creates a test user + profile for local development.
-- DO NOT run in production.
--
-- Usage (with Supabase CLI):
--   supabase db reset          # applies migrations + seed
--   supabase db seed           # seed only (without resetting)
-- ============================================================

-- ── Development test user ─────────────────────────────────────────────────────
-- Note: In production users are created via Supabase Auth (email/OAuth).
-- This inserts a synthetic auth.users row for local dev only.
-- Supabase local dev supports this via the service_role key.

-- insert into auth.users (id, email, created_at, updated_at)
-- values (
--   '00000000-0000-0000-0000-000000000001',
--   'dev-tester@speech-adventure.local',
--   now(),
--   now()
-- )
-- on conflict (id) do nothing;

-- ── Example child profile ─────────────────────────────────────────────────────
-- Uncomment and adapt once a test user is created above.

-- insert into child_profiles (
--   id, user_id, name, age, target_sound, training_goal, selected_sound_id, avatar_emoji
-- ) values (
--   '00000000-0000-0000-0000-000000000002',
--   '00000000-0000-0000-0000-000000000001',
--   'น้องทดสอบ',
--   6,
--   'ก',
--   'ฝึกออกเสียง ก ให้ชัดเจน',
--   'ก',
--   '🧒'
-- )
-- on conflict (id) do nothing;

-- All seed statements are commented out by default.
-- Uncomment when you have a local Supabase project running.
select 'seed: no-op (all statements commented out)' as status;
