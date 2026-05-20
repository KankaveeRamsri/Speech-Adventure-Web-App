"use client";

import { createContext, useContext, useMemo } from "react";
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
  // useMemo so the merged object only changes when overrides reference changes.
  const value = useMemo<Repositories>(
    () => ({ ...defaultRepositories, ...overrides }),
    // Spread of overrides intentionally not deep-compared; callers must stabilize.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [overrides?.progress, overrides?.profile, overrides?.observations],
  );

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
