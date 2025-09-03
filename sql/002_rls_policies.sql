-- Enable RLS
alter table public.projects enable row level security;
alter table public.feedback enable row level security;

-- Projects policies - users can only access their own projects
create policy "Users can view own projects"
    on public.projects for select
    using (auth.uid() = owner_user_id);

create policy "Users can create own projects"
    on public.projects for insert
    with check (auth.uid() = owner_user_id);

create policy "Users can update own projects"
    on public.projects for update
    using (auth.uid() = owner_user_id)
    with check (auth.uid() = owner_user_id);

create policy "Users can delete own projects"
    on public.projects for delete
    using (auth.uid() = owner_user_id);

-- Feedback policies - users can only access feedback for their projects
create policy "Users can view feedback for own projects"
    on public.feedback for select
    using (
        exists (
            select 1 from public.projects
            where projects.id = feedback.project_id
            and projects.owner_user_id = auth.uid()
        )
    );

create policy "Users can update feedback for own projects"
    on public.feedback for update
    using (
        exists (
            select 1 from public.projects
            where projects.id = feedback.project_id
            and projects.owner_user_id = auth.uid()
        )
    )
    with check (
        exists (
            select 1 from public.projects
            where projects.id = feedback.project_id
            and projects.owner_user_id = auth.uid()
        )
    );

-- Note: Feedback insertion is handled by API route with service role
-- No public insert policy needed - all writes go through authenticated server