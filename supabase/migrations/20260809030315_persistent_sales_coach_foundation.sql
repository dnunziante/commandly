-- Tenant-scoped Sales Coach scenarios, sessions, responses, and deterministic prototype scoring.

create type public.coach_scenario_status as enum ('draft', 'published', 'archived');
create type public.coach_session_status as enum ('in_progress', 'completed', 'abandoned');

create table public.coach_scenarios (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  slug text not null check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  title text not null check (char_length(title) between 2 and 120),
  category text not null check (char_length(category) between 2 and 80),
  difficulty text not null check (difficulty in ('Foundational', 'Intermediate', 'Advanced')),
  duration_minutes smallint not null default 6 check (duration_minutes between 1 and 60),
  customer_persona text not null check (char_length(customer_persona) between 2 and 300),
  goal text not null check (char_length(goal) between 2 and 600),
  opening text not null check (char_length(opening) between 2 and 600),
  skills text[] not null default '{}' check (cardinality(skills) between 1 and 8),
  response_options text[] not null default '{}' check (cardinality(response_options) between 2 and 6),
  preferred_option_indices smallint[] not null default '{}' check (cardinality(preferred_option_indices) >= 1),
  status public.coach_scenario_status not null default 'draft',
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, slug)
);

create table public.coach_sessions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  scenario_id uuid not null references public.coach_scenarios(id) on delete restrict,
  user_id uuid not null references public.profiles(id) on delete cascade,
  status public.coach_session_status not null default 'in_progress',
  score smallint check (score between 0 and 100),
  closer_scores jsonb not null default '{}'::jsonb check (jsonb_typeof(closer_scores) = 'object'),
  summary text,
  strength text,
  improvement text,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  check ((status = 'completed' and completed_at is not null and score is not null) or status <> 'completed')
);

create table public.coach_responses (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  session_id uuid not null references public.coach_sessions(id) on delete cascade,
  round_number smallint not null default 1 check (round_number between 1 and 20),
  customer_prompt text not null,
  response_text text not null,
  selected_option_index smallint check (selected_option_index between 0 and 5),
  score smallint check (score between 0 and 100),
  feedback text,
  created_at timestamptz not null default now(),
  unique (session_id, round_number)
);

create index coach_scenarios_organization_status_idx on public.coach_scenarios(organization_id, status);
create index coach_scenarios_organization_category_idx on public.coach_scenarios(organization_id, category);
create index coach_scenarios_created_by_idx on public.coach_scenarios(created_by);
create index coach_sessions_organization_user_started_idx on public.coach_sessions(organization_id, user_id, started_at desc);
create index coach_sessions_scenario_id_idx on public.coach_sessions(scenario_id);
create index coach_sessions_user_id_idx on public.coach_sessions(user_id);
create index coach_responses_organization_id_idx on public.coach_responses(organization_id);
create index coach_responses_session_id_idx on public.coach_responses(session_id);

alter table public.coach_scenarios enable row level security;
alter table public.coach_sessions enable row level security;
alter table public.coach_responses enable row level security;

grant select, insert, update, delete on public.coach_scenarios to authenticated;
grant select, insert, update on public.coach_sessions to authenticated;
grant select, insert, update on public.coach_responses to authenticated;

create policy "members read published coach scenarios" on public.coach_scenarios
for select to authenticated using (
  (private.is_org_member(organization_id) and (
    status = 'published'
    or private.has_org_role(organization_id, array['tenant_admin', 'manager']::public.organization_role[])
  )) or private.is_platform_owner()
);

create policy "tenant admins manage coach scenarios" on public.coach_scenarios
for all to authenticated
using (private.has_org_role(organization_id, array['tenant_admin']::public.organization_role[]))
with check (private.has_org_role(organization_id, array['tenant_admin']::public.organization_role[]));

create policy "members read permitted coach sessions" on public.coach_sessions
for select to authenticated using (
  (private.is_org_member(organization_id) and (
    user_id = (select auth.uid())
    or private.has_org_role(organization_id, array['tenant_admin', 'manager']::public.organization_role[])
  )) or private.is_platform_owner()
);

create policy "members create their own coach sessions" on public.coach_sessions
for insert to authenticated with check (
  private.is_org_member(organization_id)
  and user_id = (select auth.uid())
  and exists (
    select 1 from public.coach_scenarios scenario
    where scenario.id = scenario_id
      and scenario.organization_id = organization_id
      and scenario.status = 'published'
  )
);

create policy "members update their own coach sessions" on public.coach_sessions
for update to authenticated
using (private.is_org_member(organization_id) and user_id = (select auth.uid()))
with check (private.is_org_member(organization_id) and user_id = (select auth.uid()));

create policy "members read permitted coach responses" on public.coach_responses
for select to authenticated using (
  exists (
    select 1 from public.coach_sessions session
    where session.id = session_id
      and session.organization_id = organization_id
      and (
        session.user_id = (select auth.uid())
        or private.has_org_role(organization_id, array['tenant_admin', 'manager']::public.organization_role[])
      )
  ) or private.is_platform_owner()
);

