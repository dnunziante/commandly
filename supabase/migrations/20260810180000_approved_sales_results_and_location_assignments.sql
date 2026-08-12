-- Commandly: approved monthly sales results and optional location assignment.
-- Structure and access controls only; no sales data is seeded.

create table public.sales_results (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  location_id uuid not null,
  period_start date not null check (period_start = date_trunc('month', period_start)::date),
  revenue_target numeric(14,2) not null default 0 check (revenue_target >= 0),
  revenue_actual numeric(14,2) not null default 0 check (revenue_actual >= 0),
  units_target integer not null default 0 check (units_target >= 0),
  units_actual integer not null default 0 check (units_actual >= 0),
  leads integer not null default 0 check (leads >= 0),
  appointments integer not null default 0 check (appointments >= 0),
  status text not null default 'draft' check (status in ('draft', 'approved')),
  notes text not null default '' check (char_length(notes) <= 2000),
  created_by uuid not null references public.profiles(id) on delete restrict,
  updated_by uuid not null references public.profiles(id) on delete restrict,
  approved_by uuid references public.profiles(id) on delete set null,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (location_id, organization_id) references public.locations(id, organization_id) on delete restrict,
  unique (organization_id, location_id, period_start),
  check ((status = 'approved' and approved_by is not null and approved_at is not null) or (status = 'draft' and approved_by is null and approved_at is null))
);

alter table public.coach_sessions add column location_id uuid;
alter table public.coach_sessions add constraint coach_sessions_location_organization_fkey
  foreign key (location_id, organization_id) references public.locations(id, organization_id) on delete set null (location_id);

alter table public.growth_action_plans add column location_id uuid;
alter table public.growth_action_plans add constraint growth_action_plans_location_organization_fkey
  foreign key (location_id, organization_id) references public.locations(id, organization_id) on delete set null (location_id);

create index sales_results_org_status_period_idx on public.sales_results(organization_id, status, period_start desc);
create index sales_results_location_period_idx on public.sales_results(location_id, period_start desc);
create index sales_results_created_by_idx on public.sales_results(created_by);
create index sales_results_updated_by_idx on public.sales_results(updated_by);
create index sales_results_approved_by_idx on public.sales_results(approved_by) where approved_by is not null;
create index coach_sessions_org_location_status_idx on public.coach_sessions(organization_id, location_id, status) where location_id is not null;
create index growth_action_plans_org_location_status_idx on public.growth_action_plans(organization_id, location_id, status) where location_id is not null;

alter table public.sales_results enable row level security;
revoke all on public.sales_results from anon;
grant select, insert, update, delete on public.sales_results to authenticated;

create policy "members read approved sales results"
on public.sales_results for select to authenticated
using (
  (status = 'approved' and private.is_org_member(organization_id))
  or private.has_org_role(organization_id, array['tenant_admin']::public.organization_role[])
  or private.is_platform_owner()
);

create policy "tenant admins insert sales results"
on public.sales_results for insert to authenticated
with check (
  created_by = (select auth.uid()) and updated_by = (select auth.uid())
  and (private.has_org_role(organization_id, array['tenant_admin']::public.organization_role[]) or private.is_platform_owner())
);

create policy "tenant admins update sales results"
on public.sales_results for update to authenticated
using (private.has_org_role(organization_id, array['tenant_admin']::public.organization_role[]) or private.is_platform_owner())
with check (
  updated_by = (select auth.uid())
  and (private.has_org_role(organization_id, array['tenant_admin']::public.organization_role[]) or private.is_platform_owner())
);

create policy "tenant admins delete sales results"
on public.sales_results for delete to authenticated
using (private.has_org_role(organization_id, array['tenant_admin']::public.organization_role[]) or private.is_platform_owner());
