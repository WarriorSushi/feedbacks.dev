alter table public.api_idempotency_keys
  add column if not exists request_hash text not null default '';
