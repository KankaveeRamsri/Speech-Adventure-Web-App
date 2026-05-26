import type { Invitation } from "@/types/invitations";
import { INVITATION_EXPIRY_DAYS } from "@/types/invitations";
import {
  STORAGE_KEYS,
  getScopedStorageKey,
  getLegacyClaimedFlagKey,
} from "@/lib/storage/storageKeys";
import { localRead, localWrite, localRemove } from "@/lib/storage/local/localStorageClient";
import { z } from "zod";
import { parseOrDefault } from "@/lib/validation";

const STORAGE_KEY = STORAGE_KEYS.INVITATIONS;

// ── Zod schema ────────────────────────────────────────────────────────────────

const InvitationSchema = z.object({
  id: z.string().min(1),
  email: z.string(),
  role: z.enum(["parent", "teacher", "therapist", "school_admin", "viewer"]),
  childId: z.string().optional(),
  invitedBy: z.string(),
  status: z.enum(["pending", "accepted", "expired", "revoked"]),
  token: z.string(),
  expiresAt: z.string(),
  createdAt: z.string(),
  acceptedAt: z.string().optional(),
  acceptedBy: z.string().optional(),
  inviterEmail: z.string().optional(),
  childSnapshot: z.object({
    id: z.string(),
    name: z.string(),
    age: z.number(),
    targetSound: z.string().default(""),
    trainingGoal: z.string().default(""),
    createdAt: z.string().default(""),
    updatedAt: z.string().default(""),
  }).optional(),
});

const InvitationsArraySchema = z.array(InvitationSchema);

// ── Stable snapshot pattern ───────────────────────────────────────────────────

const SERVER_INVITATIONS: Invitation[] = [];
let currentInvitations: Invitation[] = SERVER_INVITATIONS;
let isClientInitialized = false;

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

function readFromLocalStorage(): Invitation[] {
  try {
    const raw =
      localRead(getCurrentKey()) ??
      (_scopeUserId === null ? localRead(STORAGE_KEY) : null);
    if (!raw) return SERVER_INVITATIONS;
    return parseOrDefault(
      InvitationsArraySchema,
      JSON.parse(raw),
      SERVER_INVITATIONS,
      "invitations",
    ) as Invitation[];
  } catch {
    return SERVER_INVITATIONS;
  }
}

function initializeIfNeeded(): void {
  if (!isBrowser() || isClientInitialized) return;
  isClientInitialized = true;
  currentInvitations = readFromLocalStorage();
}

function writeToLocalStorage(invitations: Invitation[]): void {
  localWrite(getCurrentKey(), JSON.stringify(invitations));
}

function notifyListeners(): void {
  listeners.forEach((fn) => fn());
}

// ── Pub-sub ───────────────────────────────────────────────────────────────────

export function subscribeToInvitations(callback: () => void): () => void {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

// ── Snapshots ─────────────────────────────────────────────────────────────────

export function getInvitations(): Invitation[] {
  initializeIfNeeded();
  return currentInvitations;
}

export function getServerInvitations(): Invitation[] {
  return SERVER_INVITATIONS;
}

// ── Expiry helpers ────────────────────────────────────────────────────────────

function markExpiredInPlace(invitations: Invitation[]): Invitation[] {
  const now = Date.now();
  return invitations.map((inv) => {
    if (inv.status === "pending" && new Date(inv.expiresAt).getTime() < now) {
      return { ...inv, status: "expired" as const };
    }
    return inv;
  });
}

// ── Write operations ──────────────────────────────────────────────────────────

export function addInvitation(invitation: Invitation): void {
  initializeIfNeeded();
  currentInvitations = [...currentInvitations, invitation];
  writeToLocalStorage(currentInvitations);
  notifyListeners();
}

export function updateInvitation(updated: Invitation): void {
  initializeIfNeeded();
  currentInvitations = currentInvitations.map((inv) =>
    inv.id === updated.id ? updated : inv,
  );
  writeToLocalStorage(currentInvitations);
  notifyListeners();
}

export function clearInvitations(): void {
  if (!isBrowser()) return;
  localRemove(getCurrentKey());
  currentInvitations = SERVER_INVITATIONS;
  notifyListeners();
}

// ── Token helpers ─────────────────────────────────────────────────────────────

export function findByToken(token: string): Invitation | null {
  initializeIfNeeded();
  const refreshed = markExpiredInPlace(currentInvitations);
  if (refreshed !== currentInvitations) {
    currentInvitations = refreshed;
    writeToLocalStorage(currentInvitations);
    notifyListeners();
  }
  return currentInvitations.find((inv) => inv.token === token) ?? null;
}

export function generateToken(): string {
  // Use crypto.randomUUID for a well-randomized token embedded in accept links.
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  // Fallback for environments without crypto.randomUUID
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

export function makeExpiresAt(): string {
  const d = new Date();
  d.setDate(d.getDate() + INVITATION_EXPIRY_DAYS);
  return d.toISOString();
}
