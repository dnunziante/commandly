-- Adds durable identity details to profiles and preserves the existing tenant
-- membership model for roles, locations, and account status.
alter table public.profiles
  add column if not exists first_name text,
  add column if not exists last_name text,
  add column if not exists phone text,
  add column if not exists email text;

alter table public.organization_invitations
  add column if not exists first_name text,
  add column if not exists last_name text,
  add column if not exists phone text;

alter table public.profiles
  drop constraint if exists profiles_first_name_length,
  drop constraint if exists profiles_last_name_length,
  drop constraint if exists profiles_phone_length;

alter table public.profiles
  add constraint profiles_first_name_length check (first_name is null or char_length(first_name) between 1 and 100),
  add constraint profiles_last_name_length check (last_name is null or char_length(last_name) between 1 and 100),
  add constraint profiles_phone_length check (phone is null or char_length(phone) between 3 and 40);

alter table public.organization_invitations
  drop constraint if exists organization_invitations_first_name_length,
  drop constraint if exists organization_invitations_last_name_length,
  drop constraint if exists organization_invitations_phone_length;

alter table public.organization_invitations
  add constraint organization_invitations_first_name_length check (first_name is null or char_length(first_name) between 1 and 100),
  add constraint organization_invitations_last_name_length check (last_name is null or char_length(last_name) between 1 and 100),
  add constraint organization_invitations_phone_length check (phone is null or char_length(phone) between 3 and 40);

-- Safely fill the new profile email field from Supabase Auth for existing users.
update public.profiles profile
set email = auth_user.email
from auth.users auth_user
where profile.id = auth_user.id and profile.email is null;

create index if not exists profiles_email_search_idx on public.profiles (lower(email));
create index if not exists organization_memberships_filter_idx
  on public.organization_memberships (organization_id, status, role, location_id);
create index if not exists organization_invitations_filter_idx
  on public.organization_invitations (organization_id, status, role, location_id);

-- This private helper keeps profile reads tenant-safe without exposing another
-- tenant's profile through a direct API request.
create or replace function private.can_manage_user_profile(target_profile_id uuid)
returns boolean
language sql
security definer
set search_path = public, auth
stable
as $$
  select private.is_platform_owner()
    or exists (
      select 1
      from public.organization_memberships administrator
      join public.organization_memberships target
        on target.organization_id = administrator.organization_id
      where administrator.user_id = (select auth.uid())
        and administrator.status = 'active'
        and administrator.role = 'tenant_admin'
        and target.user_id = target_profile_id
    );
$$;

revoke all on function private.can_manage_user_profile(uuid) from public, anon;
grant usage on schema private to authenticated;
grant execute on function private.can_manage_user_profile(uuid) to authenticated;

drop policy if exists "users read their profile" on public.profiles;
create policy "users read permitted profiles"
  on public.profiles for select to authenticated
  using (
    id = (select auth.uid())
    or (select private.can_manage_user_profile(id))
  );

drop policy if exists "tenant admins manage memberships" on public.organization_memberships;
create policy "tenant admins and owners manage memberships"
  on public.organization_memberships for all to authenticated
  using (
    private.has_org_role(organization_id, array['tenant_admin'::public.organization_role])
    or private.is_platform_owner()
  )
  with check (
    private.has_org_role(organization_id, array['tenant_admin'::public.organization_role])
    or private.is_platform_owner()
  );

-- Acceptance transfers durable identity data from the invitation to the profile,
-- while preserving the existing role/location membership relationship.
create or replace function private.accept_organization_invitation()
returns table (accepted_organization_id uuid, accepted_role public.organization_role, accepted_location_id uuid)
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  matching_invitation public.organization_invitations%rowtype;
  signed_in_email text := lower(coalesce(auth.jwt() ->> 'email', ''));
begin
  if auth.uid() is null or signed_in_email = '' then
    raise exception 'You must be signed in to accept an invitation.';
  end if;

  select * into matching_invitation
  from public.organization_invitations
  where status = 'pending' and expires_at > now() and auth_user_id = auth.uid() and lower(email) = signed_in_email
  order by created_at desc limit 1 for update;
  if not found then raise exception 'No active invitation is available for this account.'; end if;

  insert into public.profiles (id, full_name, first_name, last_name, phone, email)
  values (
    auth.uid(),
    nullif(trim(concat_ws(' ', matching_invitation.first_name, matching_invitation.last_name)), ''),
    matching_invitation.first_name,
    matching_invitation.last_name,
    matching_invitation.phone,
    matching_invitation.email
  )
  on conflict (id) do update set
    full_name = coalesce(excluded.full_name, public.profiles.full_name),
    first_name = coalesce(excluded.first_name, public.profiles.first_name),
    last_name = coalesce(excluded.last_name, public.profiles.last_name),
    phone = coalesce(excluded.phone, public.profiles.phone),
    email = excluded.email;

  insert into public.organization_memberships (organization_id, user_id, role, status, location_id)
  values (matching_invitation.organization_id, auth.uid(), matching_invitation.role, 'active', matching_invitation.location_id)
  on conflict (organization_id, user_id) do update set role = excluded.role, status = 'active', location_id = excluded.location_id;

  update public.organization_invitations set status = 'accepted', accepted_by = auth.uid(), accepted_at = now() where id = matching_invitation.id;
  return query select matching_invitation.organization_id, matching_invitation.role, matching_invitation.location_id;
end;
$$;

revoke all on function private.accept_organization_invitation() from public;
grant execute on function private.accept_organization_invitation() to authenticated;
