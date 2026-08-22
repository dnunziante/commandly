alter table public.growth_opportunities add column if not exists lifecycle_status text not null default 'idea' check (lifecycle_status in ('idea','under_review','approved','planned','in_progress','blocked','completed','validated','not_pursuing','archived'));
alter table public.growth_opportunities add column if not exists progress integer not null default 0 check (progress between 0 and 100);
alter table public.growth_opportunities add column if not exists primary_owner_id uuid references public.profiles(id) on delete set null;
alter table public.growth_opportunities add column if not exists due_date date;
alter table public.growth_opportunities add column if not exists expected_outcome text not null default '';
alter table public.growth_opportunities add column if not exists notes text not null default '';

create table public.growth_opportunity_activity (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade, opportunity_id uuid not null references public.growth_opportunities(id) on delete cascade, actor_id uuid references public.profiles(id) on delete set null, activity_type text not null, description text not null, created_at timestamptz not null default now()
);
create index growth_opportunity_activity_org_opportunity_idx on public.growth_opportunity_activity(organization_id, opportunity_id, created_at desc);
alter table public.growth_opportunity_activity enable row level security;
grant select, insert on public.growth_opportunity_activity to authenticated;
create policy "members read growth opportunity activity" on public.growth_opportunity_activity for select to authenticated using (private.is_org_member(organization_id) or private.is_platform_owner());
create policy "members add growth opportunity activity" on public.growth_opportunity_activity for insert to authenticated with check (actor_id = (select auth.uid()) and (private.is_org_member(organization_id) or private.is_platform_owner()));
