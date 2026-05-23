import * as storage from "@/lib/storage/childAccessStorage";
import type { IChildAccessRepository } from "@/lib/repositories/IChildAccessRepository";
import type { ChildAccess, GrantChildAccessInput, ChildPermissions } from "@/types/childAccess";
import { ROLE_DEFAULT_PERMISSIONS } from "@/types/childAccess";

/**
 * localStorage-backed implementation of IChildAccessRepository.
 *
 * Grants are stored in an unscoped shared key so both grantor and grantee
 * can see the same data on the same device. setScope() updates the filter
 * userId only — it does not change the underlying storage key.
 */
export class LocalChildAccessRepository implements IChildAccessRepository {
  subscribe(callback: () => void): () => void {
    return storage.subscribeToChildAccess(callback);
  }

  listReceivedGrants(): ChildAccess[] {
    return storage.getReceivedGrants();
  }

  getServerReceivedGrants(): ChildAccess[] {
    return storage.getServerReceivedGrants();
  }

  listIssuedGrants(): ChildAccess[] {
    return storage.getIssuedGrants();
  }

  async grantChildAccess(input: GrantChildAccessInput): Promise<ChildAccess> {
    const permissions = { ...ROLE_DEFAULT_PERMISSIONS[input.role], ...input.permissions };
    const grant: ChildAccess = {
      id: storage.generateId(),
      childId: input.childId,
      userId: input.userId,
      role: input.role,
      permissions,
      grantedBy: input.grantedBy,
      createdAt: new Date().toISOString(),
      childSnapshot: input.childSnapshot,
    };
    storage.addGrant(grant);
    return grant;
  }

  async revokeChildAccess(grantId: string): Promise<void> {
    const received = storage.getReceivedGrants();
    const issued = storage.getIssuedGrants();
    const grant = [...received, ...issued].find((g) => g.id === grantId);
    if (!grant) return;
    storage.updateGrant({ ...grant, revokedAt: new Date().toISOString() });
  }

  async updateChildPermissions(
    grantId: string,
    permissions: Partial<ChildPermissions>,
  ): Promise<void> {
    const received = storage.getReceivedGrants();
    const issued = storage.getIssuedGrants();
    const grant = [...received, ...issued].find((g) => g.id === grantId);
    if (!grant) return;
    storage.updateGrant({
      ...grant,
      permissions: { ...grant.permissions, ...permissions },
    });
  }

  setScope(userId: string | null): void {
    storage.setScope(userId);
  }
}
