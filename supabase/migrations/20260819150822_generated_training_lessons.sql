-- Structured, review-first training generated from a single approved source.
-- Existing published lessons remain published and continue to render with the
-- source-document fallback until an administrator chooses to regenerate them.

alter table public.training_lessons
  add column if not exists training_type text not null default 'auto_detect'
    check (training_type in ('auto_detect', 'product_knowledge', 'sales_skills', 'policy_process', 'competitor_knowledge', 'general_knowledge')),
  add column if not exists include_knowledge_check boolean not null default true,
  add column if not exists generation_status text not null default 'ready'
    check (generation_status in ('pending', 'generating', 'ready', 'failed')),
  add column if not exists generation_error text,
  add column if not exists generated_content jsonb not null default '{}'::jsonb
    check (jsonb_typeof(generated_content) = 'object'),
  add column if not exists generated_at timestamptz,
  add column if not exists source_document_updated_at timestamptz,
  add column if not exists source_review_required boolean not null default false,
  add column if not exists location_id uuid,
  add column if not exists published_at timestamptz,
  add column if not exists published_by uuid references public.profiles(id) on delete set null;

update public.training_lessons lesson
set
  source_document_updated_at = coalesce(document.processed_at, document.updated_at, document.created_at),
  location_id = document.location_id,
  published_at = case when lesson.is_published then coalesce(lesson.published_at, lesson.created_at) else lesson.published_at end
from public.knowledge_documents document
where document.id = lesson.knowledge_document_id
  and document.organization_id = lesson.organization_id;

alter table public.training_lessons
  drop constraint if exists training_lessons_location_organization_fkey;

alter table public.training_lessons
  add constraint training_lessons_location_organization_fkey
  foreign key (location_id, organization_id)
  references public.locations(id, organization_id)
  on delete set null (location_id);

create index if not exists training_lessons_location_published_idx
  on public.training_lessons(organization_id, location_id, is_published, created_at desc);
create index if not exists training_lessons_generation_status_idx
  on public.training_lessons(organization_id, generation_status, updated_at desc);
create index if not exists training_lessons_published_by_idx
  on public.training_lessons(published_by)
  where published_by is not null;

create or replace function private.can_access_training_location(target_org uuid, target_location uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select private.is_platform_owner() or exists (
    select 1
    from public.organization_memberships membership
    where membership.organization_id = target_org
      and membership.user_id = (select auth.uid())
      and membership.status = 'active'
      and (
        membership.role = 'tenant_admin'
        or target_location is null
        or membership.location_id = target_location
        or exists (
          select 1
          from public.organization_member_locations assignment
          where assignment.organization_id = target_org
            and assignment.user_id = membership.user_id
            and assignment.location_id = target_location
        )
      )
  )
$$;

create or replace function private.can_review_training(target_org uuid, target_location uuid)
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select private.is_platform_owner() or exists (
    select 1
    from public.organization_memberships membership
    where membership.organization_id = target_org
      and membership.user_id = (select auth.uid())
      and membership.status = 'active'
      and (
        membership.role = 'tenant_admin'
        or (
          membership.role = 'manager'
          and (
            target_location is null
            or membership.location_id = target_location
            or exists (
              select 1
              from public.organization_member_locations assignment
              where assignment.organization_id = target_org
                and assignment.user_id = membership.user_id
                and assignment.location_id = target_location
            )
          )
        )
      )
  )
$$;

revoke all on function private.can_access_training_location(uuid, uuid) from public, anon;
revoke all on function private.can_review_training(uuid, uuid) from public, anon;
grant execute on function private.can_access_training_location(uuid, uuid) to authenticated;
grant execute on function private.can_review_training(uuid, uuid) to authenticated;

drop policy if exists "members read published organization training lessons" on public.training_lessons;
create policy "users read permitted training lessons"
on public.training_lessons for select to authenticated
using (
  (is_published and private.can_access_training_location(organization_id, location_id))
  or private.can_review_training(organization_id, location_id)
);

drop policy if exists "tenant admins update organization training lessons" on public.training_lessons;
create policy "authorized leaders update organization training lessons"
on public.training_lessons for update to authenticated
using (private.can_review_training(organization_id, location_id))
with check (private.can_review_training(organization_id, location_id));

create or replace function private.flag_training_when_source_changes()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  if new.storage_path is distinct from old.storage_path
     or new.original_filename is distinct from old.original_filename
     or new.size_bytes is distinct from old.size_bytes then
    update public.training_lessons
    set source_review_required = true,
        updated_at = now()
    where knowledge_document_id = new.id
      and organization_id = new.organization_id;
  end if;
  return new;
end;
$$;

drop trigger if exists flag_training_when_source_changes on public.knowledge_documents;
create trigger flag_training_when_source_changes
after update of storage_path, original_filename, size_bytes on public.knowledge_documents
for each row execute function private.flag_training_when_source_changes();
