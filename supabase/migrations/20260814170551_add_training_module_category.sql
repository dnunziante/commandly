-- Categorize training modules for consistent organization and display.
alter table public.training_modules
  add column category text not null default 'General'
  check (category in (
    'General',
    'Onboarding',
    'Product Knowledge',
    'Sales Process',
    'Customer Experience',
    'Compliance',
    'Leadership',
    'Operations'
  ));

create index training_modules_organization_category_idx
  on public.training_modules(organization_id, category);
