create table public.executive_monthly_review_completions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  reporting_period date not null check (reporting_period = date_trunc('month', reporting_period)::date),
  notes text not null default '' check (char_length(notes) <= 2000),
  completed_by uuid not null references public.profiles(id) on delete restrict,
  completed_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, reporting_period)
);

create index executive_monthly_review_completions_completed_by_idx on public.executive_monthly_review_completions(completed_by);
alter table public.executive_monthly_review_completions enable row level security;
revoke all on public.executive_monthly_review_completions from anon;
grant select, insert, update on public.executive_monthly_review_completions to authenticated;

create policy "executive managers read monthly review completions"
on public.executive_monthly_review_completions for select to authenticated
using (private.has_org_role(organization_id, array['tenant_admin', 'manager']::public.organization_role[]) or private.is_platform_owner());

create policy "executive managers insert monthly review completions"
on public.executive_monthly_review_completions for insert to authenticated
with check (completed_by = (select auth.uid()) and (private.has_org_role(organization_id, array['tenant_admin', 'manager']::public.organization_role[]) or private.is_platform_owner()));

create policy "executive managers update monthly review completions"
on public.executive_monthly_review_completions for update to authenticated
using (private.has_org_role(organization_id, array['tenant_admin', 'manager']::public.organization_role[]) or private.is_platform_owner())
with check (completed_by = (select auth.uid()) and (private.has_org_role(organization_id, array['tenant_admin', 'manager']::public.organization_role[]) or private.is_platform_owner()));
