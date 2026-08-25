"use client";

import AppShell from "@/components/layout/AppShell";
import { useTeacherOrganization } from "@/hooks/useTeacherOrganization";

/**
 * Shell for every /teacher/* route.
 *
 * Wraps the shared AppShell (branding, primary nav, avatar/logout,
 * responsive behavior — all reused from the existing design system, not
 * duplicated) and silently provisions the teacher's internal organization
 * in the background so Phase 2 classroom features have somewhere to write
 * to. The provisioning result is intentionally not surfaced here —
 * "organization" is never a concept a teacher should see.
 */
export default function TeacherPageShell({ children }: { children: React.ReactNode }) {
  useTeacherOrganization();
  return <AppShell>{children}</AppShell>;
}
