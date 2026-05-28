-- Phase 15: index for efficient parent-link lookups per child
-- Used by listStudentParentLinks and ensureParentInvitationForChild.

CREATE INDEX IF NOT EXISTS invitations_child_role_idx
  ON public.invitations (child_id, role, status)
  WHERE child_id IS NOT NULL;
