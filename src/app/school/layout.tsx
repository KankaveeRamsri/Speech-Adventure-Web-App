"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth, isSchoolAdmin } from "@/hooks/useAuth";
import { FEATURES } from "@/lib/config/featureFlags";

export default function SchoolLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  // School Admin is disabled for the public product (Teacher V2 Phase 1).
  // Gate on the flag in addition to the role so an existing school_admin
  // account cannot reach the admin console while it's turned off — the
  // route, repository, and database schema stay intact for a future
  // re-enable (see src/lib/config/featureFlags.ts).
  const allowed = FEATURES.schoolAdmin && !!user && isSchoolAdmin(user);

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace("/auth/signin?redirect=/school");
      return;
    }
    if (!allowed) {
      router.replace("/training");
    }
  }, [isLoading, user, allowed, router]);

  if (isLoading || !user || !allowed) return null;
  return <>{children}</>;
}
