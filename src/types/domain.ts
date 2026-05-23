/**
 * Domain type barrel for Speech Adventure.
 *
 * Re-exports all core domain types from their canonical locations.
 * Prefer importing from here unless you need a type that is only
 * used internally by one module.
 */

// ── Speech progress domain ────────────────────────────────────────────────────
export type {
  SpeechProgress,
  PracticeAttempt,
  PracticeSession,
  SessionStatus,
  ProgressSummary,
  DifficultItem,
  StageStatus,
  PracticeState,
  RecordingState,
  EvaluationStatus,
  PracticeItemType,
  PracticeItem,
  TrainingStage,
  TargetSound,
  ChildProfile,
  PracticeHistory,
  EvaluationResult,
} from "@/types/speechAdventure";

// ── Child profile domain ──────────────────────────────────────────────────────
export type { ChildProfileData } from "@/lib/child-profile/childProfileStorage";

// ── Observation domain ────────────────────────────────────────────────────────
export type {
  ObservationNote,
  ObservationCategory,
  ObservationTargetType,
} from "@/types/observations";

// ── Invitation domain ─────────────────────────────────────────────────────────
export type {
  Invitation,
  InvitationRole,
  InvitationStatus,
  CreateInvitationInput,
} from "@/types/invitations";

// ── Child access domain ───────────────────────────────────────────────────────
export type {
  AccessRole,
  ChildPermissions,
  ChildAccess,
  GrantChildAccessInput,
} from "@/types/childAccess";

// ── Speech evaluation domain ──────────────────────────────────────────────────
export type {
  SpeechEvaluationInput,
  SpeechEvaluationResult,
  EvaluationProvider,
} from "@/lib/speech-evaluation/types";
