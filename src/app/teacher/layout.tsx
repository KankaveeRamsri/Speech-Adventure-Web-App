"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth, isTeacher, isSchoolAdmin } from "@/hooks/useAuth";

export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace("/auth/signin?redirect=/teacher");
      return;
    }
    if (!isTeacher(user)) {
      router.replace(isSchoolAdmin(user) ? "/school" : "/training");
    }
  }, [isLoading, user, router]);

  if (isLoading || !user || !isTeacher(user)) return null;
  return <>{children}</>;
}
