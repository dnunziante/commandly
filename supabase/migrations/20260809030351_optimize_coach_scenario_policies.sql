-- Avoid overlapping permissive SELECT policies on coach scenarios.

drop policy "tenant admins manage coach scenarios" on public.coach_scenarios;

create policy "tenant admins create coach scenarios" on public.coach_scenarios
for insert to authenticated
with check (private.has_org_role(organization_id, array['tenant_admin']::public.organization_role[]));

create policy "tenant admins update coach scenarios" on public.coach_scenarios
for update to authenticated
using (private.has_org_role(organization_id, array['tenant_admin']::public.organization_role[]))
with check (private.has_org_role(organization_id, array['tenant_admin']::public.organization_role[]));

create policy "tenant admins delete coach scenarios" on public.coach_scenarios
for delete to authenticated
using (private.has_org_role(organization_id, array['tenant_admin']::public.organization_role[]));
