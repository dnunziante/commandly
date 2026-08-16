create table public.organization_settings (
  organization_id uuid primary key references public.organizations(id) on delete cascade,
  display_name text not null,
  primary_color text not null default '#0B5CFF' check (primary_color ~ '^#[0-9A-Fa-f]{6}$'),
  contact_email text,
  default_location_id uuid references public.locations(id) on delete set null,
  assistant_instructions text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index organization_settings_default_location_id_idx
  on public.organization_settings(default_location_id);

alter table public.organization_settings enable row level security;

create policy "members read organization settings"
on public.organization_settings for select to authenticated
using (private.is_org_member(organization_id) or private.is_platform_owner());

create policy "tenant admins manage organization settings"
on public.organization_settings for all to authenticated
using (private.has_org_role(organization_id, array['tenant_admin']::public.organization_role[]) or private.is_platform_owner())
with check (private.has_org_role(organization_id, array['tenant_admin']::public.organization_role[]) or private.is_platform_owner());
