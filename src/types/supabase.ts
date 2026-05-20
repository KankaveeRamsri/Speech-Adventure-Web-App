/**
 * Supabase Database type placeholder for Speech Adventure.
 *
 * Mirrors the schema defined in docs/architecture/database-schema.md.
 * This file is a hand-written placeholder — replace it with the generated
 * version once a Supabase project is linked:
 *
 *   npx supabase gen types typescript --project-id <ref> > src/types/supabase.ts
 *
 * The Database type is consumed by createClient<Database>() in
 * src/lib/supabase/client.ts to provide end-to-end type safety for
 * Supabase queries (table names, column names, return shapes).
 */

import type {
  DbChildProfile,
  DbPracticeSession,
  DbPracticeAttempt,
  DbObservationNote,
  DbSessionStatus,
  DbEvaluationStatus,
  DbObservationTargetType,
  DbObservationCategory,
} from "@/types/database";

// ── Insert types (server-generated fields become optional) ────────────────────

export type InsertChildProfile = Omit<DbChildProfile, "id" | "created_at" | "updated_at">;
export type InsertPracticeSession = Omit<DbPracticeSession, "id" | "created_at">;
export type InsertPracticeAttempt = Omit<DbPracticeAttempt, "id" | "created_at">;
export type InsertObservationNote = Omit<DbObservationNote, "id" | "created_at" | "updated_at">;

// ── Update types (all mutable fields optional, PK and created_at immutable) ───

export type UpdateChildProfile = Partial<Omit<DbChildProfile, "id" | "created_at">>;
export type UpdatePracticeSession = Partial<Omit<DbPracticeSession, "id" | "created_at">>;
export type UpdatePracticeAttempt = Partial<Omit<DbPracticeAttempt, "id" | "created_at">>;
export type UpdateObservationNote = Partial<Omit<DbObservationNote, "id" | "created_at">>;

// ── Database type (passed to createClient<Database>) ─────────────────────────
//
// Shape matches what `supabase gen types` produces:
// { public: { Tables, Views, Functions, Enums, CompositeTypes } }

export interface Database {
  public: {
    Tables: {
      child_profiles: {
        Row: DbChildProfile;
        Insert: InsertChildProfile;
        Update: UpdateChildProfile;
        Relationships: [];
      };
      practice_sessions: {
        Row: DbPracticeSession;
        Insert: InsertPracticeSession;
        Update: UpdatePracticeSession;
        Relationships: [];
      };
      practice_attempts: {
        Row: DbPracticeAttempt;
        Insert: InsertPracticeAttempt;
        Update: UpdatePracticeAttempt;
        Relationships: [];
      };
      observation_notes: {
        Row: DbObservationNote;
        Insert: InsertObservationNote;
        Update: UpdateObservationNote;
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: {
      session_status: DbSessionStatus;
      evaluation_status: DbEvaluationStatus;
      observation_target_type: DbObservationTargetType;
      observation_category: DbObservationCategory;
    };
    CompositeTypes: { [_ in never]: never };
  };
}
