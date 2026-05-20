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

export type SyncDomain = "progress" | "profile" | "observations";

export interface SyncDomainPlan {
  domain: SyncDomain;
  recordCount: number;
  /** Lower number = sync first. */
  syncOrder: 1 | 2 | 3;
  reason: string;
}

export interface SyncPlan {
  domains: SyncDomainPlan[];
  totalRecords: number;
  /** False when prerequisites (auth + Supabase availability) are not met. */
  canSync: boolean;
  /** Human-readable explanation when canSync is false. */
  blockedReason: string | null;
  createdAt: string;
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
}

/**
 * Builds a sync plan from the current local state.
 * Returns an unactionable plan (canSync: false) when prerequisites are absent.
 */
export function buildSyncPlan(input: SyncPlanInput): SyncPlan {
  const now = new Date().toISOString();

  if (!input.isSupabaseAvailable) {
    return {
      domains: [],
      totalRecords: 0,
      canSync: false,
      blockedReason: "Supabase is not configured (missing env vars).",
      createdAt: now,
    };
  }

  if (!input.isAuthenticated) {
    return {
      domains: [],
      totalRecords: 0,
      canSync: false,
      blockedReason: "User must be signed in before syncing data.",
      createdAt: now,
    };
  }

  const domains: SyncDomainPlan[] = [];

  if (input.hasProfile) {
    domains.push({
      domain: "profile",
      recordCount: 1,
      syncOrder: 1,
      reason: "Profile syncs first — required by progress and observation records.",
    });
  }

  if (input.progressRecords > 0) {
    domains.push({
      domain: "progress",
      recordCount: input.progressRecords,
      syncOrder: 2,
      reason: "Practice attempts and sessions.",
    });
  }

  if (input.observationRecords > 0) {
    domains.push({
      domain: "observations",
      recordCount: input.observationRecords,
      syncOrder: 3,
      reason: "Therapist observation notes.",
    });
  }

  return {
    domains,
    totalRecords: domains.reduce((sum, d) => sum + d.recordCount, 0),
    canSync: domains.length > 0,
    blockedReason: domains.length === 0 ? "No local data to sync." : null,
    createdAt: now,
  };
}
