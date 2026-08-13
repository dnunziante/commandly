alter table public.products
  add column if not exists powertrain_text text not null default '';

alter table public.products
  drop constraint if exists products_powertrain_text_check;

alter table public.products
  add constraint products_powertrain_text_check
  check (powertrain_text in ('', '48V', '72V'));
