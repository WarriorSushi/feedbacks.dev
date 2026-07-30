-- Remove legacy integration credentials and private destinations from queues/logs.

update public.webhook_jobs as job
set
  endpoint_url = coalesce(secret.destination_hint, job.kind || ' endpoint'),
  payload = jsonb_set(
    jsonb_set(
      jsonb_set(
        (job.payload #- '{endpoint,token}' #- '{endpoint,signingSecret}'),
        '{endpoint,url}',
        '""'::jsonb,
        true
      ),
      '{endpoint,secretStored}',
      case when secret.id is null then 'false'::jsonb else 'true'::jsonb end,
      true
    ),
    '{endpoint,destinationHint}',
    to_jsonb(coalesce(secret.destination_hint, job.kind || ' endpoint')),
    true
  ),
  updated_at = now()
from (
  select
    job_row.id as job_id,
    integration_secret.id,
    integration_secret.destination_hint
  from public.webhook_jobs job_row
  left join public.project_integration_secrets integration_secret
    on integration_secret.project_id = job_row.project_id
   and integration_secret.endpoint_id = job_row.endpoint_id
) as secret
where job.id = secret.job_id
  and (
    job.endpoint_url ~ '^https://'
    or job.payload ? 'endpoint'
  );

update public.webhook_digest_items as item
set
  endpoint_url = coalesce(secret.destination_hint, item.kind || ' endpoint'),
  payload = jsonb_set(
    jsonb_set(
      jsonb_set(
        (item.payload #- '{endpoint,token}' #- '{endpoint,signingSecret}'),
        '{endpoint,url}',
        '""'::jsonb,
        true
      ),
      '{endpoint,secretStored}',
      case when secret.id is null then 'false'::jsonb else 'true'::jsonb end,
      true
    ),
    '{endpoint,destinationHint}',
    to_jsonb(coalesce(secret.destination_hint, item.kind || ' endpoint')),
    true
  ),
  updated_at = now()
from (
  select
    item_row.id as item_id,
    integration_secret.id,
    integration_secret.destination_hint
  from public.webhook_digest_items item_row
  left join public.project_integration_secrets integration_secret
    on integration_secret.project_id = item_row.project_id
   and integration_secret.endpoint_id = item_row.endpoint_id
) as secret
where item.id = secret.item_id
  and (
    item.endpoint_url ~ '^https://'
    or item.payload ? 'endpoint'
  );

update public.webhook_deliveries
set url = regexp_replace(url, '^https://([^/]+).*$','\1') || ' ••••' || right(md5(url), 4)
where url ~ '^https://';
