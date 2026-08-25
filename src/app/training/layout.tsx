"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useAuth, isSchoolAdmin } from "@/hooks/useAuth";
import { useChildProfile } from "@/hooks/useChildProfile";
import { FEATURES } from "@/lib/config/featureFlags";

/**
 * Training route guard.
 *
 * school_admin users with no selected child context have no reason to enter
 * the training flow — redirect them to /school where they manage the org.
 * Once a child is selected (e.g. from teacher dashboard), the guard passes.
 *
 * Only applies while School Admin is enabled — with the flag off, /school
 * itself redirects back to /training for these accounts, so redirecting
 * there would loop. Disabled school_admin accounts fall through and use
 * /training like any other unrecognized-role account.
 *
 * Parent and teacher users are unaffected.
 */
export default function TrainingLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const { selectedChildId } = useChildProfile();

  const shouldRedirect =
    !isLoading && FEATURES.schoolAdmin && isSchoolAdmin(user) && !selectedChildId;

  useEffect(() => {
    if (shouldRedirect) {
      router.replace("/school");
    }
  }, [shouldRedirect, router]);

  if (shouldRedirect) return null;

  return <>{children}</>;
}
