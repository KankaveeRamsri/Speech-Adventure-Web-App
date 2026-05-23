import type { ChildAccess } from "@/types/childAccess";
import { STORAGE_KEYS } from "@/lib/storage/storageKeys";
import { localRead, localWrite } from "@/lib/storage/local/localStorageClient";
import { z } from "zod";
import { parseOrDefault } from "@/lib/validation";

// ── Unscoped shared storage ────────────────────────────────────────────────────
//
// Child access grants use a single, unscoped localStorage key so that both the
// grantor and grantee on the same device see the same grants array. _currentUserId
// is used only for read-time filtering; it does NOT change the storage key.

const STORAGE_KEY = STORAGE_KEYS.CHILD_GRANTS;

// ── Zod schema ─────────────────────────────────────────────────────────────────

const ChildPermissionsSchema = z.object({
  canViewProgress: z.boolean(),
  canViewAudio: z.boolean(),
  canAssignPractice: z.boolean(),
  canEditChild: z.boolean(),
  canExportReport: z.boolean(),
});

const ChildSnapshotSchema = z.object({
  id: z.string(),
  name: z.string(),
  age: z.number(),
  targetSound: z.string().default(""),
  trainingGoal: z.string().default(""),
  createdAt: z.string().default(""),
  updatedAt: z.string().default(""),
});

const ChildAccessSchema = z.object({
  id: z.string().min(1),
  childId: z.string().min(1),
  userId: z.string().min(1),
  role: z.enum(["guardian", "teacher", "therapist", "viewer"]),
  permissions: ChildPermissionsSchema,
  grantedBy: z.string().min(1),
  createdAt: z.string(),
  revokedAt: z.string().optional(),
  childSnapshot: ChildSnapshotSchema.optional(),
});

const ChildAccessArraySchema = z.array(ChildAccessSchema);

// ── Stable server / empty snapshots ───────────────────────────────────────────
//
// IMPORTANT: useSyncExternalStore uses Object.is() to compare getSnapshot()
// return values. These constants must never be recreated — always returned as-is
// so React does not see a "changed" snapshot and trigger an infinite render loop.

const SERVER_GRANTS: ChildAccess[] = [];
const EMPTY_RECEIVED: ChildAccess[] = [];
const EMPTY_ISSUED: ChildAccess[] = [];

// ── Module state ───────────────────────────────────────────────────────────────

let _currentUserId: string | null = null;
let _allGrants: ChildAccess[] = SERVER_GRANTS;
let _isInitialized = false;

// Cached, stable filtered snapshots.
// Only replaced (new array reference) when the underlying data actually changes.
// getReceivedGrants() / getIssuedGrants() return these directly — no filter in
// the render path — so Object.is() is stable between renders.
let _receivedSnapshot: ChildAccess[] = EMPTY_RECEIVED;
let _issuedSnapshot: ChildAccess[] = EMPTY_ISSUED;

const _listeners = new Set<() => void>();

function _isBrowser(): boolean {
  return typeof window !== "undefined";
}

// Recompute both filtered snapshots from the current _allGrants + _currentUserId.
// Called before _notify() so listeners always read the freshly-computed result.
function _recomputeSnapshots(): void {
  if (!_currentUserId) {
    _receivedSnapshot = EMPTY_RECEIVED;
    _issuedSnapshot = EMPTY_ISSUED;
    return;
  }
  _receivedSnapshot = _allGrants.filter(
    (g) => g.userId === _currentUserId && !g.revokedAt,
  );
  _issuedSnapshot = _allGrants.filter(
    (g) => g.grantedBy === _currentUserId,
  );
}

function _notify(): void {
  _listeners.forEach((fn) => fn());
}

function _readFromStorage(): ChildAccess[] {
  try {
    const raw = localRead(STORAGE_KEY);
    if (!raw) return SERVER_GRANTS;
    return parseOrDefault(
      ChildAccessArraySchema,
      JSON.parse(raw),
      SERVER_GRANTS,
      "child-grants",
    ) as ChildAccess[];
  } catch {
    return SERVER_GRANTS;
  }
}

function _initializeIfNeeded(): void {
  if (!_isBrowser() || _isInitialized) return;
  _isInitialized = true;
  _allGrants = _readFromStorage();
  _recomputeSnapshots();
}

function _writeToStorage(grants: ChildAccess[]): void {
  localWrite(STORAGE_KEY, JSON.stringify(grants));
}

// ── Scope ──────────────────────────────────────────────────────────────────────

export function setScope(userId: string | null): void {
  _currentUserId = userId;
  _initializeIfNeeded();
  _recomputeSnapshots();
  _notify();
}

// ── Pub-sub ────────────────────────────────────────────────────────────────────

export function subscribeToChildAccess(callback: () => void): () => void {
  _listeners.add(callback);
  return () => { _listeners.delete(callback); };
}

// ── Read snapshots ─────────────────────────────────────────────────────────────

export function getReceivedGrants(): ChildAccess[] {
  _initializeIfNeeded();
  return _receivedSnapshot;
}

export function getServerReceivedGrants(): ChildAccess[] {
  return SERVER_GRANTS;
}

export function getIssuedGrants(): ChildAccess[] {
  _initializeIfNeeded();
  return _issuedSnapshot;
}

// ── Write operations ───────────────────────────────────────────────────────────

export function addGrant(grant: ChildAccess): void {
  _initializeIfNeeded();
  _allGrants = [..._allGrants, grant];
  _writeToStorage(_allGrants);
  _recomputeSnapshots();
  _notify();
}

export function updateGrant(updated: ChildAccess): void {
  _initializeIfNeeded();
  _allGrants = _allGrants.map((g) => (g.id === updated.id ? updated : g));
  _writeToStorage(_allGrants);
  _recomputeSnapshots();
  _notify();
}

export function generateId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}
