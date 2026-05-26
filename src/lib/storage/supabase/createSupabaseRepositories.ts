/**
 * Factory: create all three Supabase-backed repositories.
 *
 * Returns a partial Repositories map (suitable for RepositoryProvider overrides)
 * when Supabase is configured, or null when it is not.
 *
 * ── How to activate (Phase 27+) ──────────────────────────────────────────────
 *
 * 1. Make sure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are
 *    set in .env.local to real values (not placeholders).
 *
 * 2. Set NEXT_PUBLIC_STORAGE_BACKEND=supabase in .env.local.
 *
 * 3. In src/app/layout.tsx, add:
 *
 *    import { createSupabaseRepositories } from "@/lib/storage/supabase/createSupabaseRepositories";
 *
 *    const supabaseRepos = createSupabaseRepositories();
 *    // ...
 *    <RepositoryProvider overrides={supabaseRepos ?? undefined}>
 *
 * 4. localStorage repositories remain registered as defaults in RepositoryProvider —
 *    they are simply not used when overrides replace them.
 *
 * ── Current state ─────────────────────────────────────────────────────────────
 * This function is NOT called from any UI or layout code.
 * localStorage is the active provider.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/client";
import type { Repositories } from "@/lib/providers/RepositoryProvider";
import { SupabaseProgressRepository } from "./SupabaseProgressRepository";
import { SupabaseProfileRepository } from "./SupabaseProfileRepository";
import { SupabaseObservationRepository } from "./SupabaseObservationRepository";
import { SupabaseInvitationRepository } from "./SupabaseInvitationRepository";
import { SupabaseChildAccessRepository } from "./SupabaseChildAccessRepository";

/**
 * Creates Supabase repository instances when Supabase is configured.
 *
 * @returns A full Repositories map, or null when Supabase is not configured.
 */
export function createSupabaseRepositories(): Repositories | null {
  if (!isSupabaseConfigured()) return null;

  const client = getSupabaseClient();
  if (!client) return null;

  return {
    progress: new SupabaseProgressRepository(client),
    profile: new SupabaseProfileRepository(client),
    observations: new SupabaseObservationRepository(client),
    invitations: new SupabaseInvitationRepository(client),
    childAccess: new SupabaseChildAccessRepository(client),
  };
}

/**
 * Returns true when the active storage provider is Supabase-backed.
 *
 * Checks NEXT_PUBLIC_STORAGE_PROVIDER first (new canonical var); falls back
 * to legacy NEXT_PUBLIC_STORAGE_BACKEND for backward compatibility.
 */
export function isSupabaseStorageBackend(): boolean {
  const provider = process.env.NEXT_PUBLIC_STORAGE_PROVIDER;
  if (provider === "supabase" || provider === "hybrid") return true;
  // legacy alias
  return process.env.NEXT_PUBLIC_STORAGE_BACKEND === "supabase";
}
