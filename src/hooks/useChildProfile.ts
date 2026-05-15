"use client";

import { useSyncExternalStore } from "react";
import {
  subscribeToProfile,
  getProfile,
  getServerProfile,
  saveProfile,
  clearProfile,
} from "@/lib/child-profile/childProfileStorage";
import type { ChildProfileData } from "@/lib/child-profile/childProfileStorage";

export type { ChildProfileData };

export function useChildProfile() {
  const profile = useSyncExternalStore(
    subscribeToProfile,
    getProfile,
    getServerProfile
  );

  return {
    profile,
    hasProfile: profile !== null,
    isHydrated: typeof window !== "undefined",
    saveProfile,
    clearProfile,
  };
}
