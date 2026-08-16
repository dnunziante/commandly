-- Keep the privileged acceptance work out of the exposed public API schema.
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

  insert into public.organization_memberships (organization_id, user_id, role, status, location_id)
  values (matching_invitation.organization_id, auth.uid(), matching_invitation.role, 'active', matching_invitation.location_id)
  on conflict (organization_id, user_id) do update set role = excluded.role, status = 'active', location_id = excluded.location_id;

  update public.organization_invitations set status = 'accepted', accepted_by = auth.uid(), accepted_at = now() where id = matching_invitation.id;
  return query select matching_invitation.organization_id, matching_invitation.role, matching_invitation.location_id;
end;
$$;

revoke all on function private.accept_organization_invitation() from public;
grant usage on schema private to authenticated;
grant execute on function private.accept_organization_invitation() to authenticated;

create or replace function public.accept_organization_invitation()
returns table (accepted_organization_id uuid, accepted_role public.organization_role, accepted_location_id uuid)
language sql
security invoker
set search_path = public, private
as $$ select * from private.accept_organization_invitation(); $$;

revoke all on function public.accept_organization_invitation() from public, anon;
grant execute on function public.accept_organization_invitation() to authenticated;
