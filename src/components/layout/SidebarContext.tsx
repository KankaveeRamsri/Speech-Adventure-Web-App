"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

const STORAGE_KEY = "speech-adventure-sidebar-collapsed";

interface SidebarContextValue {
  collapsed: boolean;
  toggle: () => void;
  setCollapsed: (v: boolean) => void;
  mobileOpen: boolean;
  setMobileOpen: (v: boolean) => void;
  mounted: boolean;
}

const SidebarContext = createContext<SidebarContextValue>({
  collapsed: false,
  toggle: () => {},
  setCollapsed: () => {},
  mobileOpen: false,
  setMobileOpen: () => {},
  mounted: false,
});

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "true") setCollapsed(true);
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      localStorage.setItem(STORAGE_KEY, String(collapsed));
    }
  }, [collapsed, mounted]);

  const toggle = useCallback(() => setCollapsed((v) => !v), []);

  // Close mobile drawer on route change handled by consumer

  return (
    <SidebarContext.Provider value={{ collapsed, toggle, setCollapsed, mobileOpen, setMobileOpen, mounted }}>
      {children}
    </SidebarContext.Provider>
  );
}

export const useSidebar = () => useContext(SidebarContext);
