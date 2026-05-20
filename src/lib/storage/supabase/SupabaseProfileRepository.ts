import type { IProfileRepository } from "@/lib/repositories/IProfileRepository";
import type { ChildProfileData } from "@/lib/child-profile/childProfileStorage";
import type { SupabaseClient } from "@/lib/supabase/client";
import type { Database } from "@/types/supabase";

/**
 * Supabase-backed implementation of IProfileRepository.
 *
 * NOT IMPLEMENTED — Phase 3 placeholder.
 *
 * ── Implementation guide (Phase 3) ──────────────────────────────────────────
 * 1. Constructor receives a SupabaseClient<Database>
 * 2. getProfile() queries child_profiles WHERE user_id = auth.uid()
 * 3. Each user has exactly one profile (unique index on user_id)
 * 4. saveProfile() → upsert into child_profiles with domainToDbProfile() mapping
 * 5. subscribe() uses supabase.channel() realtime for live profile sync
 * 6. For SSR hydration, getServerProfile() always returns null (no server-side auth yet)
 * ────────────────────────────────────────────────────────────────────────────
 */
export class SupabaseProfileRepository implements IProfileRepository {
  constructor(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    private readonly client: SupabaseClient<Database>,
  ) {}

  getProfile(): ChildProfileData | null {
    throw new Error("SupabaseProfileRepository.getProfile: not implemented (Phase 3)");
  }

  getServerProfile(): ChildProfileData | null {
    throw new Error("SupabaseProfileRepository.getServerProfile: not implemented (Phase 3)");
  }

  subscribe(_callback: () => void): () => void {
    throw new Error("SupabaseProfileRepository.subscribe: not implemented (Phase 3)");
  }

  async saveProfile(_profile: ChildProfileData): Promise<void> {
    throw new Error("SupabaseProfileRepository.saveProfile: not implemented (Phase 3)");
  }

  async replaceProfile(_profile: ChildProfileData): Promise<void> {
    throw new Error("SupabaseProfileRepository.replaceProfile: not implemented (Phase 3)");
  }

  async clearProfile(): Promise<void> {
    throw new Error("SupabaseProfileRepository.clearProfile: not implemented (Phase 3)");
  }
}
