-- Commandly: tenant-scoped Operations Assistant persistence foundation.
-- This migration creates structure and access controls only; it does not seed BGC data.

-- Composite location keys keep every optional location reference inside its tenant.
alter table public.locations
  add constraint locations_id_organization_id_key unique (id, organization_id);

create table public.operations_procedures (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  title text not null check (char_length(title) between 2 and 160),
  category text not null check (char_length(category) between 2 and 80),
  owner text not null check (char_length(owner) between 2 and 120),
  summary text not null default '' check (char_length(summary) <= 2000),
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  version integer not null default 1 check (version > 0),
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, organization_id)
);

create table public.operations_procedure_steps (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  procedure_id uuid not null,
  title text not null check (char_length(title) between 2 and 500),
  position integer not null check (position >= 0),
  created_at timestamptz not null default now(),
  foreign key (procedure_id, organization_id)
    references public.operations_procedures(id, organization_id) on delete cascade,
  unique (procedure_id, position),
  unique (id, organization_id)
);

create table public.operations_schedules (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  procedure_id uuid not null,
  frequency text not null check (frequency in ('daily', 'weekly', 'monthly')),
  location_id uuid,
  location_name text not null check (char_length(location_name) between 2 and 120),
  owner text not null check (char_length(owner) between 2 and 120),
  assigned_to uuid references public.profiles(id) on delete set null,
  next_run_date date not null,
  status text not null default 'active' check (status in ('active', 'paused')),
  last_generated_at timestamptz,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (procedure_id, organization_id)
    references public.operations_procedures(id, organization_id) on delete restrict,
  foreign key (location_id, organization_id)
    references public.locations(id, organization_id) on delete set null (location_id),
  unique (id, organization_id)
);

create table public.operations_checklists (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  procedure_id uuid,
  schedule_id uuid,
  title text not null check (char_length(title) between 2 and 160),
  location_id uuid,
  location_name text not null check (char_length(location_name) between 2 and 120),
  owner text not null check (char_length(owner) between 2 and 120),
  assigned_to uuid references public.profiles(id) on delete set null,
  due_date date not null,
  status text not null default 'not_started'
    check (status in ('not_started', 'in_progress', 'complete')),
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (procedure_id, organization_id)
    references public.operations_procedures(id, organization_id) on delete set null (procedure_id),
  foreign key (schedule_id, organization_id)
    references public.operations_schedules(id, organization_id) on delete set null (schedule_id),
  foreign key (location_id, organization_id)
    references public.locations(id, organization_id) on delete set null (location_id),
  unique (id, organization_id)
);

create table public.operations_checklist_steps (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  checklist_id uuid not null,
  title text not null check (char_length(title) between 2 and 500),
  position integer not null check (position >= 0),
  is_complete boolean not null default false,
  completed_by uuid references public.profiles(id) on delete set null,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (checklist_id, organization_id)
    references public.operations_checklists(id, organization_id) on delete cascade,
  check ((is_complete and completed_at is not null) or (not is_complete and completed_at is null)),
  unique (checklist_id, position)
);

create table public.operations_alerts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  title text not null check (char_length(title) between 2 and 160),
  detail text not null default '' check (char_length(detail) <= 3000),
  severity text not null check (severity in ('low', 'medium', 'high', 'critical')),
  location_id uuid,
  location_name text not null check (char_length(location_name) between 2 and 120),
  owner text not null check (char_length(owner) between 2 and 120),
  assigned_to uuid references public.profiles(id) on delete set null,
  due_date date not null,
  status text not null default 'open' check (status in ('open', 'acknowledged', 'resolved')),
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (location_id, organization_id)
    references public.locations(id, organization_id) on delete set null (location_id),
  unique (id, organization_id)
);

create table public.operations_alert_history (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  alert_id uuid not null,
  status text not null check (status in ('open', 'acknowledged', 'resolved')),
  note text not null default '' check (char_length(note) <= 1000),
  changed_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  foreign key (alert_id, organization_id)
    references public.operations_alerts(id, organization_id) on delete cascade
);

