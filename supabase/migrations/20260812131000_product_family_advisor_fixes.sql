-- Cover the composite foreign key and avoid duplicate permissive SELECT policies.

create index products_family_organization_idx
  on public.products(family_id, organization_id);

drop policy if exists "tenant admins manage organization product families" on public.product_families;

create policy "tenant admins create organization product families"
on public.product_families for insert to authenticated
with check (private.has_org_role(organization_id, array['tenant_admin']::public.organization_role[]));

create policy "tenant admins update organization product families"
on public.product_families for update to authenticated
using (private.has_org_role(organization_id, array['tenant_admin']::public.organization_role[]))
with check (private.has_org_role(organization_id, array['tenant_admin']::public.organization_role[]));

create policy "tenant admins delete organization product families"
on public.product_families for delete to authenticated
using (private.has_org_role(organization_id, array['tenant_admin']::public.organization_role[]));
