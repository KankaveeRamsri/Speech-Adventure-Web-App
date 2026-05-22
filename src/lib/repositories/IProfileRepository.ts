import type { ChildProfileData } from "@/lib/child-profile/childProfileStorage";

/**
 * Contract for reading and writing child profile data.
 *
 * The subscribe / getProfile / getServerProfile triplet mirrors
 * useSyncExternalStore — the repository IS the snapshot source.
 */
export interface IProfileRepository {
  // ── useSyncExternalStore plumbing ──────────────────────────────────────────
  /** Returns the currently selected child's profile. */
  getProfile(): ChildProfileData | null;
  getServerProfile(): ChildProfileData | null;
  subscribe(callback: () => void): () => void;

  // ── Write operations ───────────────────────────────────────────────────────
  saveProfile(profile: ChildProfileData): Promise<void>;
  replaceProfile(profile: ChildProfileData): Promise<void>;
  clearProfile(): Promise<void>;

  // ── Multi-child support (Phase 7) ──────────────────────────────────────────
  /** Returns all child profiles for this user. Single-child users get a 1-item array. */
  listProfiles(): ChildProfileData[];
  /** Returns the ID of the currently selected child, or null if no selection. */
  getSelectedChildId(): string | null;
  /**
   * Switches the active child.
   * Triggers profile subscribers so useChildProfile re-renders with the new selection.
   * NOTE: Callers should also call `setSelectedSoundId(child.targetSound)` to keep
   * the training map in sync with the new child's target sound.
   */
  setSelectedChildId(id: string): void;
}