create table public.operations_handoffs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  location_id uuid,
  location_name text not null check (char_length(location_name) between 2 and 120),
  from_shift text not null check (char_length(from_shift) between 2 and 80),
  to_shift text not null check (char_length(to_shift) between 2 and 80),
  summary text not null check (char_length(summary) between 2 and 3000),
  unresolved_issues text not null default '' check (char_length(unresolved_issues) <= 3000),
  decisions text not null default '' check (char_length(decisions) <= 3000),
  owner text not null check (char_length(owner) between 2 and 120),
  assigned_to uuid references public.profiles(id) on delete set null,
  status text not null default 'open' check (status in ('open', 'acknowledged', 'closed')),
  created_by uuid not null references public.profiles(id) on delete restrict,
  acknowledged_by uuid references public.profiles(id) on delete set null,
  acknowledged_at timestamptz,
  closed_by uuid references public.profiles(id) on delete set null,
  closed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (location_id, organization_id)
    references public.locations(id, organization_id) on delete set null (location_id)
);

create table public.operations_incidents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  title text not null check (char_length(title) between 2 and 160),
  category text not null check (category in ('safety', 'customer', 'equipment', 'process', 'other')),
  severity text not null check (severity in ('low', 'medium', 'high', 'critical')),
  location_id uuid,
  location_name text not null check (char_length(location_name) between 2 and 120),
  occurred_at timestamptz not null,
  reported_by_name text not null check (char_length(reported_by_name) between 2 and 120),
  reported_by_user_id uuid references public.profiles(id) on delete set null,
  description text not null check (char_length(description) between 2 and 5000),
  immediate_action text not null default '' check (char_length(immediate_action) <= 3000),
  root_cause text not null default '' check (char_length(root_cause) <= 3000),
  corrective_action text not null default '' check (char_length(corrective_action) <= 3000),
  owner text not null check (char_length(owner) between 2 and 120),
  assigned_to uuid references public.profiles(id) on delete set null,
  due_date date not null,
  status text not null default 'reported'
    check (status in ('reported', 'investigating', 'corrective_action', 'verified_closed')),
  created_by uuid not null references public.profiles(id) on delete restrict,
  verified_by uuid references public.profiles(id) on delete set null,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((status = 'verified_closed' and verified_by is not null and verified_at is not null)
    or status <> 'verified_closed'),
  foreign key (location_id, organization_id)
    references public.locations(id, organization_id) on delete set null (location_id)
);

create index operations_procedures_org_status_idx
  on public.operations_procedures(organization_id, status);
create index operations_procedures_created_by_idx
  on public.operations_procedures(created_by);
create index operations_procedure_steps_procedure_idx
  on public.operations_procedure_steps(procedure_id);
create index operations_procedure_steps_org_idx
  on public.operations_procedure_steps(organization_id);
create index operations_schedules_org_run_idx
  on public.operations_schedules(organization_id, status, next_run_date);
create index operations_schedules_procedure_idx
  on public.operations_schedules(procedure_id);
create index operations_schedules_location_idx on public.operations_schedules(location_id);
create index operations_schedules_assigned_to_idx on public.operations_schedules(assigned_to);
create index operations_schedules_created_by_idx on public.operations_schedules(created_by);
create index operations_checklists_org_due_idx
  on public.operations_checklists(organization_id, status, due_date);
create index operations_checklists_procedure_idx
  on public.operations_checklists(procedure_id);
create index operations_checklists_schedule_idx
  on public.operations_checklists(schedule_id);
create index operations_checklists_location_idx on public.operations_checklists(location_id);
create index operations_checklists_assigned_to_idx on public.operations_checklists(assigned_to);
create index operations_checklists_created_by_idx on public.operations_checklists(created_by);
create index operations_checklist_steps_checklist_idx
  on public.operations_checklist_steps(checklist_id);
create index operations_checklist_steps_org_idx on public.operations_checklist_steps(organization_id);
create index operations_checklist_steps_completed_by_idx on public.operations_checklist_steps(completed_by);
create index operations_alerts_org_due_idx
  on public.operations_alerts(organization_id, status, severity, due_date);
create index operations_alerts_location_idx on public.operations_alerts(location_id);
create index operations_alerts_assigned_to_idx on public.operations_alerts(assigned_to);
create index operations_alerts_created_by_idx on public.operations_alerts(created_by);
create index operations_alert_history_alert_idx
  on public.operations_alert_history(alert_id, created_at desc);
create index operations_alert_history_org_idx on public.operations_alert_history(organization_id);
create index operations_alert_history_changed_by_idx on public.operations_alert_history(changed_by);
create index operations_handoffs_org_status_idx
  on public.operations_handoffs(organization_id, status, updated_at desc);
