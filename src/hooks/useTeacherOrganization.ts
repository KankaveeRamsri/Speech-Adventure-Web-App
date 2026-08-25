"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useTrustedAppRole } from "@/hooks/useTrustedAppRole";
import { useSchool } from "@/hooks/useSchool";

type ProvisionStatus = "idle" | "provisioning" | "ready" | "error";

/**
 * Ensures a signed-in teacher has an internal organization to own classrooms
 * in (Teacher V2 Phase 1), without ever exposing "organization" as a concept
 * in the UI. Mount once per Teacher V2 session (see TeacherPageShell) —
 * idempotent, so repeated mounts across route changes reuse the existing
 * organization instead of creating a new one.
 *
 * Gated on the trusted application role (public.user_app_roles via
 * useTrustedAppRole), not user.role (user_metadata.role) — Phase 1.1. Only
 * fires once the trusted role is confirmed "ready" and equal to "teacher";
 * never while it's loading, erroring, or resolved to anything else. This is
 * the client-side backstop that keeps a spoofed user_metadata.role from
 * ever reaching ensure_teacher_organization() — the RPC's own DB-side check
 * is the real, non-bypassable enforcement either way, but this means a
 * parent account never even attempts the call. In practice this hook only
 * mounts inside the Teacher route guard's already-confirmed branch (see
 * src/app/teacher/layout.tsx), so its own trusted-role read resolves
 * instantly from useTrustedAppRole's cache — no extra network round trip.
 */
export function useTeacherOrganization() {
  const { user } = useAuth();
  const { status: roleStatus, role } = useTrustedAppRole();
  const { ensureTeacherOrganization } = useSchool();

  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [status, setStatus] = useState<ProvisionStatus>("idle");
  const attemptedForUserId = useRef<string | null>(null);

  useEffect(() => {
    if (!user || roleStatus !== "ready" || role !== "teacher") return;
    if (attemptedForUserId.current === user.id) return;
    attemptedForUserId.current = user.id;

    let cancelled = false;
    setStatus("provisioning");

    // ensureTeacherOrganization is idempotent server/store-side, so calling
    // whichever function identity this render's closure captured is safe —
    // deliberately depending on user?.id (and the resolved role state)
    // rather than the function itself, which useSchool() recreates every
    // render, keeps this from re-firing.
    ensureTeacherOrganization(user.id)
      .then(({ organizationId: id }) => {
        if (cancelled) return;
        setOrganizationId(id);
        setStatus("ready");
      })
      .catch(() => {
        if (cancelled) return;
        setStatus("error");
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, roleStatus, role]);

  return { organizationId, status };
}
