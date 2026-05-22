import type {
  IProgressRepository,
  StartSessionInput,
} from "@/lib/repositories/IProgressRepository";
import type {
  SpeechProgress,
  PracticeAttempt,
  PracticeSession,
} from "@/types/speechAdventure";
import type { SupabaseClient } from "@/lib/supabase/client";
import type { Database } from "@/types/supabase";
import {
  dbToDomainAttempt,
  dbToDomainSession,
  domainToDbAttempt,
  domainToDbSession,
} from "./mappers";
import { QueryError, warnRepo } from "./errors";
import { localRead, localWrite, localRemove } from "@/lib/storage/local/localStorageClient";
import { STORAGE_KEYS } from "@/lib/storage/storageKeys";
import { SpeechProgressSchema, parseOrNull } from "@/lib/validation";

// ── Pending-clear marker ──────────────────────────────────────────────────────
// When clearProgress() is called, this key is written with the child's Supabase
// UUID. _hydrate() on the next page load detects the marker and retries the
// Supabase DELETE before using fetched data, so old progress never reappears even
// if the page was refreshed before the original DELETE completed.
// The key is NOT in storageKeys.STORAGE_KEYS / DATA_KEYS — it is an internal
// implementation detail of this repository and must survive clearAllData().
const PROGRESS_CLEAR_PENDING_KEY = "speech-adventure-progress-clear-pending";

// ── UUID guard ────────────────────────────────────────────────────────────────
// Local session ids (e.g. "session-1748...") must never reach Supabase UUID columns.
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function isValidUuid(value: string): boolean {
  return UUID_RE.test(value);
}

// ── Stable server snapshots (SSR has no Supabase session) ─────────────────────
const DEFAULT_CHILD_ID = "";
const DEFAULT_TARGET_SOUND = "ก";
const DEFAULT_SOUND_ID = "ก";

const SERVER_PROGRESS: SpeechProgress = {
  childId: DEFAULT_CHILD_ID,
  targetSound: DEFAULT_TARGET_SOUND,
  attempts: [],
  sessions: [],
  updatedAt: "",
};

/**
 * Supabase-backed implementation of IProgressRepository.
 *
 * Cache strategy (mirrors the stable-snapshot pattern from speechProgressStorage):
 *  • `_progress` cache starts as SERVER_PROGRESS; hydrated on first subscribe()
 *  • `_selectedSoundId` defaults to "ก"; updated from child_profiles on hydration
 *  • Both caches are replaced with new object references on every mutation so
 *    useSyncExternalStore detects changes via Object.is()
 *
 * Hydration flow:
 *  1. subscribe() → _triggerHydrate() (once per instance)
 *  2. _hydrate() fetches child_profiles, practice_sessions, practice_attempts in parallel
 *  3. Cache is populated → listeners notified → React re-renders with real data
 *
 * TODO (Phase 26 activation):
 *  - Replace localStorage placeholder "child-001" IDs with real Supabase UUIDs
 *    before calling addAttempt / startSession with domain objects from localStorage
 *  - Wire this repository into RepositoryProvider via createSupabaseRepositories()
 *    once NEXT_PUBLIC_STORAGE_BACKEND=supabase is set
 */
export class SupabaseProgressRepository implements IProgressRepository {
  // Progress cache (stable snapshot)
  private _progress: SpeechProgress = SERVER_PROGRESS;

  // Selected sound cache
  private _selectedSoundId = DEFAULT_SOUND_ID;

  // Child profile UUID — populated during hydration, used for writes
  private _childId: string | null = null;

  // Listener sets (separate for progress and sound — mirrors local storage)
  private readonly _progressListeners = new Set<() => void>();
  private readonly _soundListeners = new Set<() => void>();

  // Hydration state
  private _hydrated = false;
  private _hydratePromise: Promise<void> | null = null;
  // Incremented by rehydrate() to invalidate any in-flight _hydrate() call
  private _hydrateGen = 0;

  constructor(private readonly client: SupabaseClient<Database>) {}

  // ── useSyncExternalStore — progress ──────────────────────────────────────

  getProgress(): SpeechProgress {
    return this._progress;
  }

