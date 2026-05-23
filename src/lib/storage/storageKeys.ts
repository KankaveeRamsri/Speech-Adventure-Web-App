/**
 * Centralized localStorage key constants for Speech Adventure.
 *
 * All storage modules and repositories must import keys from here.
 * This prevents key mismatches across modules and makes future
 * migrations (e.g., to a versioned schema) straightforward.
 */

// ── Per-user scoping ──────────────────────────────────────────────────────────

export const ANONYMOUS_SCOPE = "anonymous";

/**
 * Returns a scoped localStorage key for app data.
 * Authenticated users get `baseKey:userId`; unauthenticated get `baseKey:anonymous`.
 */
export function getScopedStorageKey(baseKey: string, userId: string | null): string {
  return `${baseKey}:${userId ?? ANONYMOUS_SCOPE}`;
}

/**
 * Returns the migration claim-flag key for a given base key.
 * The value stored at this flag is the scope id (userId or "anonymous") that
 * first claimed the legacy unscoped data during a one-time migration.
 */
export function getLegacyClaimedFlagKey(baseKey: string): string {
  return `${baseKey}:legacy-claimed`;
}

export const STORAGE_KEYS = {
  /** Speech progress: attempts, sessions, stage status */
  PROGRESS: "speech-adventure-progress-v1",

  /** Selected target sound (e.g., "ก", "ข") */
  SELECTED_SOUND: "speech-adventure-selected-sound-v1",

  /** Child profile: name, age, targetSound, trainingGoal (single-profile, legacy) */
  PROFILE: "speech-adventure-profile-v1",

  /** All child profiles for this user account (multi-child list) */
  PROFILES_LIST: "speech-adventure-profiles-v1",

  /** ID of the currently selected child profile */
  SELECTED_CHILD_ID: "speech-adventure-selected-child-v1",

  /** Therapist / parent observation notes */
  OBSERVATIONS: "speech-adventure-observations-v1",

  /** Invitations created by this user */
  INVITATIONS: "speech-adventure-invitations-v1",

  /** Child access grants — unscoped shared key (visible to both grantor and grantee on device) */
  CHILD_GRANTS: "speech-adventure-child-grants-v1",

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
  STORAGE_KEYS.PROFILES_LIST,
  STORAGE_KEYS.SELECTED_CHILD_ID,
  STORAGE_KEYS.OBSERVATIONS,
  STORAGE_KEYS.INVITATIONS,
] as const;

/** UI preference keys — preserved on data reset for smoother UX. */
export const PREFERENCE_KEYS = [
  STORAGE_KEYS.SIDEBAR_COLLAPSED,
  STORAGE_KEYS.THEME,
] as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];
export type DataKey = (typeof DATA_KEYS)[number];
