-- Private, tenant-scoped product images.

alter table public.products
  add column if not exists image_path text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-images',
  'product-images',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "organization members read product images"
on storage.objects for select to authenticated
using (
  bucket_id = 'product-images'
  and exists (
    select 1 from public.organizations organization
    where organization.id::text = (storage.foldername(name))[1]
      and (private.is_org_member(organization.id) or private.is_platform_owner())
  )
);

create policy "tenant admins upload product images"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'product-images'
  and exists (
    select 1 from public.organizations organization
    where organization.id::text = (storage.foldername(name))[1]
      and (
        private.has_org_role(organization.id, array['tenant_admin']::public.organization_role[])
        or private.is_platform_owner()
      )
  )
);

create policy "tenant admins update product images"
on storage.objects for update to authenticated
using (
  bucket_id = 'product-images'
  and exists (
    select 1 from public.organizations organization
    where organization.id::text = (storage.foldername(name))[1]
      and (
        private.has_org_role(organization.id, array['tenant_admin']::public.organization_role[])
        or private.is_platform_owner()
      )
  )
)
with check (
  bucket_id = 'product-images'
  and exists (
    select 1 from public.organizations organization
    where organization.id::text = (storage.foldername(name))[1]
      and (
        private.has_org_role(organization.id, array['tenant_admin']::public.organization_role[])
        or private.is_platform_owner()
      )
  )
);

create policy "tenant admins delete product images"
on storage.objects for delete to authenticated
using (
  bucket_id = 'product-images'
  and exists (
    select 1 from public.organizations organization
    where organization.id::text = (storage.foldername(name))[1]
      and (
        private.has_org_role(organization.id, array['tenant_admin']::public.organization_role[])
        or private.is_platform_owner()
      )
  )
);
