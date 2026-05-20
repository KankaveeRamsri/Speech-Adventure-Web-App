"use client";

import { useState, useCallback, useEffect } from "react";
import {
  migrateToSupabase,
  getMigrationFlag,
  type MigrationState,
  type MigrationProgress,
  type MigrationFlag,
} from "@/lib/sync/migrateToSupabase";
import { useAuth } from "@/hooks/useAuth";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface UseMigrationReturn {
  migrationState: MigrationState;
  migrationProgress: MigrationProgress;
  previousMigration: MigrationFlag | null;
  startMigration: () => Promise<void>;
}

const INITIAL_PROGRESS: MigrationProgress = {
  state: "idle",
  currentDomain: null,
  completedDomains: [],
  totalRecords: 0,
  uploadedRecords: 0,
  errorMessage: null,
  completedAt: null,
};

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useMigration(): UseMigrationReturn {
  const { user } = useAuth();
  const [migrationState, setMigrationState] = useState<MigrationState>("idle");
  const [migrationProgress, setMigrationProgress] = useState<MigrationProgress>(INITIAL_PROGRESS);
  const [previousMigration, setPreviousMigration] = useState<MigrationFlag | null>(null);

  // Read localStorage flag after mount (SSR-safe)
  useEffect(() => {
    setPreviousMigration(getMigrationFlag());
  }, []);

  // Re-read flag after a successful migration
  useEffect(() => {
    if (migrationState === "success") {
      setPreviousMigration(getMigrationFlag());
    }
  }, [migrationState]);

  const startMigration = useCallback(async () => {
    if (!user?.id) return;
    if (migrationState !== "idle") return;

    const handleProgress = (p: MigrationProgress) => {
      setMigrationState(p.state);
      setMigrationProgress(p);
    };

    // Kick off with "checking" immediately
    handleProgress({ ...INITIAL_PROGRESS, state: "checking" });

    await migrateToSupabase(user.id, handleProgress);
  }, [user?.id, migrationState]);

  return { migrationState, migrationProgress, previousMigration, startMigration };
}
