-- Tenant-scoped training lessons created from approved knowledge documents.

alter table public.knowledge_documents
  add constraint knowledge_documents_id_organization_id_key unique (id, organization_id);

create table public.training_lessons (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  knowledge_document_id uuid not null,
  created_by uuid not null references public.profiles(id),
  title text not null check (char_length(title) between 2 and 140),
  description text not null default '',
  estimated_minutes integer not null default 10 check (estimated_minutes between 1 and 240),
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, knowledge_document_id),
  foreign key (knowledge_document_id, organization_id)
    references public.knowledge_documents(id, organization_id) on delete cascade
);

create index training_lessons_organization_published_idx
  on public.training_lessons(organization_id, is_published, created_at desc);

alter table public.training_lessons enable row level security;

grant select, insert, update, delete on public.training_lessons to authenticated;

create policy "members read published organization training lessons"
on public.training_lessons for select to authenticated
using (
  (private.is_org_member(organization_id) and is_published)
  or private.has_org_role(organization_id, array['tenant_admin']::public.organization_role[])
  or private.is_platform_owner()
);

create policy "tenant admins create organization training lessons"
on public.training_lessons for insert to authenticated
with check (
  created_by = (select auth.uid())
  and (
    private.has_org_role(organization_id, array['tenant_admin']::public.organization_role[])
    or private.is_platform_owner()
  )
);

create policy "tenant admins update organization training lessons"
on public.training_lessons for update to authenticated
using (
  private.has_org_role(organization_id, array['tenant_admin']::public.organization_role[])
  or private.is_platform_owner()
)
with check (
  private.has_org_role(organization_id, array['tenant_admin']::public.organization_role[])
  or private.is_platform_owner()
);

create policy "tenant admins delete organization training lessons"
on public.training_lessons for delete to authenticated
using (
  private.has_org_role(organization_id, array['tenant_admin']::public.organization_role[])
  or private.is_platform_owner()
);
