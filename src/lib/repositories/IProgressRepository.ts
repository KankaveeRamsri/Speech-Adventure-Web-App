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
}
