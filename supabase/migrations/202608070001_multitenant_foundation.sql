-- Sales Assistant AI: multi-tenant identity and authorization foundation.
-- Apply with the Supabase CLI or paste into the Supabase SQL editor.

create extension if not exists pgcrypto;

create type public.organization_role as enum (
  'tenant_admin',
  'manager',
  'salesperson'
);

create type public.membership_status as enum (
  'invited',
  'active',
  'suspended'
);

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  status text not null default 'active' check (status in ('active', 'suspended')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.locations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  city text,
  state text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (organization_id, name)
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  is_platform_owner boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.organization_memberships (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.organization_role not null default 'salesperson',
  status public.membership_status not null default 'invited',
  created_at timestamptz not null default now(),
  unique (organization_id, user_id)
);

-- Platform-owned methodology is deliberately separate from tenant content.
create table public.platform_methodologies (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  name text not null,
  content text not null,
  version integer not null default 1,
  is_active boolean not null default true,
  updated_at timestamptz not null default now()
);

-- Tenant-specific AI guidance never contains platform-wide methodology.
create table public.organization_instructions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  instruction_type text not null check (instruction_type in ('brand', 'policy', 'assistant')),
  content text not null,
  is_active boolean not null default true,
  updated_at timestamptz not null default now()
);

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create or replace function private.is_platform_owner()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select is_platform_owner from public.profiles where id = auth.uid()), false)
$$;

create or replace function private.is_org_member(target_org uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.organization_memberships
    where organization_id = target_org
      and user_id = auth.uid()
      and status = 'active'
  )
$$;

create or replace function private.has_org_role(target_org uuid, allowed_roles public.organization_role[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select private.is_platform_owner() or exists (
    select 1 from public.organization_memberships
    where organization_id = target_org
      and user_id = auth.uid()
      and status = 'active'
      and role = any(allowed_roles)
  )
$$;

grant usage on schema private to authenticated;
grant execute on function private.is_platform_owner() to authenticated;
grant execute on function private.is_org_member(uuid) to authenticated;
grant execute on function private.has_org_role(uuid, public.organization_role[]) to authenticated;

alter table public.organizations enable row level security;
alter table public.locations enable row level security;
alter table public.profiles enable row level security;
alter table public.organization_memberships enable row level security;
alter table public.platform_methodologies enable row level security;
alter table public.organization_instructions enable row level security;

create policy "members read their organizations" on public.organizations
for select to authenticated using (private.is_org_member(id) or private.is_platform_owner());
create policy "platform owners manage organizations" on public.organizations
for all to authenticated using (private.is_platform_owner()) with check (private.is_platform_owner());

create policy "members read organization locations" on public.locations
for select to authenticated using (private.is_org_member(organization_id) or private.is_platform_owner());
create policy "tenant admins manage locations" on public.locations
for all to authenticated
using (private.has_org_role(organization_id, array['tenant_admin']::public.organization_role[]))
with check (private.has_org_role(organization_id, array['tenant_admin']::public.organization_role[]));

create policy "users read their profile" on public.profiles
for select to authenticated using (id = auth.uid() or private.is_platform_owner());
create policy "users update their profile" on public.profiles
for update to authenticated using (id = auth.uid())
with check (id = auth.uid() and is_platform_owner = private.is_platform_owner());
create policy "platform owners manage profiles" on public.profiles
for all to authenticated using (private.is_platform_owner()) with check (private.is_platform_owner());

create policy "members read organization memberships" on public.organization_memberships
for select to authenticated using (private.is_org_member(organization_id) or private.is_platform_owner());
create policy "tenant admins manage memberships" on public.organization_memberships
for all to authenticated
using (private.has_org_role(organization_id, array['tenant_admin']::public.organization_role[]))
with check (private.has_org_role(organization_id, array['tenant_admin']::public.organization_role[]));

create policy "authenticated users read active methodology" on public.platform_methodologies
for select to authenticated using (is_active or private.is_platform_owner());
create policy "platform owners manage methodology" on public.platform_methodologies
for all to authenticated using (private.is_platform_owner()) with check (private.is_platform_owner());

create policy "members read organization instructions" on public.organization_instructions
for select to authenticated using (private.is_org_member(organization_id) or private.is_platform_owner());
create policy "tenant admins manage organization instructions" on public.organization_instructions
for all to authenticated
using (private.has_org_role(organization_id, array['tenant_admin']::public.organization_role[]))
with check (private.has_org_role(organization_id, array['tenant_admin']::public.organization_role[]));

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)));
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

create index organization_memberships_user_id_idx on public.organization_memberships(user_id);
create index locations_organization_id_idx on public.locations(organization_id);
create index organization_instructions_organization_id_idx on public.organization_instructions(organization_id);
