-- Tenant-controlled, structured product sales guidance.

alter table public.products
  add column if not exists sales_guide jsonb not null default '{}'::jsonb;

alter table public.products
  drop constraint if exists products_sales_guide_object;

alter table public.products
  add constraint products_sales_guide_object
  check (jsonb_typeof(sales_guide) = 'object');
