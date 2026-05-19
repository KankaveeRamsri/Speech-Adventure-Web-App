"use client";

import { useSyncExternalStore } from "react";
import { useRepositories } from "@/lib/providers/RepositoryProvider";
import type { ChildProfileData } from "@/lib/child-profile/childProfileStorage";

export type { ChildProfileData };

// Same stable-snapshot pattern as useSpeechProgress — avoids hydration mismatch.
const noopSubscribe = () => () => {};
const clientTrue = () => true as const;
const serverFalse = () => false as const;

export function useChildProfile() {
  const { profile: repo } = useRepositories();

  const profile = useSyncExternalStore(
    repo.subscribe.bind(repo),
    repo.getProfile.bind(repo),
    repo.getServerProfile.bind(repo),
  );

  // false during SSR + hydration, true right after — matches the server snapshot.
  const isHydrated = useSyncExternalStore(noopSubscribe, clientTrue, serverFalse);

  return {
    profile,
    hasProfile: profile !== null,
    isHydrated,
    saveProfile: (data: ChildProfileData) => repo.saveProfile(data),
    clearProfile: () => repo.clearProfile(),
  };
}
