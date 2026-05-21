import type { IObservationRepository } from "@/lib/repositories/IObservationRepository";
import type { ObservationNote } from "@/types/observations";
import type { SupabaseClient } from "@/lib/supabase/client";
import type { Database } from "@/types/supabase";
import { dbToDomainNote, domainToDbNote } from "./mappers";
import { QueryError, warnRepo } from "./errors";
import { localRead } from "@/lib/storage/local/localStorageClient";
import { STORAGE_KEYS } from "@/lib/storage/storageKeys";
import { ObservationNotesArraySchema, parseOrNull } from "@/lib/validation";

// ── Stable server snapshot ────────────────────────────────────────────────────
const SERVER_NOTES: ObservationNote[] = [];

/**
 * Supabase-backed implementation of IObservationRepository.
 *
 * Cache strategy:
 *  • Hydrates on first subscribe() call — fetches all notes for the current user's child
 *  • Cache is replaced (new array reference) on every mutation so
 *    useSyncExternalStore detects changes correctly
 *  • Notes are RLS-filtered by child_id on the DB side (via is_own_child())
 *
 * Note on author_id:
 *  The domain ObservationNote does not carry authorId — it is injected from
 *  auth.getUser() at write time. The DB author_id column stores who wrote each note.
 *
 * Note on target_id:
 *  In localStorage, target_id is a string (e.g. "session-1716134400000-abc12").
 *  In Supabase the column is uuid. String → UUID migration happens in Phase 3/4.
 *  For now, target_id is stored as-is and the DB column accepts nulls; non-UUID
 *  strings will cause a DB error at insert time if target_id is non-null.
 *  TODO (Phase 27): migrate string target_ids to UUIDs before writing to Supabase.
 */
export class SupabaseObservationRepository implements IObservationRepository {
  private _cache: ObservationNote[] = SERVER_NOTES;
  private readonly _listeners = new Set<() => void>();
  private _hydrated = false;
  private _hydratePromise: Promise<void> | null = null;
  // Incremented by rehydrate() to invalidate any in-flight _hydrate() call
  private _hydrateGen = 0;

  constructor(private readonly client: SupabaseClient<Database>) {}

  // ── useSyncExternalStore plumbing ─────────────────────────────────────────

  getNotes(): ObservationNote[] {
    return this._cache;
  }

  getServerNotes(): ObservationNote[] {
    return SERVER_NOTES;
  }

  subscribe(callback: () => void): () => void {
    this._listeners.add(callback);
    this._triggerHydrate();

    return () => {
      this._listeners.delete(callback);
    };
  }

  // ── Write operations ──────────────────────────────────────────────────────

  async addNote(note: ObservationNote): Promise<void> {
    // Optimistic update — add to cache before the network round-trip
    this._setCache([...this._cache, note]);

    const authorId = await this._getCurrentUserId();
    if (!authorId) {
      warnRepo("SupabaseObservationRepository.addNote", "no auth user — note added to cache only");
      return;
    }

    const { error } = await this.client
      .from("observation_notes")
      .insert(domainToDbNote(note, authorId));

    if (error) {
      warnRepo("SupabaseObservationRepository.addNote", new QueryError("observation_notes", "insert", error));
      // Roll back optimistic update on failure
      this._setCache(this._cache.filter((n) => n.id !== note.id));
    }
  }

  async updateNote(updated: ObservationNote): Promise<void> {
    const previous = this._cache;
    this._setCache(this._cache.map((n) => (n.id === updated.id ? updated : n)));

    const { error } = await this.client
      .from("observation_notes")
      .update({
        target_type: updated.targetType,
        target_id: updated.targetId ?? null,
        category: updated.category,
        title: updated.title,
        content: updated.content,
      })
      .eq("id", updated.id);

    if (error) {
      warnRepo("SupabaseObservationRepository.updateNote", new QueryError("observation_notes", "update", error));
      // Roll back on failure
      this._setCache(previous);
    }
  }

  async deleteNote(id: string): Promise<void> {
    const previous = this._cache;
    this._setCache(this._cache.filter((n) => n.id !== id));

    const { error } = await this.client
      .from("observation_notes")
      .delete()
      .eq("id", id);

    if (error) {
      warnRepo("SupabaseObservationRepository.deleteNote", new QueryError("observation_notes", "delete", error));
      // Roll back on failure
      this._setCache(previous);
    }
  }

