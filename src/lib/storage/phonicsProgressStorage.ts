/**
 * Phonics Progress Storage — Kindergarten Phonics Mode only.
 *
 * CRITICAL: this module is entirely separate from speechProgressStorage.ts.
 * Phonics attempts/sessions are NEVER stored in speech_progress.
 *
 * Storage key: PHONICS_PROGRESS:<userId>
 * Structure:   Record<childId, { attempts, sessions, updatedAt }>
 *
 * Architecture follows the stable-snapshot pattern used by speechProgressStorage
 * so it can be consumed by useSyncExternalStore without infinite loops.
 *
 * TODO (K6+): Supabase implementation via IPhonicsProgressRepository interface.
 */

import type { PhonicsAttempt, PhonicsSession, PhonicsProgress } from "@/types/phonics";
import {
  STORAGE_KEYS,
  getScopedStorageKey,
} from "@/lib/storage/storageKeys";
import { localRead, localWrite } from "@/lib/storage/local/localStorageClient";

const STORAGE_KEY = STORAGE_KEYS.PHONICS_PROGRESS;

// ── Scope ─────────────────────────────────────────────────────────────────────

let _userId: string | null = null;
let _activeChildId: string | null = null;

function getStoreKey(): string {
  return getScopedStorageKey(STORAGE_KEY, _userId);
}

// ── In-memory state ───────────────────────────────────────────────────────────

type ChildStore = { attempts: PhonicsAttempt[]; sessions: PhonicsSession[]; updatedAt: string };
type ProgressMap = Record<string, ChildStore>;

const EMPTY_STORE: ChildStore = { attempts: [], sessions: [], updatedAt: "" };

// Stable server-side snapshot (SSR always returns null)
const SERVER_PROGRESS: PhonicsProgress | null = null;

let _map: ProgressMap = {};
let _snapshot: PhonicsProgress | null = null;
let _initialized = false;

const _listeners = new Set<() => void>();

function _notify(): void {
  _listeners.forEach((fn) => fn());
}

function _isBrowser(): boolean {
  return typeof window !== "undefined";
}

function _readFromStorage(): ProgressMap {
  try {
    const raw = localRead(getStoreKey());
    if (!raw) return {};
    return JSON.parse(raw) as ProgressMap;
  } catch {
    return {};
  }
}

function _writeToStorage(): void {
  localWrite(getStoreKey(), JSON.stringify(_map));
}

function _rebuildSnapshot(): void {
  if (_activeChildId === null) {
    _snapshot = null;
    return;
  }
  const child = _map[_activeChildId] ?? EMPTY_STORE;
  _snapshot = {
    childId: _activeChildId,
    attempts: child.attempts,
    sessions: child.sessions,
    updatedAt: child.updatedAt,
  };
}

function _initIfNeeded(): void {
  if (!_isBrowser() || _initialized) return;
  _initialized = true;
  _map = _readFromStorage();
  _rebuildSnapshot();
}

// ── Stale session cleanup (>30 min active sessions are abandoned) ─────────────

const STALE_SESSION_MS = 30 * 60 * 1000;

function _cleanupStaleSessions(childStore: ChildStore): void {
  const now = Date.now();
  let changed = false;
  childStore.sessions = childStore.sessions.map((s) => {
    if (s.status !== "active") return s;
    if (now - new Date(s.startedAt).getTime() > STALE_SESSION_MS) {
      changed = true;
      return { ...s, status: "abandoned", endedAt: new Date().toISOString() };
    }
    return s;
  });
  if (changed) childStore.updatedAt = new Date().toISOString();
}

// ── Public API ────────────────────────────────────────────────────────────────

export function setScope(userId: string | null): void {
  if (userId === _userId && _initialized) return;
  _userId = userId;
  _initialized = false;
  _initIfNeeded();
  _rebuildSnapshot();
  _notify();
}

export function setActiveChild(childId: string | null): void {
  if (childId === _activeChildId) return;
  _activeChildId = childId;
  _initIfNeeded();
  _rebuildSnapshot();
  _notify();
}

export function subscribe(callback: () => void): () => void {
  _listeners.add(callback);
  return () => _listeners.delete(callback);
}

export function getProgress(): PhonicsProgress | null {
  _initIfNeeded();
  return _snapshot;
}

export function getServerProgress(): PhonicsProgress | null {
  return SERVER_PROGRESS;
}

// ── Session management ────────────────────────────────────────────────────────

