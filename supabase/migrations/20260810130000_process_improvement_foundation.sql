-- Commandly: tenant-scoped Process Improvement workflow.
-- Structure and access controls only; no customer data is seeded.

create table public.operations_improvements (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  kind text not null check (kind in ('problem', 'improvement')),
  title text not null check (char_length(title) between 2 and 160),
  description text not null check (char_length(description) between 20 and 5000),
  department text not null check (department in ('management', 'sales', 'service', 'administrative', 'delivery')),
  location_id uuid,
  location_name text not null check (char_length(location_name) between 2 and 120),
  frequency text not null check (frequency in ('one_time', 'occasional', 'weekly', 'daily', 'multiple_times_daily')),
  impact text not null check (impact in ('low', 'medium', 'high', 'critical')),
  urgency text not null check (urgency in ('low', 'medium', 'high', 'critical')),
  status text not null default 'submitted' check (status in ('submitted', 'under_review', 'approved', 'in_progress', 'measuring', 'verified', 'closed')),
  manager_decision text not null default 'pending' check (manager_decision in ('pending', 'approved', 'more_information', 'not_approved')),
  manager_note text not null default '' check (char_length(manager_note) <= 3000),
  owner_name text not null default 'Unassigned' check (char_length(owner_name) between 2 and 120),
  assigned_to uuid references public.profiles(id) on delete set null,
  due_date date,
  lean_waste text check (lean_waste in ('defects', 'overproduction', 'waiting', 'unused_talent', 'transportation', 'inventory', 'motion', 'extra_processing')),
  project_method text not null default 'rapid_improvement' check (project_method in ('rapid_improvement', 'dmaic')),
  dmaic_phase text check (dmaic_phase in ('define', 'measure', 'analyze', 'improve', 'control')),
  results text not null default '' check (char_length(results) <= 5000),
  lessons_learned text not null default '' check (char_length(lessons_learned) <= 5000),
  submitted_by uuid not null references public.profiles(id) on delete restrict,
  reviewed_by uuid references public.profiles(id) on delete set null,
  verified_by uuid references public.profiles(id) on delete set null,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (location_id, organization_id) references public.locations(id, organization_id) on delete set null (location_id),
  unique (id, organization_id),
  check ((status in ('verified', 'closed') and verified_by is not null and verified_at is not null) or status not in ('verified', 'closed'))
);

create table public.operations_improvement_status_history (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  improvement_id uuid not null,
  status text not null check (status in ('submitted', 'under_review', 'approved', 'in_progress', 'measuring', 'verified', 'closed')),
  decision text check (decision in ('pending', 'approved', 'more_information', 'not_approved')),
  note text not null default '' check (char_length(note) <= 3000),
  changed_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  foreign key (improvement_id, organization_id) references public.operations_improvements(id, organization_id) on delete cascade
);

create table public.operations_improvement_whys (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  improvement_id uuid not null,
  position integer not null check (position between 1 and 5),
  answer text not null check (char_length(answer) between 2 and 2000),
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (improvement_id, organization_id) references public.operations_improvements(id, organization_id) on delete cascade,
  unique (improvement_id, position)
);

create table public.operations_improvement_actions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  improvement_id uuid not null,
  description text not null check (char_length(description) between 2 and 5000),
  owner_name text not null check (char_length(owner_name) between 2 and 120),
  assigned_to uuid references public.profiles(id) on delete set null,
  due_date date,
  status text not null default 'planned' check (status in ('planned', 'in_progress', 'complete', 'verified')),
  created_by uuid not null references public.profiles(id) on delete restrict,
  verified_by uuid references public.profiles(id) on delete set null,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (improvement_id, organization_id) references public.operations_improvements(id, organization_id) on delete cascade
);

create table public.operations_improvement_measurements (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  improvement_id uuid not null,
  phase text not null check (phase in ('before', 'after', 'follow_up')),
  metric text not null check (char_length(metric) between 2 and 160),
  value numeric not null,
  unit text not null check (char_length(unit) between 1 and 80),
  measured_at date not null,
  verified_by uuid references public.profiles(id) on delete set null,
  verified_at timestamptz,
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  foreign key (improvement_id, organization_id) references public.operations_improvements(id, organization_id) on delete cascade
);

create index operations_improvements_org_status_idx on public.operations_improvements(organization_id, status, urgency, updated_at desc);
create index operations_improvements_submitter_idx on public.operations_improvements(submitted_by, created_at desc);
create index operations_improvements_assigned_idx on public.operations_improvements(assigned_to, status, due_date);
create index operations_improvements_location_org_idx on public.operations_improvements(location_id, organization_id);
create index operations_improvement_history_parent_idx on public.operations_improvement_status_history(improvement_id, organization_id, created_at desc);
create index operations_improvement_history_actor_idx on public.operations_improvement_status_history(changed_by);
create index operations_improvement_whys_parent_idx on public.operations_improvement_whys(improvement_id, organization_id);
create index operations_improvement_whys_creator_idx on public.operations_improvement_whys(created_by);
create index operations_improvement_actions_parent_idx on public.operations_improvement_actions(improvement_id, organization_id, status);
create index operations_improvement_actions_assigned_idx on public.operations_improvement_actions(assigned_to);
create index operations_improvement_actions_creator_idx on public.operations_improvement_actions(created_by);
create index operations_improvement_measurements_parent_idx on public.operations_improvement_measurements(improvement_id, organization_id, phase);
create index operations_improvement_measurements_creator_idx on public.operations_improvement_measurements(created_by);
create index operations_improvement_measurements_verifier_idx on public.operations_improvement_measurements(verified_by);

