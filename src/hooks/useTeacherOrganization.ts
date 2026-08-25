"use client";

import { useEffect, useRef, useState } from "react";
import { useAuth, isTeacher } from "@/hooks/useAuth";
import { useSchool } from "@/hooks/useSchool";

type ProvisionStatus = "idle" | "provisioning" | "ready" | "error";

/**
 * Ensures a signed-in teacher has an internal organization to own classrooms
 * in (Teacher V2 Phase 1), without ever exposing "organization" as a concept
 * in the UI. Mount once per Teacher V2 session (see TeacherPageShell) —
 * idempotent, so repeated mounts across route changes reuse the existing
 * organization instead of creating a new one.
 *
 * Never runs for non-teacher roles: parents must not receive an organization.
 */
export function useTeacherOrganization() {
  const { user } = useAuth();
  const { ensureTeacherOrganization } = useSchool();

  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [status, setStatus] = useState<ProvisionStatus>("idle");
  const attemptedForUserId = useRef<string | null>(null);

  useEffect(() => {
    if (!user || !isTeacher(user)) return;
    if (attemptedForUserId.current === user.id) return;
    attemptedForUserId.current = user.id;

    let cancelled = false;
    setStatus("provisioning");

    // ensureTeacherOrganization is idempotent server/store-side, so calling
    // whichever function identity this render's closure captured is safe —
    // deliberately depending on user?.id only (not the function itself,
    // which useSchool() recreates every render) keeps this from re-firing.
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
  }, [user?.id]);

  return { organizationId, status };
}
