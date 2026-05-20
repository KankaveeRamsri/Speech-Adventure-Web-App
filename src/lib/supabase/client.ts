import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/supabase";

// Read at module init — safe because Next.js inlines NEXT_PUBLIC_* at build time.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * True when both NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
 * are set. When false the app operates in localStorage-only mode (the default).
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl && supabaseAnonKey);
}

// Singleton — one client per page lifecycle.
let _client: SupabaseClient<Database> | null = null;

/**
 * Returns the singleton Supabase browser client when env vars are configured.
 * Returns null in localStorage-only mode (env vars absent).
 *
 * ── Migration path (Phase 3) ────────────────────────────────────────────────
 * 1. Set NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local
 * 2. Implement SupabaseProgressRepository / SupabaseProfileRepository /
 *    SupabaseObservationRepository in src/lib/storage/supabase/
 * 3. In src/app/layout.tsx, detect NEXT_PUBLIC_STORAGE_BACKEND === "supabase"
 *    and pass the Supabase repositories as overrides to <RepositoryProvider>
 * 4. Current localStorage behaviour is preserved until that env var is flipped.
 * ────────────────────────────────────────────────────────────────────────────
 */
export function getSupabaseClient(): SupabaseClient<Database> | null {
  if (!isSupabaseConfigured()) return null;

  if (!_client) {
    // Non-null assertion is safe here — isSupabaseConfigured() already checked.
    _client = createClient<Database>(supabaseUrl!, supabaseAnonKey!);
  }

  return _client;
}

export type { SupabaseClient };
