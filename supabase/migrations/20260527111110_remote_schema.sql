drop extension if exists "pg_net";

drop function if exists "public"."archive_student"(p_child_id uuid);

alter table "public"."child_profiles" drop column "archived_at";

CREATE UNIQUE INDEX invitations_child_pending_email_idx ON public.invitations USING btree (child_id, lower(email)) WHERE ((status = 'pending'::public.invitation_status) AND (child_id IS NOT NULL));

set check_function_bodies = off;

CREATE OR REPLACE FUNCTION public.revoke_parent_link_for_child(p_child_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_org_id uuid;
BEGIN
  SELECT cp.organization_id INTO v_org_id
  FROM   child_profiles cp
  WHERE  cp.id = p_child_id;

  IF v_org_id IS NULL OR NOT is_org_admin(v_org_id) THEN
    RAISE EXCEPTION 'Not authorized: caller must be org admin for this child';
  END IF;

  -- Soft-revoke all active guardian grants
  UPDATE child_access
  SET    revoked_at = now()
  WHERE  child_id   = p_child_id
    AND  role       = 'guardian'
    AND  revoked_at IS NULL;

  -- Mark all parent invitations as revoked
  UPDATE invitations
  SET    status     = 'revoked',
         updated_at = now()
  WHERE  child_id   = p_child_id
    AND  role       = 'parent'
    AND  status     IN ('pending', 'accepted');
END;
$function$
;


  create policy "invitations: org admin select for org children"
  on "public"."invitations"
  as permissive
  for select
  to public
using (((child_id IS NOT NULL) AND (EXISTS ( SELECT 1
   FROM public.child_profiles cp
  WHERE ((cp.id = invitations.child_id) AND (cp.organization_id IS NOT NULL) AND public.is_org_admin(cp.organization_id))))));