  async replaceNotes(notes: ObservationNote[]): Promise<void> {
    this._setCache(notes);

    const authorId = await this._getCurrentUserId();
    if (!authorId) {
      warnRepo("SupabaseObservationRepository.replaceNotes", "no auth user — cache only");
      return;
    }

    // Get child_id for the current user
    const childId = await this._getChildId();
    if (!childId) return;

    // Delete existing and re-insert (upsert by id is also an option)
    const { error: delError } = await this.client
      .from("observation_notes")
      .delete()
      .eq("child_id", childId);

    if (delError) {
      warnRepo("SupabaseObservationRepository.replaceNotes", new QueryError("observation_notes", "delete", delError));
      return;
    }

    if (notes.length === 0) return;

    const { error: insError } = await this.client
      .from("observation_notes")
      .insert(notes.map((n) => domainToDbNote(n, authorId)));

    if (insError) {
      warnRepo("SupabaseObservationRepository.replaceNotes", new QueryError("observation_notes", "insert", insError));
    }
  }

  async clearNotes(): Promise<void> {
    this._setCache(SERVER_NOTES);

    const childId = await this._getChildId();
    if (!childId) return;

    const { error } = await this.client
      .from("observation_notes")
      .delete()
      .eq("child_id", childId);

    if (error) {
      warnRepo("SupabaseObservationRepository.clearNotes", new QueryError("observation_notes", "delete", error));
    }
  }

  // ── Rehydration (called by RepositoryProvider after auth session is ready) ─

  /**
   * Resets hydration state and re-fetches from Supabase.
   * Safe to call multiple times — generation counter prevents stale writes.
   */
  public rehydrate(): void {
    if (process.env.NODE_ENV !== "production") {
      console.debug("[SupabaseObservationRepository] rehydrate triggered");
    }
    this._hydrated = false;
    this._hydratePromise = null;
    this._hydrateGen++;
    this._triggerHydrate();
  }

  // ── Private helpers ───────────────────────────────────────────────────────

  private _setCache(notes: ObservationNote[]): void {
    this._cache = notes;
    this._notify();
  }

  private _notify(): void {
    this._listeners.forEach((cb) => cb());
  }

  private _triggerHydrate(): void {
    if (this._hydratePromise) return;
    this._hydratePromise = this._hydrate().catch((err) => {
      warnRepo("SupabaseObservationRepository._hydrate", err);
    });
  }

  private async _hydrate(): Promise<void> {
    const myGen = this._hydrateGen;

    // RLS on observation_notes uses is_own_child(child_id) — the DB filters for us.
    const { data, error } = await this.client
      .from("observation_notes")
      .select("*")
      .order("created_at", { ascending: false });

    // Bail if a newer rehydrate() superseded us
    if (this._hydrateGen !== myGen) return;

    if (error) {
      warnRepo("SupabaseObservationRepository._hydrate", new QueryError("observation_notes", "select", error));
      // Fallback to localStorage so observation panel isn't blank when Supabase is unreachable
      const local = this._readLocalNotes();
      if (local && local.length > 0) {
        if (process.env.NODE_ENV !== "production") {
          console.debug("[SupabaseObservationRepository] cloud error — falling back to localStorage");
        }
        this._cache = local;
        this._notify();
      }
      this._hydrated = true;
      return;
    }

    this._cache = (data ?? []).map(dbToDomainNote);
    this._hydrated = true;
    this._notify();
  }

  private _readLocalNotes(): ObservationNote[] | null {
    try {
      const raw = localRead(STORAGE_KEYS.OBSERVATIONS);
      if (!raw) return null;
      return parseOrNull(ObservationNotesArraySchema, JSON.parse(raw), "observations") as ObservationNote[] | null;
    } catch {
      return null;
    }
  }

  private async _getCurrentUserId(): Promise<string | null> {
    const { data } = await this.client.auth.getUser();
    return data.user?.id ?? null;
  }

  private async _getChildId(): Promise<string | null> {
    const { data } = await this.client
      .from("child_profiles")
      .select("id")
      .limit(1)
      .maybeSingle();
    return data?.id ?? null;
  }
}