export interface StartPhonicsSessionInput {
  childId: string;
  unitId: string;
  lessonId: string;
  totalItems: number;
}

export function startPhonicsSession(input: StartPhonicsSessionInput): PhonicsSession {
  if (!input.childId) throw new Error("[phonicsProgressStorage] childId must not be empty");
  _initIfNeeded();

  const childStore: ChildStore = _map[input.childId] ?? {
    attempts: [],
    sessions: [],
    updatedAt: new Date().toISOString(),
  };

  // Abandon any stale active sessions for this child + lesson
  _cleanupStaleSessions(childStore);
  childStore.sessions = childStore.sessions.map((s) =>
    s.status === "active" && s.unitId === input.unitId && s.lessonId === input.lessonId
      ? { ...s, status: "abandoned" as const, endedAt: new Date().toISOString() }
      : s,
  );

  const session: PhonicsSession = {
    id: `phonics-session-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    childId: input.childId,
    unitId: input.unitId,
    lessonId: input.lessonId,
    startedAt: new Date().toISOString(),
    completedItems: 0,
    totalItems: input.totalItems,
    averageScore: 0,
    starsEarned: 0,
    attemptIds: [],
    status: "active",
  };

  childStore.sessions = [...childStore.sessions, session];
  childStore.updatedAt = new Date().toISOString();
  _map = { ..._map, [input.childId]: childStore };

  if (_activeChildId === input.childId) _rebuildSnapshot();
  _writeToStorage();
  _notify();
  return session;
}

export function addPhonicsAttempt(attempt: PhonicsAttempt): void {
  if (!attempt.childId) return;
  _initIfNeeded();

  const childStore: ChildStore = _map[attempt.childId] ?? {
    attempts: [],
    sessions: [],
    updatedAt: new Date().toISOString(),
  };

  // Attach to active session if sessionId is provided
  let sessions = childStore.sessions;
  if (attempt.sessionId) {
    sessions = sessions.map((s) =>
      s.id === attempt.sessionId && s.status === "active"
        ? {
            ...s,
            attemptIds: [...s.attemptIds, attempt.id],
            completedItems: s.completedItems + 1,
          }
        : s,
    );
  }

  const updatedStore: ChildStore = {
    attempts: [...childStore.attempts, attempt],
    sessions,
    updatedAt: new Date().toISOString(),
  };
  _map = { ..._map, [attempt.childId]: updatedStore };

  if (_activeChildId === attempt.childId) _rebuildSnapshot();
  _writeToStorage();
  _notify();
}

export function completePhonicsSession(sessionId: string, childId: string): void {
  _initIfNeeded();
  const childStore = _map[childId];
  if (!childStore) return;

  const session = childStore.sessions.find((s) => s.id === sessionId);
  if (!session || session.status !== "active") return;

  // Compute average score from linked attempts
  const linkedAttempts = childStore.attempts.filter((a) =>
    session.attemptIds.includes(a.id),
  );
  const avgScore =
    linkedAttempts.length > 0
      ? Math.round(
          linkedAttempts.reduce((s, a) => s + a.score, 0) / linkedAttempts.length,
        )
      : 0;
  const totalStars = linkedAttempts.reduce((s, a) => s + a.starsEarned, 0);
  const now = new Date().toISOString();
  const durationMs =
    new Date(now).getTime() - new Date(session.startedAt).getTime();

  const completed: PhonicsSession = {
    ...session,
    status: "completed",
    endedAt: now,
    durationMs,
    averageScore: avgScore,
    starsEarned: totalStars,
    completedItems: linkedAttempts.length,
  };

  const updatedStore: ChildStore = {
    ...childStore,
    sessions: childStore.sessions.map((s) => (s.id === sessionId ? completed : s)),
    updatedAt: now,
  };
  _map = { ..._map, [childId]: updatedStore };

  if (_activeChildId === childId) _rebuildSnapshot();
  _writeToStorage();
  _notify();
}

// ── Summary helpers ───────────────────────────────────────────────────────────

/** Returns lesson IDs that have at least one completed session for this child. */
export function getCompletedLessonIds(childId: string): Set<string> {
  _initIfNeeded();
  const childStore = _map[childId];
  if (!childStore) return new Set();
  const ids = new Set<string>();
  childStore.sessions
    .filter((s) => s.status === "completed")
    .forEach((s) => ids.add(s.lessonId));
  return ids;
}
