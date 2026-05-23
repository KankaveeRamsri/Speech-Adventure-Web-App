/**
 * Database-layer type definitions for Speech Adventure.
 *
 * These types mirror the Supabase/PostgreSQL schema defined in
 * docs/architecture/database-schema.md. They use snake_case to match
 * column names and differ from the domain types in:
 *
 * - Field names are snake_case (DB) vs camelCase (domain)
 * - Nullable fields are explicit (nullable in DB, non-null after defaults in domain)
 * - `user_id` and `author_id` are added for multi-user Supabase context
 *
 * Mapping functions (domainToDb* / dbToDomain*) live alongside the
 * relevant repository implementations and are not included here.
 */

// ── child_profiles ────────────────────────────────────────────────────────────

export type DbChildProfile = {
  id: string;
  user_id: string;
  name: string;
  age: number;
  target_sound: string;
  training_goal: string;
  selected_sound_id: string;
  avatar_emoji: string;
  created_at: string;
  updated_at: string;
};

// ── practice_sessions ─────────────────────────────────────────────────────────

export type DbSessionStatus = "active" | "completed" | "abandoned";

export type DbPracticeSession = {
  id: string;
  child_id: string;
  target_sound: string;
  stage_id: string;
  started_at: string;
  ended_at: string | null;
  duration_ms: number | null;
  completed_missions: number;
  total_missions: number;
  average_score: number;
  stars_earned: number;
  status: DbSessionStatus;
  created_at: string;
};

// ── practice_attempts ─────────────────────────────────────────────────────────

export type DbEvaluationStatus = "passed" | "almost" | "retry";

export type DbPracticeAttempt = {
  id: string;
  child_id: string;
  session_id: string | null;
  stage_id: string;
  practice_item_id: string;
  target_sound: string;
  prompt_text: string;
  duration_ms: number;
  score: number;
  confidence: number;
  status: DbEvaluationStatus;
  feedback: string;
  recommendation: string | null;
  stars_earned: number;
  is_mock: boolean;
  audio_path: string | null;
  created_at: string;
};

// ── invitations ───────────────────────────────────────────────────────────────

export type DbInvitationRole = "parent" | "teacher" | "therapist" | "school_admin" | "viewer";
export type DbInvitationStatus = "pending" | "accepted" | "expired" | "revoked";

export type DbInvitation = {
  id: string;
  email: string;
  role: DbInvitationRole;
  child_id: string | null;
  invited_by: string;
  status: DbInvitationStatus;
  token: string;
  expires_at: string;
  created_at: string;
  accepted_at: string | null;
};

// ── child_access ──────────────────────────────────────────────────────────────

export type DbAccessRole = "guardian" | "teacher" | "therapist" | "viewer";

export type DbChildAccess = {
  id: string;
  child_id: string;
  user_id: string;
  role: DbAccessRole;
  can_view_progress: boolean;
  can_view_audio: boolean;
  can_assign_practice: boolean;
  can_edit_child: boolean;
  can_export_report: boolean;
  granted_by: string;
  created_at: string;
  revoked_at: string | null;
};

// ── observation_notes ─────────────────────────────────────────────────────────

export type DbObservationTargetType = "session" | "attempt" | "general";
export type DbObservationCategory =
  | "pronunciation"
  | "attention"
  | "progress"
  | "recommendation"
  | "other";

export type DbObservationNote = {
  id: string;
  child_id: string;
  author_id: string;
  target_type: DbObservationTargetType;
  target_id: string | null;
  category: DbObservationCategory;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
};
