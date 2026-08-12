-- Cover composite location/organization foreign keys in their declared order.
create index coach_sessions_location_organization_idx on public.coach_sessions(location_id, organization_id) where location_id is not null;
create index growth_action_plans_location_organization_idx on public.growth_action_plans(location_id, organization_id) where location_id is not null;
create index sales_results_location_organization_idx on public.sales_results(location_id, organization_id);
