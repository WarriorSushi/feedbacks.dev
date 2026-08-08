-- Keep public team replies aligned with the current visibility of their parent
-- feedback and board. Owners retain access through the separate ownership arm.

drop policy if exists "feedback_notes_public_read" on public.feedback_notes;
drop policy if exists "feedback_notes_select_owned" on public.feedback_notes;
drop policy if exists "feedback_notes_read_public_or_owned" on public.feedback_notes;

create policy "feedback_notes_read_public_or_owned"
  on public.feedback_notes
  for select
  to anon, authenticated
  using (
    exists (
      select 1
      from public.feedback f
      join public.public_board_settings board on board.project_id = f.project_id
      where f.id = feedback_notes.feedback_id
        and feedback_notes.is_public = true
        and f.is_public = true
        and f.is_archived = false
        and board.enabled = true
        and board.visibility <> 'private'::text
    )
    or exists (
      select 1
      from public.feedback f
      join public.projects p on p.id = f.project_id
      where f.id = feedback_notes.feedback_id
        and p.owner_user_id = (select auth.uid())
    )
  );
