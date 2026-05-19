import type { ObservationNote } from "@/types/observations";

/**
 * Contract for reading and writing observation notes.
 *
 * getNotes filters by childId — Supabase implementations can push
 * this filter to the database query instead of loading all rows.
 */
export interface IObservationRepository {
  // ── useSyncExternalStore plumbing ──────────────────────────────────────────
  /** Returns all notes (unfiltered). Filtering by childId is the hook's job. */
  getNotes(): ObservationNote[];
  getServerNotes(): ObservationNote[];
  subscribe(callback: () => void): () => void;

  // ── Write operations ───────────────────────────────────────────────────────
  addNote(note: ObservationNote): Promise<void>;
  updateNote(updated: ObservationNote): Promise<void>;
  deleteNote(id: string): Promise<void>;
  replaceNotes(notes: ObservationNote[]): Promise<void>;
  clearNotes(): Promise<void>;
}
