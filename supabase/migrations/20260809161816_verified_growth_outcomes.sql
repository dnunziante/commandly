create table public.growth_plan_outcomes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  plan_id uuid not null references public.growth_action_plans(id) on delete cascade,
  outcome_date date not null,
  leads integer not null default 0 check (leads >= 0),
  appointments integer not null default 0 check (appointments >= 0),
  revenue numeric(12,2) not null default 0 check (revenue >= 0),
  cost numeric(12,2) not null default 0 check (cost >= 0),
  notes text not null default '' check (char_length(notes) <= 1000),
  recorded_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index growth_plan_outcomes_org_date_idx on public.growth_plan_outcomes(organization_id, outcome_date desc);
create index growth_plan_outcomes_plan_date_idx on public.growth_plan_outcomes(plan_id, outcome_date desc);

alter table public.growth_plan_outcomes enable row level security;
grant select, insert, update, delete on public.growth_plan_outcomes to authenticated;

create policy "members read growth outcomes" on public.growth_plan_outcomes for select to authenticated
using (private.is_platform_owner() or (private.is_org_member(organization_id) and exists (select 1 from public.growth_action_plans plan where plan.id = plan_id and plan.organization_id = organization_id)));

create policy "authorized members create growth outcomes" on public.growth_plan_outcomes for insert to authenticated
with check (recorded_by = (select auth.uid()) and (private.is_platform_owner() or (private.is_org_member(organization_id) and exists (select 1 from public.growth_action_plans plan where plan.id = plan_id and plan.organization_id = organization_id and (plan.created_by = (select auth.uid()) or private.has_org_role(organization_id, array['tenant_admin', 'manager']::public.organization_role[]))))));

create policy "authorized members update growth outcomes" on public.growth_plan_outcomes for update to authenticated
using (private.is_platform_owner() or (private.is_org_member(organization_id) and (recorded_by = (select auth.uid()) or private.has_org_role(organization_id, array['tenant_admin', 'manager']::public.organization_role[]))))
with check (private.is_platform_owner() or (private.is_org_member(organization_id) and (recorded_by = (select auth.uid()) or private.has_org_role(organization_id, array['tenant_admin', 'manager']::public.organization_role[]))));

create policy "authorized members delete growth outcomes" on public.growth_plan_outcomes for delete to authenticated
using (private.is_platform_owner() or (private.is_org_member(organization_id) and (recorded_by = (select auth.uid()) or private.has_org_role(organization_id, array['tenant_admin', 'manager']::public.organization_role[]))));
