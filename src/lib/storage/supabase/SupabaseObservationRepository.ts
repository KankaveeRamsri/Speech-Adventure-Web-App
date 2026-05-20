import type { IObservationRepository } from "@/lib/repositories/IObservationRepository";
import type { ObservationNote } from "@/types/observations";
import type { SupabaseClient } from "@/lib/supabase/client";
import type { Database } from "@/types/supabase";

/**
 * Supabase-backed implementation of IObservationRepository.
 *
 * NOT IMPLEMENTED — Phase 3 placeholder.
 *
 * ── Implementation guide (Phase 3) ──────────────────────────────────────────
 * 1. Constructor receives a SupabaseClient<Database>
 * 2. getNotes() queries observation_notes WHERE child_id = <active child>
 *    — Supabase can filter at DB level (vs loading all then filtering in-memory)
 * 3. addNote() → insert into observation_notes with domainToDbNote() mapping
 * 4. updateNote() → update WHERE id = note.id AND author_id = auth.uid()
 * 5. deleteNote() → delete WHERE id = note.id
 * 6. Note: target_id is UUID in DB; string IDs from localStorage need migration
 *    See: docs/architecture/database-schema.md — "Note: target_id เปลี่ยนจาก string เป็น uuid"
 * ────────────────────────────────────────────────────────────────────────────
 */
export class SupabaseObservationRepository implements IObservationRepository {
  constructor(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    private readonly client: SupabaseClient<Database>,
  ) {}

  getNotes(): ObservationNote[] {
    throw new Error("SupabaseObservationRepository.getNotes: not implemented (Phase 3)");
  }

  getServerNotes(): ObservationNote[] {
    throw new Error("SupabaseObservationRepository.getServerNotes: not implemented (Phase 3)");
  }

  subscribe(_callback: () => void): () => void {
    throw new Error("SupabaseObservationRepository.subscribe: not implemented (Phase 3)");
  }

  async addNote(_note: ObservationNote): Promise<void> {
    throw new Error("SupabaseObservationRepository.addNote: not implemented (Phase 3)");
  }

  async updateNote(_updated: ObservationNote): Promise<void> {
    throw new Error("SupabaseObservationRepository.updateNote: not implemented (Phase 3)");
  }

  async deleteNote(_id: string): Promise<void> {
    throw new Error("SupabaseObservationRepository.deleteNote: not implemented (Phase 3)");
  }

  async replaceNotes(_notes: ObservationNote[]): Promise<void> {
    throw new Error("SupabaseObservationRepository.replaceNotes: not implemented (Phase 3)");
  }

  async clearNotes(): Promise<void> {
    throw new Error("SupabaseObservationRepository.clearNotes: not implemented (Phase 3)");
  }
}
