-- Phase 2: Enhance webhook deliveries with response time and body

alter table public.webhook_deliveries
  add column if not exists response_time_ms integer;

alter table public.webhook_deliveries
  add column if not exists response_body text;

