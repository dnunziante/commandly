-- Tenant-managed Quote Calculator defaults stored on existing business locations.

alter table public.locations
  add column if not exists shipping_destination_fee_cents integer not null default 0 check (shipping_destination_fee_cents >= 0),
  add column if not exists delivery_fee_cents integer not null default 0 check (delivery_fee_cents >= 0),
  add column if not exists sales_tax_rate numeric(6,3) not null default 0 check (sales_tax_rate >= 0 and sales_tax_rate <= 100);

grant select, update on public.locations to authenticated;
