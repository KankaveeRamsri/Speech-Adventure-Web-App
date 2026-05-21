/**
 * Sync plan utilities.
 *
 * A sync plan describes what data would be migrated if the user chose to sync
 * their localStorage data to Supabase. No data is moved here — this is purely
 * an analysis / preview step used by the future migration UI (Phase 3+).
 *
 * Sync order: profile → progress → observations
 * (profile must exist before progress/observation records can reference it)
 */

import { assessConflict, type RecommendedUploadAction } from "./conflictDetection";

export type SyncDomain = "progress" | "profile" | "observations";

export interface SyncDomainPlan {
  domain: SyncDomain;
  recordCount: number;
  /** Lower number = sync first. */
  syncOrder: 1 | 2 | 3;
  reason: string;
  /** True when both local and cloud data exist for this domain. Upload may create duplicates. */
  conflictRisk: boolean;
}

export interface SyncPlan {
  domains: SyncDomainPlan[];
  totalRecords: number;
  /** False when prerequisites (auth + Supabase availability) are not met. */
  canSync: boolean;
  /** Human-readable explanation when canSync is false. */
  blockedReason: string | null;
  createdAt: string;
  // ── Conflict detection (Phase 34) ────────────────────────────────────────────
  /** True if localStorage has any data (profile/progress/observations). */
  localHasData: boolean;
  /** True if Supabase already has data for this user (cloud profile exists). */
  cloudHasData: boolean;
  /** True when both localHasData and cloudHasData are true — upload may duplicate. */
  hasConflict: boolean;
  /** Short Thai explanation of the conflict, null when hasConflict is false. */
  conflictSummary: string | null;
  /** Safe recommended action given the current local/cloud state. */
  recommendedAction: RecommendedUploadAction;
}

export interface SyncPlanInput {
  /** Number of practice attempts + sessions in localStorage. */
  progressRecords: number;
  /** Whether a child profile exists in localStorage. */
  hasProfile: boolean;
  /** Number of observation notes in localStorage. */
  observationRecords: number;
  /** Whether the user has an active Supabase auth session. */
  isAuthenticated: boolean;
  /** Whether Supabase env vars are configured and the client is available. */
  isSupabaseAvailable: boolean;
  // ── Conflict detection inputs (Phase 34) ─────────────────────────────────────
  /** True when localStorage has any user data (profile/progress/observations). */
  localHasData: boolean;
  /** True when Supabase already has data for this user (e.g. child profile exists). */
  cloudHasData: boolean;
}

/**
 * Builds a sync plan from the current local state.
 * Returns an unactionable plan (canSync: false) when prerequisites are absent.
 */
export function buildSyncPlan(input: SyncPlanInput): SyncPlan {
  const now = new Date().toISOString();

  // Evaluate conflict state regardless of auth/Supabase prerequisites
  const conflict = assessConflict(input.localHasData, input.cloudHasData);

  const baseConflictFields = {
    localHasData: input.localHasData,
    cloudHasData: input.cloudHasData,
    hasConflict: conflict.conflictRisk === "both",
    conflictSummary: conflict.warningMessage,
    recommendedAction: conflict.recommendedAction,
  };

  if (!input.isSupabaseAvailable) {
    return {
      domains: [],
      totalRecords: 0,
      canSync: false,
      blockedReason: "Supabase is not configured (missing env vars).",
      createdAt: now,
      ...baseConflictFields,
    };
  }

  if (!input.isAuthenticated) {
    return {
      domains: [],
      totalRecords: 0,
      canSync: false,
      blockedReason: "User must be signed in before syncing data.",
      createdAt: now,
      ...baseConflictFields,
    };
  }

  const hasConflict = conflict.conflictRisk === "both";
  const domains: SyncDomainPlan[] = [];

  if (input.hasProfile) {
    domains.push({
      domain: "profile",
      recordCount: 1,
      syncOrder: 1,
      reason: "Profile syncs first — required by progress and observation records.",
      conflictRisk: hasConflict,
    });
  }

  if (input.progressRecords > 0) {
    domains.push({
      domain: "progress",
      recordCount: input.progressRecords,
      syncOrder: 2,
      reason: "Practice attempts and sessions.",
      conflictRisk: hasConflict,
    });
  }

  if (input.observationRecords > 0) {
    domains.push({
      domain: "observations",
      recordCount: input.observationRecords,
      syncOrder: 3,
      reason: "Therapist observation notes.",
      conflictRisk: hasConflict,
    });
  }

  return {
    domains,
    totalRecords: domains.reduce((sum, d) => sum + d.recordCount, 0),
    canSync: domains.length > 0,
    blockedReason: domains.length === 0 ? "No local data to sync." : null,
    createdAt: now,
    ...baseConflictFields,
  };
}
