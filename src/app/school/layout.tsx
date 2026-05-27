"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth, isSchoolAdmin } from "@/hooks/useAuth";

export default function SchoolLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace("/auth/signin?redirect=/school");
      return;
    }
    if (!isSchoolAdmin(user)) {
      router.replace("/training");
    }
  }, [isLoading, user, router]);

  if (isLoading || !user || !isSchoolAdmin(user)) return null;
  return <>{children}</>;
}
