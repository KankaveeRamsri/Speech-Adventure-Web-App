import * as storage from "@/lib/observations/observationStorage";
import type { IObservationRepository } from "@/lib/repositories/IObservationRepository";
import type { ObservationNote } from "@/types/observations";

/**
 * localStorage-backed implementation of IObservationRepository.
 *
 * Thin wrapper around observationStorage.ts. All business logic
 * stays in the storage module; this class provides interface conformance.
 */
export class LocalObservationRepository implements IObservationRepository {
  // ── useSyncExternalStore plumbing ────────────────────────────────────────────

  getNotes(): ObservationNote[] {
    return storage.getObservations();
  }

  getServerNotes(): ObservationNote[] {
    return storage.getServerObservations();
  }

  subscribe(callback: () => void): () => void {
    return storage.subscribeToObservations(callback);
  }

  // ── Write operations ─────────────────────────────────────────────────────────

  async addNote(note: ObservationNote): Promise<void> {
    storage.addObservation(note);
  }

  async updateNote(updated: ObservationNote): Promise<void> {
    storage.updateObservation(updated);
  }

  async deleteNote(id: string): Promise<void> {
    storage.deleteObservation(id);
  }

  async replaceNotes(notes: ObservationNote[]): Promise<void> {
    storage.replaceObservations(notes);
  }

  async clearNotes(): Promise<void> {
    storage.clearObservations();
  }
}
