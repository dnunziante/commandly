create table public.growth_scoring_configs (
  organization_id uuid primary key references public.organizations(id) on delete cascade,
  weights jsonb not null check (jsonb_typeof(weights) = 'object'),
  opportunity_scores jsonb not null default '{}'::jsonb check (jsonb_typeof(opportunity_scores) = 'object'),
  updated_by uuid references public.profiles(id) on delete set null,
  updated_at timestamptz not null default now()
);
alter table public.growth_scoring_configs enable row level security;
grant select, insert, update on public.growth_scoring_configs to authenticated;
create policy "members read growth scoring configuration" on public.growth_scoring_configs for select to authenticated using (private.is_org_member(organization_id) or private.is_platform_owner());
create policy "tenant admins manage growth scoring configuration" on public.growth_scoring_configs for all to authenticated using (private.has_org_role(organization_id, array['tenant_admin']::public.organization_role[]) or private.is_platform_owner()) with check (private.has_org_role(organization_id, array['tenant_admin']::public.organization_role[]) or private.is_platform_owner());
insert into public.growth_scoring_configs (organization_id, weights, opportunity_scores) values ('10000000-0000-0000-0000-000000000001', '{"impact":25,"effort":10,"confidence":20,"cost":15,"risk":10,"alignment":20}'::jsonb, '{"community-demo-days":{"impact":5,"effort":3,"confidence":3,"cost":3,"risk":2,"alignment":4},"past-buyer-referrals":{"impact":5,"effort":2,"confidence":4,"cost":2,"risk":2,"alignment":5},"local-partner-network":{"impact":3,"effort":3,"confidence":3,"cost":2,"risk":3,"alignment":4},"lead-response-sprint":{"impact":5,"effort":2,"confidence":4,"cost":1,"risk":2,"alignment":5},"mobile-service-feasibility":{"impact":3,"effort":5,"confidence":2,"cost":5,"risk":4,"alignment":3}}'::jsonb) on conflict (organization_id) do nothing;
