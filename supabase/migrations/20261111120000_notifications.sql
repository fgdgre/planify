begin;

alter table public.calendar_events add column if not exists organizer_name text;
alter table public.google_calendars add column if not exists last_synced_at timestamptz;

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null check (type in ('event_created')),
  source text not null check (source in ('app', 'google', 'telegram')),
  title text not null,
  description text,
  author_name text,
  author_email text,
  calendar_event_id uuid references public.calendar_events(id) on delete cascade,
  event_start_at timestamptz,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index notifications_user_created_idx on public.notifications (user_id, created_at desc);
create index notifications_user_unread_idx on public.notifications (user_id) where read_at is null;

alter table public.notifications enable row level security;

create policy "notifications_select_own" on public.notifications
  for select to authenticated using (auth.uid() = user_id);

create policy "notifications_update_own" on public.notifications
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "notifications_delete_own" on public.notifications
  for delete to authenticated using (auth.uid() = user_id);

revoke all on table public.notifications from anon;
revoke insert, update on table public.notifications from authenticated;
grant update (read_at) on table public.notifications to authenticated;

create or replace function public.should_notify(target_user_id uuid, notification_type text, notification_source text)
returns boolean
language sql
stable
set search_path = public
as $$
  -- TODO: read per-user preferences (which types and sources notify) once Settings has a notifications section
  select notification_source <> 'app'
$$;

revoke execute on function public.should_notify(uuid, text, text) from public, anon, authenticated;

create or replace function public.notify_calendar_event_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  event_source text := case when new.google_account_id is not null then 'google' else 'app' end;
  event_author_name text := new.organizer_name;
  event_author_email text := coalesce(new.organizer_email, new.creator_email);
begin
  if new.status = 'cancelled' then
    return new;
  end if;

  if not public.should_notify(new.user_id, 'event_created', event_source) then
    return new;
  end if;

  if event_source = 'google' and not exists (
    select 1
    from public.google_calendars c
    where c.google_account_id = new.google_account_id
      and c.calendar_id = new.calendar_id
      and c.last_synced_at is not null
  ) then
    return new;
  end if;

  if event_source = 'app' then
    select nullif(trim(concat_ws(' ', p.first_name, p.last_name)), ''), p.email
    into event_author_name, event_author_email
    from public.profiles p
    where p.id = new.user_id;
  end if;

  insert into public.notifications (
    user_id, type, source, title, description, author_name, author_email, calendar_event_id, event_start_at
  )
  values (
    new.user_id,
    'event_created',
    event_source,
    coalesce(nullif(trim(new.title), ''), 'Untitled event'),
    nullif(trim(new.location), ''),
    coalesce(event_author_name, split_part(event_author_email, '@', 1)),
    event_author_email,
    new.id,
    new.start_at
  );

  return new;
end;
$$;

create trigger calendar_events_notify_created
  after insert on public.calendar_events
  for each row execute function public.notify_calendar_event_created();

alter publication supabase_realtime add table public.notifications;

commit;
