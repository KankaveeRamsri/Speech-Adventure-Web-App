/**
 * Sync status types for the future data migration UI (Phase 3+).
 *
 * These types describe the state of a pending or in-progress migration from
 * localStorage to Supabase. No migration logic lives here — this module is
 * pure type definitions and initial-value constants.
 */

/** High-level lifecycle of a sync operation. */
export type SyncState =
  | "idle"      // no sync attempted or needed
  | "pending"   // records are queued but not yet uploaded
  | "syncing"   // upload in progress
  | "synced"    // all records uploaded successfully
  | "error";    // last sync attempt failed

/** Per-domain sync status. */
export interface DomainSyncStatus {
  domain: "progress" | "profile" | "observations";
  state: SyncState;
  uploadedCount: number;
  totalCount: number;
  lastSyncedAt: string | null;
  errorMessage: string | null;
}

/** Overall sync status combining all three domains. */
export interface SyncStatus {
  overall: SyncState;
  domains: DomainSyncStatus[];
  lastSyncedAt: string | null;
  totalPending: number;
  errorMessage: string | null;
}

export const INITIAL_DOMAIN_SYNC_STATUS: Omit<DomainSyncStatus, "domain"> = {
  state: "idle",
  uploadedCount: 0,
  totalCount: 0,
  lastSyncedAt: null,
  errorMessage: null,
};

export const INITIAL_SYNC_STATUS: SyncStatus = {
  overall: "idle",
  domains: [],
  lastSyncedAt: null,
  totalPending: 0,
  errorMessage: null,
};
