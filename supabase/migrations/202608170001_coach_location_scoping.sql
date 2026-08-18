-- Location-based coaching access. This migration preserves existing sessions and assignments.

alter table public.organization_memberships
  add column if not exists location_id uuid references public.locations(id) on delete set null;

create table if not exists public.organization_member_locations (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  location_id uuid not null references public.locations(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (organization_id, user_id, location_id)
);

insert into public.organization_member_locations (organization_id, user_id, location_id)
select organization_id, user_id, location_id
from public.organization_memberships
where location_id is not null
on conflict do nothing;

alter table public.coach_sessions
  add column if not exists location_id uuid references public.locations(id) on delete set null;

create index if not exists organization_member_locations_user_location_idx
  on public.organization_member_locations (organization_id, user_id, location_id);
create index if not exists coach_sessions_organization_location_completed_idx
  on public.coach_sessions (organization_id, location_id, completed_at desc)
  where status = 'completed' and location_id is not null;

alter table public.organization_member_locations enable row level security;
grant select on public.organization_member_locations to authenticated;

create or replace function private.can_view_coach_performance(
  target_organization_id uuid,
  target_location_id uuid,
  target_user_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public, auth, private
as $$
  select (select private.is_platform_owner())
    or target_user_id = (select auth.uid())
    or exists (
      select 1
      from public.organization_memberships viewer
      where viewer.organization_id = target_organization_id
        and viewer.user_id = (select auth.uid())
        and viewer.status = 'active'
        and viewer.role = 'tenant_admin'
    )
    or exists (
      select 1
      from public.organization_memberships viewer
      join public.organization_member_locations assignment
        on assignment.organization_id = viewer.organization_id
       and assignment.user_id = viewer.user_id
      where viewer.organization_id = target_organization_id
        and viewer.user_id = (select auth.uid())
        and viewer.status = 'active'
        and viewer.role = 'manager'
        and assignment.location_id = target_location_id
    );
$$;

revoke all on function private.can_view_coach_performance(uuid, uuid, uuid) from public;
grant execute on function private.can_view_coach_performance(uuid, uuid, uuid) to authenticated;

drop policy if exists "members read assigned locations" on public.organization_member_locations;
create policy "members read coach-relevant assigned locations"
on public.organization_member_locations for select to authenticated
using (private.can_view_coach_performance(organization_id, location_id, user_id));

drop policy if exists "members read permitted coach sessions" on public.coach_sessions;
create policy "members read scoped coach sessions"
on public.coach_sessions for select to authenticated
using (private.can_view_coach_performance(organization_id, location_id, user_id));

drop policy if exists "members read permitted coach responses" on public.coach_responses;
create policy "members read scoped coach responses"
on public.coach_responses for select to authenticated
using (
  exists (
    select 1
    from public.coach_sessions session
    where session.id = coach_responses.session_id
      and session.organization_id = coach_responses.organization_id
      and private.can_view_coach_performance(session.organization_id, session.location_id, session.user_id)
  )
);
