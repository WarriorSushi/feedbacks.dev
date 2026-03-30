-- Phase 10: remove persistent raw API key storage and keep only hashed verification data.

ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS api_key_last_four text;

UPDATE public.projects
SET api_key_hash = encode(digest(api_key, 'sha256'), 'hex')
WHERE api_key IS NOT NULL
  AND (api_key_hash IS NULL OR api_key_hash = '');

UPDATE public.projects
SET api_key_last_four = right(api_key, 4)
WHERE api_key IS NOT NULL
  AND (api_key_last_four IS NULL OR api_key_last_four = '');

ALTER TABLE public.projects
  ALTER COLUMN api_key DROP NOT NULL;

UPDATE public.projects
SET api_key = NULL
WHERE api_key IS NOT NULL;