create policy "members create their own coach responses" on public.coach_responses
for insert to authenticated with check (
  exists (
    select 1 from public.coach_sessions session
    where session.id = session_id
      and session.organization_id = organization_id
      and session.user_id = (select auth.uid())
      and session.status = 'in_progress'
  )
);

create policy "members update their own coach responses" on public.coach_responses
for update to authenticated
using (
  exists (
    select 1 from public.coach_sessions session
    where session.id = session_id
      and session.organization_id = organization_id
      and session.user_id = (select auth.uid())
      and session.status = 'in_progress'
  )
)
with check (
  exists (
    select 1 from public.coach_sessions session
    where session.id = session_id
      and session.organization_id = organization_id
      and session.user_id = (select auth.uid())
      and session.status = 'in_progress'
  )
);

insert into public.coach_scenarios (
  organization_id, slug, title, category, difficulty, duration_minutes,
  customer_persona, goal, opening, skills, response_options, preferred_option_indices, status
)
values
  ('10000000-0000-0000-0000-000000000001', 'price-objection', 'The price feels high', 'Objection handling', 'Foundational', 6, 'A value-conscious family comparing several carts', 'Acknowledge the concern, uncover priorities, and explain value without inventing pricing.', 'I like the Nexus, but this is more than I planned to spend.', array['Listen', 'Clarify', 'Value framing'], array['That makes sense. Before we compare numbers, what matters most to you in the cart you choose?', 'The Nexus has a lot of value, so I think it is worth the difference.', 'What price were you hoping to stay near, and which features are most important to your family?'], array[0,2]::smallint[], 'published'),
  ('10000000-0000-0000-0000-000000000001', 'competitor-comparison', 'Comparing another dealership', 'Competitive conversation', 'Intermediate', 8, 'A shopper who has visited a competing dealership', 'Explore the customer''s comparison criteria before positioning an approved BGC product.', 'The other dealership says their cart gives me the same thing for less.', array['Discovery', 'Comparison', 'Trust'], array['What parts of their offer stood out most to you?', 'We are better than they are, so price should not be the only factor.', 'Would it help if we compared the features and support that matter most to you?'], array[0,2]::smallint[], 'published'),
  ('10000000-0000-0000-0000-000000000001', 'product-fit', 'Finding the right cart', 'Product recommendation', 'Foundational', 7, 'A first-time buyer unsure which model fits', 'Use discovery questions to distinguish Nexus, Beyond, and ActivEV Pulse needs.', 'There are so many options. I am not sure what I actually need.', array['Discovery', 'Product fit', 'Summarizing'], array['Let us start with how many people you usually carry and where you plan to drive.', 'The Nexus is our premium model, so that is probably the best choice.', 'Which matters more to you right now: passenger capacity, comfort, or range?'], array[0,2]::smallint[], 'published'),
  ('10000000-0000-0000-0000-000000000001', 'financing', 'Making the purchase manageable', 'Financing discussion', 'Intermediate', 7, 'A qualified shopper concerned about the total purchase', 'Discuss next steps clearly without promising unapproved terms or rates.', 'I may need financing, but I do not want the payment to get out of hand.', array['Empathy', 'Boundaries', 'Next steps'], array['That makes sense. We can review approved options without assuming a rate or payment.', 'I am sure we can get the payment where you need it.', 'What monthly range feels comfortable before we discuss the available next steps?'], array[0,2]::smallint[], 'published'),
  ('10000000-0000-0000-0000-000000000001', 'follow-up', 'Re-engaging a quiet lead', 'Follow-up', 'Intermediate', 5, 'A shopper who has not replied in one week', 'Create a useful, low-pressure reason to continue the conversation.', 'I am still thinking about it. I will reach out when I am ready.', array['Relevance', 'Permission', 'Follow-up'], array['Absolutely. Would it be helpful if I sent the comparison we discussed and checked back next week?', 'I need to know whether you are buying so I can close your file.', 'What information would make your decision easier while you think it over?'], array[0,2]::smallint[], 'published'),
  ('10000000-0000-0000-0000-000000000001', 'close', 'Asking for the next step', 'Closing conversation', 'Advanced', 9, 'An informed shopper showing strong buying signals', 'Summarize the fit and confidently invite a clear next step.', 'The Beyond seems to check most of my boxes. I just need to decide.', array['Summarizing', 'Confidence', 'Commitment'], array['It sounds like the Beyond fits your priorities. Would you like to choose the next step together?', 'Great, I will start the paperwork now.', 'What is the one remaining question you need answered before deciding?'], array[0,2]::smallint[], 'published')
on conflict (organization_id, slug) do update set
  title = excluded.title,
  category = excluded.category,
  difficulty = excluded.difficulty,
  duration_minutes = excluded.duration_minutes,
  customer_persona = excluded.customer_persona,
  goal = excluded.goal,
  opening = excluded.opening,
  skills = excluded.skills,
  response_options = excluded.response_options,
  preferred_option_indices = excluded.preferred_option_indices,
  status = excluded.status,
  updated_at = now();
