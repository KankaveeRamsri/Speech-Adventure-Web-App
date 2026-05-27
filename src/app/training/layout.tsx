"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useAuth, isSchoolAdmin } from "@/hooks/useAuth";
import { useChildProfile } from "@/hooks/useChildProfile";

/**
 * Training route guard.
 *
 * school_admin users with no selected child context have no reason to enter
 * the training flow — redirect them to /school where they manage the org.
 * Once a child is selected (e.g. from teacher dashboard), the guard passes.
 *
 * Parent and teacher users are unaffected.
 */
export default function TrainingLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const { selectedChildId } = useChildProfile();

  const shouldRedirect = !isLoading && isSchoolAdmin(user) && !selectedChildId;

  useEffect(() => {
    if (shouldRedirect) {
      router.replace("/school");
    }
  }, [shouldRedirect, router]);

  if (shouldRedirect) return null;

  return <>{children}</>;
}