create trigger operations_improvements_set_updated_at before update on public.operations_improvements
for each row execute function private.set_operations_updated_at();
create trigger operations_improvement_whys_set_updated_at before update on public.operations_improvement_whys
for each row execute function private.set_operations_updated_at();
create trigger operations_improvement_actions_set_updated_at before update on public.operations_improvement_actions
for each row execute function private.set_operations_updated_at();

alter table public.operations_improvements enable row level security;
alter table public.operations_improvement_status_history enable row level security;
alter table public.operations_improvement_whys enable row level security;
alter table public.operations_improvement_actions enable row level security;
alter table public.operations_improvement_measurements enable row level security;

revoke all on public.operations_improvements, public.operations_improvement_status_history,
  public.operations_improvement_whys, public.operations_improvement_actions,
  public.operations_improvement_measurements from anon;
grant select, insert, update on public.operations_improvements,
  public.operations_improvement_status_history, public.operations_improvement_whys,
  public.operations_improvement_actions, public.operations_improvement_measurements to authenticated;
grant delete on public.operations_improvement_whys, public.operations_improvement_actions,
  public.operations_improvement_measurements to authenticated;

create policy "employees read own improvements" on public.operations_improvements for select to authenticated
using (submitted_by = (select auth.uid()) or assigned_to = (select auth.uid()) or private.has_org_role(organization_id, array['tenant_admin', 'manager']::public.organization_role[]) or private.is_platform_owner());
create policy "employees submit improvements" on public.operations_improvements for insert to authenticated
with check (submitted_by = (select auth.uid()) and private.is_org_member(organization_id));
create policy "managers update improvements" on public.operations_improvements for update to authenticated
using (private.has_org_role(organization_id, array['tenant_admin', 'manager']::public.organization_role[]) or private.is_platform_owner())
with check (private.has_org_role(organization_id, array['tenant_admin', 'manager']::public.organization_role[]) or private.is_platform_owner());

create policy "participants read improvement history" on public.operations_improvement_status_history for select to authenticated
using (exists (select 1 from public.operations_improvements i where i.id = improvement_id and i.organization_id = operations_improvement_status_history.organization_id));
create policy "employees create submission history" on public.operations_improvement_status_history for insert to authenticated
with check (changed_by = (select auth.uid()) and exists (select 1 from public.operations_improvements i where i.id = improvement_id and i.organization_id = operations_improvement_status_history.organization_id and (i.submitted_by = (select auth.uid()) or private.has_org_role(i.organization_id, array['tenant_admin', 'manager']::public.organization_role[]) or private.is_platform_owner())));

create policy "participants read improvement whys" on public.operations_improvement_whys for select to authenticated
using (exists (select 1 from public.operations_improvements i where i.id = improvement_id and i.organization_id = operations_improvement_whys.organization_id));
create policy "managers manage improvement whys" on public.operations_improvement_whys for all to authenticated
using (private.has_org_role(organization_id, array['tenant_admin', 'manager']::public.organization_role[]) or private.is_platform_owner())
with check (created_by = (select auth.uid()) and (private.has_org_role(organization_id, array['tenant_admin', 'manager']::public.organization_role[]) or private.is_platform_owner()));

create policy "participants read improvement actions" on public.operations_improvement_actions for select to authenticated
using (exists (select 1 from public.operations_improvements i where i.id = improvement_id and i.organization_id = operations_improvement_actions.organization_id));
create policy "managers manage improvement actions" on public.operations_improvement_actions for all to authenticated
using (private.has_org_role(organization_id, array['tenant_admin', 'manager']::public.organization_role[]) or private.is_platform_owner())
with check (created_by = (select auth.uid()) and (private.has_org_role(organization_id, array['tenant_admin', 'manager']::public.organization_role[]) or private.is_platform_owner()));

create policy "participants read improvement measurements" on public.operations_improvement_measurements for select to authenticated
using (exists (select 1 from public.operations_improvements i where i.id = improvement_id and i.organization_id = operations_improvement_measurements.organization_id));
create policy "managers manage improvement measurements" on public.operations_improvement_measurements for all to authenticated
using (private.has_org_role(organization_id, array['tenant_admin', 'manager']::public.organization_role[]) or private.is_platform_owner())
with check (created_by = (select auth.uid()) and (private.has_org_role(organization_id, array['tenant_admin', 'manager']::public.organization_role[]) or private.is_platform_owner()));
