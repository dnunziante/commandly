-- Applies the explicit deny-all policy to projects upgraded before the policy
-- was included in the adaptive coach foundation migration.
create policy "hidden personas have no direct client access" on public.coach_session_personas
for all to authenticated using (false) with check (false);
