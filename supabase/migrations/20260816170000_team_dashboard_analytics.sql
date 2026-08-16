-- Durable, tenant-safe activity tracking for the Team Dashboard.
create table if not exists public.organization_member_locations (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  location_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (organization_id, user_id, location_id),
  foreign key (location_id, organization_id) references public.locations(id, organization_id) on delete cascade
);

insert into public.organization_member_locations (organization_id, user_id, location_id)
select organization_id, user_id, location_id from public.organization_memberships
where location_id is not null
on conflict do nothing;

create index if not exists organization_member_locations_location_idx on public.organization_member_locations (organization_id, location_id, user_id);

create table if not exists public.performance_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  location_id uuid,
  event_type text not null check (event_type in ('assistant_question_answered', 'message_created')),
  created_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  foreign key (location_id, organization_id) references public.locations(id, organization_id) on delete set null (location_id)
);
create index if not exists performance_events_scope_idx on public.performance_events (organization_id, location_id, user_id, created_at desc);

alter table public.organization_member_locations enable row level security;
alter table public.performance_events enable row level security;

create or replace function private.can_view_performance(target_organization_id uuid, target_location_id uuid, target_user_id uuid)
returns boolean language sql security definer stable set search_path = public, auth, private as $$
  select (select private.is_platform_owner())
    or target_user_id = (select auth.uid())
    or exists (select 1 from public.organization_memberships viewer where viewer.organization_id = target_organization_id and viewer.user_id = (select auth.uid()) and viewer.status = 'active' and viewer.role = 'tenant_admin')
    or exists (select 1 from public.organization_memberships viewer join public.organization_member_locations assignment on assignment.organization_id = viewer.organization_id and assignment.user_id = viewer.user_id where viewer.organization_id = target_organization_id and viewer.user_id = (select auth.uid()) and viewer.status = 'active' and viewer.role = 'manager' and assignment.location_id = target_location_id);
$$;
revoke all on function private.can_view_performance(uuid, uuid, uuid) from public, anon;
grant usage on schema private to authenticated;
grant execute on function private.can_view_performance(uuid, uuid, uuid) to authenticated;

create policy "members read assigned locations" on public.organization_member_locations for select to authenticated using (private.can_view_performance(organization_id, location_id, user_id));
create policy "admins manage member locations" on public.organization_member_locations for all to authenticated using (private.has_org_role(organization_id, array['tenant_admin'::public.organization_role]) or private.is_platform_owner()) with check (private.has_org_role(organization_id, array['tenant_admin'::public.organization_role]) or private.is_platform_owner());
create policy "users read permitted performance events" on public.performance_events for select to authenticated using (private.can_view_performance(organization_id, location_id, user_id));
create policy "users create own performance events" on public.performance_events for insert to authenticated with check (user_id = (select auth.uid()) and private.is_org_member(organization_id) and (location_id is null or exists (select 1 from public.organization_member_locations assignment where assignment.organization_id = organization_id and assignment.user_id = (select auth.uid()) and assignment.location_id = location_id)));

-- Narrow existing analytics access from whole-tenant manager visibility to assigned locations only.
drop policy if exists "employees read own training progress" on public.training_progress;
create policy "users read authorized training progress" on public.training_progress for select to authenticated using (private.can_view_performance(organization_id, (select location_id from public.organization_memberships m where m.organization_id = training_progress.organization_id and m.user_id = training_progress.user_id limit 1), user_id));
drop policy if exists "users read permitted assistant conversations" on public.assistant_conversations;
create policy "users read authorized assistant conversations" on public.assistant_conversations for select to authenticated using (private.can_view_performance(organization_id, location_id, user_id));
