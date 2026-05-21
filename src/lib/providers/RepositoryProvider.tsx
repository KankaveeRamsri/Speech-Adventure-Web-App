"use client";

import { createContext, useContext, useEffect, useMemo, useRef } from "react";
import type { ReactNode } from "react";
import type { IProgressRepository } from "@/lib/repositories/IProgressRepository";
import type { IProfileRepository } from "@/lib/repositories/IProfileRepository";
import type { IObservationRepository } from "@/lib/repositories/IObservationRepository";
import { LocalProgressRepository } from "@/lib/storage/local/LocalProgressRepository";
import { LocalProfileRepository } from "@/lib/storage/local/LocalProfileRepository";
import { LocalObservationRepository } from "@/lib/storage/local/LocalObservationRepository";
import {
  getConfiguredProvider,
  isSupabaseProviderRequested,
} from "@/lib/config/storageProvider";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { createSupabaseRepositories } from "@/lib/storage/supabase/createSupabaseRepositories";
import { useAuth } from "@/hooks/useAuth";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Repositories {
  progress: IProgressRepository;
  profile: IProfileRepository;
  observations: IObservationRepository;
}

// ── Repository resolution ─────────────────────────────────────────────────────
//
// Module-level singletons so the same repository instance is returned on every
// render, preserving useSyncExternalStore subscription stability.
//
// Resolution order:
//  1. If NEXT_PUBLIC_STORAGE_PROVIDER is absent / "local" → localStorage
//  2. If "supabase" or "hybrid" but Supabase env vars are missing → fallback to
//     localStorage (dev warning logged)
//  3. If "supabase" or "hybrid" and Supabase is configured → Supabase repos
//
// localStorage remains the default; Supabase is opt-in via env var only.

const _localRepositories: Repositories = {
  progress: new LocalProgressRepository(),
  profile: new LocalProfileRepository(),
  observations: new LocalObservationRepository(),
};

function _resolveRepositories(): Repositories {
  if (!isSupabaseProviderRequested()) {
    return _localRepositories;
  }

  if (!isSupabaseConfigured()) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        `[Storage] NEXT_PUBLIC_STORAGE_PROVIDER="${getConfiguredProvider()}" ` +
          "but Supabase env vars are missing. Falling back to localStorage.",
      );
    }
    return _localRepositories;
  }

  const supabaseRepos = createSupabaseRepositories();
  if (!supabaseRepos) {
    if (process.env.NODE_ENV !== "production") {
      console.warn(
        `[Storage] NEXT_PUBLIC_STORAGE_PROVIDER="${getConfiguredProvider()}" ` +
          "but Supabase client failed to initialize. Falling back to localStorage.",
      );
    }
    return _localRepositories;
  }

  return supabaseRepos;
}

const defaultRepositories: Repositories = _resolveRepositories();

// ── Rehydration helper ────────────────────────────────────────────────────────
//
// Supabase repositories expose a public rehydrate() method; local repositories
// do not. This duck-type guard lets RepositoryProvider call rehydrate() only on
// repos that support it — no changes to the IRepository interfaces required.

interface Rehydratable {
  rehydrate(): void;
}

function hasRehydrate(repo: unknown): repo is Rehydratable {
  return typeof (repo as Rehydratable).rehydrate === "function";
}

// ── Context ───────────────────────────────────────────────────────────────────

const RepositoryContext = createContext<Repositories>(defaultRepositories);

// ── Provider ──────────────────────────────────────────────────────────────────

interface RepositoryProviderProps {
  children: ReactNode;
  /**
   * Partial override map — pass only the repositories you want to replace.
   * Used in tests (mock repositories) and future Supabase migration
   * (swap one or more repositories without touching hooks or UI).
   */
  overrides?: Partial<Repositories>;
}

export function RepositoryProvider({ children, overrides }: RepositoryProviderProps) {
  const { isLoading, user } = useAuth();

  // useMemo so the merged object only changes when overrides reference changes.
  const value = useMemo<Repositories>(
    () => ({ ...defaultRepositories, ...overrides }),
    // Spread of overrides intentionally not deep-compared; callers must stabilize.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [overrides?.progress, overrides?.profile, overrides?.observations],
  );

  // Track the last userId we triggered rehydration for — prevents duplicate calls.
  const prevUserIdRef = useRef<string | null>(null);

  // After auth settles (session restored or signed in), rehydrate Supabase repos
  // so they fetch real cloud data instead of the empty result from the pre-auth
  // query that fired immediately on first subscribe().
  useEffect(() => {
    if (isLoading) return; // auth still initializing — wait

    const userId = user?.id ?? null;
    if (userId === prevUserIdRef.current) return; // no user change — skip
    prevUserIdRef.current = userId;

    if (!userId) return; // signed out — repos stay as-is (no cloud data to fetch)

    // Only Supabase repos implement rehydrate(); local repos are unaffected.
    if (hasRehydrate(value.profile)) value.profile.rehydrate();
    if (hasRehydrate(value.progress)) value.progress.rehydrate();
    if (hasRehydrate(value.observations)) value.observations.rehydrate();
  // value is a stable useMemo result; safe to include — it rarely changes.
  }, [isLoading, user?.id, value]);

  return (
    <RepositoryContext.Provider value={value}>
      {children}
    </RepositoryContext.Provider>
  );
}

// ── Consumer hook ─────────────────────────────────────────────────────────────

export function useRepositories(): Repositories {
  return useContext(RepositoryContext);
}
