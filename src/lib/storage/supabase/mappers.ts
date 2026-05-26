/**
 * Bidirectional mapping between Speech Adventure domain types and
 * Supabase/PostgreSQL database types.
 *
 * Direction A — DB → Domain  (dbToDomain*)
 *   Used when reading rows from Supabase and building in-memory cache.
 *
 * Direction B — Domain → DB Insert  (domainToDb*)
 *   Used when writing domain objects into Supabase tables.
 *
 * Mapping notes:
 * - snake_case ↔ camelCase field rename
 * - `null` DB values become `undefined` in domain (optional fields)
 * - `user_id` / `author_id` are not in domain types — callers supply them
 *   as separate parameters (they come from the auth session, not the data)
 * - `attemptIds[]` on PracticeSession is NOT stored in Supabase; the array
 *   is left empty — use a JOIN on practice_attempts.session_id if needed
 * - `is_mock` and `audio_path` on attempts have no domain equivalent yet;
 *   they default to true / null until Phase 5 (real AI + audio upload)
 */

import type {
  PracticeAttempt,
  PracticeSession,
  EvaluationStatus,
  SessionStatus,
} from "@/types/speechAdventure";
import type { ChildProfileData } from "@/lib/child-profile/childProfileStorage";
import type {
  ObservationNote,
  ObservationTargetType,
  ObservationCategory,
} from "@/types/observations";
import type {
  DbPracticeAttempt,
  DbPracticeSession,
  DbChildProfile,
  DbObservationNote,
  DbInvitation,
  DbChildAccess,
} from "@/types/database";
import type {
  InsertPracticeAttempt,
  InsertPracticeSession,
  InsertObservationNote,
  InsertChildProfile,
  InsertInvitation,
  InsertChildAccess,
} from "@/types/supabase";
import type { Invitation, InvitationRole, InvitationStatus } from "@/types/invitations";
import type { ChildAccess, AccessRole, ChildPermissions } from "@/types/childAccess";

// ── DB → Domain ───────────────────────────────────────────────────────────────

export function dbToDomainAttempt(db: DbPracticeAttempt): PracticeAttempt {
  return {
    id: db.id,
    childId: db.child_id,
    stageId: db.stage_id,
    practiceItemId: db.practice_item_id,
    targetSound: db.target_sound,
    promptText: db.prompt_text,
    durationMs: db.duration_ms,
    score: db.score,
    confidence: db.confidence,
    status: db.status as EvaluationStatus,
    feedback: db.feedback,
    recommendation: db.recommendation ?? undefined,
    starsEarned: db.stars_earned,
    sessionId: db.session_id ?? undefined,
    createdAt: db.created_at,
    audioPath: db.audio_path ?? undefined,
  };
}

export function dbToDomainSession(db: DbPracticeSession): PracticeSession {
  return {
    id: db.id,
    childId: db.child_id,
    targetSound: db.target_sound,
    stageId: db.stage_id,
    startedAt: db.started_at,
    endedAt: db.ended_at ?? undefined,
    durationMs: db.duration_ms ?? undefined,
    completedMissions: db.completed_missions,
    totalMissions: db.total_missions,
    averageScore: db.average_score,
    starsEarned: db.stars_earned,
    // attemptIds is not persisted in Supabase — reconstructed via JOIN when needed.
    attemptIds: [],
    status: db.status as SessionStatus,
  };
}

export function dbToDomainProfile(db: DbChildProfile): ChildProfileData {
  return {
    id: db.id,
    name: db.name,
    age: db.age,
    targetSound: db.target_sound,
    trainingGoal: db.training_goal,
    createdAt: db.created_at,
    updatedAt: db.updated_at,
  };
}

export function dbToDomainNote(db: DbObservationNote): ObservationNote {
  return {
    id: db.id,
    childId: db.child_id,
    targetType: db.target_type as ObservationTargetType,
    targetId: db.target_id ?? undefined,
    category: db.category as ObservationCategory,
    title: db.title,
    content: db.content,
    createdAt: db.created_at,
    updatedAt: db.updated_at,
  };
}

// ── Domain → DB Insert ────────────────────────────────────────────────────────

export function domainToDbAttempt(
  attempt: PracticeAttempt,
): InsertPracticeAttempt {
  return {
    // TODO (Phase 26 activation): verify attempt.childId is a valid UUID
    // matching the authenticated user's child_profile.id, not the localStorage
    // placeholder "child-001".
    child_id: attempt.childId,
    session_id: attempt.sessionId ?? null,
    stage_id: attempt.stageId,
    practice_item_id: attempt.practiceItemId,
    target_sound: attempt.targetSound,
    prompt_text: attempt.promptText,
    duration_ms: attempt.durationMs,
    score: attempt.score,
    confidence: attempt.confidence,
    status: attempt.status,
    feedback: attempt.feedback,
    recommendation: attempt.recommendation ?? null,
    stars_earned: attempt.starsEarned,
    is_mock: true,   // TODO: set false when real AI evaluation is active
    audio_path: attempt.audioPath ?? null,
  };
}