  getServerProgress(): SpeechProgress {
    return SERVER_PROGRESS;
  }

  subscribe(callback: () => void): () => void {
    this._progressListeners.add(callback);
    this._triggerHydrate();

    return () => {
      this._progressListeners.delete(callback);
    };
  }

  // ── useSyncExternalStore — selected sound ─────────────────────────────────

  getSelectedSoundId(): string {
    return this._selectedSoundId;
  }

  getServerSoundId(): string {
    return DEFAULT_SOUND_ID;
  }

  subscribeToSelectedSound(callback: () => void): () => void {
    this._soundListeners.add(callback);
    this._triggerHydrate();

    return () => {
      this._soundListeners.delete(callback);
    };
  }

  // ── Write — attempts ──────────────────────────────────────────────────────

  async addAttempt(attempt: PracticeAttempt): Promise<SpeechProgress> {
    // Optimistic update first so the UI is responsive regardless of DB outcome.
    const next: SpeechProgress = {
      ...this._progress,
      attempts: [...this._progress.attempts, attempt],
      updatedAt: new Date().toISOString(),
    };
    this._setProgress(next);

    // Resolve the Supabase UUID for child_profiles.id.
    // attempt.childId may be a localStorage placeholder ("child-001") — never
    // pass that to a UUID column.
    const childId = await this._requireChildId();
    if (!childId) {
      warnRepo(
        "SupabaseProgressRepository.addAttempt",
        "no Supabase child_id — attempt saved to cache only",
      );
      return this._progress;
    }

    const { error } = await this.client
      .from("practice_attempts")
      .insert({ ...domainToDbAttempt(attempt), child_id: childId });

    if (error) {
      warnRepo("SupabaseProgressRepository.addAttempt", new QueryError("practice_attempts", "insert", error));
      // Revert optimistic update
      this._setProgress({
        ...next,
        attempts: next.attempts.filter((a) => a.id !== attempt.id),
        updatedAt: this._progress.updatedAt,
      });
    }

    return this._progress;
  }

  async replaceProgress(progress: SpeechProgress): Promise<void> {
    this._setProgress(progress);

    // Always use the hydrated Supabase UUID — progress.childId may be a
    // localStorage placeholder ("child-001") that is not a valid DB UUID.
    const childId = await this._requireChildId();
    if (!childId) {
      warnRepo("SupabaseProgressRepository.replaceProgress", "no Supabase child_id — cache updated only");
      return;
    }

    // Delete then re-insert — used for import/restore only
    const [delAttempts, delSessions] = await Promise.all([
      this.client.from("practice_attempts").delete().eq("child_id", childId),
      this.client.from("practice_sessions").delete().eq("child_id", childId),
    ]);

    if (delAttempts.error) warnRepo("replaceProgress.deleteAttempts", delAttempts.error);
    if (delSessions.error) warnRepo("replaceProgress.deleteSessions", delSessions.error);

    const [insAttempts, insSessions] = await Promise.all([
      progress.attempts.length > 0
        ? this.client
            .from("practice_attempts")
            .insert(progress.attempts.map((a) => ({ ...domainToDbAttempt(a), child_id: childId })))
        : Promise.resolve({ error: null }),
      progress.sessions.length > 0
        ? this.client
            .from("practice_sessions")
            .insert(progress.sessions.map((s) => ({ ...domainToDbSession(s), child_id: childId })))
        : Promise.resolve({ error: null }),
    ]);

    if (insAttempts.error) warnRepo("replaceProgress.insertAttempts", insAttempts.error);
    if (insSessions.error) warnRepo("replaceProgress.insertSessions", insSessions.error);
  }

