-- Append-only audit history for Executive Advisor priority reviews.

create table public.executive_priority_review_history (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  review_id uuid not null references public.executive_priority_reviews(id) on delete cascade,
  priority_key text not null check (priority_key ~ '^[a-z0-9-]{2,80}$'),
  reporting_period date not null check (reporting_period = date_trunc('month', reporting_period)::date),
  previous_status text check (previous_status is null or previous_status in ('open', 'acknowledged', 'in_progress', 'completed', 'dismissed')),
  status text not null check (status in ('open', 'acknowledged', 'in_progress', 'completed', 'dismissed')),
  owner_name text not null default '' check (char_length(owner_name) <= 160),
  due_date date,
  review_note text not null default '' check (char_length(review_note) <= 2000),
  changed_by uuid not null references public.profiles(id) on delete restrict,
  changed_at timestamptz not null default now()
);

create index executive_priority_review_history_org_period_changed_idx
  on public.executive_priority_review_history(organization_id, reporting_period desc, changed_at desc);
create index executive_priority_review_history_review_changed_idx
  on public.executive_priority_review_history(review_id, changed_at desc);
create index executive_priority_review_history_changed_by_idx
  on public.executive_priority_review_history(changed_by);

alter table public.executive_priority_review_history enable row level security;
revoke all on public.executive_priority_review_history from anon, authenticated;
grant select on public.executive_priority_review_history to authenticated;

create policy "executive managers read priority review history"
on public.executive_priority_review_history for select to authenticated
using (
  private.has_org_role(organization_id, array['tenant_admin', 'manager']::public.organization_role[])
  or private.is_platform_owner()
);

create or replace function private.record_executive_priority_review_history()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
begin
  insert into public.executive_priority_review_history (
    organization_id, review_id, priority_key, reporting_period,
    previous_status, status, owner_name, due_date, review_note, changed_by, changed_at
  ) values (
    new.organization_id, new.id, new.priority_key, new.reporting_period,
    case when tg_op = 'UPDATE' then old.status else null end,
    new.status, new.owner_name, new.due_date, new.review_note, new.updated_by, new.updated_at
  );
  return new;
end;
$$;

revoke all on function private.record_executive_priority_review_history() from public, anon, authenticated;

create trigger record_executive_priority_review_history
after insert or update of status, owner_name, due_date, review_note on public.executive_priority_reviews
for each row execute function private.record_executive_priority_review_history();
