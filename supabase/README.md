# Supabase setup for Milestone 2

The application runs in BGC demo mode while the Supabase environment values are empty.

## Outside account required

1. Create a Supabase account and project at https://supabase.com.
2. In the Supabase SQL editor, run `migrations/202608070001_multitenant_foundation.sql`.
3. Run `seed.sql` to add the sample BGC organization, locations, and methodology placeholders.
4. Copy `.env.example` to `.env.local` and add the project URL and publishable key from **Project Settings → API**.
5. Restart the development server.

Do not place the database password or service-role key in any `NEXT_PUBLIC_` variable. This milestone does not need a service-role key.

## Create the first BGC administrator

Create a user in **Authentication → Users**, then run the following in the SQL editor after replacing the sample email:

```sql
insert into public.organization_memberships (organization_id, user_id, role, status)
select
  '10000000-0000-0000-0000-000000000001',
  id,
  'tenant_admin',
  'active'
from auth.users
where email = 'replace-with-your-email@example.com'
on conflict (organization_id, user_id)
do update set role = 'tenant_admin', status = 'active';
```

The user can then sign in at `/login`. Users without an active organization membership are sent to `/no-access`.

## Roles

- `platform_owner`: stored only on the user profile; controls platform methodology and all tenants.
- `tenant_admin`: manages one tenant's members, locations, and customer instructions.
- `manager`: tenant member who can manage Operations procedures and recurring schedules, with additional team-management permissions added by later milestones.
- `salesperson`: tenant member with standard application access.

Platform methodology and tenant instructions live in separate tables and have separate row-level security policies.

## Persistent Sales Coach

The connected BGC project includes these applied migrations:

- `20260809030315_persistent_sales_coach_foundation.sql`
- `20260809030351_optimize_coach_scenario_policies.sql`
- `20260809032716_multi_round_coach_rubric.sql`

They create tenant-scoped scenarios, configurable C.L.O.S.E.R. weights, multi-round content, sessions, and responses with RLS. Six three-round BGC sample scenarios are published for the first tenant. In local demo mode the interface remains fully navigable but does not write practice sessions; turn off `LOCAL_DEMO_MODE` and sign in to verify authenticated persistence.
`20260809040651_persistent_growth_action_plans.sql` adds tenant-scoped Growth Advisor action plans and tasks with explicit Data API grants and row-level security.
`20260809042235_tenant_growth_scoring_configuration.sql` adds administrator-controlled, tenant-scoped deterministic scoring weights and opportunity ratings.
`20260809043934_tenant_growth_opportunity_management.sql` adds tenant-scoped Growth Advisor opportunities with administrator lifecycle controls.

## Operations Assistant foundation

`20260810011434_operations_multitenant_foundation.sql` adds tenant-scoped persistence for Operations procedures, recurring schedules, checklists, alerts and status history, shift handoffs, and incidents. `20260810012437_optimize_operations_foundation.sql` adds covering indexes for tenant-safe composite relationships and removes an overlapping procedure-step policy. Neither migration seeds sample data.

`20260810130000_process_improvement_foundation.sql` adds tenant-scoped improvement submissions, status history, Five Whys, corrective actions, and before/after measurements with employee ownership and manager-review RLS. `20260810131000_optimize_process_improvement_foundation.sql` adds the foreign-key indexes identified by the database advisor. `20260810132000_refine_process_improvement_manager_policies.sql` preserves creator attribution while allowing authorized managers to continue one another's improvement work. None of these migrations seed customer data. Local demo mode continues to use sample records.