  async clearProgress(): Promise<void> {
    // (A) Capture childId BEFORE touching the generation counter.
    //     _hydrateGen++ may abort an in-flight _hydrate() before it reaches
    //     `this._childId = profile.id`, leaving _childId null.  Capturing here
    //     ensures we always have the UUID even if hydration is mid-flight.
    //     _progress.childId is also a Supabase UUID when set by _hydrate().
    const capturedChildId =
      this._childId ??
      (isValidUuid(this._progress.childId) ? this._progress.childId : null);

    if (process.env.NODE_ENV !== "production") {
      console.debug("[SupabaseProgressRepository] clearProgress: capturedChildId =", capturedChildId);
    }

    // (B) Invalidate any in-flight _hydrate() so it cannot write stale Supabase
    //     data back over the cleared state (race-condition guard).
    //     _hydratePromise is intentionally NOT nulled here — keeping it non-null
    //     prevents _triggerHydrate() (called on every re-subscribe) from starting
    //     a NEW hydration during the async DELETEs below.
    this._hydrateGen++;

    const cleared: SpeechProgress = {
      ...SERVER_PROGRESS,
      childId: this._progress.childId,
      targetSound: this._progress.targetSound,
      updatedAt: new Date().toISOString(),
    };
    this._setProgress(cleared);

    // (C) Remove localStorage fallback so the offline-fallback path in _hydrate()
    //     cannot restore old data.
    localRemove(STORAGE_KEYS.PROGRESS);

    // Use the pre-captured UUID first; fall back to one-shot fetch only if null.
    const childId = capturedChildId ?? (await this._requireChildId());
    if (!childId) {
      warnRepo("clearProgress", "no child_id — Supabase DELETE skipped");
      return;
    }

    // (D) Write marker BEFORE the DELETE so that if the page is refreshed before
    //     the DELETE completes, _hydrate() on the next load detects the marker
    //     and retries the DELETE itself, preventing old progress from reappearing.
    localWrite(PROGRESS_CLEAR_PENDING_KEY, childId);

    if (process.env.NODE_ENV !== "production") {
      console.debug("[SupabaseProgressRepository] clearProgress: deleting rows for child_id =", childId);
    }

    const [delAttempts, delSessions] = await Promise.all([
      this.client.from("practice_attempts").delete({ count: "exact" }).eq("child_id", childId),
      this.client.from("practice_sessions").delete({ count: "exact" }).eq("child_id", childId),
    ]);

    if (process.env.NODE_ENV !== "production") {
      console.debug(
        "[SupabaseProgressRepository] clearProgress: deleted",
        delAttempts.count ?? 0, "attempt(s) and",
        delSessions.count ?? 0, "session(s).",
        "attempt error:", delAttempts.error,
        "session error:", delSessions.error,
      );
    }

    if (delAttempts.error) {
      warnRepo("clearProgress.deleteAttempts", new QueryError("practice_attempts", "delete", delAttempts.error));
      // Keep marker — _hydrate() on the next load will retry.
      return;
    }
    if (delSessions.error) {
      warnRepo("clearProgress.deleteSessions", new QueryError("practice_sessions", "delete", delSessions.error));
      return;
    }

    // (E) Both DELETEs confirmed successful — remove the pending marker and
    //     trigger a fresh rehydrate so the UI re-fetches and confirms empty state.
    localRemove(PROGRESS_CLEAR_PENDING_KEY);

    // Allow a new _hydrate() to start now that the DELETE is confirmed complete.
    // This is safe: _hydratePromise is nulled here (not earlier) so no hydration
    // could have snuck in during the async DELETEs above.
    this._hydrated = false;
    this._hydratePromise = null;
    this._childId = null;
    this._hydrateGen++;
    this._triggerHydrate();
  }

  /**
   * Clears progress for the active child scoped to the repository instance.
   * The childId parameter is used as a non-empty guard only — Supabase operations
   * always use the hydrated UUID from this._childId (never the localStorage
   * placeholder that may arrive as childId from the UI layer).
   */
  async clearProgressForChild(childId: string): Promise<void> {
    if (!childId) {
      if (process.env.NODE_ENV !== "production") {
        console.warn(
          "[SupabaseProgressRepository] clearProgressForChild: childId is empty — skipped",
        );
      }
      return;
    }
    await this.clearProgress();
  }

  // ── Session management ────────────────────────────────────────────────────

