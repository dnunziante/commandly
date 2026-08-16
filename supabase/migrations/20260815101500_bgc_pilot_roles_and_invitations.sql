-- Adds a location assignment to memberships/invitations and shared records for
-- employee training progress and Sales Assistant conversations. Existing BGC data
-- is preserved; all added columns are nullable until a new invite is accepted.

alter table public.organization_memberships
  add column if not exists location_id uuid;

alter table public.organization_memberships
  drop constraint if exists organization_memberships_location_organization_fkey;

alter table public.organization_memberships
  add constraint organization_memberships_location_organization_fkey
  foreign key (location_id, organization_id)
  references public.locations (id, organization_id)
  on delete set null (location_id);

create index if not exists organization_memberships_location_id_idx
  on public.organization_memberships (location_id)
  where location_id is not null;

alter table public.organization_invitations
  add column if not exists location_id uuid,
  add column if not exists auth_user_id uuid references public.profiles(id) on delete set null;

alter table public.organization_invitations
  drop constraint if exists organization_invitations_location_organization_fkey;

alter table public.organization_invitations
  add constraint organization_invitations_location_organization_fkey
  foreign key (location_id, organization_id)
  references public.locations (id, organization_id)
  on delete set null (location_id);

create index if not exists organization_invitations_pending_email_idx
  on public.organization_invitations (organization_id, lower(email))
  where status = 'pending';

create index if not exists organization_invitations_auth_user_id_idx
  on public.organization_invitations (auth_user_id)
  where auth_user_id is not null;

create table if not exists public.training_progress (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  lesson_id uuid not null,
  status text not null default 'not_started' check (status in ('not_started', 'in_progress', 'completed')),
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, user_id, lesson_id),
  foreign key (lesson_id, organization_id)
    references public.training_lessons (id, organization_id) on delete cascade,
  check (
    (status = 'not_started' and started_at is null and completed_at is null)
    or (status = 'in_progress' and started_at is not null and completed_at is null)
    or (status = 'completed' and started_at is not null and completed_at is not null)
  )
);

create index if not exists training_progress_org_user_idx
  on public.training_progress (organization_id, user_id, updated_at desc);

create table if not exists public.assistant_conversations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  location_id uuid,
  title text not null default 'New conversation' check (char_length(title) between 1 and 180),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (location_id, organization_id)
    references public.locations (id, organization_id) on delete set null (location_id)
);

create index if not exists assistant_conversations_org_user_idx
  on public.assistant_conversations (organization_id, user_id, updated_at desc);

alter table public.training_progress enable row level security;
alter table public.assistant_conversations enable row level security;

drop policy if exists "members read organization memberships" on public.organization_memberships;
create policy "users read permitted organization memberships"
  on public.organization_memberships for select to authenticated
  using (
    user_id = (select auth.uid())
    or private.has_org_role(organization_id, array['tenant_admin'::organization_role, 'manager'::organization_role])
    or private.is_platform_owner()
  );

drop policy if exists "members read published organization products" on public.products;
create policy "members read published organization products"
  on public.products for select to authenticated
  using (
    (private.is_org_member(organization_id) and status = 'published'::product_status)
    or private.has_org_role(organization_id, array['tenant_admin'::organization_role])
    or private.is_platform_owner()
  );

drop policy if exists "members read organization knowledge documents" on public.knowledge_documents;
create policy "members read organization knowledge documents"
  on public.knowledge_documents for select to authenticated
  using (
    private.is_org_member(organization_id)
    or private.is_platform_owner()
  );

drop policy if exists "members read sales content" on public.sales_content_items;
create policy "members read published sales content"
  on public.sales_content_items for select to authenticated
  using (
    (private.is_org_member(organization_id) and status = 'published')
    or private.has_org_role(organization_id, array['tenant_admin'::organization_role])
    or private.is_platform_owner()
  );

drop policy if exists "members read organization settings" on public.organization_settings;
create policy "tenant admins read organization settings"
  on public.organization_settings for select to authenticated
  using (
    private.has_org_role(organization_id, array['tenant_admin'::organization_role])
    or private.is_platform_owner()
  );

drop policy if exists "members read organization instructions" on public.organization_instructions;
create policy "tenant admins read organization instructions"
  on public.organization_instructions for select to authenticated
  using (
    private.has_org_role(organization_id, array['tenant_admin'::organization_role])
    or private.is_platform_owner()
  );

create policy "employees read own training progress"
  on public.training_progress for select to authenticated
  using (
    user_id = (select auth.uid())
    or private.has_org_role(organization_id, array['tenant_admin'::organization_role, 'manager'::organization_role])
    or private.is_platform_owner()
  );

create policy "employees create own training progress"
  on public.training_progress for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and private.is_org_member(organization_id)
  );

create policy "employees update own training progress"
  on public.training_progress for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()) and private.is_org_member(organization_id));

create policy "users read permitted assistant conversations"
  on public.assistant_conversations for select to authenticated
  using (
    user_id = (select auth.uid())
    or private.has_org_role(organization_id, array['tenant_admin'::organization_role, 'manager'::organization_role])
    or private.is_platform_owner()
  );

create policy "users create own assistant conversations"
  on public.assistant_conversations for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and private.is_org_member(organization_id)
  );

create policy "users update own assistant conversations"
  on public.assistant_conversations for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()) and private.is_org_member(organization_id));

create or replace function public.accept_organization_invitation()
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
  where status = 'pending'
    and expires_at > now()
    and auth_user_id = auth.uid()
    and lower(email) = signed_in_email
  order by created_at desc
  limit 1
  for update;

  if not found then
    raise exception 'No active invitation is available for this account.';
  end if;

  insert into public.organization_memberships (organization_id, user_id, role, status, location_id)
  values (matching_invitation.organization_id, auth.uid(), matching_invitation.role, 'active', matching_invitation.location_id)
  on conflict (organization_id, user_id) do update
    set role = excluded.role,
        status = 'active',
        location_id = excluded.location_id;

  update public.organization_invitations
  set status = 'accepted', accepted_by = auth.uid(), accepted_at = now()
  where id = matching_invitation.id;

  return query select matching_invitation.organization_id, matching_invitation.role, matching_invitation.location_id;
end;
$$;

revoke all on function public.accept_organization_invitation() from public, anon;
grant execute on function public.accept_organization_invitation() to authenticated;
