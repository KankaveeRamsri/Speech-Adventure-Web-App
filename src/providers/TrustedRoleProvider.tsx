"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  fetchTrustedAppRole,
  invalidateTrustedAppRole,
  type TrustedAppRole,
} from "@/lib/auth/trustedRole";

export type TrustedAppRoleStatus = "idle" | "loading" | "ready" | "error";

export interface TrustedAppRoleResult {
  /** "idle" — no user yet. "loading" — resolving, render a neutral state,
   * never assume a role. "ready" — role is authoritative (may be null,
   * meaning "authenticated but no recognized role"). "error" — the query
   * failed; protected areas must fail closed and offer retry(). */
  status: TrustedAppRoleStatus;
  role: TrustedAppRole | null;
  retry: () => void;
}

const UNRESOLVED: TrustedAppRoleResult = {
  status: "idle",
  role: null,
  retry: () => {},
};

const TrustedRoleContext = createContext<TrustedAppRoleResult>(UNRESOLVED);

/**
 * Resolves the signed-in user's authorization-grade role from
 * public.user_app_roles (never from user_metadata — see
 * src/lib/auth/trustedRole.ts for why) exactly once per session, and shares
 * the result via context.
 *
 * Mounted once at the app root (src/app/layout.tsx) so every consumer —
 * the Teacher route guard, useTeacherOrganization, AppSidebar, MobileNav,
 * UserMenu, the auth pages' post-login redirect — reads the same resolved
 * value instead of each independently querying user_app_roles. A component
 * calling useTrustedAppRole() never triggers a network request itself; only
 * this provider's own effect does.
 */
export function TrustedRoleProvider({ children }: { children: ReactNode }) {
  const { user, isLoading: authLoading } = useAuth();
  // "loading" is never stored directly — it's derived below from whether
  // resolvedForUserId matches the live user id, which also means a stale
  // resolution from a just-signed-out or just-switched account is never
  // shown, even for a single render.
  const [asyncStatus, setAsyncStatus] = useState<"ready" | "error">("ready");
  const [role, setRole] = useState<TrustedAppRole | null>(null);
  const [resolvedForUserId, setResolvedForUserId] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const inFlightKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (authLoading || !user) return;

    const key = `${user.id}:${attempt}`;
    if (inFlightKeyRef.current === key) return;
    inFlightKeyRef.current = key;

    let cancelled = false;
    setResolvedForUserId(null);

    fetchTrustedAppRole(user.id)
      .then((resolved) => {
        if (cancelled) return;
        setRole(resolved);
        setResolvedForUserId(user.id);
        setAsyncStatus("ready");
      })
      .catch(() => {
        if (cancelled) return;
        setResolvedForUserId(user.id);
        setAsyncStatus("error");
      });

    return () => {
      cancelled = true;
      // Release the dedup guard so a genuine remount (e.g. React
      // StrictMode's dev-only mount → cleanup → mount cycle) starts a
      // fresh, uncancelled fetch instead of believing one is still in
      // flight and silently discarding the result of the one that just
      // got cancelled. Guarded by key match — this closure only ever
      // clears the guard it itself set, so an older cleanup can never
      // clear a newer instance's in-flight marker (React always runs a
      // cleanup before the next effect instance for the same hook starts,
      // never interleaved).
      if (inFlightKeyRef.current === key) {
        inFlightKeyRef.current = null;
      }
    };
    // user is intentionally read via user.id (a stable primitive) rather
    // than the object itself.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user?.id, attempt]);

  const retry = useCallback(() => {
    if (user) invalidateTrustedAppRole(user.id);
    setAttempt((n) => n + 1);
  }, [user]);

  // Derived during render, not stored as its own state slot — "idle" needs
  // no effect (there's nothing to fetch without a user), and comparing
  // resolvedForUserId against the live user id means a stale result from a
  // previous account can never be shown while the new user's fetch is in
  // flight.
  const stale = !user || resolvedForUserId !== user.id;
  const status: TrustedAppRoleStatus = !user ? "idle" : stale ? "loading" : asyncStatus;
  const effectiveRole = status === "ready" ? role : null;

  const value: TrustedAppRoleResult = { status, role: effectiveRole, retry };

  return <TrustedRoleContext.Provider value={value}>{children}</TrustedRoleContext.Provider>;
}

/** Reads the trusted role resolved by the single TrustedRoleProvider mounted at the app root — never triggers a query itself. */
export function useTrustedAppRole(): TrustedAppRoleResult {
  return useContext(TrustedRoleContext);
}
