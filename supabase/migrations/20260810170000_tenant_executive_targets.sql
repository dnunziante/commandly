-- Commandly: tenant-scoped Executive Advisor targets.
-- Configuration only; no customer data is seeded.

create table public.executive_targets (
  organization_id uuid primary key references public.organizations(id) on delete cascade,
  sales_pace_target smallint not null default 100 check (sales_pace_target between 1 and 200),
  coaching_completion_target smallint not null default 90 check (coaching_completion_target between 1 and 100),
  growth_completion_target smallint not null default 80 check (growth_completion_target between 1 and 100),
  operations_completion_target smallint not null default 95 check (operations_completion_target between 1 and 100),
  high_risk_limit smallint not null default 0 check (high_risk_limit between 0 and 100),
  updated_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now()
);

alter table public.executive_targets enable row level security;

revoke all on public.executive_targets from anon;
grant select, insert, update on public.executive_targets to authenticated;

create policy "members read executive targets"
on public.executive_targets for select to authenticated
using (private.is_org_member(organization_id) or private.is_platform_owner());

create policy "tenant admins insert executive targets"
on public.executive_targets for insert to authenticated
with check (
  updated_by = (select auth.uid())
  and (private.has_org_role(organization_id, array['tenant_admin']::public.organization_role[]) or private.is_platform_owner())
);

create policy "tenant admins update executive targets"
on public.executive_targets for update to authenticated
using (private.has_org_role(organization_id, array['tenant_admin']::public.organization_role[]) or private.is_platform_owner())
with check (
  updated_by = (select auth.uid())
  and (private.has_org_role(organization_id, array['tenant_admin']::public.organization_role[]) or private.is_platform_owner())
);
