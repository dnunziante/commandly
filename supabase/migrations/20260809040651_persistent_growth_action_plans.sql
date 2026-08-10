-- Tenant-aware Growth Advisor action plans and ordered validation tasks.

create table public.growth_action_plans (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  opportunity_slug text not null check (opportunity_slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  title text not null check (char_length(title) between 2 and 160),
  owner_name text not null check (char_length(owner_name) between 2 and 120),
  target_date date not null,
  target_measure text not null check (char_length(target_measure) between 2 and 160),
  status text not null default 'not_started' check (status in ('not_started', 'in_progress', 'complete')),
  created_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, opportunity_slug)
);

create table public.growth_action_plan_tasks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  plan_id uuid not null references public.growth_action_plans(id) on delete cascade,
  position smallint not null check (position between 1 and 50),
  title text not null check (char_length(title) between 2 and 240),
  is_complete boolean not null default false,
  completed_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (plan_id, position),
  check ((is_complete and completed_at is not null) or (not is_complete and completed_at is null))
);

create index growth_action_plans_org_status_idx on public.growth_action_plans(organization_id, status);
create index growth_action_plans_created_by_idx on public.growth_action_plans(created_by);
create index growth_action_plan_tasks_org_idx on public.growth_action_plan_tasks(organization_id);
create index growth_action_plan_tasks_plan_idx on public.growth_action_plan_tasks(plan_id);

alter table public.growth_action_plans enable row level security;
alter table public.growth_action_plan_tasks enable row level security;

grant select, insert, update, delete on public.growth_action_plans to authenticated;
grant select, insert, update, delete on public.growth_action_plan_tasks to authenticated;

create policy "members read growth plans" on public.growth_action_plans for select to authenticated
using (private.is_org_member(organization_id) or private.is_platform_owner());

create policy "members create growth plans" on public.growth_action_plans for insert to authenticated
with check (private.is_org_member(organization_id) and created_by = (select auth.uid()));

create policy "authorized members update growth plans" on public.growth_action_plans for update to authenticated
using (private.is_platform_owner() or (private.is_org_member(organization_id) and (created_by = (select auth.uid()) or private.has_org_role(organization_id, array['tenant_admin', 'manager']::public.organization_role[]))))
with check (private.is_platform_owner() or (private.is_org_member(organization_id) and (created_by = (select auth.uid()) or private.has_org_role(organization_id, array['tenant_admin', 'manager']::public.organization_role[]))));

create policy "authorized members delete growth plans" on public.growth_action_plans for delete to authenticated
using (private.is_platform_owner() or (private.is_org_member(organization_id) and (created_by = (select auth.uid()) or private.has_org_role(organization_id, array['tenant_admin', 'manager']::public.organization_role[]))));

create policy "members read growth plan tasks" on public.growth_action_plan_tasks for select to authenticated
using (private.is_platform_owner() or (private.is_org_member(organization_id) and exists (select 1 from public.growth_action_plans plan where plan.id = plan_id and plan.organization_id = organization_id)));

create policy "authorized members create growth plan tasks" on public.growth_action_plan_tasks for insert to authenticated
with check (private.is_platform_owner() or (private.is_org_member(organization_id) and exists (select 1 from public.growth_action_plans plan where plan.id = plan_id and plan.organization_id = organization_id and (plan.created_by = (select auth.uid()) or private.has_org_role(organization_id, array['tenant_admin', 'manager']::public.organization_role[])))));

create policy "authorized members update growth plan tasks" on public.growth_action_plan_tasks for update to authenticated
using (private.is_platform_owner() or (private.is_org_member(organization_id) and exists (select 1 from public.growth_action_plans plan where plan.id = plan_id and plan.organization_id = organization_id and (plan.created_by = (select auth.uid()) or private.has_org_role(organization_id, array['tenant_admin', 'manager']::public.organization_role[])))))
with check (private.is_platform_owner() or (private.is_org_member(organization_id) and exists (select 1 from public.growth_action_plans plan where plan.id = plan_id and plan.organization_id = organization_id and (plan.created_by = (select auth.uid()) or private.has_org_role(organization_id, array['tenant_admin', 'manager']::public.organization_role[])))));

create policy "authorized members delete growth plan tasks" on public.growth_action_plan_tasks for delete to authenticated
using (private.is_platform_owner() or (private.is_org_member(organization_id) and exists (select 1 from public.growth_action_plans plan where plan.id = plan_id and plan.organization_id = organization_id and (plan.created_by = (select auth.uid()) or private.has_org_role(organization_id, array['tenant_admin', 'manager']::public.organization_role[])))));
