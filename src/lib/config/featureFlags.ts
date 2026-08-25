/**
 * Central feature-flag configuration.
 *
 * Single source of truth for which product surfaces are enabled. Import
 * FEATURES (or isFeatureEnabled) wherever a flag needs to be checked —
 * registration UI, navigation, route guards, role-selection logic — instead
 * of scattering `process.env.NEXT_PUBLIC_*` checks through components.
 *
 * Each flag reads an optional NEXT_PUBLIC_ENABLE_* env var so ops can flip a
 * flag without a code change, but always falls back to the Phase 1 default
 * below when the env var is absent — the app never depends on env
 * configuration being present.
 *
 * Phase 1 defaults:
 *   schoolAdmin = false  — hidden from the public product; architecture and
 *                          database schema are preserved, not deleted.
 *   therapist   = false  — role/product surface not yet built.
 *   teacherV2   = true   — Teacher V2 foundation is live.
 */

export interface FeatureFlags {
  /** School Admin product surface (org/classroom admin console at /school). */
  schoolAdmin: boolean;
  /** Therapist role and product surface. */
  therapist: boolean;
  /** Teacher V2 (classrooms / students / assignments / reports foundation). */
  teacherV2: boolean;
}

function readFlag(envValue: string | undefined, defaultValue: boolean): boolean {
  if (envValue === "true") return true;
  if (envValue === "false") return false;
  return defaultValue;
}

export const FEATURES: FeatureFlags = {
  schoolAdmin: readFlag(process.env.NEXT_PUBLIC_ENABLE_SCHOOL_ADMIN, false),
  therapist: readFlag(process.env.NEXT_PUBLIC_ENABLE_THERAPIST, false),
  teacherV2: readFlag(process.env.NEXT_PUBLIC_ENABLE_TEACHER_V2, true),
};

/** Returns whether a given product surface is enabled. */
export function isFeatureEnabled(flag: keyof FeatureFlags): boolean {
  return FEATURES[flag];
}
