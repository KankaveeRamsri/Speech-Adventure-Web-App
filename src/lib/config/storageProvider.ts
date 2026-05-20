/**
 * Storage provider configuration.
 *
 * Three modes, set via NEXT_PUBLIC_STORAGE_PROVIDER:
 *
 *  "local"    — localStorage only (default, no external dependencies)
 *  "supabase" — all three repositories backed by Supabase
 *  "hybrid"   — Supabase primary + localStorage fallback (target for Phase 3+)
 *
 * Rules:
 *  - Default is always "local" — app never breaks when env var is absent
 *  - "supabase" and "hybrid" are silently demoted to "local" when Supabase env
 *    vars are missing; a dev-mode warning is logged in that case
 *  - UI behaviour is identical regardless of which provider is active
 */

export type StorageProvider = "local" | "supabase" | "hybrid";

/**
 * Returns the configured storage provider.
 * Any unrecognised or absent value is normalised to "local".
 */
export function getConfiguredProvider(): StorageProvider {
  const raw = process.env.NEXT_PUBLIC_STORAGE_PROVIDER;
  if (raw === "supabase") return "supabase";
  if (raw === "hybrid") return "hybrid";
  return "local";
}

/**
 * True when the env var requests a Supabase-backed provider.
 * Does NOT verify that Supabase is actually reachable — call
 * isSupabaseConfigured() from @/lib/supabase/client for that.
 */
export function isSupabaseProviderRequested(): boolean {
  const p = getConfiguredProvider();
  return p === "supabase" || p === "hybrid";
}
