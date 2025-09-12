-- Phase 3: Support multiple endpoints via endpoint_id and attempt

alter table public.webhook_deliveries
  add column if not exists endpoint_id text;

alter table public.webhook_deliveries
  add column if not exists attempt integer;

create index if not exists idx_webhook_deliveries_project_endpoint
  on public.webhook_deliveries(project_id, endpoint_id, created_at desc);

