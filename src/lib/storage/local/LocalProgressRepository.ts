import * as storage from "@/lib/speechProgressStorage";
import type {
  IProgressRepository,
  StartSessionInput,
  ChildPracticeSummary,
} from "@/lib/repositories/IProgressRepository";
import type { SpeechProgress, PracticeAttempt, PracticeSession } from "@/types/speechAdventure";

/**
 * localStorage-backed implementation of IProgressRepository.
 *
 * Thin wrapper around speechProgressStorage.ts — all business logic
 * stays in the storage module. This class exists solely to conform to
 * the IProgressRepository interface so hooks can depend on the
 * abstraction rather than the concrete storage module.
 *
 * When Supabase arrives, implement IProgressRepository with a
 * SupabaseProgressRepository class and inject it via RepositoryProvider.
 */
export class LocalProgressRepository implements IProgressRepository {
  // ── useSyncExternalStore plumbing ────────────────────────────────────────────

  getProgress(): SpeechProgress {
    return storage.getProgress();
  }

  getServerProgress(): SpeechProgress {
    return storage.getServerProgress();
  }

  subscribe(callback: () => void): () => void {
    return storage.subscribeToProgress(callback);
  }

  // ── Write operations ─────────────────────────────────────────────────────────

  async addAttempt(attempt: PracticeAttempt): Promise<SpeechProgress> {
    return storage.addAttempt(attempt);
  }

  async replaceProgress(progress: SpeechProgress): Promise<void> {
    storage.replaceProgress(progress);
  }

  async clearProgress(): Promise<void> {
    storage.clearProgress();
  }

  async clearProgressForChild(childId: string): Promise<void> {
    storage.clearProgressForChild(childId);
  }

  // ── Session management ───────────────────────────────────────────────────────

  async startSession(input: StartSessionInput): Promise<PracticeSession> {
    return storage.startPracticeSession(input);
  }

  async completeSession(sessionId: string): Promise<PracticeSession | null> {
    return storage.completePracticeSession(sessionId);
  }

  async abandonSession(sessionId: string): Promise<PracticeSession | null> {
    return storage.abandonPracticeSession(sessionId);
  }

  getActiveSession(stageId: string): PracticeSession | null {
    return storage.getActiveSession(stageId);
  }

  // ── Selected sound ───────────────────────────────────────────────────────────

  getSelectedSoundId(): string {
    return storage.getSelectedSoundId();
  }

  getServerSoundId(): string {
    return storage.getServerSoundId();
  }

  async setSelectedSoundId(id: string): Promise<void> {
    storage.setSelectedSoundId(id);
  }

  subscribeToSelectedSound(callback: () => void): () => void {
    return storage.subscribeToSelectedSound(callback);
  }

  setScope(userId: string | null): void {
    storage.setScope(userId);
  }

  // ── Teacher V2 Phase 3 ────────────────────────────────────────────────────
  // Local/demo mode holds only the signed-in user's own selected-child
  // progress, so cross-child teacher reads are best-effort: real data only
  // when childId matches the loaded progress, otherwise an empty history.

  async getChildProgress(childId: string): Promise<SpeechProgress> {
    const current = storage.getProgress();
    if (childId && current.childId === childId) return current;
    return {
      childId,
      targetSound: current.targetSound,
      attempts: [],
      sessions: [],
      updatedAt: new Date().toISOString(),
    };
  }

  async getChildrenPracticeSummaries(
    childIds: string[],
  ): Promise<Map<string, ChildPracticeSummary>> {
    const result = new Map<string, ChildPracticeSummary>();
    const current = storage.getProgress();
    if (!current.childId || !childIds.includes(current.childId)) return result;
    const attempts = current.attempts;
    if (attempts.length === 0) return result;
    const total = attempts.reduce((s, a) => s + a.score, 0);
    const last = attempts.reduce(
      (m, a) => (a.createdAt > m ? a.createdAt : m),
      attempts[0].createdAt,
    );
    result.set(current.childId, {
      childId: current.childId,
      attemptCount: attempts.length,
      averageScore: Math.round(total / attempts.length),
      lastPracticedAt: last,
    });
    return result;
  }
}
