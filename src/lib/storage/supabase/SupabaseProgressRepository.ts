import type { IProgressRepository, StartSessionInput } from "@/lib/repositories/IProgressRepository";
import type { SpeechProgress, PracticeAttempt, PracticeSession } from "@/types/speechAdventure";
import type { SupabaseClient } from "@/lib/supabase/client";
import type { Database } from "@/types/supabase";

/**
 * Supabase-backed implementation of IProgressRepository.
 *
 * NOT IMPLEMENTED — Phase 3 placeholder.
 *
 * ── Implementation guide (Phase 3) ──────────────────────────────────────────
 * 1. Constructor receives a SupabaseClient<Database> (from getSupabaseClient())
 * 2. getProgress() / subscribe() maintain an in-memory cache; network reads
 *    hydrate the cache on first call, then ws channel keeps it live
 * 3. Write methods call supabase.from("practice_attempts").insert(domainToDb(attempt))
 * 4. Session methods target the practice_sessions table
 * 5. Selected sound lives in child_profiles.selected_sound_id
 * 6. Inject via <RepositoryProvider overrides={{ progress: new SupabaseProgressRepository(client) }}>
 *    inside src/app/layout.tsx when NEXT_PUBLIC_STORAGE_BACKEND === "supabase"
 * ────────────────────────────────────────────────────────────────────────────
 */
export class SupabaseProgressRepository implements IProgressRepository {
  constructor(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    private readonly client: SupabaseClient<Database>,
  ) {}

  getProgress(): SpeechProgress {
    throw new Error("SupabaseProgressRepository.getProgress: not implemented (Phase 3)");
  }

  getServerProgress(): SpeechProgress {
    throw new Error("SupabaseProgressRepository.getServerProgress: not implemented (Phase 3)");
  }

  subscribe(_callback: () => void): () => void {
    throw new Error("SupabaseProgressRepository.subscribe: not implemented (Phase 3)");
  }

  async addAttempt(_attempt: PracticeAttempt): Promise<SpeechProgress> {
    throw new Error("SupabaseProgressRepository.addAttempt: not implemented (Phase 3)");
  }

  async replaceProgress(_progress: SpeechProgress): Promise<void> {
    throw new Error("SupabaseProgressRepository.replaceProgress: not implemented (Phase 3)");
  }

  async clearProgress(): Promise<void> {
    throw new Error("SupabaseProgressRepository.clearProgress: not implemented (Phase 3)");
  }

  async startSession(_input: StartSessionInput): Promise<PracticeSession> {
    throw new Error("SupabaseProgressRepository.startSession: not implemented (Phase 3)");
  }

  async completeSession(_sessionId: string): Promise<PracticeSession | null> {
    throw new Error("SupabaseProgressRepository.completeSession: not implemented (Phase 3)");
  }

  async abandonSession(_sessionId: string): Promise<PracticeSession | null> {
    throw new Error("SupabaseProgressRepository.abandonSession: not implemented (Phase 3)");
  }

  getActiveSession(_stageId: string): PracticeSession | null {
    throw new Error("SupabaseProgressRepository.getActiveSession: not implemented (Phase 3)");
  }

  getSelectedSoundId(): string {
    throw new Error("SupabaseProgressRepository.getSelectedSoundId: not implemented (Phase 3)");
  }

  getServerSoundId(): string {
    throw new Error("SupabaseProgressRepository.getServerSoundId: not implemented (Phase 3)");
  }

  async setSelectedSoundId(_id: string): Promise<void> {
    throw new Error("SupabaseProgressRepository.setSelectedSoundId: not implemented (Phase 3)");
  }

  subscribeToSelectedSound(_callback: () => void): () => void {
    throw new Error("SupabaseProgressRepository.subscribeToSelectedSound: not implemented (Phase 3)");
  }
}
