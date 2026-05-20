/**
 * One-way data migration: localStorage → Supabase.
 *
 * Migration order:
 *   1. child_profiles  — upsert on user_id (idempotent)
 *   2. practice_sessions + practice_attempts  — insert with new UUIDs (NOT idempotent)
 *   3. observation_notes  — insert with new UUIDs (NOT idempotent)
 *
 * Idempotency:
 *   Profile upsert is always safe (onConflict: user_id).
 *   Sessions/Attempts/Notes are NOT safe to run twice — each run inserts new rows.
 *   Callers must check getMigrationFlag() and prevent duplicate runs.
 *
 * Data preservation:
 *   localStorage is read-only here. No local data is modified or deleted.
 *
 * ID mapping:
 *   localStorage uses string IDs (e.g. "child-001", "session-...").
 *   Supabase requires UUID primary keys. Strategy:
 *   - Profile: DB generates UUID via gen_random_uuid(); returned and used below.
 *   - Sessions: DB generates UUID; we don't track the mapping.
 *   - Attempts: child_id = profile UUID above; session_id = null (can't map strings → UUIDs).
 *   - Notes: child_id = profile UUID; target_id = null (same reason).
 */

import { getSupabaseClient } from "@/lib/supabase/client";
import { getProfile } from "@/lib/child-profile/childProfileStorage";
import { getProgress, getSelectedSoundId } from "@/lib/speechProgressStorage";
import { getObservations } from "@/lib/observations/observationStorage";
import {
  domainToDbProfile,
  domainToDbSession,
  domainToDbAttempt,
  domainToDbNote,
} from "@/lib/storage/supabase/mappers";

// ── Types ─────────────────────────────────────────────────────────────────────

export type MigrationDomain = "profile" | "progress" | "observations";

export type MigrationState =
  | "idle"
  | "checking"
  | "migrating"
  | "success"
  | "error";

export interface MigrationProgress {
  state: MigrationState;
  /** Domain currently being migrated. */
  currentDomain: MigrationDomain | null;
  completedDomains: MigrationDomain[];
  totalRecords: number;
  uploadedRecords: number;
  errorMessage: string | null;
  completedAt: string | null;
}

export interface MigrationResult {
  success: boolean;
  profileMigrated: boolean;
  sessionsUploaded: number;
  attemptsUploaded: number;
  observationsUploaded: number;
  errorMessage: string | null;
  completedAt: string;
}

export interface MigrationFlag {
  completedAt: string;
  profileMigrated: boolean;
  sessionsUploaded: number;
  attemptsUploaded: number;
  observationsUploaded: number;
}

// ── Migration flag (idempotency) ──────────────────────────────────────────────

export const MIGRATION_FLAG_KEY = "speech-adventure-migration-v1";

export function getMigrationFlag(): MigrationFlag | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(MIGRATION_FLAG_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as MigrationFlag;
  } catch {
    return null;
  }
}

function saveMigrationFlag(flag: MigrationFlag): void {
  try {
    localStorage.setItem(MIGRATION_FLAG_KEY, JSON.stringify(flag));
  } catch {
    // Best-effort — migration still succeeded even if the flag can't be written.
  }
}

// ── Internal helpers ──────────────────────────────────────────────────────────

const BATCH_SIZE = 100;

function batchOf<T>(arr: T[]): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += BATCH_SIZE) {
    result.push(arr.slice(i, i + BATCH_SIZE));
  }
  return result;
}

function failResult(
  errorMessage: string,
  partial: Partial<Omit<MigrationResult, "success" | "errorMessage" | "completedAt">>,
): MigrationResult {
  return {
    success: false,
    profileMigrated: false,
    sessionsUploaded: 0,
    attemptsUploaded: 0,
    observationsUploaded: 0,
    ...partial,
    errorMessage,
    completedAt: new Date().toISOString(),
  };
}

// ── Main migration function ───────────────────────────────────────────────────

/**
 * Migrates all local data to Supabase for the authenticated user.
 *
 * @param userId   The auth.uid() from the active Supabase session.
 * @param onProgress  Called after each step with the current progress snapshot.
 */
