-- Persistent adaptive coaching. Customer personas live in a separate table with
-- no client SELECT policy so a participant cannot retrieve the hidden brief.

alter table public.coach_sessions
  alter column scenario_id drop not null,
  add column if not exists session_type text not null default 'role_play' check (session_type in ('role_play', 'objection', 'challenge')),
  add column if not exists difficulty text not null default 'Foundational' check (difficulty in ('Foundational', 'Intermediate', 'Advanced')),
  add column if not exists coaching_focus text,
  add column if not exists evaluation jsonb not null default '{}'::jsonb check (jsonb_typeof(evaluation) = 'object');

create table public.coach_adaptive_profiles (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  overall_score smallint not null default 0 check (overall_score between 0 and 100),
  skill_scores jsonb not null default '{}'::jsonb check (jsonb_typeof(skill_scores) = 'object'),
  recurring_strengths text[] not null default '{}',
  recurring_weaknesses text[] not null default '{}',
  recent_trend text not null default 'Establishing a baseline',
  completed_scenarios jsonb not null default '[]'::jsonb check (jsonb_typeof(completed_scenarios) = 'array'),
  objection_types_practiced text[] not null default '{}',
  current_difficulty text not null default 'Foundational' check (current_difficulty in ('Foundational', 'Intermediate', 'Advanced')),
  recommended_focus text not null default 'Discovery and customer priorities',
  updated_at timestamptz not null default now(),
  primary key (organization_id, user_id)
);

create table public.coach_session_personas (
  session_id uuid primary key references public.coach_sessions(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  persona jsonb not null check (jsonb_typeof(persona) = 'object'),
  created_at timestamptz not null default now()
);

create table public.coach_conversation_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.coach_sessions(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  speaker text not null check (speaker in ('customer', 'rep', 'coach')),
  content text not null check (char_length(content) between 1 and 4000),
  created_at timestamptz not null default now()
);

create index coach_adaptive_profiles_org_updated_idx on public.coach_adaptive_profiles (organization_id, updated_at desc);
create index coach_conversation_messages_session_idx on public.coach_conversation_messages (session_id, created_at);

alter table public.coach_adaptive_profiles enable row level security;
alter table public.coach_session_personas enable row level security;
alter table public.coach_conversation_messages enable row level security;
grant select on public.coach_adaptive_profiles, public.coach_conversation_messages to authenticated;

create policy "participants and leaders read adaptive coaching profiles" on public.coach_adaptive_profiles
for select to authenticated using (private.can_view_coach_performance(organization_id, null, user_id));

create policy "participants and leaders read coach conversation" on public.coach_conversation_messages
for select to authenticated using (exists (
  select 1 from public.coach_sessions s where s.id = session_id
  and private.can_view_coach_performance(s.organization_id, s.location_id, s.user_id)
));

-- A deny-all policy documents that personas are deliberately server-only;
-- service-role code writes/reads them after authenticating the participant.
create policy "hidden personas have no direct client access" on public.coach_session_personas
for all to authenticated using (false) with check (false);
