import * as storage from "@/lib/child-profile/childProfileStorage";
import * as listStorage from "@/lib/child-profile/childProfileListStorage";
import type { IProfileRepository } from "@/lib/repositories/IProfileRepository";
import type { ChildProfileData } from "@/lib/child-profile/childProfileStorage";

/**
 * localStorage-backed implementation of IProfileRepository.
 *
 * Delegates single-profile read/write to childProfileStorage (backward compat
 * write-through for other code that reads that key) and delegates list ops +
 * the selected-profile source of truth to childProfileListStorage.
 */
export class LocalProfileRepository implements IProfileRepository {
  // ── useSyncExternalStore plumbing ────────────────────────────────────────────

  /** Returns the currently selected child profile. */
  getProfile(): ChildProfileData | null {
    return listStorage.getSelectedProfile();
  }

  getServerProfile(): ChildProfileData | null {
    return listStorage.getServerSelectedProfile();
  }

  subscribe(callback: () => void): () => void {
    return listStorage.subscribeToProfileList(callback);
  }

  // ── Write operations ─────────────────────────────────────────────────────────

  async saveProfile(profile: ChildProfileData): Promise<void> {
    // Write-through to legacy single-profile key so Supabase migration and
    // other backward-compat reads still find data there.
    storage.saveProfile(profile);
    listStorage.saveProfileToList(profile);
  }

  async replaceProfile(profile: ChildProfileData): Promise<void> {
    storage.replaceProfile(profile);
    listStorage.saveProfileToList(profile);
  }

  async clearProfile(): Promise<void> {
    storage.clearProfile();
    listStorage.clearAllProfiles();
  }

  setScope(userId: string | null): void {
    storage.setScope(userId);
    listStorage.setListScope(userId);
  }

  // ── Multi-child support ─────────────────────────────────────────────────────

  listProfiles(): ChildProfileData[] {
    return listStorage.getProfiles();
  }

  getSelectedChildId(): string | null {
    return listStorage.getSelectedChildId();
  }

  setSelectedChildId(id: string): void {
    listStorage.setSelectedChildId(id);
  }
}
