import * as storage from "@/lib/child-profile/childProfileStorage";
import type { IProfileRepository } from "@/lib/repositories/IProfileRepository";
import type { ChildProfileData } from "@/lib/child-profile/childProfileStorage";

/**
 * localStorage-backed implementation of IProfileRepository.
 *
 * Thin wrapper around childProfileStorage.ts. All business logic
 * stays in the storage module; this class provides interface conformance.
 */
export class LocalProfileRepository implements IProfileRepository {
  // ── useSyncExternalStore plumbing ────────────────────────────────────────────

  getProfile(): ChildProfileData | null {
    return storage.getProfile();
  }

  getServerProfile(): ChildProfileData | null {
    return storage.getServerProfile();
  }

  subscribe(callback: () => void): () => void {
    return storage.subscribeToProfile(callback);
  }

  // ── Write operations ─────────────────────────────────────────────────────────

  async saveProfile(profile: ChildProfileData): Promise<void> {
    storage.saveProfile(profile);
  }

  async replaceProfile(profile: ChildProfileData): Promise<void> {
    storage.replaceProfile(profile);
  }

  async clearProfile(): Promise<void> {
    storage.clearProfile();
  }

  setScope(userId: string | null): void {
    storage.setScope(userId);
  }
}
