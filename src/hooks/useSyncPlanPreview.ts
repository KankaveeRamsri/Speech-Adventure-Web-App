"use client";

import { useMemo } from "react";
import { buildSyncPlan, type SyncPlan } from "@/lib/sync/syncPlan";
import { getConfiguredProvider, type StorageProvider } from "@/lib/config/storageProvider";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { useSpeechProgress } from "@/hooks/useSpeechProgress";
import { useChildProfile } from "@/hooks/useChildProfile";
import { useObservationNotes } from "@/hooks/useObservationNotes";
import { useAuth } from "@/hooks/useAuth";
// Direct localStorage reads for conflict detection — always reflect device-local
// state regardless of which storage provider is currently active.
import { getProfile as getLocalProfile } from "@/lib/child-profile/childProfileStorage";
import { getProgress as getLocalProgress } from "@/lib/speechProgressStorage";
import { getObservations as getLocalObservations } from "@/lib/observations/observationStorage";

export interface SyncPlanPreview {
  plan: SyncPlan;
  /** NEXT_PUBLIC_STORAGE_PROVIDER value (normalised). */
  provider: StorageProvider;
  /** True when Supabase env vars are present. Does not guarantee real credentials. */
  isSupabaseEnvSet: boolean;
  /** True after all three hooks have hydrated from localStorage. */
  isHydrated: boolean;
  /** True when the user has an active Supabase session. */
  isAuthenticated: boolean;
  /** True while AuthProvider is restoring the session (show skeleton). */
  isAuthLoading: boolean;
  /** Authenticated user's email address, or null if not signed in. */
  userEmail: string | null;
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
  const { isAuthenticated, user, isLoading: isAuthLoading } = useAuth();

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

  // ── Conflict detection ──────────────────────────────────────────────────────
  //
  // localHasData: always read from localStorage storage modules directly.
  // These are the modules' in-memory caches — synchronous, device-local, and
  // independent of the active storage provider.
  //
  // cloudHasData: when provider=supabase the active hooks return cloud state
  // after hydration. We use the memoised counts rather than re-reading repos.
  // When provider=local there is no Supabase connection, so cloud is always false.

  const localHasData = useMemo(() => {
    if (typeof window === "undefined") return false;
    const localProfile = getLocalProfile();
    const localProgress = getLocalProgress();
    const localNotes = getLocalObservations();
    return (
      localProfile !== null ||
      localProgress.attempts.length > 0 ||
      localProgress.sessions.length > 0 ||
      localNotes.length > 0
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // snapshot at mount — stable reference for the upload decision

  const cloudHasData = useMemo(
    () =>
      provider !== "local" &&
      isAuthenticated &&
      isHydrated &&
      (counts.hasProfile || counts.attempts > 0 || counts.sessions > 0 || counts.observations > 0),
    [provider, isAuthenticated, isHydrated, counts],
  );

  const plan = useMemo(
    () =>
      buildSyncPlan({
        progressRecords: isHydrated ? counts.attempts + counts.sessions : 0,
        hasProfile: isHydrated ? counts.hasProfile : false,
        observationRecords: isHydrated ? counts.observations : 0,
        isAuthenticated,
        isSupabaseAvailable: isSupabaseEnvSet,
        localHasData,
        cloudHasData,
      }),
    [isHydrated, counts, isAuthenticated, isSupabaseEnvSet, localHasData, cloudHasData],
  );

  return {
    plan,
    provider,
    isSupabaseEnvSet,
    isHydrated,
    isAuthenticated,
    isAuthLoading,
    userEmail: user?.email ?? null,
    counts,
  };
}
