import type { ObservationNote } from "@/types/observations";

const STORAGE_KEY = "speech-adventure-observations-v1";

// ── Stable snapshot pattern (matches speechProgressStorage / childProfileStorage) ─

const SERVER_OBSERVATIONS: ObservationNote[] = [];
let currentObservations: ObservationNote[] = SERVER_OBSERVATIONS;
let isClientInitialized = false;

const listeners = new Set<() => void>();

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function readFromLocalStorage(): ObservationNote[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return SERVER_OBSERVATIONS;
    const parsed = JSON.parse(raw) as ObservationNote[];
    if (!Array.isArray(parsed)) return SERVER_OBSERVATIONS;
    return parsed;
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
  if (!isBrowser()) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  } catch { /* ignore */ }
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
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch { /* ignore */ }
  currentObservations = SERVER_OBSERVATIONS;
  notifyListeners();
}
