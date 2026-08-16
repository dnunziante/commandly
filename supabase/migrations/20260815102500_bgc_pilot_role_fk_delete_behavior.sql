-- Preserve the organization reference if an assigned location is removed.
alter table public.organization_memberships drop constraint if exists organization_memberships_location_organization_fkey;
alter table public.organization_memberships add constraint organization_memberships_location_organization_fkey foreign key (location_id, organization_id) references public.locations (id, organization_id) on delete set null (location_id);

alter table public.organization_invitations drop constraint if exists organization_invitations_location_organization_fkey;
alter table public.organization_invitations add constraint organization_invitations_location_organization_fkey foreign key (location_id, organization_id) references public.locations (id, organization_id) on delete set null (location_id);

alter table public.assistant_conversations drop constraint if exists assistant_conversations_location_id_organization_id_fkey;
alter table public.assistant_conversations add constraint assistant_conversations_location_id_organization_id_fkey foreign key (location_id, organization_id) references public.locations (id, organization_id) on delete set null (location_id);
