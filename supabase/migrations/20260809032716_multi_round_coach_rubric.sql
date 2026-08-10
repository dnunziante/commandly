-- Multi-round practice content and configurable deterministic C.L.O.S.E.R. scoring.

alter table public.coach_scenarios
add column rubric_weights jsonb not null default '{"Clarify":20,"Listen":20,"Open":15,"Solve":15,"Explain":15,"Recommend":15}'::jsonb
check (
  jsonb_typeof(rubric_weights) = 'object'
  and rubric_weights ?& array['Clarify','Listen','Open','Solve','Explain','Recommend']
);

create table public.coach_scenario_rounds (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  scenario_id uuid not null references public.coach_scenarios(id) on delete cascade,
  round_number smallint not null check (round_number between 1 and 10),
  customer_prompt text not null check (char_length(customer_prompt) between 2 and 600),
  response_options text[] not null check (cardinality(response_options) between 2 and 6),
  preferred_option_indices smallint[] not null check (cardinality(preferred_option_indices) >= 1),
  skill_impacts text[] not null check (cardinality(skill_impacts) between 1 and 6),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (scenario_id, round_number)
);

create index coach_scenario_rounds_organization_id_idx on public.coach_scenario_rounds(organization_id);
create index coach_scenario_rounds_scenario_id_idx on public.coach_scenario_rounds(scenario_id);

alter table public.coach_scenario_rounds enable row level security;
grant select, insert, update, delete on public.coach_scenario_rounds to authenticated;

create policy "members read published coach scenario rounds" on public.coach_scenario_rounds
for select to authenticated using (
  exists (
    select 1 from public.coach_scenarios scenario
    where scenario.id = scenario_id
      and scenario.organization_id = organization_id
      and (
        scenario.status = 'published'
        or private.has_org_role(organization_id, array['tenant_admin', 'manager']::public.organization_role[])
      )
  ) or private.is_platform_owner()
);

create policy "tenant admins create coach scenario rounds" on public.coach_scenario_rounds
for insert to authenticated with check (
  private.has_org_role(organization_id, array['tenant_admin']::public.organization_role[])
  and exists (
    select 1 from public.coach_scenarios scenario
    where scenario.id = scenario_id and scenario.organization_id = organization_id
  )
);

create policy "tenant admins update coach scenario rounds" on public.coach_scenario_rounds
for update to authenticated
using (private.has_org_role(organization_id, array['tenant_admin']::public.organization_role[]))
with check (
  private.has_org_role(organization_id, array['tenant_admin']::public.organization_role[])
  and exists (
    select 1 from public.coach_scenarios scenario
    where scenario.id = scenario_id and scenario.organization_id = organization_id
  )
);

create policy "tenant admins delete coach scenario rounds" on public.coach_scenario_rounds
for delete to authenticated
using (private.has_org_role(organization_id, array['tenant_admin']::public.organization_role[]));

insert into public.coach_scenario_rounds (
  organization_id, scenario_id, round_number, customer_prompt,
  response_options, preferred_option_indices, skill_impacts
)
select organization_id, id, 1, opening, response_options, preferred_option_indices, array['Clarify', 'Listen']
from public.coach_scenarios
where organization_id = '10000000-0000-0000-0000-000000000001'
on conflict (scenario_id, round_number) do update set
  customer_prompt = excluded.customer_prompt,
  response_options = excluded.response_options,
  preferred_option_indices = excluded.preferred_option_indices,
  skill_impacts = excluded.skill_impacts,
  updated_at = now();

insert into public.coach_scenario_rounds (
  organization_id, scenario_id, round_number, customer_prompt,
  response_options, preferred_option_indices, skill_impacts
)
select organization_id, id, 2,
  'That makes sense. Based on what I have told you, how would you help me narrow this down?',
  array[
    'Let me summarize what I heard first, then we can compare the choices that fit those priorities.',
    'I would choose the most popular option because it works for most customers.',
    'Before I recommend anything, which of those priorities would be hardest for you to compromise on?'
  ],
  array[0,2]::smallint[],
  array['Open', 'Solve', 'Explain']
from public.coach_scenarios
where organization_id = '10000000-0000-0000-0000-000000000001'
on conflict (scenario_id, round_number) do update set
  customer_prompt = excluded.customer_prompt,
  response_options = excluded.response_options,
  preferred_option_indices = excluded.preferred_option_indices,
  skill_impacts = excluded.skill_impacts,
  updated_at = now();

insert into public.coach_scenario_rounds (
  organization_id, scenario_id, round_number, customer_prompt,
  response_options, preferred_option_indices, skill_impacts
)
select organization_id, id, 3,
  'I understand the fit better now. What would you suggest as the next step?',
  array[
    'Based on your priorities, I can recommend a clear next step and explain why it fits.',
    'You should make the decision today before the opportunity is gone.',
    'Would you like to review the best-fit option together and decide what next step feels right?'
  ],
  array[0,2]::smallint[],
  array['Explain', 'Recommend']
from public.coach_scenarios
where organization_id = '10000000-0000-0000-0000-000000000001'
on conflict (scenario_id, round_number) do update set
  customer_prompt = excluded.customer_prompt,
  response_options = excluded.response_options,
  preferred_option_indices = excluded.preferred_option_indices,
  skill_impacts = excluded.skill_impacts,
  updated_at = now();
