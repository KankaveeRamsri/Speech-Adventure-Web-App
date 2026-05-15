const STORAGE_KEY = "speech-adventure-profile-v1";

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
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ChildProfileData;
    if (!parsed || typeof parsed.name !== "string") return null;
    return parsed;
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
  if (isBrowser()) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    } catch { /* ignore */ }
  }
  notifyListeners();
}

export function clearProfile(): void {
  if (!isBrowser()) return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch { /* ignore */ }
  currentProfile = null;
  notifyListeners();
}
