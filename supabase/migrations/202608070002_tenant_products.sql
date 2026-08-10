-- Tenant-scoped product catalog with location-specific availability and pricing.

create type public.product_status as enum ('draft', 'published', 'archived');

create table public.products (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  slug text not null,
  model text not null default '',
  description text not null default '',
  base_price_cents integer not null default 0 check (base_price_cents >= 0),
  range_text text not null default '',
  seats_text text not null default '',
  highlights text[] not null default '{}',
  visual_theme text not null default 'blue' check (visual_theme in ('navy', 'blue', 'green', 'orange')),
  status public.product_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, slug)
);

create table public.product_locations (
  product_id uuid not null references public.products(id) on delete cascade,
  location_id uuid not null references public.locations(id) on delete cascade,
  price_override_cents integer check (price_override_cents >= 0),
  is_available boolean not null default true,
  updated_at timestamptz not null default now(),
  primary key (product_id, location_id)
);

create index products_organization_id_idx on public.products(organization_id);
create index products_organization_status_idx on public.products(organization_id, status);
create index product_locations_location_id_idx on public.product_locations(location_id);

alter table public.products enable row level security;
alter table public.product_locations enable row level security;

create policy "members read published organization products" on public.products
for select to authenticated
using (
  private.is_org_member(organization_id)
  and (
    status = 'published'
    or private.has_org_role(organization_id, array['tenant_admin', 'manager']::public.organization_role[])
  )
  or private.is_platform_owner()
);

create policy "tenant admins manage organization products" on public.products
for all to authenticated
using (private.has_org_role(organization_id, array['tenant_admin']::public.organization_role[]))
with check (private.has_org_role(organization_id, array['tenant_admin']::public.organization_role[]));

create policy "members read organization product availability" on public.product_locations
for select to authenticated
using (
  exists (
    select 1 from public.products p
    where p.id = product_id and private.is_org_member(p.organization_id)
  )
  or private.is_platform_owner()
);

create policy "tenant admins manage organization product availability" on public.product_locations
for all to authenticated
using (
  exists (
    select 1 from public.products p
    where p.id = product_id
      and private.has_org_role(p.organization_id, array['tenant_admin']::public.organization_role[])
  )
)
with check (
  exists (
    select 1 from public.products p
    where p.id = product_id
      and private.has_org_role(p.organization_id, array['tenant_admin']::public.organization_role[])
  )
);

insert into public.products (
  organization_id, name, slug, model, description, base_price_cents,
  range_text, seats_text, highlights, visual_theme, status
)
values
  (
    '10000000-0000-0000-0000-000000000001', 'Nexus', 'nexus-4-passenger-forward',
    '4 Passenger Forward', 'Premium 72V performance with upscale comfort and connected technology.',
    1599500, 'Up to 55 mi', '4 passengers',
    array['72V lithium', 'Power steering', '10.1-in touchscreen'], 'navy', 'published'
  ),
  (
    '10000000-0000-0000-0000-000000000001', 'Beyond', 'beyond-4-passenger-forward',
    '4 Passenger Forward', 'A refined everyday cart with practical premium features included.',
    1349500, 'Up to 40 mi', '4 passengers',
    array['48V lithium', 'Aluminum frame', 'Premium audio'], 'blue', 'published'
  ),
  (
    '10000000-0000-0000-0000-000000000001', 'ActivEV Pulse', 'activev-pulse-6-passenger',
    '6 Passenger', 'Flexible six-passenger seating and approachable electric performance.',
    1099500, 'Up to 35 mi', '6 passengers',
    array['Lithium power', 'Digital display', 'Extended seating'], 'green', 'published'
  )
on conflict (organization_id, slug) do update set
  name = excluded.name,
  model = excluded.model,
  description = excluded.description,
  base_price_cents = excluded.base_price_cents,
  range_text = excluded.range_text,
  seats_text = excluded.seats_text,
  highlights = excluded.highlights,
  visual_theme = excluded.visual_theme,
  status = excluded.status,
  updated_at = now();
