alter table public.products
  add column if not exists sort_order integer not null default 0;

with ranked as (
  select id, row_number() over (
    partition by organization_id, family_id
    order by name, model, created_at, id
  ) - 1 as position
  from public.products
)
update public.products as products
set sort_order = ranked.position
from ranked
where products.id = ranked.id;

alter table public.products
  drop constraint if exists products_sort_order_check;

alter table public.products
  add constraint products_sort_order_check check (sort_order >= 0);

create index if not exists products_family_sort_order_idx
  on public.products (organization_id, family_id, sort_order, name);
