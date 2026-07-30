create or replace function public.get_public_board_directory_cursor(
  p_sort text default 'trending',
  p_category text default null,
  p_query text default null,
  p_limit integer default 24,
  p_after_score numeric default null,
  p_after_activity timestamptz default null,
  p_after_id uuid default null,
  p_snapshot_at timestamptz default null
)
returns jsonb
language sql
stable
security invoker
set search_path = ''
as $$
  with request_context as (
    select coalesce(p_snapshot_at, now()) as snapshot_at
  ),
  eligible as (
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
    cross join request_context
    left join lateral (
      select
        count(*) as feedback_count,
        coalesce(sum(feedback.vote_count), 0) as vote_count,
        count(*) filter (where feedback.status = 'closed') as recently_shipped_count,
        count(*) filter (where feedback.status = 'in_progress') as in_progress_count,
        count(*) filter (
          where feedback.created_at >= request_context.snapshot_at - interval '14 days'
        ) as recent_feedback_count,
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
      coalesce(aggregated.recent_activity_at, aggregated.updated_at) as activity_at,
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
          / greatest(
              1,
              extract(epoch from (
                request_context.snapshot_at
                - coalesce(aggregated.recent_activity_at, aggregated.updated_at)
              )) / 604800
            )
        when 'responsive' then
          (aggregated.public_reply_count * 5)
          + (aggregated.in_progress_count * 3)
          + aggregated.recently_shipped_count
        when 'shipping' then
          (aggregated.recently_shipped_count * 6)
          + (aggregated.in_progress_count * 3)
          + (aggregated.public_reply_count * 0.5)
        when 'new' then extract(epoch from aggregated.created_at)
        else
          ((aggregated.recent_feedback_count * 4)
            + (aggregated.vote_count * 0.3)
            + (aggregated.public_reply_count * 2))
          / greatest(
              1,
              extract(epoch from (
                request_context.snapshot_at
                - coalesce(aggregated.recent_activity_at, aggregated.updated_at)
              )) / 604800
            )
      end as sort_score
    from aggregated
    cross join request_context
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
  cursor_filtered as (
    select *
    from filtered
    where p_after_score is null
      or sort_score < p_after_score
      or (
        sort_score = p_after_score
        and activity_at < p_after_activity
      )
      or (
        sort_score = p_after_score
        and activity_at = p_after_activity
        and id > p_after_id
      )
  ),
  ranked as (
    select *
    from cursor_filtered
    order by sort_score desc, activity_at desc, id asc
    limit greatest(1, least(p_limit, 50)) + 1
  ),
  page_rows as (
    select *
    from ranked
    order by sort_score desc, activity_at desc, id asc
    limit greatest(1, least(p_limit, 50))
  ),
  last_row as (
    select sort_score, activity_at, id
    from page_rows
    order by sort_score asc, activity_at asc, id desc
    limit 1
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
            - 'public_reply_count' - 'recent_activity_at' - 'activity_at' - 'trust_score'
            - 'sort_score',
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
        order by page_rows.sort_score desc, page_rows.activity_at desc, page_rows.id asc
      )
      from page_rows
    ), '[]'::jsonb),
    'total', (select count(*) from filtered),
    'categories', coalesce((
      select jsonb_agg(jsonb_build_object('value', value, 'count', count) order by count desc, value)
      from category_rows
    ), '[]'::jsonb),
    'totalRequests', (select coalesce(sum(feedback_count), 0) from aggregated),
    'totalReplies', (select coalesce(sum(public_reply_count), 0) from aggregated),
    'hasMore', (select count(*) > greatest(1, least(p_limit, 50)) from ranked),
    'next', (
      select jsonb_build_object(
        'score', sort_score,
        'activityAt', activity_at,
        'id', id,
        'snapshotAt', request_context.snapshot_at
      )
      from last_row
      cross join request_context
    ),
    'snapshotAt', (select snapshot_at from request_context)
  );
$$;

revoke all on function public.get_public_board_directory_cursor(
  text,text,text,integer,numeric,timestamptz,uuid,timestamptz
) from public, anon, authenticated;
grant execute on function public.get_public_board_directory_cursor(
  text,text,text,integer,numeric,timestamptz,uuid,timestamptz
) to service_role;
