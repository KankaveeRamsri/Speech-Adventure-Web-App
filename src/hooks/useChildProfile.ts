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

// Same stable-snapshot pattern as useSpeechProgress — avoids hydration mismatch.
const noopSubscribe = () => () => {};
const clientTrue = () => true as const;
const serverFalse = () => false as const;

export function useChildProfile() {
  const profile = useSyncExternalStore(
    subscribeToProfile,
    getProfile,
    getServerProfile
  );

  // false during SSR + hydration, true right after — matches the server snapshot.
  const isHydrated = useSyncExternalStore(noopSubscribe, clientTrue, serverFalse);

  return {
    profile,
    hasProfile: profile !== null,
    isHydrated,
    saveProfile,
    clearProfile,
  };
}
