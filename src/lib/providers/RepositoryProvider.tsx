"use client";

import { createContext, useContext, useMemo } from "react";
import type { ReactNode } from "react";
import type { IProgressRepository } from "@/lib/repositories/IProgressRepository";
import type { IProfileRepository } from "@/lib/repositories/IProfileRepository";
import type { IObservationRepository } from "@/lib/repositories/IObservationRepository";
import { LocalProgressRepository } from "@/lib/storage/local/LocalProgressRepository";
import { LocalProfileRepository } from "@/lib/storage/local/LocalProfileRepository";
import { LocalObservationRepository } from "@/lib/storage/local/LocalObservationRepository";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface Repositories {
  progress: IProgressRepository;
  profile: IProfileRepository;
  observations: IObservationRepository;
}

// ── Default (localStorage) singletons ─────────────────────────────────────────
//
// Module-level singletons so the same repository instance is returned on every
// render, preserving useSyncExternalStore subscription stability.

const defaultRepositories: Repositories = {
  progress: new LocalProgressRepository(),
  profile: new LocalProfileRepository(),
  observations: new LocalObservationRepository(),
};

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
