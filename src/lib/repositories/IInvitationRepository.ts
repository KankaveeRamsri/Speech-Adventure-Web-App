import type { Invitation, CreateInvitationInput } from "@/types/invitations";

/**
 * Contract for creating and managing invitations.
 *
 * Follows the same useSyncExternalStore-compatible subscribe/snapshot
 * pattern as IProfileRepository and IObservationRepository.
 *
 * child_access grants are NOT performed here — documented as Phase 10.
 */
export interface IInvitationRepository {
  // ── useSyncExternalStore plumbing ──────────────────────────────────────────
  /** Returns all invitations created by the current user. */
  listInvitations(): Invitation[];
  getServerInvitations(): Invitation[];
  subscribe(callback: () => void): () => void;

  // ── Token lookup (also used by unauthenticated accept page) ───────────────
  /** Returns a single invitation by token, regardless of owner. Null when not found. */
  getInvitationByToken(token: string): Invitation | null;

  // ── Write operations ───────────────────────────────────────────────────────
  createInvitation(input: CreateInvitationInput, invitedBy: string): Promise<Invitation>;
  acceptInvitation(token: string): Promise<void>;
  revokeInvitation(id: string): Promise<void>;
}
