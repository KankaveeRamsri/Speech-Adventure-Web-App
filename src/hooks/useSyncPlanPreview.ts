"use client";

import { useMemo } from "react";
import { buildSyncPlan, type SyncPlan } from "@/lib/sync/syncPlan";
import { getConfiguredProvider, type StorageProvider } from "@/lib/config/storageProvider";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { useSpeechProgress } from "@/hooks/useSpeechProgress";
import { useChildProfile } from "@/hooks/useChildProfile";
import { useObservationNotes } from "@/hooks/useObservationNotes";
import { useAuth } from "@/hooks/useAuth";

export interface SyncPlanPreview {
  plan: SyncPlan;
  /** NEXT_PUBLIC_STORAGE_PROVIDER value (normalised). */
  provider: StorageProvider;
  /** True when Supabase env vars are present. Does not guarantee real credentials. */
  isSupabaseEnvSet: boolean;
  /** True after all three hooks have hydrated from localStorage. */
  isHydrated: boolean;
  /** Counts used to build the plan. */
  counts: {
    attempts: number;
    sessions: number;
    observations: number;
    hasProfile: boolean;
  };
}

/**
 * Assembles a sync plan preview from live hook data.
 * Read-only — no data is moved or deleted.
 */
export function useSyncPlanPreview(): SyncPlanPreview {
  const { progress, isHydrated: progressHydrated } = useSpeechProgress();
  const { profile, hasProfile, isHydrated: profileHydrated } = useChildProfile();
  const childId = profile?.id ?? "child-001";
  const { notes } = useObservationNotes(childId);
  const { isAuthenticated } = useAuth();

  const isHydrated = progressHydrated && profileHydrated;
  const isSupabaseEnvSet = isSupabaseConfigured();
  const provider = getConfiguredProvider();

  const counts = useMemo(
    () => ({
      attempts: progress.attempts.length,
      sessions: progress.sessions.length,
      observations: notes.length,
      hasProfile,
    }),
    [progress.attempts.length, progress.sessions.length, notes.length, hasProfile],
  );

  const plan = useMemo(
    () =>
      buildSyncPlan({
        progressRecords: isHydrated ? counts.attempts + counts.sessions : 0,
        hasProfile: isHydrated ? counts.hasProfile : false,
        observationRecords: isHydrated ? counts.observations : 0,
        isAuthenticated,
        isSupabaseAvailable: isSupabaseEnvSet,
      }),
    [isHydrated, counts, isAuthenticated, isSupabaseEnvSet],
  );

  return { plan, provider, isSupabaseEnvSet, isHydrated, counts };
}
