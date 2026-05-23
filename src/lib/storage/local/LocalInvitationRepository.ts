import * as storage from "@/lib/storage/invitationStorage";
import type { IInvitationRepository } from "@/lib/repositories/IInvitationRepository";
import type { Invitation, CreateInvitationInput } from "@/types/invitations";
import { getProfiles } from "@/lib/child-profile/childProfileListStorage";

/**
 * localStorage-backed implementation of IInvitationRepository.
 *
 * Invitations are scoped per user (same pattern as profile/observations).
 * The token is embedded in accept links: /invite/[token]
 */
export class LocalInvitationRepository implements IInvitationRepository {
  // ── useSyncExternalStore plumbing ────────────────────────────────────────────

  listInvitations(): Invitation[] {
    return storage.getInvitations();
  }

  getServerInvitations(): Invitation[] {
    return storage.getServerInvitations();
  }

  subscribe(callback: () => void): () => void {
    return storage.subscribeToInvitations(callback);
  }

  // ── Token lookup ─────────────────────────────────────────────────────────────

  getInvitationByToken(token: string): Invitation | null {
    return storage.findByToken(token);
  }

  // ── Write operations ─────────────────────────────────────────────────────────

  async createInvitation(
    input: CreateInvitationInput,
    invitedBy: string,
  ): Promise<Invitation> {
    const now = new Date().toISOString();
    const childSnapshot = input.childId
      ? getProfiles().find((p) => p.id === input.childId)
      : undefined;
    const invitation: Invitation = {
      id: storage.generateToken(),
      email: input.email.trim().toLowerCase(),
      role: input.role,
      childId: input.childId,
      invitedBy,
      status: "pending",
      token: storage.generateToken(),
      expiresAt: storage.makeExpiresAt(),
      createdAt: now,
      childSnapshot,
    };
    storage.addInvitation(invitation);
    return invitation;
  }

  async acceptInvitation(token: string): Promise<void> {
    const inv = storage.findByToken(token);
    if (!inv) return;
    if (inv.status !== "pending") return;
    storage.updateInvitation({
      ...inv,
      status: "accepted",
      acceptedAt: new Date().toISOString(),
    });
  }

  async revokeInvitation(id: string): Promise<void> {
    const invitations = storage.getInvitations();
    const inv = invitations.find((i) => i.id === id);
    if (!inv) return;
    storage.updateInvitation({ ...inv, status: "revoked" });
  }

  setScope(userId: string | null): void {
    storage.setScope(userId);
  }
}
