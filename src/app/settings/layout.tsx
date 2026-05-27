"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { isSupabaseConfigured } from "@/lib/supabase/client";

/**
 * Settings route guard.
 *
 * In Supabase mode: redirects unauthenticated users to sign-in.
 * In local mode (no Supabase): always allows access — anonymous users follow
 * the parent flow and can access settings without logging in.
 */
export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    if (isLoading) return;
    if (!user) router.replace("/auth/signin?redirect=/settings");
  }, [isLoading, user, router]);

  if (isSupabaseConfigured() && (isLoading || !user)) return null;
  return <>{children}</>;
}
