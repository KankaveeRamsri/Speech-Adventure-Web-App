"use client";

import { useSyncExternalStore, useCallback } from "react";
import { useRepositories } from "@/lib/providers/RepositoryProvider";
import type { Invitation, CreateInvitationInput } from "@/types/invitations";
import { useAuth } from "@/hooks/useAuth";

const EMPTY_INVITATIONS: Invitation[] = [];
const getEmptyInvitations = (): Invitation[] => EMPTY_INVITATIONS;

export function useInvitations() {
  const { invitations: repo } = useRepositories();
  const { user } = useAuth();

  const invitations = useSyncExternalStore(
    repo.subscribe.bind(repo),
    repo.listInvitations.bind(repo),
    getEmptyInvitations,
  );

  const createInvitation = useCallback(
    async (input: CreateInvitationInput): Promise<Invitation> => {
      const invitedBy = user?.id ?? "anonymous";
      return repo.createInvitation(input, invitedBy);
    },
    [repo, user?.id],
  );

  const acceptInvitation = useCallback(
    async (token: string): Promise<void> => {
      return repo.acceptInvitation(token);
    },
    [repo],
  );

  const revokeInvitation = useCallback(
    async (id: string): Promise<void> => {
      return repo.revokeInvitation(id);
    },
    [repo],
  );

  const getByToken = useCallback(
    (token: string): Invitation | null => {
      return repo.getInvitationByToken(token);
    },
    [repo],
  );

  const pendingCount = invitations.filter((inv) => inv.status === "pending").length;

  return {
    invitations,
    pendingCount,
    createInvitation,
    acceptInvitation,
    revokeInvitation,
    getByToken,
  };
}
