/**
 * Local data backup utility for Speech Adventure.
 *
 * Handles export, import, and clearing of all app data stored in localStorage.
 * UI preferences (theme, sidebar collapse) are intentionally kept on clear
 * to avoid a jarring experience after resetting content data.
 */

import {
  DATA_KEYS,
  PREFERENCE_KEYS,
  STORAGE_KEYS,
  getScopedStorageKey,
} from "@/lib/storage/storageKeys";

// Re-export so existing callers (`onboarding/page.tsx` etc.) can still
// access DATA_KEYS / PREFERENCE_KEYS from this module if needed.
export { DATA_KEYS, PREFERENCE_KEYS };

// ── Backup metadata ────────────────────────────────────────────────────────────

const APP_NAME = "Speech Adventure";
const BACKUP_VERSION = 1;

// ── Types ──────────────────────────────────────────────────────────────────────

export interface BackupMetadata {
  appName: string;
  version: number;
  exportedAt: string;
  dataKeys: string[];
}

export interface BackupFile {
  metadata: BackupMetadata;
  data: Record<string, unknown>;
}

export type BackupValidationResult =
  | { valid: true; metadata: BackupMetadata }
  | { valid: false; error: string };

export type ImportResult =
  | { success: true; keysRestored: string[] }
  | { success: false; error: string };

// ── Helpers ────────────────────────────────────────────────────────────────────

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function generateFilename(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `speech-adventure-backup-${yyyy}-${mm}-${dd}.json`;
}

// ── Export ─────────────────────────────────────────────────────────────────────

export function exportData(userId?: string | null): void {
  if (!isBrowser()) return;

  const data: Record<string, unknown> = {};

  for (const key of DATA_KEYS) {
    // Prefer the scoped key, fall back to legacy unscoped for backward compat.
    const scopedKey = getScopedStorageKey(key, userId ?? null);
    const raw = localStorage.getItem(scopedKey) ?? localStorage.getItem(key);
    if (raw !== null) {
      try {
        data[key] = JSON.parse(raw);
      } catch {
        data[key] = raw;
      }
    }
  }

  const backup: BackupFile = {
    metadata: {
      appName: APP_NAME,
      version: BACKUP_VERSION,
      exportedAt: new Date().toISOString(),
      dataKeys: Object.keys(data),
    },
    data,
  };

  const json = JSON.stringify(backup, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = generateFilename();
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ── Validate ───────────────────────────────────────────────────────────────────

export function validateBackup(file: BackupFile): BackupValidationResult {
  if (!file || typeof file !== "object") {
    return { valid: false, error: "ไฟล์ไม่ใช่รูปแบบ JSON ที่ถูกต้อง" };
  }

  if (!file.metadata || typeof file.metadata !== "object") {
    return { valid: false, error: "ไฟล์นี้ไม่ใช่ข้อมูลสำรองของ Speech Adventure" };
  }

  if (file.metadata.appName !== APP_NAME) {
    return { valid: false, error: "ไฟล์นี้ไม่ใช่ข้อมูลสำรองของ Speech Adventure" };
  }

  if (!file.data || typeof file.data !== "object") {
    return { valid: false, error: "ไฟล์สำรองไม่มีข้อมูล" };
  }

  return {
    valid: true,
    metadata: file.metadata as BackupMetadata,
  };
}

// ── Import ─────────────────────────────────────────────────────────────────────

export function importData(file: BackupFile): ImportResult {
  const validation = validateBackup(file);
  if (!validation.valid) {
    return { success: false, error: validation.error };
  }

  if (!isBrowser()) {
    return { success: false, error: "ไม่สามารถนำเข้าข้อมูลได้ในขณะนี้" };
  }

  const keysRestored: string[] = [];

  for (const key of DATA_KEYS) {
    if (key in file.data && file.data[key] !== undefined) {
      try {
        localStorage.setItem(key, JSON.stringify(file.data[key]));
        keysRestored.push(key);
      } catch {
        // Skip keys that fail to write
      }
    }
  }

  return { success: true, keysRestored };
}

// ── Clear ──────────────────────────────────────────────────────────────────────

export function clearAllData(userId?: string | null): string[] {
  if (!isBrowser()) return [];

  const cleared: string[] = [];

  for (const key of DATA_KEYS) {
    try {
      // Remove both the scoped key and the legacy unscoped key.
      localStorage.removeItem(getScopedStorageKey(key, userId ?? null));
      localStorage.removeItem(key);
      cleared.push(key);
    } catch {
      // Skip silently
    }
  }

  return cleared;
}

// ── Read file helper ───────────────────────────────────────────────────────────

export function readBackupFile(file: File): Promise<BackupFile> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result as string) as BackupFile;
        resolve(parsed);
      } catch {
        reject(new Error("ไฟล์ไม่ใช่รูปแบบ JSON ที่ถูกต้อง"));
      }
    };

    reader.onerror = () => {
      reject(new Error("ไม่สามารถอ่านไฟล์ได้"));
    };

    reader.readAsText(file);
  });
}

// ── Storage info ───────────────────────────────────────────────────────────────

export function getStorageSummary(userId?: string | null): {
  hasProfile: boolean;
  hasProgress: boolean;
  hasObservations: boolean;
  totalKeys: number;
} {
  if (!isBrowser()) {
    return { hasProfile: false, hasProgress: false, hasObservations: false, totalKeys: 0 };
  }

  const uid = userId ?? null;
  // Check scoped key first, then fall back to legacy for backward compat.
  const profile =
    localStorage.getItem(getScopedStorageKey(STORAGE_KEYS.PROFILE, uid)) ??
    localStorage.getItem(STORAGE_KEYS.PROFILE);
  const progress =
    localStorage.getItem(getScopedStorageKey(STORAGE_KEYS.PROGRESS, uid)) ??
    localStorage.getItem(STORAGE_KEYS.PROGRESS);
  const observations =
    localStorage.getItem(getScopedStorageKey(STORAGE_KEYS.OBSERVATIONS, uid)) ??
    localStorage.getItem(STORAGE_KEYS.OBSERVATIONS);

  let totalKeys = 0;
  for (const key of DATA_KEYS) {
    const has =
      localStorage.getItem(getScopedStorageKey(key, uid)) !== null ||
      localStorage.getItem(key) !== null;
    if (has) totalKeys++;
  }

  return {
    hasProfile: profile !== null,
    hasProgress: progress !== null,
    hasObservations: observations !== null,
    totalKeys,
  };
}
