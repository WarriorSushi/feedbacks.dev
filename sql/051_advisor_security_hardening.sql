-- Make service-only intent explicit and remove callable trigger internals from
-- the Data API surface.

revoke execute on function public.record_feedback_activity()
  from public, anon, authenticated;
revoke execute on function public.record_feedback_note_activity()
  from public, anon, authenticated;
revoke execute on function public.get_owner_project_health()
  from public, anon, authenticated;
grant execute on function public.get_owner_project_health()
  to service_role;

drop policy if exists "service_only_explicit_deny" on public.account_deletion_jobs;
create policy "service_only_explicit_deny"
  on public.account_deletion_jobs as restrictive for all
  to anon, authenticated using (false) with check (false);

drop policy if exists "service_only_explicit_deny" on public.activation_milestones;
create policy "service_only_explicit_deny"
  on public.activation_milestones as restrictive for all
  to anon, authenticated using (false) with check (false);

drop policy if exists "service_only_explicit_deny" on public.api_idempotency_keys;
create policy "service_only_explicit_deny"
  on public.api_idempotency_keys as restrictive for all
  to anon, authenticated using (false) with check (false);

drop policy if exists "service_only_explicit_deny" on public.feedback_media;
create policy "service_only_explicit_deny"
  on public.feedback_media as restrictive for all
  to anon, authenticated using (false) with check (false);

drop policy if exists "service_only_explicit_deny" on public.project_api_key_events;
create policy "service_only_explicit_deny"
  on public.project_api_key_events as restrictive for all
  to anon, authenticated using (false) with check (false);

drop policy if exists "service_only_explicit_deny" on public.project_api_keys;
create policy "service_only_explicit_deny"
  on public.project_api_keys as restrictive for all
  to anon, authenticated using (false) with check (false);

drop policy if exists "service_only_explicit_deny" on public.project_integration_secret_events;
create policy "service_only_explicit_deny"
  on public.project_integration_secret_events as restrictive for all
  to anon, authenticated using (false) with check (false);

drop policy if exists "service_only_explicit_deny" on public.project_integration_secrets;
create policy "service_only_explicit_deny"
  on public.project_integration_secrets as restrictive for all
  to anon, authenticated using (false) with check (false);

create index if not exists feedback_activity_actor_id_idx
  on public.feedback_activity(actor_id);
create index if not exists project_api_key_events_actor_user_id_idx
  on public.project_api_key_events(actor_user_id);
create index if not exists project_api_key_events_api_key_id_idx
  on public.project_api_key_events(api_key_id);

drop index if exists public.webhook_deliveries_project_endpoint_created_idx;
