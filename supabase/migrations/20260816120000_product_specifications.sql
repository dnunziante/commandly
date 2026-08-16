-- Tenant-owned catalog specifications. Existing products remain unchanged until an administrator adds values.
alter table public.products
  add column if not exists dimensions text,
  add column if not exists running_distance text,
  add column if not exists turning_radius text,
  add column if not exists max_load_capacity text;
