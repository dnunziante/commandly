-- Tenant-scoped training modules that organize existing lessons into ordered paths.

alter table public.training_lessons
  add constraint training_lessons_id_organization_id_key unique (id, organization_id);

create table public.training_modules (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  created_by uuid not null references public.profiles(id),
  title text not null check (char_length(title) between 2 and 140),
  description text not null default '',
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, organization_id)
);

create table public.training_module_lessons (
  module_id uuid not null,
  lesson_id uuid not null,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  sort_order integer not null check (sort_order between 1 and 999),
  created_at timestamptz not null default now(),
  primary key (module_id, lesson_id),
  foreign key (module_id, organization_id)
    references public.training_modules(id, organization_id) on delete cascade,
  foreign key (lesson_id, organization_id)
    references public.training_lessons(id, organization_id) on delete cascade
);

create index training_modules_organization_published_idx
  on public.training_modules(organization_id, is_published, created_at desc);
create index training_modules_created_by_idx on public.training_modules(created_by);
create index training_module_lessons_lesson_organization_idx on public.training_module_lessons(lesson_id, organization_id);
create index training_module_lessons_module_organization_idx on public.training_module_lessons(module_id, organization_id);
create index training_module_lessons_organization_idx on public.training_module_lessons(organization_id);

alter table public.training_modules enable row level security;
alter table public.training_module_lessons enable row level security;

grant select, insert, update, delete on public.training_modules to authenticated;
grant select, insert, update, delete on public.training_module_lessons to authenticated;

create policy "members read published organization training modules"
on public.training_modules for select to authenticated
using (
  (private.is_org_member(organization_id) and is_published)
  or private.has_org_role(organization_id, array['tenant_admin']::public.organization_role[])
  or private.is_platform_owner()
);

create policy "tenant admins create organization training modules"
on public.training_modules for insert to authenticated
with check (
  created_by = (select auth.uid())
  and (
    private.has_org_role(organization_id, array['tenant_admin']::public.organization_role[])
    or private.is_platform_owner()
  )
);

create policy "tenant admins update organization training modules"
on public.training_modules for update to authenticated
using (
  private.has_org_role(organization_id, array['tenant_admin']::public.organization_role[])
  or private.is_platform_owner()
)
with check (
  private.has_org_role(organization_id, array['tenant_admin']::public.organization_role[])
  or private.is_platform_owner()
);

create policy "tenant admins delete organization training modules"
on public.training_modules for delete to authenticated
using (
  private.has_org_role(organization_id, array['tenant_admin']::public.organization_role[])
  or private.is_platform_owner()
);

create policy "members read organization training module lessons"
on public.training_module_lessons for select to authenticated
using (
  private.is_org_member(organization_id)
  or private.is_platform_owner()
);

create policy "tenant admins create organization training module lessons"
on public.training_module_lessons for insert to authenticated
with check (
  private.has_org_role(organization_id, array['tenant_admin']::public.organization_role[])
  or private.is_platform_owner()
);

create policy "tenant admins update organization training module lessons"
on public.training_module_lessons for update to authenticated
using (
  private.has_org_role(organization_id, array['tenant_admin']::public.organization_role[])
  or private.is_platform_owner()
)
with check (
  private.has_org_role(organization_id, array['tenant_admin']::public.organization_role[])
  or private.is_platform_owner()
);

create policy "tenant admins delete organization training module lessons"
on public.training_module_lessons for delete to authenticated
using (
  private.has_org_role(organization_id, array['tenant_admin']::public.organization_role[])
  or private.is_platform_owner()
);