create index operations_handoffs_location_idx on public.operations_handoffs(location_id);
create index operations_handoffs_assigned_to_idx on public.operations_handoffs(assigned_to);
create index operations_handoffs_created_by_idx on public.operations_handoffs(created_by);
create index operations_handoffs_acknowledged_by_idx on public.operations_handoffs(acknowledged_by);
create index operations_handoffs_closed_by_idx on public.operations_handoffs(closed_by);
create index operations_incidents_org_status_idx
  on public.operations_incidents(organization_id, status, severity, due_date);
create index operations_incidents_location_idx on public.operations_incidents(location_id);
create index operations_incidents_reported_by_idx on public.operations_incidents(reported_by_user_id);
create index operations_incidents_assigned_to_idx on public.operations_incidents(assigned_to);
create index operations_incidents_created_by_idx on public.operations_incidents(created_by);
create index operations_incidents_verified_by_idx on public.operations_incidents(verified_by);

create or replace function private.set_operations_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke all on function private.set_operations_updated_at() from public, anon, authenticated;

create trigger operations_procedures_set_updated_at before update on public.operations_procedures
for each row execute function private.set_operations_updated_at();
create trigger operations_schedules_set_updated_at before update on public.operations_schedules
for each row execute function private.set_operations_updated_at();
create trigger operations_checklists_set_updated_at before update on public.operations_checklists
for each row execute function private.set_operations_updated_at();
create trigger operations_checklist_steps_set_updated_at before update on public.operations_checklist_steps
for each row execute function private.set_operations_updated_at();
create trigger operations_alerts_set_updated_at before update on public.operations_alerts
for each row execute function private.set_operations_updated_at();
create trigger operations_handoffs_set_updated_at before update on public.operations_handoffs
for each row execute function private.set_operations_updated_at();
create trigger operations_incidents_set_updated_at before update on public.operations_incidents
for each row execute function private.set_operations_updated_at();

alter table public.operations_procedures enable row level security;
alter table public.operations_procedure_steps enable row level security;
alter table public.operations_schedules enable row level security;
alter table public.operations_checklists enable row level security;
alter table public.operations_checklist_steps enable row level security;
alter table public.operations_alerts enable row level security;
alter table public.operations_alert_history enable row level security;
alter table public.operations_handoffs enable row level security;
alter table public.operations_incidents enable row level security;

revoke all on public.operations_procedures, public.operations_procedure_steps,
  public.operations_schedules, public.operations_checklists, public.operations_checklist_steps,
  public.operations_alerts, public.operations_alert_history, public.operations_handoffs,
  public.operations_incidents from anon;
grant select, insert, update, delete on public.operations_procedures,
  public.operations_procedure_steps, public.operations_schedules, public.operations_checklists,
  public.operations_checklist_steps, public.operations_alerts, public.operations_alert_history,
  public.operations_handoffs, public.operations_incidents to authenticated;

-- All active members can read their tenant's operational records.
create policy "members read operations procedures" on public.operations_procedures for select to authenticated
using (private.is_org_member(organization_id) or private.is_platform_owner());
create policy "members read operations procedure steps" on public.operations_procedure_steps for select to authenticated
using (private.is_org_member(organization_id) or private.is_platform_owner());
create policy "members read operations schedules" on public.operations_schedules for select to authenticated
using (private.is_org_member(organization_id) or private.is_platform_owner());
create policy "members read operations checklists" on public.operations_checklists for select to authenticated
using (private.is_org_member(organization_id) or private.is_platform_owner());
create policy "members read operations checklist steps" on public.operations_checklist_steps for select to authenticated
using (private.is_org_member(organization_id) or private.is_platform_owner());
create policy "members read operations alerts" on public.operations_alerts for select to authenticated
using (private.is_org_member(organization_id) or private.is_platform_owner());
create policy "members read operations alert history" on public.operations_alert_history for select to authenticated
using (private.is_org_member(organization_id) or private.is_platform_owner());
create policy "members read operations handoffs" on public.operations_handoffs for select to authenticated
using (private.is_org_member(organization_id) or private.is_platform_owner());
create policy "members read operations incidents" on public.operations_incidents for select to authenticated
using (private.is_org_member(organization_id) or private.is_platform_owner());

