import type { IProfileRepository } from "@/lib/repositories/IProfileRepository";
import type { ChildProfileData } from "@/lib/child-profile/childProfileStorage";
import type { SupabaseClient } from "@/lib/supabase/client";
import type { Database } from "@/types/supabase";
import { dbToDomainProfile, domainToDbProfile } from "./mappers";
import { QueryError, warnRepo } from "./errors";
import { localRead, localWrite, localRemove } from "@/lib/storage/local/localStorageClient";
import { STORAGE_KEYS, getScopedStorageKey } from "@/lib/storage/storageKeys";
import { ChildProfileDataSchema, parseOrNull } from "@/lib/validation";

// ── Stable server snapshot (no profile on the server — no auth context) ───────
const SERVER_PROFILE: ChildProfileData | null = null;

/**
 * Supabase-backed implementation of IProfileRepository.
 *
 * Cache strategy (mirrors the stable-snapshot pattern from childProfileStorage):
 *  • `_cache` holds the current in-memory profile (null = no profile / not yet loaded)
 *  • `subscribe()` triggers a one-time async hydration from Supabase
 *  • When hydration resolves the cache is updated and listeners are notified
 *  • Write operations (save/replace/clear) update the cache synchronously,
 *    then persist to Supabase asynchronously
 *
 * useSyncExternalStore compatibility:
 *  • `getProfile()` always returns the same object reference between writes
 *  • A new object is assigned only when data actually changes
 *
 * TODO (activation): verify that `getSupabaseClient()` is called only after
 * the browser auth session is ready (AuthProvider.isLoading = false).
 */
// Stable empty-profiles constant so listProfiles() never returns a new [] reference.
const SUPABASE_EMPTY_PROFILES: ChildProfileData[] = [];

export class SupabaseProfileRepository implements IProfileRepository {
  private _cache: ChildProfileData | null = null;
  // Cached single-element list kept in sync with _cache inside _setCache().
  // Returning the same reference on every call keeps useSyncExternalStore stable.
  private _profilesList: ChildProfileData[] = SUPABASE_EMPTY_PROFILES;
  private readonly _listeners = new Set<() => void>();
  private _hydrated = false;
  private _hydratePromise: Promise<void> | null = null;
  private _hydrateGen = 0;
  // Tracks the current authenticated userId for scoped localStorage ops.
  private _localScopeUserId: string | null = null;

  constructor(private readonly client: SupabaseClient<Database>) {}

  /** Called by RepositoryProvider on every auth transition to set the userId for localStorage scoping. */
  public setScope(userId: string | null): void {
    this._localScopeUserId = userId;
  }

  private _localKey(): string {
    return getScopedStorageKey(STORAGE_KEYS.PROFILE, this._localScopeUserId);
  }

  // ── useSyncExternalStore plumbing ─────────────────────────────────────────

  getProfile(): ChildProfileData | null {
    return this._cache;
  }

  getServerProfile(): ChildProfileData | null {
    return SERVER_PROFILE;
  }

  subscribe(callback: () => void): () => void {
    this._listeners.add(callback);
    this._triggerHydrate();

    return () => {
      this._listeners.delete(callback);
    };
  }

  // ── Write operations ──────────────────────────────────────────────────────

  async saveProfile(profile: ChildProfileData): Promise<void> {
    // Optimistic: update cache immediately so UI is responsive
    this._setCache(profile);
    // Write-through to localStorage (scoped by user) so data survives a page
    // reload when Supabase is temporarily unreachable.
    localWrite(this._localKey(), JSON.stringify(profile));

    const userId = await this._getCurrentUserId();
    if (!userId) {
      warnRepo("SupabaseProfileRepository.saveProfile", "no auth user — profile saved to cache + localStorage only");
      return;
    }

    // profile.id is a localStorage placeholder (e.g. "child-1748…"), not a UUID.
    // Passing it would make PostgreSQL reject the row with "invalid input syntax
    // for type uuid". Let the DB generate (or preserve) the UUID automatically.
    const { data: upserted, error } = await this.client
      .from("child_profiles")
      .upsert(
        // Use targetSound as initial selected_sound_id; it can be changed later
        // via setSelectedSoundId. Do NOT include id — let gen_random_uuid() run.
        domainToDbProfile(profile, userId, profile.targetSound),
        { onConflict: "user_id" },
      )
      .select("id, updated_at")
      .single();

    if (error) {
      warnRepo("SupabaseProfileRepository.saveProfile", new QueryError("child_profiles", "upsert", error));
    } else if (upserted) {
      const row = upserted as { id: string; updated_at: string };
      // Replace the localStorage placeholder id with the real DB UUID so that
      // SupabaseProgressRepository can use it as child_id on linked records.
      const canonical: ChildProfileData = { ...profile, id: row.id, updatedAt: row.updated_at };
      this._setCache(canonical);
      localWrite(this._localKey(), JSON.stringify(canonical));
    }
  }

