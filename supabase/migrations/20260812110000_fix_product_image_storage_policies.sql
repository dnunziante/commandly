-- Qualify the outer object path so it cannot resolve to organizations.name.

drop policy if exists "organization members read product images" on storage.objects;
drop policy if exists "tenant admins upload product images" on storage.objects;
drop policy if exists "tenant admins update product images" on storage.objects;
drop policy if exists "tenant admins delete product images" on storage.objects;

create policy "organization members read product images"
on storage.objects for select to authenticated
using (
  storage.objects.bucket_id = 'product-images'
  and exists (
    select 1 from public.organizations org
    where org.id::text = (storage.foldername(storage.objects.name))[1]
      and (private.is_org_member(org.id) or private.is_platform_owner())
  )
);

create policy "tenant admins upload product images"
on storage.objects for insert to authenticated
with check (
  storage.objects.bucket_id = 'product-images'
  and exists (
    select 1 from public.organizations org
    where org.id::text = (storage.foldername(storage.objects.name))[1]
      and (
        private.has_org_role(org.id, array['tenant_admin']::public.organization_role[])
        or private.is_platform_owner()
      )
  )
);

create policy "tenant admins update product images"
on storage.objects for update to authenticated
using (
  storage.objects.bucket_id = 'product-images'
  and exists (
    select 1 from public.organizations org
    where org.id::text = (storage.foldername(storage.objects.name))[1]
      and (
        private.has_org_role(org.id, array['tenant_admin']::public.organization_role[])
        or private.is_platform_owner()
      )
  )
)
with check (
  storage.objects.bucket_id = 'product-images'
  and exists (
    select 1 from public.organizations org
    where org.id::text = (storage.foldername(storage.objects.name))[1]
      and (
        private.has_org_role(org.id, array['tenant_admin']::public.organization_role[])
        or private.is_platform_owner()
      )
  )
);

create policy "tenant admins delete product images"
on storage.objects for delete to authenticated
using (
  storage.objects.bucket_id = 'product-images'
  and exists (
    select 1 from public.organizations org
    where org.id::text = (storage.foldername(storage.objects.name))[1]
      and (
        private.has_org_role(org.id, array['tenant_admin']::public.organization_role[])
        or private.is_platform_owner()
      )
  )
);
