-- Tenant-scoped knowledge document metadata and private file storage.

create type public.knowledge_document_status as enum ('uploaded', 'processing', 'ready', 'error');

create table public.knowledge_documents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  uploaded_by uuid not null references public.profiles(id),
  title text not null,
  original_filename text not null,
  storage_path text not null unique,
  mime_type text not null,
  size_bytes bigint not null check (size_bytes > 0 and size_bytes <= 4194304),
  collection text not null default 'General' check (collection in ('General', 'Product knowledge', 'Policies', 'Sales process', 'Operations')),
  status public.knowledge_document_status not null default 'uploaded',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (storage_path like organization_id::text || '/%')
);

create index knowledge_documents_organization_id_idx on public.knowledge_documents(organization_id);
create index knowledge_documents_organization_status_idx on public.knowledge_documents(organization_id, status);

alter table public.knowledge_documents enable row level security;

create policy "members read organization knowledge documents" on public.knowledge_documents
for select to authenticated
using (private.is_org_member(organization_id) or private.is_platform_owner());

create policy "tenant admins manage organization knowledge documents" on public.knowledge_documents
for all to authenticated
using (private.has_org_role(organization_id, array['tenant_admin']::public.organization_role[]))
with check (private.has_org_role(organization_id, array['tenant_admin']::public.organization_role[]));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'knowledge-documents',
  'knowledge-documents',
  false,
  4194304,
  array[
    'application/pdf',
    'text/plain',
    'text/markdown',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "members read organization knowledge files" on storage.objects
for select to authenticated
using (
  bucket_id = 'knowledge-documents'
  and private.is_org_member(((storage.foldername(name))[1])::uuid)
);

create policy "tenant admins upload organization knowledge files" on storage.objects
for insert to authenticated
with check (
  bucket_id = 'knowledge-documents'
  and private.has_org_role(
    ((storage.foldername(name))[1])::uuid,
    array['tenant_admin']::public.organization_role[]
  )
);

create policy "tenant admins update organization knowledge files" on storage.objects
for update to authenticated
using (
  bucket_id = 'knowledge-documents'
  and private.has_org_role(
    ((storage.foldername(name))[1])::uuid,
    array['tenant_admin']::public.organization_role[]
  )
)
with check (
  bucket_id = 'knowledge-documents'
  and private.has_org_role(
    ((storage.foldername(name))[1])::uuid,
    array['tenant_admin']::public.organization_role[]
  )
);

create policy "tenant admins delete organization knowledge files" on storage.objects
for delete to authenticated
using (
  bucket_id = 'knowledge-documents'
  and private.has_org_role(
    ((storage.foldername(name))[1])::uuid,
    array['tenant_admin']::public.organization_role[]
  )
);
