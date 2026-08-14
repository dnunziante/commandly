-- Tenant-owned rules for deterministic Executive priority reminders and escalations.

create table public.executive_escalation_settings (
  organization_id uuid primary key references public.organizations(id) on delete cascade,
  enabled boolean not null default true,
  remind_before_days smallint not null default 3 check (remind_before_days between 0 and 30),
  escalate_after_days smallint not null default 2 check (escalate_after_days between 0 and 30),
  escalation_recipient text not null default 'Tenant administrator' check (char_length(escalation_recipient) between 2 and 100),
  updated_by uuid not null references public.profiles(id) on delete restrict,
  updated_at timestamptz not null default now()
);

create index executive_escalation_settings_updated_by_idx on public.executive_escalation_settings(updated_by);

alter table public.executive_escalation_settings enable row level security;
revoke all on public.executive_escalation_settings from anon;
grant select, insert, update on public.executive_escalation_settings to authenticated;

create policy "executive managers read escalation settings"
on public.executive_escalation_settings for select to authenticated
using (
  private.has_org_role(organization_id, array['tenant_admin', 'manager']::public.organization_role[])
  or private.is_platform_owner()
);

create policy "executive administrators insert escalation settings"
on public.executive_escalation_settings for insert to authenticated
with check (
  updated_by = (select auth.uid())
  and (
    private.has_org_role(organization_id, array['tenant_admin']::public.organization_role[])
    or private.is_platform_owner()
  )
);

create policy "executive administrators update escalation settings"
on public.executive_escalation_settings for update to authenticated
using (
  private.has_org_role(organization_id, array['tenant_admin']::public.organization_role[])
  or private.is_platform_owner()
)
with check (
  updated_by = (select auth.uid())
  and (
    private.has_org_role(organization_id, array['tenant_admin']::public.organization_role[])
    or private.is_platform_owner()
  )
);
