-- Tenant-owned product families group individual models and configurations.

create table public.product_families (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null check (char_length(name) between 2 and 120),
  slug text not null check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  description text not null default '' check (char_length(description) <= 500),
  image_path text,
  sort_order smallint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, slug),
  unique (id, organization_id)
);

alter table public.products add column family_id uuid;
alter table public.products
  add constraint products_family_organization_fkey
  foreign key (family_id, organization_id)
  references public.product_families(id, organization_id)
  on delete set null (family_id);

create index product_families_organization_sort_idx
  on public.product_families(organization_id, sort_order, name);
create index products_family_status_idx
  on public.products(family_id, status);

alter table public.product_families enable row level security;

create policy "members read organization product families"
on public.product_families for select to authenticated
using (private.is_org_member(organization_id) or private.is_platform_owner());

create policy "tenant admins manage organization product families"
on public.product_families for all to authenticated
using (private.has_org_role(organization_id, array['tenant_admin']::public.organization_role[]))
with check (private.has_org_role(organization_id, array['tenant_admin']::public.organization_role[]));

grant select, insert, update, delete on public.product_families to authenticated;
grant select, insert, update, delete on public.products to authenticated;

insert into public.product_families (organization_id, name, slug, description, sort_order)
select organization.id, family.name, family.slug, family.description, family.sort_order
from public.organizations organization
cross join (values
  ('ActivEV Pulse', 'activev-pulse', 'Explore every ActivEV Pulse model and configuration.', 10),
  ('Bintelli Beyond', 'bintelli-beyond', 'Explore every Bintelli Beyond model and configuration.', 20),
  ('Bintelli Nexus', 'bintelli-nexus', 'Explore every Bintelli Nexus model and configuration.', 30),
  ('SIVO Edge', 'sivo-edge', 'Explore every SIVO Edge model and configuration.', 40)
) as family(name, slug, description, sort_order)
where organization.slug = 'bgc-dealerships'
on conflict (organization_id, slug) do update set
  name = excluded.name,
  description = excluded.description,
  sort_order = excluded.sort_order,
  updated_at = now();

update public.products product
set family_id = family.id
from public.product_families family
where product.organization_id = family.organization_id
  and product.family_id is null
  and (
    (family.slug = 'activev-pulse' and lower(product.name) like '%pulse%')
    or (family.slug = 'bintelli-beyond' and lower(product.name) like '%beyond%')
    or (family.slug = 'bintelli-nexus' and lower(product.name) like '%nexus%')
    or (family.slug = 'sivo-edge' and (lower(product.name) like '%sivo%' or lower(product.name) like '%edge%'))
  );
