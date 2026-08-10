-- Safe sample tenant data. Run after the foundation migration.
insert into public.organizations (id, name, slug)
values ('10000000-0000-0000-0000-000000000001', 'BGC Dealerships', 'bgc-dealerships')
on conflict (id) do update set name = excluded.name, slug = excluded.slug;

insert into public.locations (organization_id, name, city, state)
values
  ('10000000-0000-0000-0000-000000000001', 'Myrtle Beach', 'Myrtle Beach', 'SC'),
  ('10000000-0000-0000-0000-000000000001', 'Charleston', 'Charleston', 'SC')
on conflict (organization_id, name) do nothing;

insert into public.platform_methodologies (key, name, content)
values
  ('nlp-communication', 'NLP Communication Principles', 'Platform-owner content to be authored.'),
  ('lean-sales-system', 'Lean Sales System Principles', 'Platform-owner content to be authored.'),
  ('closer-framework', 'C.L.O.S.E.R. Sales Framework', 'Platform-owner content to be authored.')
on conflict (key) do nothing;
