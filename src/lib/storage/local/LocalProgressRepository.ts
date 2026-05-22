import * as storage from "@/lib/speechProgressStorage";
import type { IProgressRepository, StartSessionInput } from "@/lib/repositories/IProgressRepository";
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
}
