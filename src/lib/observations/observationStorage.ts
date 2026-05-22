import type { ObservationNote } from "@/types/observations";
import {
  STORAGE_KEYS,
  getScopedStorageKey,
  getLegacyClaimedFlagKey,
} from "@/lib/storage/storageKeys";
import { localRead, localWrite, localRemove } from "@/lib/storage/local/localStorageClient";
import { ObservationNotesArraySchema, parseOrDefault } from "@/lib/validation";

const STORAGE_KEY = STORAGE_KEYS.OBSERVATIONS;

// ── Stable snapshot pattern (matches speechProgressStorage / childProfileStorage) ─

const SERVER_OBSERVATIONS: ObservationNote[] = [];
let currentObservations: ObservationNote[] = SERVER_OBSERVATIONS;
let isClientInitialized = false;

// ── User scope ────────────────────────────────────────────────────────────────
let _scopeUserId: string | null = null;

function getCurrentKey(): string {
  return getScopedStorageKey(STORAGE_KEY, _scopeUserId);
}

function tryMigrateLegacy(): void {
  if (_scopeUserId === null) return;
  if (localRead(getCurrentKey())) return;
  const claimFlag = getLegacyClaimedFlagKey(STORAGE_KEY);
  if (localRead(claimFlag)) return;
  const legacy = localRead(STORAGE_KEY);
  if (!legacy) return;
  localWrite(getCurrentKey(), legacy);
  localWrite(claimFlag, _scopeUserId);
}

export function setScope(userId: string | null): void {
  if (userId === _scopeUserId && isClientInitialized) return;
  _scopeUserId = userId;
  isClientInitialized = false;
  tryMigrateLegacy();
  initializeIfNeeded();
  notifyListeners();
}

const listeners = new Set<() => void>();

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function readFromLocalStorage(): ObservationNote[] {
  try {
    // For anonymous scope fall back to the legacy unscoped key.
    const raw = localRead(getCurrentKey()) ?? (_scopeUserId === null ? localRead(STORAGE_KEY) : null);
    if (!raw) return SERVER_OBSERVATIONS;
    return parseOrDefault(
      ObservationNotesArraySchema,
      JSON.parse(raw),
      SERVER_OBSERVATIONS,
      "observations",
    ) as ObservationNote[];
  } catch {
    return SERVER_OBSERVATIONS;
  }
}

function initializeIfNeeded(): void {
  if (!isBrowser() || isClientInitialized) return;
  isClientInitialized = true;
  currentObservations = readFromLocalStorage();
}

function writeToLocalStorage(notes: ObservationNote[]): void {
  localWrite(getCurrentKey(), JSON.stringify(notes));
}

function notifyListeners(): void {
  listeners.forEach((fn) => fn());
}

// ── Pub-sub ───────────────────────────────────────────────────────────────────

export function subscribeToObservations(callback: () => void): () => void {
  listeners.add(callback);
  return () => { listeners.delete(callback); };
}

// ── Snapshots ─────────────────────────────────────────────────────────────────

export function getObservations(): ObservationNote[] {
  initializeIfNeeded();
  return currentObservations;
}

export function getServerObservations(): ObservationNote[] {
  return SERVER_OBSERVATIONS;
}

// ── Write operations ──────────────────────────────────────────────────────────

export function addObservation(note: ObservationNote): void {
  initializeIfNeeded();
  currentObservations = [...currentObservations, note];
  writeToLocalStorage(currentObservations);
  notifyListeners();
}

export function updateObservation(updated: ObservationNote): void {
  initializeIfNeeded();
  currentObservations = currentObservations.map((n) =>
    n.id === updated.id ? updated : n
  );
  writeToLocalStorage(currentObservations);
  notifyListeners();
}

export function deleteObservation(id: string): void {
  initializeIfNeeded();
  currentObservations = currentObservations.filter((n) => n.id !== id);
  writeToLocalStorage(currentObservations);
  notifyListeners();
}

export function replaceObservations(notes: ObservationNote[]): void {
  currentObservations = notes;
  writeToLocalStorage(currentObservations);
  notifyListeners();
}

export function clearObservations(): void {
  if (!isBrowser()) return;
  localRemove(getCurrentKey());
  currentObservations = SERVER_OBSERVATIONS;
  notifyListeners();
}
