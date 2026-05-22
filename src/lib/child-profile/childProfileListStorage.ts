import {
  STORAGE_KEYS,
  getScopedStorageKey,
} from "@/lib/storage/storageKeys";
import { localRead, localWrite, localRemove } from "@/lib/storage/local/localStorageClient";
import { ChildProfileDataSchema, parseOrNull } from "@/lib/validation";
import type { ChildProfileData } from "./childProfileStorage";

// ── Stable server snapshots ────────────────────────────────────────────────────
const SERVER_PROFILES: ChildProfileData[] = [];
const SERVER_SELECTED_ID: string | null = null;

// ── Module state ───────────────────────────────────────────────────────────────
let _scopeUserId: string | null = null;
let _profiles: ChildProfileData[] = [];
let _selectedChildId: string | null = null;
let _selectedProfile: ChildProfileData | null = null;
let _initialized = false;

const _listeners = new Set<() => void>();

// ── Key helpers ────────────────────────────────────────────────────────────────

function _profilesKey(): string {
  return getScopedStorageKey(STORAGE_KEYS.PROFILES_LIST, _scopeUserId);
}

function _selectedKey(): string {
  return getScopedStorageKey(STORAGE_KEYS.SELECTED_CHILD_ID, _scopeUserId);
}

function _isBrowser(): boolean {
  return typeof window !== "undefined";
}

function _notify(): void {
  _listeners.forEach((fn) => fn());
}

// ── Keep the selected-profile reference stable ─────────────────────────────────
function _syncSelectedProfile(): void {
  const found =
    _profiles.find((p) => p.id === _selectedChildId) ??
    _profiles[0] ??
    null;
  _selectedProfile = found;
}

// ── Persistence helpers ───────────────────────────────────────────────────────

function _readProfiles(): ChildProfileData[] {
  try {
    const raw = localRead(_profilesKey());
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is ChildProfileData =>
        parseOrNull(ChildProfileDataSchema, item, "profiles-list") !== null,
    );
  } catch {
    return [];
  }
}

function _writeProfiles(profiles: ChildProfileData[]): void {
  localWrite(_profilesKey(), JSON.stringify(profiles));
}

// ── Migration from single-profile storage ─────────────────────────────────────
// If the profiles list is empty but the legacy single-profile key has data,
// migrate that one profile into the list and auto-select it.
function _tryMigrateFromLegacy(): void {
  if (_profiles.length > 0) return;
  const legacyKey = getScopedStorageKey(STORAGE_KEYS.PROFILE, _scopeUserId);
  const legacyRaw = localRead(legacyKey);
  if (!legacyRaw) return;
  try {
    const legacy = parseOrNull(
      ChildProfileDataSchema,
      JSON.parse(legacyRaw),
      "profile-migration",
    ) as ChildProfileData | null;
    if (legacy) {
      _profiles = [legacy];
      _selectedChildId = legacy.id;
      _writeProfiles(_profiles);
      localWrite(_selectedKey(), legacy.id);
    }
  } catch {
    // migration failed silently
  }
}

// ── Initialization ─────────────────────────────────────────────────────────────

function _initializeIfNeeded(): void {
  if (!_isBrowser() || _initialized) return;
  _initialized = true;
  _profiles = _readProfiles();
  const storedSelected = localRead(_selectedKey());
  _selectedChildId = storedSelected ?? null;
  _tryMigrateFromLegacy();
  // Auto-select first profile when nothing is selected yet
  if (!_selectedChildId && _profiles.length > 0) {
    _selectedChildId = _profiles[0].id;
    localWrite(_selectedKey(), _selectedChildId);
  }
  _syncSelectedProfile();
}

// ── Scope management (called by LocalProfileRepository.setScope) ───────────────

export function setListScope(userId: string | null): void {
  if (userId === _scopeUserId && _initialized) return;
  _scopeUserId = userId;
  _initialized = false;
  _profiles = [];
  _selectedChildId = null;
  _selectedProfile = null;
  _initializeIfNeeded();
  _notify();
}

// ── Pub/sub ────────────────────────────────────────────────────────────────────

export function subscribeToProfileList(callback: () => void): () => void {
  _listeners.add(callback);
  return () => {
    _listeners.delete(callback);
  };
}

// ── Read operations (useSyncExternalStore) ─────────────────────────────────────

export function getSelectedProfile(): ChildProfileData | null {
  _initializeIfNeeded();
  return _selectedProfile;
}

export function getServerSelectedProfile(): ChildProfileData | null {
  return SERVER_SELECTED_ID as null; // always null on server
}

export function getProfiles(): ChildProfileData[] {
  _initializeIfNeeded();
  return _profiles;
}

export function getServerProfiles(): ChildProfileData[] {
  return SERVER_PROFILES;
}

export function getSelectedChildId(): string | null {
  _initializeIfNeeded();
  return _selectedChildId;
}

// ── Write operations ───────────────────────────────────────────────────────────

/** Add or update a profile in the list. Auto-selects if it is the first profile. */
export function saveProfileToList(profile: ChildProfileData): void {
  _initializeIfNeeded();
  const idx = _profiles.findIndex((p) => p.id === profile.id);
  if (idx >= 0) {
    _profiles = _profiles.map((p, i) => (i === idx ? profile : p));
  } else {
    _profiles = [..._profiles, profile];
  }
  // Auto-select when adding the first profile
  if (_profiles.length === 1 || !_selectedChildId) {
    _selectedChildId = profile.id;
    localWrite(_selectedKey(), profile.id);
  }
  _writeProfiles(_profiles);
  _syncSelectedProfile();
  _notify();
}

/** Switch the active child. Triggers profile and progress context re-render. */
export function setSelectedChildId(id: string): void {
  if (_selectedChildId === id) return;
  _selectedChildId = id;
  localWrite(_selectedKey(), id);
  _syncSelectedProfile();
  _notify();
}

/** Remove all profiles and selection (called on clearProfile or data reset). */
export function clearAllProfiles(): void {
  if (!_isBrowser()) return;
  localRemove(_profilesKey());
  localRemove(_selectedKey());
  _profiles = [];
  _selectedChildId = null;
  _selectedProfile = null;
  _notify();
}
