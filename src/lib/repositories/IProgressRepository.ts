import type {
  SpeechProgress,
  PracticeAttempt,
  PracticeSession,
} from "@/types/speechAdventure";

export interface StartSessionInput {
  childId: string;
  targetSound: string;
  stageId: string;
  totalMissions: number;
}

/**
 * Lightweight per-child practice summary for the Teacher student directory.
 * Derived from a single batched query over all accessible child IDs — never
 * one query per child (see IProgressRepository.getChildrenPracticeSummaries).
 */
export interface ChildPracticeSummary {
  childId: string;
  /** Number of scored practice_attempts rows. */
  attemptCount: number;
  /** Mean of attempt.score (0–100), rounded; null when no attempts. */
  averageScore: number | null;
  /** ISO timestamp of the most recent attempt; null when no attempts. */
  lastPracticedAt: string | null;
}

/**
 * Contract for reading and writing speech progress data.
 *
 * Methods are async so future implementations (Supabase, API) can
 * do network I/O without requiring hook changes. The local
 * implementation resolves synchronously.
 *
 * The subscribe / getProgress / getServerProgress triplet mirrors
 * the useSyncExternalStore API — repositories are the direct
 * source of truth for those three functions.
 */
export interface IProgressRepository {
  // ── useSyncExternalStore plumbing ──────────────────────────────────────────
  getProgress(): SpeechProgress;
  getServerProgress(): SpeechProgress;
  subscribe(callback: () => void): () => void;

  // ── Write operations ───────────────────────────────────────────────────────
  addAttempt(attempt: PracticeAttempt): Promise<SpeechProgress>;
  replaceProgress(progress: SpeechProgress): Promise<void>;
  clearProgress(): Promise<void>;
  /**
   * Removes progress data for the given child only.
   * Safe to call for development/testing resets — never deletes child profile.
   * Guard: if childId is empty, logs a warning and returns without clearing.
   */
  clearProgressForChild(childId: string): Promise<void>;

  // ── Session management ─────────────────────────────────────────────────────
  startSession(input: StartSessionInput): Promise<PracticeSession>;
  completeSession(sessionId: string): Promise<PracticeSession | null>;
  abandonSession(sessionId: string): Promise<PracticeSession | null>;
  getActiveSession(stageId: string): PracticeSession | null;

  // ── Selected sound ─────────────────────────────────────────────────────────
  getSelectedSoundId(): string;
  getServerSoundId(): string;
  setSelectedSoundId(id: string): Promise<void>;
  subscribeToSelectedSound(callback: () => void): () => void;

  // ── Teacher V2 Phase 3: read another child's practice data ─────────────────
  /**
   * Fetches the full speech-practice history (attempts + sessions) for one
   * child by id. RLS-scoped: returns real data only when the caller has a
   * legitimate read path (owns the child / active can_view_progress grant /
   * teaches a classroom containing the child — see
   * 20260829000300_teacher_read_student_practice.sql). For an inaccessible
   * child the query simply returns no rows — callers get an empty
   * SpeechProgress and must not treat that as "no practice" without also
   * checking child-profile access.
   *
   * Does NOT touch the repository's own useSyncExternalStore cache (that is
   * still scoped to the signed-in user's selected child).
   */
  getChildProgress(childId: string): Promise<SpeechProgress>;
  /**
   * One batched query returning a practice summary for every accessible child
   * id in `childIds`. Inaccessible / never-practiced ids are omitted from the
   * result map. Used by the Teacher student directory to avoid N+1 queries.
   */
  getChildrenPracticeSummaries(
    childIds: string[],
  ): Promise<Map<string, ChildPracticeSummary>>;
}