-- Managers and tenant administrators control reusable procedures and schedules.
create policy "managers create operations procedures" on public.operations_procedures for insert to authenticated
with check (created_by = (select auth.uid()) and private.has_org_role(organization_id, array['tenant_admin', 'manager']::public.organization_role[]));
create policy "managers update operations procedures" on public.operations_procedures for update to authenticated
using (private.has_org_role(organization_id, array['tenant_admin', 'manager']::public.organization_role[]))
with check (private.has_org_role(organization_id, array['tenant_admin', 'manager']::public.organization_role[]));
create policy "managers delete operations procedures" on public.operations_procedures for delete to authenticated
using (private.has_org_role(organization_id, array['tenant_admin', 'manager']::public.organization_role[]));
create policy "managers manage operations procedure steps" on public.operations_procedure_steps for all to authenticated
using (private.has_org_role(organization_id, array['tenant_admin', 'manager']::public.organization_role[]))
with check (private.has_org_role(organization_id, array['tenant_admin', 'manager']::public.organization_role[]));
create policy "managers create operations schedules" on public.operations_schedules for insert to authenticated
with check (created_by = (select auth.uid()) and private.has_org_role(organization_id, array['tenant_admin', 'manager']::public.organization_role[]));
create policy "managers update operations schedules" on public.operations_schedules for update to authenticated
using (private.has_org_role(organization_id, array['tenant_admin', 'manager']::public.organization_role[]))
with check (private.has_org_role(organization_id, array['tenant_admin', 'manager']::public.organization_role[]));
create policy "managers delete operations schedules" on public.operations_schedules for delete to authenticated
using (private.has_org_role(organization_id, array['tenant_admin', 'manager']::public.organization_role[]));

-- Active members perform day-to-day operational work. Managers control deletion.
create policy "members create operations checklists" on public.operations_checklists for insert to authenticated
with check (created_by = (select auth.uid()) and (private.is_org_member(organization_id) or private.is_platform_owner()));
create policy "members update operations checklists" on public.operations_checklists for update to authenticated
using (private.is_org_member(organization_id) or private.is_platform_owner())
with check (private.is_org_member(organization_id) or private.is_platform_owner());
create policy "managers delete operations checklists" on public.operations_checklists for delete to authenticated
using (private.has_org_role(organization_id, array['tenant_admin', 'manager']::public.organization_role[]));

create policy "members create operations checklist steps" on public.operations_checklist_steps for insert to authenticated
with check (private.is_org_member(organization_id) or private.is_platform_owner());
create policy "members update operations checklist steps" on public.operations_checklist_steps for update to authenticated
using (private.is_org_member(organization_id) or private.is_platform_owner())
with check (private.is_org_member(organization_id) or private.is_platform_owner());
create policy "managers delete operations checklist steps" on public.operations_checklist_steps for delete to authenticated
using (private.has_org_role(organization_id, array['tenant_admin', 'manager']::public.organization_role[]));

create policy "members create operations alerts" on public.operations_alerts for insert to authenticated
with check (created_by = (select auth.uid()) and (private.is_org_member(organization_id) or private.is_platform_owner()));
create policy "members update operations alerts" on public.operations_alerts for update to authenticated
using (private.is_org_member(organization_id) or private.is_platform_owner())
with check (private.is_org_member(organization_id) or private.is_platform_owner());
create policy "managers delete operations alerts" on public.operations_alerts for delete to authenticated
using (private.has_org_role(organization_id, array['tenant_admin', 'manager']::public.organization_role[]));

create policy "members create operations alert history" on public.operations_alert_history for insert to authenticated
with check (changed_by = (select auth.uid()) and (private.is_org_member(organization_id) or private.is_platform_owner()));
create policy "managers delete operations alert history" on public.operations_alert_history for delete to authenticated
using (private.has_org_role(organization_id, array['tenant_admin', 'manager']::public.organization_role[]));

create policy "members create operations handoffs" on public.operations_handoffs for insert to authenticated
with check (created_by = (select auth.uid()) and (private.is_org_member(organization_id) or private.is_platform_owner()));
create policy "members update operations handoffs" on public.operations_handoffs for update to authenticated
using (private.is_org_member(organization_id) or private.is_platform_owner())
with check (private.is_org_member(organization_id) or private.is_platform_owner());
create policy "managers delete operations handoffs" on public.operations_handoffs for delete to authenticated
using (private.has_org_role(organization_id, array['tenant_admin', 'manager']::public.organization_role[]));

create policy "members create operations incidents" on public.operations_incidents for insert to authenticated
with check (created_by = (select auth.uid()) and (private.is_org_member(organization_id) or private.is_platform_owner()));
create policy "members update operations incidents" on public.operations_incidents for update to authenticated
using (private.is_org_member(organization_id) or private.is_platform_owner())
with check (private.is_org_member(organization_id) or private.is_platform_owner());
create policy "managers delete operations incidents" on public.operations_incidents for delete to authenticated
using (private.has_org_role(organization_id, array['tenant_admin', 'manager']::public.organization_role[]));
