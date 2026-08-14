-- Match tenant-safe composite foreign keys with covering indexes.
create index operations_procedure_steps_procedure_org_idx
  on public.operations_procedure_steps(procedure_id, organization_id);
create index operations_schedules_procedure_org_idx
  on public.operations_schedules(procedure_id, organization_id);
create index operations_schedules_location_org_idx
  on public.operations_schedules(location_id, organization_id);
create index operations_checklists_procedure_org_idx
  on public.operations_checklists(procedure_id, organization_id);
create index operations_checklists_schedule_org_idx
  on public.operations_checklists(schedule_id, organization_id);
create index operations_checklists_location_org_idx
  on public.operations_checklists(location_id, organization_id);
create index operations_checklist_steps_checklist_org_idx
  on public.operations_checklist_steps(checklist_id, organization_id);
create index operations_alerts_location_org_idx
  on public.operations_alerts(location_id, organization_id);
create index operations_alert_history_alert_org_idx
  on public.operations_alert_history(alert_id, organization_id);
create index operations_handoffs_location_org_idx
  on public.operations_handoffs(location_id, organization_id);
create index operations_incidents_location_org_idx
  on public.operations_incidents(location_id, organization_id);

-- Avoid evaluating an overlapping SELECT policy for managers.
drop policy "managers manage operations procedure steps"
  on public.operations_procedure_steps;

create policy "managers create operations procedure steps"
on public.operations_procedure_steps for insert to authenticated
with check (private.has_org_role(
  organization_id,
  array['tenant_admin', 'manager']::public.organization_role[]
));

create policy "managers update operations procedure steps"
on public.operations_procedure_steps for update to authenticated
using (private.has_org_role(
  organization_id,
  array['tenant_admin', 'manager']::public.organization_role[]
))
with check (private.has_org_role(
  organization_id,
  array['tenant_admin', 'manager']::public.organization_role[]
));

create policy "managers delete operations procedure steps"
on public.operations_procedure_steps for delete to authenticated
using (private.has_org_role(
  organization_id,
  array['tenant_admin', 'manager']::public.organization_role[]
));
