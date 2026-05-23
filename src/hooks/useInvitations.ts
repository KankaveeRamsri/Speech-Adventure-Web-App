"use client";

import { useSyncExternalStore, useCallback } from "react";
import { useRepositories } from "@/lib/providers/RepositoryProvider";
import type { Invitation, CreateInvitationInput } from "@/types/invitations";
import { useAuth } from "@/hooks/useAuth";
import { invitationRoleToAccessRole } from "@/types/childAccess";

const EMPTY_INVITATIONS: Invitation[] = [];
const getEmptyInvitations = (): Invitation[] => EMPTY_INVITATIONS;

export function useInvitations() {
  const { invitations: repo, childAccess: accessRepo } = useRepositories();
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
      const inv = repo.getInvitationByToken(token);
      await repo.acceptInvitation(token);
      // If the invitation was tied to a child and we know who accepted, create a grant.
      if (inv && inv.childId && inv.childSnapshot && user?.id) {
        await accessRepo.grantChildAccess({
          childId: inv.childId,
          userId: user.id,
          role: invitationRoleToAccessRole(inv.role),
          grantedBy: inv.invitedBy,
          childSnapshot: inv.childSnapshot,
        });
      }
    },
    [repo, accessRepo, user],
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
