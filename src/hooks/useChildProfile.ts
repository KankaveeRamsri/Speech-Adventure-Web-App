"use client";

import { useSyncExternalStore } from "react";
import { useRepositories } from "@/lib/providers/RepositoryProvider";
import type { ChildProfileData } from "@/lib/child-profile/childProfileStorage";

export type { ChildProfileData };

// Stable server-side snapshots
// IMPORTANT: server snapshots must return the exact same reference on every call.
// useSyncExternalStore uses Object.is() — a new [] each call causes an infinite loop.
const EMPTY_PROFILES: ChildProfileData[] = [];

const noopSubscribe = () => () => {};
const clientTrue = () => true as const;
const serverFalse = () => false as const;
const getEmptyProfiles = (): ChildProfileData[] => EMPTY_PROFILES;
const serverNullId = (): string | null => null;

export function useChildProfile() {
  const { profile: repo } = useRepositories();

  const profile = useSyncExternalStore(
    repo.subscribe.bind(repo),
    repo.getProfile.bind(repo),
    repo.getServerProfile.bind(repo),
  );

  // List of all child profiles for this user account
  const profiles = useSyncExternalStore(
    repo.subscribe.bind(repo),
    () => repo.listProfiles(),
    getEmptyProfiles,
  );

  // ID of the currently selected child
  const selectedChildId = useSyncExternalStore(
    repo.subscribe.bind(repo),
    () => repo.getSelectedChildId(),
    serverNullId,
  );

  // false during SSR + hydration, true right after
  const isHydrated = useSyncExternalStore(noopSubscribe, clientTrue, serverFalse);

  return {
    profile,
    profiles,
    selectedChildId,
    hasProfile: profile !== null,
    isHydrated,
    saveProfile: (data: ChildProfileData) => repo.saveProfile(data),
    clearProfile: () => repo.clearProfile(),
    /** Switch to a different child. Callers should also call setSelectedSound(child.targetSound). */
    selectChild: (id: string) => repo.setSelectedChildId(id),
  };
}
