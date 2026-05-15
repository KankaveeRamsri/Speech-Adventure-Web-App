"use client";

import AppTopBar from "./AppTopBar";
import AppSidebar from "./AppSidebar";
import MobileNav from "./MobileNav";

interface Props {
  children: React.ReactNode;
}

export default function AppShell({ children }: Props) {
  return (
    <div className="min-h-screen bg-bg print:bg-white">
      <AppTopBar />
      <AppSidebar />
      {/* pt-14: below fixed topbar | lg:pl-[220px]: beside fixed sidebar | pb-16 lg:pb-0: above fixed mobile nav */}
      <main className="pt-14 lg:pl-[220px] pb-16 lg:pb-0 print:pt-0 print:pl-0 print:pb-0">
        {children}
      </main>
      <MobileNav />
    </div>
  );
}
