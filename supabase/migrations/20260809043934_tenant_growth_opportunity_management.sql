create table public.growth_opportunities (
 id uuid primary key default gen_random_uuid(), organization_id uuid not null references public.organizations(id) on delete cascade,
 slug text not null check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'), title text not null check(char_length(title) between 2 and 160),
 category text not null, summary text not null, rationale text not null, impact_label text not null check(impact_label in ('High','Medium')),
 effort_label text not null check(effort_label in ('Low','Medium','High')), timeframe text not null,
 status text not null default 'draft' check(status in ('draft','published','archived')),
 actions text[] not null default '{}', measures text[] not null default '{}', score jsonb not null check(jsonb_typeof(score)='object'),
 created_by uuid references public.profiles(id) on delete set null, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(organization_id,slug)
);
create index growth_opportunities_org_status_idx on public.growth_opportunities(organization_id,status);
create index growth_opportunities_created_by_idx on public.growth_opportunities(created_by);
alter table public.growth_opportunities enable row level security;
grant select,insert,update,delete on public.growth_opportunities to authenticated;
create policy "members read growth opportunities" on public.growth_opportunities for select to authenticated using (private.is_org_member(organization_id) or private.is_platform_owner());
create policy "tenant admins manage growth opportunities" on public.growth_opportunities for all to authenticated using (private.has_org_role(organization_id,array['tenant_admin']::public.organization_role[]) or private.is_platform_owner()) with check (private.has_org_role(organization_id,array['tenant_admin']::public.organization_role[]) or private.is_platform_owner());
-- BGC seed rows match the temporary opportunity fixtures in src/lib/growth/data.ts.
