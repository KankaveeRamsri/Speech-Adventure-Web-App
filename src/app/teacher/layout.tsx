"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth, isTeacher } from "@/hooks/useAuth";
import { getPostAuthDestination } from "@/lib/auth/postAuthDestination";

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace("/auth/signin?redirect=/teacher");
      return;
    }
    // Strictly role-gated: a parent or a school_admin (even with School Admin
    // disabled) must not reach Teacher V2 just because it renders next.
    if (!isTeacher(user)) {
      router.replace(getPostAuthDestination(user));
    }
  }, [isLoading, user, router]);

  if (isLoading || !user || !isTeacher(user)) return null;
  return <>{children}</>;
}
