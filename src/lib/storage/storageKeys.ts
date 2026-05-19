/**
 * Centralized localStorage key constants for Speech Adventure.
 *
 * All storage modules and repositories must import keys from here.
 * This prevents key mismatches across modules and makes future
 * migrations (e.g., to a versioned schema) straightforward.
 */

export const STORAGE_KEYS = {
  /** Speech progress: attempts, sessions, stage status */
  PROGRESS: "speech-adventure-progress-v1",

  /** Selected target sound (e.g., "ก", "ข") */
  SELECTED_SOUND: "speech-adventure-selected-sound-v1",

  /** Child profile: name, age, targetSound, trainingGoal */
  PROFILE: "speech-adventure-profile-v1",

  /** Therapist / parent observation notes */
  OBSERVATIONS: "speech-adventure-observations-v1",

  // ── UI preferences — not cleared on data reset ──────────────────────────────

  /** Desktop sidebar collapsed state */
  SIDEBAR_COLLAPSED: "speech-adventure-sidebar-collapsed",

  /** Color theme preference: "light" | "dark" */
  THEME: "speech-adventure-theme",
} as const;

/** Keys that contain user content — exported and cleared on data reset. */
export const DATA_KEYS = [
  STORAGE_KEYS.PROGRESS,
  STORAGE_KEYS.SELECTED_SOUND,
  STORAGE_KEYS.PROFILE,
  STORAGE_KEYS.OBSERVATIONS,
] as const;

/** UI preference keys — preserved on data reset for smoother UX. */
export const PREFERENCE_KEYS = [
  STORAGE_KEYS.SIDEBAR_COLLAPSED,
  STORAGE_KEYS.THEME,
] as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];
export type DataKey = (typeof DATA_KEYS)[number];
