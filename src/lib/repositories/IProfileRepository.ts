import type { ChildProfileData } from "@/lib/child-profile/childProfileStorage";

/**
 * Contract for reading and writing child profile data.
 *
 * The subscribe / getProfile / getServerProfile triplet mirrors
 * useSyncExternalStore — the repository IS the snapshot source.
 */
export interface IProfileRepository {
  // ── useSyncExternalStore plumbing ──────────────────────────────────────────
  getProfile(): ChildProfileData | null;
  getServerProfile(): ChildProfileData | null;
  subscribe(callback: () => void): () => void;

  // ── Write operations ───────────────────────────────────────────────────────
  saveProfile(profile: ChildProfileData): Promise<void>;
  replaceProfile(profile: ChildProfileData): Promise<void>;
  clearProfile(): Promise<void>;
}