export async function migrateToSupabase(
  userId: string,
  onProgress: (p: MigrationProgress) => void,
): Promise<MigrationResult> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return failResult("Supabase client ไม่พร้อมใช้งาน กรุณาตรวจสอบ env vars", {});
  }

  // Emit helper — always called with a fresh snapshot
  let _completed: MigrationDomain[] = [];
  let _uploaded = 0;
  let _total = 0;

  const emit = (
    state: MigrationState,
    currentDomain: MigrationDomain | null,
    errorMessage: string | null = null,
    completedAt: string | null = null,
  ): void => {
    onProgress({
      state,
      currentDomain,
      completedDomains: [..._completed],
      totalRecords: _total,
      uploadedRecords: _uploaded,
      errorMessage,
      completedAt,
    });
  };

  // ── Read all local data ──────────────────────────────────────────────────────
  emit("checking", null);

  const profile = getProfile();
  if (!profile) {
    return failResult("ไม่พบโปรไฟล์เด็กในอุปกรณ์นี้", {});
  }

  const progress = getProgress();
  const observations = getObservations();
  const selectedSoundId = getSelectedSoundId();

  const sessions = progress.sessions;
  const attempts = progress.attempts;

  _total = 1 + sessions.length + attempts.length + observations.length;

  // ── Step 1: Profile (upsert — always safe to re-run) ────────────────────────
  emit("migrating", "profile");

  let childUuid: string;
  try {
    const profileRow = domainToDbProfile(profile, userId, selectedSoundId);
    const { data, error } = await supabase
      .from("child_profiles")
      .upsert(profileRow, { onConflict: "user_id" })
      .select("id")
      .single();

    if (error || !data) {
      throw new Error(error?.message ?? "ไม่ได้รับ ID จาก child_profiles");
    }
    childUuid = data.id;
    _uploaded += 1;
    _completed = ["profile"];
  } catch (err) {
    const msg = err instanceof Error ? err.message : "อัปโหลดโปรไฟล์ไม่สำเร็จ";
    emit("error", "profile", msg);
    return failResult(msg, {});
  }

  // ── Step 2: Sessions + Attempts ─────────────────────────────────────────────
  let sessionsUploaded = 0;
  let attemptsUploaded = 0;

  if (sessions.length > 0 || attempts.length > 0) {
    emit("migrating", "progress");

    try {
      for (const batch of batchOf(sessions)) {
        const rows = batch.map((s) => ({
          ...domainToDbSession(s),
          child_id: childUuid,
        }));
        const { error } = await supabase.from("practice_sessions").insert(rows);
        if (error) throw new Error(error.message);
        sessionsUploaded += batch.length;
        _uploaded += batch.length;
        emit("migrating", "progress");
      }

      for (const batch of batchOf(attempts)) {
        const rows = batch.map((a) => ({
          ...domainToDbAttempt(a),
          child_id: childUuid,
          session_id: null,
        }));
        const { error } = await supabase.from("practice_attempts").insert(rows);
        if (error) throw new Error(error.message);
        attemptsUploaded += batch.length;
        _uploaded += batch.length;
        emit("migrating", "progress");
      }

      _completed = ["profile", "progress"];
    } catch (err) {
      const msg = err instanceof Error ? err.message : "อัปโหลดข้อมูลการฝึกไม่สำเร็จ";
      emit("error", "progress", msg);
      return failResult(msg, { profileMigrated: true, sessionsUploaded, attemptsUploaded });
    }
  } else {
    _completed = ["profile", "progress"];
  }

  // ── Step 3: Observation notes ────────────────────────────────────────────────
  let observationsUploaded = 0;

  if (observations.length > 0) {
    emit("migrating", "observations");

    try {
      for (const batch of batchOf(observations)) {
        const rows = batch.map((n) => ({
          ...domainToDbNote(n, userId),
          child_id: childUuid,
          target_id: null,
        }));
        const { error } = await supabase.from("observation_notes").insert(rows);
        if (error) throw new Error(error.message);
        observationsUploaded += batch.length;
        _uploaded += batch.length;
        emit("migrating", "observations");
      }

      _completed = ["profile", "progress", "observations"];
    } catch (err) {
      const msg = err instanceof Error ? err.message : "อัปโหลดบันทึกการสังเกตไม่สำเร็จ";
      emit("error", "observations", msg);
      return failResult(msg, { profileMigrated: true, sessionsUploaded, attemptsUploaded, observationsUploaded });
    }
  } else {
    _completed = ["profile", "progress", "observations"];
  }

  // ── Done ──────────────────────────────────────────────────────────────────────
  const completedAt = new Date().toISOString();
  saveMigrationFlag({
    completedAt,
    profileMigrated: true,
    sessionsUploaded,
    attemptsUploaded,
    observationsUploaded,
  });

  emit("success", null, null, completedAt);

  return {
    success: true,
    profileMigrated: true,
    sessionsUploaded,
    attemptsUploaded,
    observationsUploaded,
    errorMessage: null,
    completedAt,
  };
}
