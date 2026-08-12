-- Private tenant-scoped files attached to warranty add-ons.

alter table public.products
  add column if not exists warranty_document_paths text[] not null default '{}';

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'warranty-documents',
  'warranty-documents',
  false,
  10485760,
  array['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "organization members read warranty documents"
on storage.objects for select to authenticated
using (
  bucket_id = 'warranty-documents'
  and (private.is_org_member(((storage.foldername(name))[1])::uuid) or private.is_platform_owner())
);
create policy "tenant admins upload warranty documents"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'warranty-documents'
  and (private.has_org_role(((storage.foldername(name))[1])::uuid, array['tenant_admin']::public.organization_role[]) or private.is_platform_owner())
);

create policy "tenant admins update warranty documents"
on storage.objects for update to authenticated
using (
  bucket_id = 'warranty-documents'
  and (private.has_org_role(((storage.foldername(name))[1])::uuid, array['tenant_admin']::public.organization_role[]) or private.is_platform_owner())
)
with check (
  bucket_id = 'warranty-documents'
  and (private.has_org_role(((storage.foldername(name))[1])::uuid, array['tenant_admin']::public.organization_role[]) or private.is_platform_owner())
);

create policy "tenant admins delete warranty documents"
on storage.objects for delete to authenticated
using (
  bucket_id = 'warranty-documents'
  and (private.has_org_role(((storage.foldername(name))[1])::uuid, array['tenant_admin']::public.organization_role[]) or private.is_platform_owner())
);
