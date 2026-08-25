"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useTrustedAppRole } from "@/hooks/useTrustedAppRole";
import { getPostAuthDestination } from "@/lib/auth/postAuthDestination";

/**
 * Teacher V2 route guard (Phase 1.1) — gates on the trusted application role
 * (public.user_app_roles, via useTrustedAppRole), never on
 * user.role (user_metadata.role, which the signed-in user can edit
 * themselves). A user who manually sets user_metadata.role = "teacher" but
 * whose trusted role is "parent" (or anything else) must not reach this
 * layout's children — see the state machine below.
 *
 * session known → role loading → neutral loading state → trusted role
 * resolved → allow or redirect. A query failure fails closed (children are
 * never rendered) with a retry affordance, rather than silently granting or
 * denying access.
 */
export default function TeacherLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading: authLoading } = useAuth();
  const { status, role, retry } = useTrustedAppRole();
  const router = useRouter();

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace("/auth/signin?redirect=/teacher");
      return;
    }
    if (status === "ready" && role !== "teacher") {
      router.replace(getPostAuthDestination(user, role));
    }
  }, [authLoading, user, status, role, router]);

  if (authLoading || !user) return null;

  // Neutral loading state — never render Teacher content, and never assume
  // a role, while the trusted source is still resolving.
  if (status === "idle" || status === "loading") {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <div className="w-6 h-6 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  // Fail closed: never render Teacher content on a query failure. Offer a
  // retry instead of silently redirecting a possibly-real Teacher away.
  if (status === "error") {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center px-4">
        <div className="text-center max-w-xs">
          <p className="text-sm text-text-muted mb-4">
            ไม่สามารถตรวจสอบสิทธิ์การเข้าถึงได้ กรุณาลองใหม่
          </p>
          <button
            type="button"
            onClick={retry}
            className="bg-primary text-white font-semibold rounded-xl px-5 py-2.5 text-sm hover:bg-primary/90 active:scale-[0.98] transition-all"
          >
            ลองใหม่
          </button>
        </div>
      </div>
    );
  }

  // status === "ready": only render for a confirmed trusted Teacher. For
  // any other resolved role, the redirect effect above is already in
  // flight — render nothing in the meantime.
  if (role !== "teacher") return null;

  return <>{children}</>;
}
