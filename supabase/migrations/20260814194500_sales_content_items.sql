create table public.sales_content_items (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  content_type text not null check (content_type in ('sales_script', 'objection_response', 'email_template', 'text_template')),
  title text not null check (char_length(title) between 2 and 160),
  body text not null check (char_length(body) between 2 and 12000),
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index sales_content_items_organization_type_idx
  on public.sales_content_items(organization_id, content_type, updated_at desc);

alter table public.sales_content_items enable row level security;

create policy "members read sales content"
on public.sales_content_items for select to authenticated
using (private.is_org_member(organization_id) or private.is_platform_owner());

create policy "tenant admins manage sales content"
on public.sales_content_items for all to authenticated
using (private.has_org_role(organization_id, array['tenant_admin']::public.organization_role[]) or private.is_platform_owner())
with check (private.has_org_role(organization_id, array['tenant_admin']::public.organization_role[]) or private.is_platform_owner());