export function domainToDbSession(
  session: PracticeSession,
): InsertPracticeSession {
  return {
    // TODO (Phase 26 activation): same UUID caution as domainToDbAttempt
    child_id: session.childId,
    target_sound: session.targetSound,
    stage_id: session.stageId,
    started_at: session.startedAt,
    ended_at: session.endedAt ?? null,
    duration_ms: session.durationMs ?? null,
    completed_missions: session.completedMissions,
    total_missions: session.totalMissions,
    average_score: session.averageScore,
    stars_earned: session.starsEarned,
    status: session.status,
  };
}

/**
 * Maps a domain profile to a DB insert row.
 *
 * @param profile    Domain ChildProfileData
 * @param userId     The auth.uid() of the owner — NOT in the domain type
 * @param selectedSoundId  Current selected sound (from separate storage key)
 */
export function domainToDbProfile(
  profile: ChildProfileData,
  userId: string,
  selectedSoundId = "ก",
): InsertChildProfile {
  return {
    user_id: userId,
    name: profile.name,
    age: profile.age,
    target_sound: profile.targetSound,
    training_goal: profile.trainingGoal,
    selected_sound_id: selectedSoundId,
    // TODO: add avatarEmoji to ChildProfileData domain type (Phase 27+)
    avatar_emoji: "🧒",
  };
}

/**
 * Maps a domain observation note to a DB insert row.
 *
 * @param note      Domain ObservationNote
 * @param authorId  The auth.uid() of the author — NOT in the domain type
 */
export function domainToDbNote(
  note: ObservationNote,
  authorId: string,
): InsertObservationNote {
  return {
    child_id: note.childId,
    author_id: authorId,
    target_type: note.targetType,
    target_id: note.targetId ?? null,
    category: note.category,
    title: note.title,
    content: note.content,
  };
}

// ── Invitation mappers ────────────────────────────────────────────────────────

export function dbToDomainInvitation(db: DbInvitation): Invitation {
  return {
    id: db.id,
    email: db.email,
    role: db.role as InvitationRole,
    childId: db.child_id ?? undefined,
    invitedBy: db.invited_by,
    inviterEmail: db.inviter_email ?? undefined,
    status: db.status as InvitationStatus,
    token: db.token,
    expiresAt: db.expires_at,
    createdAt: db.created_at,
    acceptedAt: db.accepted_at ?? undefined,
    acceptedBy: db.accepted_by ?? undefined,
    // childSnapshot is not stored in DB — must be fetched separately if needed
  };
}

export function domainToDbInvitation(
  inv: Invitation,
  invitedBy: string,
  inviterEmail?: string,
): InsertInvitation {
  return {
    id: inv.id,
    email: inv.email,
    role: inv.role,
    child_id: inv.childId ?? null,
    invited_by: invitedBy,
    inviter_email: inviterEmail ?? null,
    token: inv.token,
    status: inv.status,
    expires_at: inv.expiresAt,
  };
}

// ── ChildAccess mappers ───────────────────────────────────────────────────────

export function dbToDomainChildAccess(db: DbChildAccess): ChildAccess {
  return {
    id: db.id,
    childId: db.child_id,
    userId: db.user_id,
    role: db.role as AccessRole,
    permissions: {
      canViewProgress:   db.can_view_progress,
      canViewAudio:      db.can_view_audio,
      canAssignPractice: db.can_assign_practice,
      canEditChild:      db.can_edit_child,
      canExportReport:   db.can_export_report,
    },
    grantedBy: db.granted_by,
    createdAt: db.created_at,
    revokedAt: db.revoked_at ?? undefined,
  };
}

export function domainToDbChildAccess(
  grant: ChildAccess,
  userId: string,
): InsertChildAccess {
  return {
    id: grant.id,
    child_id: grant.childId,
    user_id: userId,
    role: grant.role,
    granted_by: grant.grantedBy,
    can_view_progress:   grant.permissions.canViewProgress,
    can_view_audio:      grant.permissions.canViewAudio,
    can_assign_practice: grant.permissions.canAssignPractice,
    can_edit_child:      grant.permissions.canEditChild,
    can_export_report:   grant.permissions.canExportReport,
  };
}

export function dbPermissions(db: DbChildAccess): ChildPermissions {
  return {
    canViewProgress:   db.can_view_progress,
    canViewAudio:      db.can_view_audio,
    canAssignPractice: db.can_assign_practice,
    canEditChild:      db.can_edit_child,
    canExportReport:   db.can_export_report,
  };
}
