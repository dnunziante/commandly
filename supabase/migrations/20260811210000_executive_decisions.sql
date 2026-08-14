create table public.executive_decisions (
  id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
  reporting_period date not null check (reporting_period = date_trunc('month', reporting_period)::date), priority_key text not null check (priority_key ~ '^[a-z0-9-]{2,80}$'),
  title text not null check (char_length(title) between 3 and 180), decision text not null check (char_length(decision) between 3 and 3000), rationale text not null default '' check (char_length(rationale) <= 3000),
  owner_name text not null check (char_length(owner_name) between 2 and 160), review_date date not null, expected_outcome text not null check (char_length(expected_outcome) between 3 and 2000), measured_outcome text not null default '' check (char_length(measured_outcome) <= 2000),
  status text not null default 'open' check (status in ('open', 'validated', 'revised', 'reversed')), created_by uuid not null references public.profiles(id) on delete restrict, updated_by uuid not null references public.profiles(id) on delete restrict, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index executive_decisions_org_period_status_idx on public.executive_decisions(organization_id, reporting_period desc, status);
create index executive_decisions_review_date_idx on public.executive_decisions(organization_id, review_date);
create index executive_decisions_created_by_idx on public.executive_decisions(created_by);
create index executive_decisions_updated_by_idx on public.executive_decisions(updated_by);
alter table public.executive_decisions enable row level security; revoke all on public.executive_decisions from anon; grant select, insert, update on public.executive_decisions to authenticated;
create policy "executive managers read decisions" on public.executive_decisions for select to authenticated using (private.has_org_role(organization_id, array['tenant_admin', 'manager']::public.organization_role[]) or private.is_platform_owner());
create policy "executive managers insert decisions" on public.executive_decisions for insert to authenticated with check (created_by = (select auth.uid()) and updated_by = (select auth.uid()) and (private.has_org_role(organization_id, array['tenant_admin', 'manager']::public.organization_role[]) or private.is_platform_owner()));
create policy "executive managers update decisions" on public.executive_decisions for update to authenticated using (private.has_org_role(organization_id, array['tenant_admin', 'manager']::public.organization_role[]) or private.is_platform_owner()) with check (updated_by = (select auth.uid()) and (private.has_org_role(organization_id, array['tenant_admin', 'manager']::public.organization_role[]) or private.is_platform_owner()));
