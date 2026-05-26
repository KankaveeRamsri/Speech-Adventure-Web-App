"use client";

import { useSyncExternalStore, useCallback } from "react";
import { useRepositories } from "@/lib/providers/RepositoryProvider";
import type { Invitation, CreateInvitationInput } from "@/types/invitations";
import { useAuth } from "@/hooks/useAuth";
import { invitationRoleToAccessRole } from "@/types/childAccess";

interface Rehydratable { rehydrate(): void }
function hasRehydrate(repo: unknown): repo is Rehydratable {
  return typeof (repo as Rehydratable).rehydrate === "function";
}

export function useInvitations() {
  const { invitations: repo, childAccess: accessRepo, profile: profileRepo } = useRepositories();
  const { user } = useAuth();

  const sentInvitations = useSyncExternalStore(
    repo.subscribe.bind(repo),
    repo.listSentInvitations.bind(repo),
    repo.getServerSentInvitations.bind(repo),
  );

  const receivedInvitations = useSyncExternalStore(
    repo.subscribe.bind(repo),
    repo.listReceivedInvitations.bind(repo),
    repo.getServerReceivedInvitations.bind(repo),
  );

  const createInvitation = useCallback(
    async (input: CreateInvitationInput): Promise<Invitation> => {
      const invitedBy = user?.id ?? "anonymous";
      return repo.createInvitation(input, invitedBy, user?.email);
    },
    [repo, user?.id, user?.email],
  );

  const acceptInvitation = useCallback(
    async (token: string): Promise<void> => {
      const inv = repo.getInvitationByToken(token);
      if (process.env.NODE_ENV !== "production") {
        console.debug("[useInvitations.acceptInvitation]", {
          tokenFound: Boolean(inv),
          tokenPrefix: token.slice(0, 8),
          childId: inv?.childId ?? null,
          acceptingUserId: user?.id ?? null,
          acceptingEmail: user?.email ?? null,
        });
      }

      await repo.acceptInvitation(token);

      // Local mode only: server-side Supabase RPC already creates the grant,
      // but the local invitation repo does not — so we mirror it here.
      if (inv && inv.childId && inv.childSnapshot && user?.id) {
        await accessRepo.grantChildAccess({
          childId: inv.childId,
          userId: user.id,
          role: invitationRoleToAccessRole(inv.role),
          grantedBy: inv.invitedBy,
          childSnapshot: inv.childSnapshot,
        });
      }

      // Refresh both stores so child selector picks up the newly-shared child.
      // Local repos are no-ops via the duck-type guard.
      if (hasRehydrate(accessRepo)) accessRepo.rehydrate();
      if (hasRehydrate(profileRepo)) profileRepo.rehydrate();
    },
    [repo, accessRepo, profileRepo, user],
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

  const pendingSentCount = sentInvitations.filter((inv) => inv.status === "pending").length;
  const pendingReceivedCount = receivedInvitations.filter((inv) => inv.status === "pending").length;

  return {
    // Sent (owner-managed)
    sentInvitations,
    pendingSentCount,
    // Received (addressed to me)
    receivedInvitations,
    pendingReceivedCount,
    // Back-compat alias — old callers treated this as "my sent invites"
    invitations: sentInvitations,
    pendingCount: pendingSentCount,
    // Actions
    createInvitation,
    acceptInvitation,
    revokeInvitation,
    getByToken,
  };
}
