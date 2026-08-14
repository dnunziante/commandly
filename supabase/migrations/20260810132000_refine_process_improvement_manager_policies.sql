-- Keep creator attribution strict on insert without blocking another manager from later updates.
drop policy "managers manage improvement whys" on public.operations_improvement_whys;
drop policy "managers manage improvement actions" on public.operations_improvement_actions;
drop policy "managers manage improvement measurements" on public.operations_improvement_measurements;

create policy "managers create improvement whys" on public.operations_improvement_whys for insert to authenticated
with check (created_by = (select auth.uid()) and (private.has_org_role(organization_id, array['tenant_admin', 'manager']::public.organization_role[]) or private.is_platform_owner()));
create policy "managers update improvement whys" on public.operations_improvement_whys for update to authenticated
using (private.has_org_role(organization_id, array['tenant_admin', 'manager']::public.organization_role[]) or private.is_platform_owner())
with check (private.has_org_role(organization_id, array['tenant_admin', 'manager']::public.organization_role[]) or private.is_platform_owner());
create policy "managers delete improvement whys" on public.operations_improvement_whys for delete to authenticated
using (private.has_org_role(organization_id, array['tenant_admin', 'manager']::public.organization_role[]) or private.is_platform_owner());

create policy "managers create improvement actions" on public.operations_improvement_actions for insert to authenticated
with check (created_by = (select auth.uid()) and (private.has_org_role(organization_id, array['tenant_admin', 'manager']::public.organization_role[]) or private.is_platform_owner()));
create policy "managers update improvement actions" on public.operations_improvement_actions for update to authenticated
using (private.has_org_role(organization_id, array['tenant_admin', 'manager']::public.organization_role[]) or private.is_platform_owner())
with check (private.has_org_role(organization_id, array['tenant_admin', 'manager']::public.organization_role[]) or private.is_platform_owner());
create policy "managers delete improvement actions" on public.operations_improvement_actions for delete to authenticated
using (private.has_org_role(organization_id, array['tenant_admin', 'manager']::public.organization_role[]) or private.is_platform_owner());

create policy "managers create improvement measurements" on public.operations_improvement_measurements for insert to authenticated
with check (created_by = (select auth.uid()) and (private.has_org_role(organization_id, array['tenant_admin', 'manager']::public.organization_role[]) or private.is_platform_owner()));
create policy "managers update improvement measurements" on public.operations_improvement_measurements for update to authenticated
using (private.has_org_role(organization_id, array['tenant_admin', 'manager']::public.organization_role[]) or private.is_platform_owner())
with check (private.has_org_role(organization_id, array['tenant_admin', 'manager']::public.organization_role[]) or private.is_platform_owner());
create policy "managers delete improvement measurements" on public.operations_improvement_measurements for delete to authenticated
using (private.has_org_role(organization_id, array['tenant_admin', 'manager']::public.organization_role[]) or private.is_platform_owner());
