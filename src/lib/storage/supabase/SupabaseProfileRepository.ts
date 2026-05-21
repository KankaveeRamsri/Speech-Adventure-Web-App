import type { IProfileRepository } from "@/lib/repositories/IProfileRepository";
import type { ChildProfileData } from "@/lib/child-profile/childProfileStorage";
import type { SupabaseClient } from "@/lib/supabase/client";
import type { Database } from "@/types/supabase";
import { dbToDomainProfile, domainToDbProfile } from "./mappers";
import { QueryError, warnRepo } from "./errors";
import { localRead, localWrite, localRemove } from "@/lib/storage/local/localStorageClient";
import { STORAGE_KEYS } from "@/lib/storage/storageKeys";
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
export class SupabaseProfileRepository implements IProfileRepository {
  private _cache: ChildProfileData | null = null;
  private readonly _listeners = new Set<() => void>();
  private _hydrated = false;
  private _hydratePromise: Promise<void> | null = null;
  // Incremented by rehydrate() to invalidate any in-flight _hydrate() call
  private _hydrateGen = 0;

  constructor(private readonly client: SupabaseClient<Database>) {}

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
    // Write-through to localStorage so data survives a page reload when
    // the user isn't authenticated yet (Supabase would return 0 rows).
    localWrite(STORAGE_KEYS.PROFILE, JSON.stringify(profile));

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
      localWrite(STORAGE_KEYS.PROFILE, JSON.stringify(canonical));
    }
  }

  async replaceProfile(profile: ChildProfileData): Promise<void> {
    // replaceProfile is semantically identical to saveProfile for Supabase
    // (both upsert by user_id). Kept separate to preserve the interface contract.
    await this.saveProfile(profile);
  }

  async clearProfile(): Promise<void> {
    this._setCache(null);
    localRemove(STORAGE_KEYS.PROFILE);

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

  // ── Rehydration (called by RepositoryProvider after auth session is ready) ─

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
      const raw = localRead(STORAGE_KEYS.PROFILE);
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
}
