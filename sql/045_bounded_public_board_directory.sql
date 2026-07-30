create index if not exists idx_feedback_public_directory_aggregate
  on public.feedback(project_id, created_at desc)
  include (vote_count, status)
  where is_public = true and is_archived = false;

create index if not exists idx_feedback_notes_public_feedback_created
  on public.feedback_notes(feedback_id, created_at desc)
  where is_public = true;

create or replace function public.get_public_board_directory(
  p_sort text default 'trending',
  p_category text default null,
  p_query text default null,
  p_limit integer default 24,
  p_offset integer default 0
)
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  with eligible as (
    select board.*, project.name as project_name
    from public.public_board_settings board
    join public.projects project on project.id = board.project_id
    where board.enabled = true
      and board.visibility = 'public'
      and board.directory_opt_in = true
      and project.environment = 'production'
  ),
  aggregated as (
    select
      eligible.*,
      coalesce(feedback_stats.feedback_count, 0)::integer as feedback_count,
      coalesce(feedback_stats.vote_count, 0)::integer as vote_count,
      coalesce(feedback_stats.recently_shipped_count, 0)::integer as recently_shipped_count,
      coalesce(feedback_stats.in_progress_count, 0)::integer as in_progress_count,
      coalesce(feedback_stats.recent_feedback_count, 0)::integer as recent_feedback_count,
      coalesce(reply_stats.public_reply_count, 0)::integer as public_reply_count,
      greatest(feedback_stats.recent_feedback_at, reply_stats.recent_reply_at) as recent_activity_at
    from eligible
    left join lateral (
      select
        count(*) as feedback_count,
        coalesce(sum(feedback.vote_count), 0) as vote_count,
        count(*) filter (where feedback.status = 'closed') as recently_shipped_count,
        count(*) filter (where feedback.status = 'in_progress') as in_progress_count,
        count(*) filter (where feedback.created_at >= now() - interval '14 days') as recent_feedback_count,
        max(feedback.created_at) as recent_feedback_at
      from public.feedback
      where feedback.project_id = eligible.project_id
        and feedback.is_public = true
        and feedback.is_archived = false
        and feedback.type = any(eligible.show_types)
    ) feedback_stats on true
    left join lateral (
      select count(*) as public_reply_count, max(note.created_at) as recent_reply_at
      from public.feedback_notes note
      join public.feedback on feedback.id = note.feedback_id
      where feedback.project_id = eligible.project_id
        and feedback.is_public = true
        and feedback.is_archived = false
        and feedback.type = any(eligible.show_types)
        and note.is_public = true
    ) reply_stats on true
  ),
  scored as (
    select
      aggregated.*,
      least(
        100,
        20
          + least(20, aggregated.feedback_count * 3)
          + case when aggregated.feedback_count > 0
              then least(35, round((aggregated.public_reply_count::numeric / aggregated.feedback_count) * 40))
              else 0 end
          + least(15, aggregated.recently_shipped_count * 5)
          + least(10, aggregated.in_progress_count * 4)
      )::integer as trust_score,
      case p_sort
        when 'active' then
          ((aggregated.feedback_count * 2) + aggregated.public_reply_count + aggregated.recent_feedback_count)
          / greatest(1, extract(epoch from (now() - coalesce(aggregated.recent_activity_at, aggregated.updated_at))) / 604800)
        when 'responsive' then
          (aggregated.public_reply_count * 5) + (aggregated.in_progress_count * 3) + aggregated.recently_shipped_count
        when 'shipping' then
          (aggregated.recently_shipped_count * 6) + (aggregated.in_progress_count * 3) + (aggregated.public_reply_count * 0.5)
        when 'new' then extract(epoch from aggregated.created_at)
        else
          ((aggregated.recent_feedback_count * 4) + (aggregated.vote_count * 0.3) + (aggregated.public_reply_count * 2))
          / greatest(1, extract(epoch from (now() - coalesce(aggregated.recent_activity_at, aggregated.updated_at))) / 604800)
      end as sort_score
    from aggregated
  ),
  filtered as (
    select *
    from scored
    where (nullif(trim(p_category), '') is null or scored.categories @> array[lower(trim(p_category))])
      and (
        nullif(trim(p_query), '') is null
        or scored.title ilike '%' || trim(p_query) || '%'
        or scored.description ilike '%' || trim(p_query) || '%'
        or scored.display_name ilike '%' || trim(p_query) || '%'
        or scored.project_name ilike '%' || trim(p_query) || '%'
      )
  ),
  page_rows as (
    select *
    from filtered
    order by sort_score desc, coalesce(recent_activity_at, updated_at) desc, id
    limit greatest(1, least(p_limit, 50))
    offset greatest(0, p_offset)
  ),
  category_rows as (
    select category as value, count(*)::integer as count
    from eligible, unnest(eligible.categories) category
    where trim(category) <> ''
    group by category
    order by count desc, value asc
  )
  select jsonb_build_object(
    'entries',
    coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'board', to_jsonb(page_rows) - 'project_name' - 'feedback_count' - 'vote_count'
            - 'recently_shipped_count' - 'in_progress_count' - 'recent_feedback_count'
            - 'public_reply_count' - 'recent_activity_at' - 'trust_score' - 'sort_score',
          'projectName', page_rows.project_name,
          'feedbackCount', page_rows.feedback_count,
          'voteCount', page_rows.vote_count,
          'publicReplyCount', page_rows.public_reply_count,
          'recentlyShippedCount', page_rows.recently_shipped_count,
          'inProgressCount', page_rows.in_progress_count,
          'recentFeedbackCount', page_rows.recent_feedback_count,
          'recentActivityAt', page_rows.recent_activity_at,
          'trustScore', page_rows.trust_score,
          'sortScore', page_rows.sort_score
        )
        order by page_rows.sort_score desc, coalesce(page_rows.recent_activity_at, page_rows.updated_at) desc, page_rows.id
      )
      from page_rows
    ), '[]'::jsonb),
    'total', (select count(*) from filtered),
    'categories', coalesce((
      select jsonb_agg(jsonb_build_object('value', value, 'count', count) order by count desc, value)
      from category_rows
    ), '[]'::jsonb),
    'totalRequests', (select coalesce(sum(feedback_count), 0) from aggregated),
    'totalReplies', (select coalesce(sum(public_reply_count), 0) from aggregated)
  );
$$;

revoke all on function public.get_public_board_directory(text,text,text,integer,integer)
  from public, anon, authenticated;
grant execute on function public.get_public_board_directory(text,text,text,integer,integer)
  to service_role;
