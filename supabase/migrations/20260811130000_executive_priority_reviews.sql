-- Manager workflow metadata for deterministic Executive Advisor priorities.
-- Review records do not alter priority calculations or source records.

create table public.executive_priority_reviews (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  priority_key text not null check (priority_key ~ '^[a-z0-9-]{2,80}$'),
  reporting_period date not null check (reporting_period = date_trunc('month', reporting_period)::date),
  status text not null default 'open' check (status in ('open', 'acknowledged', 'in_progress', 'completed', 'dismissed')),
  owner_name text not null default '' check (char_length(owner_name) <= 160),
  due_date date,
  review_note text not null default '' check (char_length(review_note) <= 2000),
  created_by uuid not null references public.profiles(id) on delete restrict,
  updated_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, priority_key, reporting_period)
);

create index executive_priority_reviews_org_period_status_idx on public.executive_priority_reviews(organization_id, reporting_period desc, status);
create index executive_priority_reviews_created_by_idx on public.executive_priority_reviews(created_by);
create index executive_priority_reviews_updated_by_idx on public.executive_priority_reviews(updated_by);

alter table public.executive_priority_reviews enable row level security;
revoke all on public.executive_priority_reviews from anon;
grant select, insert, update on public.executive_priority_reviews to authenticated;

create policy "executive managers read priority reviews"
on public.executive_priority_reviews for select to authenticated
using (
  private.has_org_role(organization_id, array['tenant_admin', 'manager']::public.organization_role[])
  or private.is_platform_owner()
);

create policy "executive managers insert priority reviews"
on public.executive_priority_reviews for insert to authenticated
with check (
  created_by = (select auth.uid())
  and updated_by = (select auth.uid())
  and (
    private.has_org_role(organization_id, array['tenant_admin', 'manager']::public.organization_role[])
    or private.is_platform_owner()
  )
);

create policy "executive managers update priority reviews"
on public.executive_priority_reviews for update to authenticated
using (
  private.has_org_role(organization_id, array['tenant_admin', 'manager']::public.organization_role[])
  or private.is_platform_owner()
)
with check (
  updated_by = (select auth.uid())
  and (
    private.has_org_role(organization_id, array['tenant_admin', 'manager']::public.organization_role[])
    or private.is_platform_owner()
  )
);
