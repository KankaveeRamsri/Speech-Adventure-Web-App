"use client";

import { useEffect, useState } from "react";
import AppTopBar from "./AppTopBar";
import AppSidebar from "./AppSidebar";
import MobileNav from "./MobileNav";
import { SidebarProvider, useSidebar } from "./SidebarContext";

function AppShellInner({ children }: { children: React.ReactNode }) {
  const { collapsed, mounted } = useSidebar();
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    setIsDesktop(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Before mount: Tailwind `lg:pl-[240px]` provides the default expanded width.
  // After mount: if the user has collapsed the sidebar, override to 72px.
  // This avoids a layout shift — the expanded width (240px) is the correct SSR default.
  const paddingOverride =
    mounted && isDesktop && collapsed ? { paddingLeft: "72px" } : undefined;

  return (
    <div className="min-h-screen bg-bg print:bg-white">
      {/* Minimal mobile top bar — hidden on desktop */}
      <AppTopBar />
      <AppSidebar />
      {/* pt-11: below thin mobile bar (hidden on desktop) | lg:pt-0: no top bar on desktop | pb-16 lg:pb-0: above mobile bottom nav */}
      <main
        className="pt-11 lg:pt-0 pb-16 lg:pb-0 print:pt-0 print:!pl-0 print:pb-0 lg:pl-[240px] transition-[padding-left] duration-200 ease-in-out"
        style={paddingOverride}
      >
        {children}
      </main>
      <MobileNav />
    </div>
  );
}

interface Props {
  children: React.ReactNode;
}

export default function AppShell({ children }: Props) {
  return (
    <SidebarProvider>
      <AppShellInner>{children}</AppShellInner>
    </SidebarProvider>
  );
}
