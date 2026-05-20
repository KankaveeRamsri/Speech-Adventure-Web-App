-- ============================================================
-- Migration: 003 — Views
-- Project:   Speech Adventure
-- Date:      2026-05-20
-- ============================================================
-- Run AFTER 002_rls_policies.sql.
-- Views derive computed data that would otherwise be calculated
-- in calculateProgressSummary() on the client side.
-- ============================================================

-- ── child_stage_status ────────────────────────────────────────────────────────
-- Per-child, per-stage aggregated attempt stats.
-- Replaces the in-memory calculations in calculateProgressSummary() for
-- the Supabase backend path. The localStorage path still computes these locally.

create view child_stage_status as
select
  child_id,
  stage_id,
  count(*)                        as attempt_count,
  max(score)                      as best_score,
  bool_or(score >= 70)            as is_passed,
  min(created_at)                 as first_attempt_at,
  max(created_at)                 as last_attempt_at
from practice_attempts
group by child_id, stage_id;

-- ── child_session_summary ─────────────────────────────────────────────────────
-- Aggregate stats per child — total sessions, average score, stars.
-- Useful for the progress dashboard header cards.

create view child_session_summary as
select
  child_id,
  count(*)                        as total_sessions,
  count(*) filter (where status = 'completed')  as completed_sessions,
  round(avg(average_score))       as overall_avg_score,
  sum(stars_earned)               as total_stars
from practice_sessions
group by child_id;