  async replaceProfile(profile: ChildProfileData): Promise<void> {
    // replaceProfile is semantically identical to saveProfile for Supabase
    // (both upsert by user_id). Kept separate to preserve the interface contract.
    await this.saveProfile(profile);
  }

  async clearProfile(): Promise<void> {
    this._setCache(null);
    localRemove(this._localKey());

    const userId = await this._getCurrentUserId();
    if (!userId) return;

    const { error } = await this.client
      .from("child_profiles")
      .delete()
      .eq("user_id", userId);

    if (error) {
      warnRepo("SupabaseProfileRepository.clearProfile", new QueryError("child_profiles", "delete", error));
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
      console.debug("[SupabaseProfileRepository] reset — clearing cache");
    }
    this._hydrateGen++;
    this._hydrated = false;
    this._hydratePromise = null;
    this._localScopeUserId = null;
    this._cache = null;
    this._profilesList = SUPABASE_EMPTY_PROFILES;
    this._notify();
  }

  /**
   * Resets hydration state and re-fetches from Supabase.
   * Safe to call multiple times — generation counter prevents stale writes.
   */
  public rehydrate(): void {
    if (process.env.NODE_ENV !== "production") {
      console.debug("[SupabaseProfileRepository] rehydrate triggered");
    }
    this._hydrated = false;
    this._hydratePromise = null;
    this._hydrateGen++;
    this._triggerHydrate();
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  private _setCache(value: ChildProfileData | null): void {
    this._cache = value;
    // Keep _profilesList in sync so listProfiles() returns the same reference
    // between writes — required for useSyncExternalStore snapshot stability.
    this._profilesList = value !== null ? [value] : SUPABASE_EMPTY_PROFILES;
    this._notify();
  }

  private _notify(): void {
    this._listeners.forEach((cb) => cb());
  }

  private _triggerHydrate(): void {
    if (this._hydratePromise) return;
    this._hydratePromise = this._hydrate().catch((err) => {
      warnRepo("SupabaseProfileRepository._hydrate", err);
    });
  }

  private async _hydrate(): Promise<void> {
    const myGen = this._hydrateGen;

    const { data, error } = await this.client
      .from("child_profiles")
      .select("*")
      .limit(1)
      .maybeSingle();

    // Bail if a newer rehydrate() superseded us
    if (this._hydrateGen !== myGen) return;

    if (error) {
      warnRepo("SupabaseProfileRepository._hydrate", new QueryError("child_profiles", "select", error));
      // Fall back to localStorage so the UI isn't blank when Supabase is unreachable.
      this._cache = this._readLocalStorage();
      this._hydrated = true;
      this._notify();
      return;
    }

    // Supabase row takes priority; fall back to localStorage when no Supabase
    // profile exists yet (unauthenticated user or pre-migration state).
    this._cache = data ? dbToDomainProfile(data) : this._readLocalStorage();
    this._hydrated = true;
    this._notify();
  }

  private _readLocalStorage(): ChildProfileData | null {
    try {
      const raw = localRead(this._localKey());
      if (!raw) return null;
      return parseOrNull(ChildProfileDataSchema, JSON.parse(raw), "profile") as ChildProfileData | null;
    } catch {
      return null;
    }
  }

  private async _getCurrentUserId(): Promise<string | null> {
    const { data } = await this.client.auth.getUser();
    return data.user?.id ?? null;
  }

  // ── Multi-child support stubs (Phase 7) ─────────────────────────────────────
  // Supabase currently enforces one child_profile per user_id (upsert onConflict).
  // These stubs preserve the IProfileRepository contract without schema changes.
  // Full multi-child support for Supabase requires a DB migration in Phase 8+.

  listProfiles(): ChildProfileData[] {
    return this._profilesList;
  }

  getSelectedChildId(): string | null {
    return this._cache?.id ?? null;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  setSelectedChildId(_id: string): void {
    // No-op: Supabase single-profile mode — only one child is always "selected".
  }
}
