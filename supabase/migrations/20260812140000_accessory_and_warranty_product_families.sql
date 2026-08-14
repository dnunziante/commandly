-- Add BGC product-library categories for accessories and warranty plans.

insert into public.product_families (organization_id, name, slug, description, sort_order)
select organization.id, family.name, family.slug, family.description, family.sort_order
from public.organizations organization
cross join (values
  ('Accessories', 'accessories', 'Browse available accessories and add-on options.', 50),
  ('Warranties', 'warranties', 'Browse available warranty plans and coverage options.', 60)
) as family(name, slug, description, sort_order)
where organization.slug = 'bgc-dealerships'
on conflict (organization_id, slug) do update set
  name = excluded.name,
  description = excluded.description,
  sort_order = excluded.sort_order,
  updated_at = now();
