import { STORAGE_KEYS } from "@/lib/storage/storageKeys";
import { localRead, localWrite, localRemove } from "@/lib/storage/local/localStorageClient";
import { ChildProfileDataSchema, parseOrNull } from "@/lib/validation";

const STORAGE_KEY = STORAGE_KEYS.PROFILE;

export interface ChildProfileData {
  id: string;
  name: string;
  age: number;
  targetSound: string;
  trainingGoal: string;
  createdAt: string;
  updatedAt: string;
}

// ── Stable snapshot pattern (same as speechProgressStorage) ──────────────────
//
// SERVER_PROFILE is always null — the server has no localStorage.
// currentProfile starts as null; after client init it holds the stored object
// or remains null if nothing is saved. Object.is(null, null) === true, so no
// spurious re-renders when the user has no profile.

const SERVER_PROFILE: ChildProfileData | null = null;
let currentProfile: ChildProfileData | null = null;
let isClientInitialized = false;

const listeners = new Set<() => void>();

function isBrowser(): boolean {
  return typeof window !== "undefined";
}

function readFromLocalStorage(): ChildProfileData | null {
  try {
    const raw = localRead(STORAGE_KEY);
    if (!raw) return null;
    return parseOrNull(
      ChildProfileDataSchema,
      JSON.parse(raw),
      "profile",
    ) as ChildProfileData | null;
  } catch {
    return null;
  }
}

function initializeIfNeeded(): void {
  if (!isBrowser() || isClientInitialized) return;
  isClientInitialized = true;
  currentProfile = readFromLocalStorage();
}

function notifyListeners(): void {
  listeners.forEach((fn) => fn());
}

export function subscribeToProfile(callback: () => void): () => void {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

export function getProfile(): ChildProfileData | null {
  initializeIfNeeded();
  return currentProfile;
}

export function getServerProfile(): ChildProfileData | null {
  return SERVER_PROFILE;
}

export function saveProfile(profile: ChildProfileData): void {
  currentProfile = profile;
  localWrite(STORAGE_KEY, JSON.stringify(profile));
  notifyListeners();
}

export function clearProfile(): void {
  if (!isBrowser()) return;
  localRemove(STORAGE_KEY);
  currentProfile = null;
  notifyListeners();
}

export function replaceProfile(profile: ChildProfileData): void {
  currentProfile = profile;
  localWrite(STORAGE_KEY, JSON.stringify(profile));
  notifyListeners();
}
