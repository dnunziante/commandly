-- Durable, tenant-scoped Sales Assistant interaction analytics.
create table public.assistant_interactions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  location_id uuid references public.locations(id) on delete set null,
  user_id uuid not null references public.profiles(id) on delete cascade,
  conversation_id uuid references public.assistant_conversations(id) on delete set null,
  question text not null check (char_length(question) between 2 and 2000),
  topic text not null default 'General',
  product_references text[] not null default '{}',
  competitor_references text[] not null default '{}',
  objection_category text,
  grounded boolean not null default false,
  unresolved boolean not null default false,
  created_at timestamptz not null default now(),
  foreign key (location_id, organization_id) references public.locations(id, organization_id) on delete set null
);
create index assistant_interactions_scope_idx on public.assistant_interactions (organization_id, location_id, user_id, created_at desc);
create index assistant_interactions_topic_idx on public.assistant_interactions (organization_id, topic, created_at desc);
alter table public.assistant_interactions enable row level security;
grant select, insert on public.assistant_interactions to authenticated;
create policy "users read authorized assistant interactions" on public.assistant_interactions for select to authenticated
using (private.can_view_performance(organization_id, location_id, user_id));
create policy "users create own assistant interactions" on public.assistant_interactions for insert to authenticated
with check (user_id = (select auth.uid()) and private.is_org_member(organization_id));
