-- Add ordered, bounded calls-to-action while preserving the original columns
-- for older widget bundles during the rollout.

alter table public.product_updates
  add column if not exists ctas jsonb not null default '[]'::jsonb;

update public.product_updates
   set ctas = jsonb_build_array(
     jsonb_build_object('label', cta_label, 'url', cta_url)
   )
 where ctas = '[]'::jsonb
   and cta_label is not null
   and cta_url is not null;

alter table public.product_updates
  drop constraint if exists product_updates_ctas_shape;

alter table public.product_updates
  add constraint product_updates_ctas_shape check (
    jsonb_typeof(ctas) = 'array'
    and jsonb_array_length(ctas) <= 4
    and not jsonb_path_exists(
      ctas,
      '$[*] ? (!(@.label.type() == "string" && @.url.type() == "string"))'
    )
  );
