"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { isSupabaseConfigured } from "@/lib/supabase/client";

interface AuthGuardProps {
  children: React.ReactNode;
  /** Where to send unauthenticated users. Defaults to /auth/signin. */
  redirectTo?: string;
}

/**
 * Minimal protected-route wrapper.
 * When Supabase is not configured the gate is open — localStorage mode
 * doesn't require authentication.
 */
export function AuthGuard({ children, redirectTo = "/auth/signin" }: AuthGuardProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    if (isLoading) return;
    if (!isAuthenticated) {
      router.replace(redirectTo);
    }
  }, [isAuthenticated, isLoading, redirectTo, router]);

  // While Supabase checks the session, render nothing to avoid flicker.
  if (isSupabaseConfigured() && isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  // If Supabase is configured but user is not authenticated, render nothing
  // (redirect is in progress).
  if (isSupabaseConfigured() && !isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