  async startSession(input: StartSessionInput): Promise<PracticeSession> {
    const now = new Date().toISOString();
    const newSession: PracticeSession = {
      // Generate a temporary client-side ID — the DB will assign a UUID on insert.
      // TODO (Phase 26 activation): use the DB-returned id instead of this placeholder.
      id: `session-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      childId: input.childId,
      targetSound: input.targetSound,
      stageId: input.stageId,
      startedAt: now,
      completedMissions: 0,
      totalMissions: input.totalMissions,
      averageScore: 0,
      starsEarned: 0,
      attemptIds: [],
      status: "active",
    };

    const next: SpeechProgress = {
      ...this._progress,
      sessions: [...this._progress.sessions, newSession],
      updatedAt: now,
    };
    this._setProgress(next);

    // Resolve Supabase UUID — input.childId may be "child-001".
    const childId = await this._requireChildId();
    if (!childId) {
      warnRepo(
        "SupabaseProgressRepository.startSession",
        "no Supabase child_id — session saved to cache only",
      );
      return newSession;
    }

    const { data, error } = await this.client
      .from("practice_sessions")
      .insert({ ...domainToDbSession(newSession), child_id: childId })
      .select("id")
      .single();

    if (error) {
      warnRepo("SupabaseProgressRepository.startSession", new QueryError("practice_sessions", "insert", error));
      // Revert
      this._setProgress({
        ...next,
        sessions: next.sessions.filter((s) => s.id !== newSession.id),
      });
      return newSession;
    }

    // Patch the session with the DB-assigned UUID
    if (data?.id && data.id !== newSession.id) {
      const patched: PracticeSession = { ...newSession, id: data.id };
      this._setProgress({
        ...this._progress,
        sessions: this._progress.sessions.map((s) =>
          s.id === newSession.id ? patched : s,
        ),
      });
      return patched;
    }

    return newSession;
  }

  async completeSession(sessionId: string): Promise<PracticeSession | null> {
    return this._updateSessionStatus(sessionId, "completed");
  }

  async abandonSession(sessionId: string): Promise<PracticeSession | null> {
    return this._updateSessionStatus(sessionId, "abandoned");
  }

  getActiveSession(stageId: string): PracticeSession | null {
    return (
      this._progress.sessions.find(
        (s) => s.stageId === stageId && s.status === "active",
      ) ?? null
    );
  }

  // ── Selected sound ────────────────────────────────────────────────────────

  async setSelectedSoundId(id: string): Promise<void> {
    this._selectedSoundId = id;
    this._notifySound();

    // If _childId is null (hydration ran before the profile was created), do a
    // one-shot fetch — covers the first save-then-navigate-to-training scenario.
    if (!this._childId) {
      const { data } = await this.client
        .from("child_profiles")
        .select("id")
        .limit(1)
        .maybeSingle();
      if (data?.id) this._childId = data.id;
    }

    const childId = this._childId;
    if (!childId) {
      warnRepo("SupabaseProgressRepository.setSelectedSoundId", "no childId — sound updated in cache only");
      return;
    }

    const { error } = await this.client
      .from("child_profiles")
      .update({ selected_sound_id: id })
      .eq("id", childId);

    if (error) {
      warnRepo("SupabaseProgressRepository.setSelectedSoundId", new QueryError("child_profiles", "update", error));
    }
  }

  // ── Session boundary (called by RepositoryProvider on auth state change) ────

  /**
   * Clears the in-memory cache immediately and notifies subscribers.
   * Called on sign-out or before rehydrating a different user.
   * Does NOT trigger a new fetch — call rehydrate() after if needed.
   */
  public reset(): void {
    if (process.env.NODE_ENV !== "production") {
      console.debug("[SupabaseProgressRepository] reset — clearing cache");
    }
    // Invalidate any in-flight _hydrate() so it cannot overwrite the cleared state
    this._hydrateGen++;
    this._hydrated = false;
    this._hydratePromise = null;
    this._childId = null;
    this._progress = SERVER_PROGRESS; // stable empty snapshot
    this._selectedSoundId = DEFAULT_SOUND_ID;
    this._notifyProgress();
    this._notifySound();
  }

  /**
   * Resets hydration state and re-fetches from Supabase.
   * Safe to call multiple times — generation counter prevents stale writes.
   */
  public rehydrate(): void {
    if (process.env.NODE_ENV !== "production") {
      console.debug("[SupabaseProgressRepository] rehydrate triggered");
    }
    this._hydrated = false;
    this._hydratePromise = null;
    this._childId = null;
    this._hydrateGen++;
    this._triggerHydrate();
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  private _setProgress(progress: SpeechProgress): void {
    this._progress = progress;
    this._notifyProgress();
  }

  private _notifyProgress(): void {
    this._progressListeners.forEach((cb) => cb());
  }

  private _notifySound(): void {
    this._soundListeners.forEach((cb) => cb());
  }

  private _triggerHydrate(): void {
    if (this._hydratePromise) return;
    this._hydratePromise = this._hydrate().catch((err) => {
      warnRepo("SupabaseProgressRepository._hydrate", err);
    });
  }

  private async _hydrate(): Promise<void> {
    const myGen = this._hydrateGen;

    // Step 1: get child profile (needed for child_id + selected_sound_id + target_sound)
    const { data: profile, error: profileError } = await this.client
      .from("child_profiles")
      .select("id, selected_sound_id, target_sound")
      .limit(1)
      .maybeSingle();

    // Bail if a newer rehydrate() superseded us
    if (this._hydrateGen !== myGen) return;

    if (profileError) {
      warnRepo("SupabaseProgressRepository._hydrate (child_profiles)", new QueryError("child_profiles", "select", profileError));
      // Fallback to localStorage so the training map isn't blank when Supabase is unreachable
      const local = this._readLocalProgress();
      if (local) {
        if (process.env.NODE_ENV !== "production") {
          console.debug("[SupabaseProgressRepository] cloud error — falling back to localStorage");
        }
        this._progress = local;
        this._notifyProgress();
      }
      this._hydrated = true;
      return;
    }

    if (!profile) {
      // No Supabase profile yet (pre-migration) — fall back to localStorage data
      const local = this._readLocalProgress();
      if (local && (local.attempts.length > 0 || local.sessions.length > 0)) {
        if (process.env.NODE_ENV !== "production") {
          console.debug("[SupabaseProgressRepository] no cloud profile — falling back to localStorage");
        }
        this._progress = local;
        this._notifyProgress();
      }
      this._hydrated = true;
      return;
    }

    this._childId = profile.id;
    this._selectedSoundId = profile.selected_sound_id;

    // Check for a pending-clear marker written by clearProgress().
    // This handles: clearProgress() called → page refreshed before DELETE
    // completed (or DELETE failed). We retry the DELETE here and return empty
    // progress so old data never reappears on page refresh.
    const pendingClearFor = localRead(PROGRESS_CLEAR_PENDING_KEY);
    if (pendingClearFor === profile.id) {
      if (process.env.NODE_ENV !== "production") {
        console.debug(
          "[SupabaseProgressRepository] pending-clear marker detected — retrying Supabase DELETE",
        );
      }
      const [delA, delS] = await Promise.all([
        this.client.from("practice_attempts").delete().eq("child_id", profile.id),
        this.client.from("practice_sessions").delete().eq("child_id", profile.id),
      ]);
      if (delA.error) warnRepo("_hydrate.pendingClear.deleteAttempts", new QueryError("practice_attempts", "delete", delA.error));
      if (delS.error) warnRepo("_hydrate.pendingClear.deleteSessions", new QueryError("practice_sessions", "delete", delS.error));

      if (!delA.error && !delS.error) {
        localRemove(PROGRESS_CLEAR_PENDING_KEY);
      }

      if (this._hydrateGen !== myGen) return;

      // Set empty progress (do not use the data Supabase returned)
      this._progress = {
        ...SERVER_PROGRESS,
        childId: profile.id,
        targetSound: profile.target_sound,
        updatedAt: new Date().toISOString(),
      };
      this._hydrated = true;
      this._notifyProgress();
      this._notifySound();
      return;
    }

    // Step 2: fetch sessions and attempts in parallel
    const [sessionsResult, attemptsResult] = await Promise.all([
      this.client
        .from("practice_sessions")
        .select("*")
        .eq("child_id", profile.id)
        .order("created_at", { ascending: false }),
      this.client
        .from("practice_attempts")
        .select("*")
        .eq("child_id", profile.id)
        .order("created_at", { ascending: false }),
    ]);

    // Check again after the second async batch
    if (this._hydrateGen !== myGen) return;

    if (sessionsResult.error) {
      warnRepo("SupabaseProgressRepository._hydrate (sessions)", new QueryError("practice_sessions", "select", sessionsResult.error));
    }
    if (attemptsResult.error) {
      warnRepo("SupabaseProgressRepository._hydrate (attempts)", new QueryError("practice_attempts", "select", attemptsResult.error));
    }

    const sessions = (sessionsResult.data ?? []).map(dbToDomainSession);
    const attempts = (attemptsResult.data ?? []).map(dbToDomainAttempt);

    this._progress = {
      childId: profile.id,
      targetSound: profile.target_sound,
      sessions,
      attempts,
      updatedAt: new Date().toISOString(),
    };

    this._hydrated = true;
    this._notifyProgress();
    this._notifySound();
  }

  /**
   * Returns the hydrated Supabase child_profiles UUID for DB writes.
   * Falls back to a one-shot fetch if hydration has not completed yet
   * (covers the edge case where a user submits before _hydrate() resolves).
   * Never returns a localStorage placeholder ID like "child-001".
   */
  private async _requireChildId(): Promise<string | null> {
    if (this._childId) return this._childId;

    const { data } = await this.client
      .from("child_profiles")
      .select("id")
      .limit(1)
      .maybeSingle();

    if (data?.id) this._childId = data.id;
    return this._childId;
  }

  private _readLocalProgress(): SpeechProgress | null {
    try {
      const raw = localRead(STORAGE_KEYS.PROGRESS);
      if (!raw) return null;
      return parseOrNull(SpeechProgressSchema, JSON.parse(raw), "progress") as SpeechProgress | null;
    } catch {
      return null;
    }
  }

  private async _updateSessionStatus(
    sessionId: string,
    status: "completed" | "abandoned",
  ): Promise<PracticeSession | null> {
    const session = this._progress.sessions.find((s) => s.id === sessionId);
    if (!session) return null;

    const now = new Date().toISOString();
    const durationMs = session.startedAt
      ? Date.now() - new Date(session.startedAt).getTime()
      : undefined;

    // Compute stats from cached attempts (mirrors completePracticeSession in speechProgressStorage)
    const sessionAttempts = this._progress.attempts.filter(
      (a) => a.sessionId === sessionId,
    );
    const completedMissions = new Set(
      sessionAttempts.map((a) => a.practiceItemId),
    ).size;
    const averageScore =
      sessionAttempts.length > 0
        ? Math.round(
            sessionAttempts.reduce((sum, a) => sum + a.score, 0) /
              sessionAttempts.length,
          )
        : 0;
    const starsEarned = sessionAttempts.reduce(
      (sum, a) => sum + a.starsEarned,
      0,
    );

    const updated: PracticeSession = {
      ...session,
      status,
      endedAt: now,
      durationMs: durationMs ?? session.durationMs,
      completedMissions,
      averageScore,
      starsEarned,
      attemptIds: sessionAttempts.map((a) => a.id),
    };

    this._setProgress({
      ...this._progress,
      sessions: this._progress.sessions.map((s) =>
        s.id === sessionId ? updated : s,
      ),
      updatedAt: now,
    });

    // Cache-only sessions (created when no Supabase child_id was available) carry
    // a local id like "session-<timestamp>-<random>" that is not a valid UUID.
    // Sending that id to a UUID column causes "invalid input syntax for type uuid".
    if (!isValidUuid(sessionId)) {
      warnRepo(
        `SupabaseProgressRepository.${status}Session`,
        "sessionId is not a UUID — session was cache-only, Supabase update skipped",
      );
      return updated;
    }

    const { error } = await this.client
      .from("practice_sessions")
      .update({
        status,
        ended_at: now,
        duration_ms: updated.durationMs ?? null,
        completed_missions: completedMissions,
        average_score: averageScore,
        stars_earned: starsEarned,
      })
      .eq("id", sessionId);

    if (error) {
      warnRepo(`SupabaseProgressRepository.${status}Session`, new QueryError("practice_sessions", "update", error));
    }

    return updated;
  }
}
