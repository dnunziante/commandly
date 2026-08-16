-- Adds a stable, shared display order without altering any location details or fees.
alter table public.locations
  add column if not exists sort_order integer not null default 0 check (sort_order >= 0);

with ranked_locations as (
  select id, row_number() over (partition by organization_id order by name, created_at)::integer as next_sort_order
  from public.locations
)
update public.locations as location
set sort_order = ranked_locations.next_sort_order
from ranked_locations
where location.id = ranked_locations.id and location.sort_order = 0;

create index if not exists locations_organization_sort_order_idx
  on public.locations (organization_id, sort_order, name);
