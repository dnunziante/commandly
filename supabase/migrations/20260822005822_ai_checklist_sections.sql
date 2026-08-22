create table public.operations_checklist_sections (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  checklist_id uuid not null,
  title text not null check (char_length(title) between 2 and 160),
  position integer not null check (position >= 0),
  created_at timestamptz not null default now(),
  foreign key (checklist_id, organization_id) references public.operations_checklists(id, organization_id) on delete cascade,
  unique (checklist_id, position)
);

alter table public.operations_checklists add column creation_source text not null default 'manual' check (creation_source in ('manual', 'document', 'knowledge_base', 'training', 'procedure', 'manager_instruction'));
alter table public.operations_checklist_steps add column section_id uuid;
alter table public.operations_checklist_steps add constraint operations_checklist_steps_section_fk foreign key (section_id, organization_id) references public.operations_checklist_sections(id, organization_id) on delete set null (section_id);
create index operations_checklist_sections_checklist_idx on public.operations_checklist_sections(checklist_id, organization_id, position);
create index operations_checklist_steps_section_idx on public.operations_checklist_steps(section_id, organization_id, position);

alter table public.operations_checklist_sections enable row level security;
revoke all on public.operations_checklist_sections from anon;
grant select, insert, update, delete on public.operations_checklist_sections to authenticated;
create policy "members read operations checklist sections" on public.operations_checklist_sections for select to authenticated using (private.is_org_member(organization_id) or private.is_platform_owner());
create policy "managers create operations checklist sections" on public.operations_checklist_sections for insert to authenticated with check (private.has_org_role(organization_id, array['tenant_admin', 'manager']::public.organization_role[]));
create policy "managers update operations checklist sections" on public.operations_checklist_sections for update to authenticated using (private.has_org_role(organization_id, array['tenant_admin', 'manager']::public.organization_role[])) with check (private.has_org_role(organization_id, array['tenant_admin', 'manager']::public.organization_role[]));
create policy "managers delete operations checklist sections" on public.operations_checklist_sections for delete to authenticated using (private.has_org_role(organization_id, array['tenant_admin', 'manager']::public.organization_role[]));
