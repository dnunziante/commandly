-- Expand the existing primary product image into an ordered gallery.

alter table public.products
  add column if not exists image_paths text[] not null default '{}';

update public.products
set image_paths = array[image_path]
where image_path is not null
  and image_path <> ''
  and cardinality(image_paths) = 0;

alter table public.products
  drop constraint if exists products_image_paths_limit;

alter table public.products
  add constraint products_image_paths_limit
  check (cardinality(image_paths) <= 8);
