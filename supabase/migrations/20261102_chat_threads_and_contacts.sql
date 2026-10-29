-- Run once in the Supabase SQL editor (after 20261101_public_profiles.sql).
--
-- 1. get_contact_profiles(): name + email + phone, but only for people you share a rental request
--    with (you rented from them or they rented from you). Request pages, chat and the "you have a
--    new request / payment" emails need this; RLS on profiles hides everyone else's row.
-- 2. chat_threads: one conversation per (listing, renter), so a renter can message a lender from
--    the listing page before sending a request. Existing request chats are moved into threads.

-- ── 1. Contacts ─────────────────────────────────────────────────────────────────────────────────
create or replace function public.get_contact_profiles(p_ids uuid[])
returns table (
  id uuid,
  name text,
  email text,
  phone text,
  avatar_url text
)
language sql
stable
security definer
set search_path = public
as $$
  select
    u.id,
    coalesce(
      nullif(trim(p.name), ''),
      nullif(trim(u.raw_user_meta_data ->> 'name'), ''),
      nullif(trim(u.raw_user_meta_data ->> 'full_name'), ''),
      split_part(u.email, '@', 1)
    ) as name,
    u.email::text,
    p.phone,
    p.avatar_url
  from auth.users u
  left join public.profiles p on p.id = u.id
  where u.id = any(p_ids)
    and (
      u.id = auth.uid()
      or exists (
        select 1
        from public.requests r
        join public.listings l on l.id = r.listing_id
        where (r.renter_id = auth.uid() and l.owner_id = u.id)
           or (l.owner_id = auth.uid() and r.renter_id = u.id)
      )
    );
$$;

grant execute on function public.get_contact_profiles(uuid[]) to authenticated;

-- ── 2. Chat threads ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.chat_threads (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid references public.listings(id) on delete set null,
  renter_id uuid not null references auth.users(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  listing_title text,
  created_at timestamptz not null default now(),
  unique (listing_id, renter_id)
);
alter table public.chat_threads enable row level security;

drop policy if exists "Participants can read their threads" on public.chat_threads;
create policy "Participants can read their threads" on public.chat_threads
  for select to authenticated using (auth.uid() in (renter_id, owner_id));
-- No insert/update policies: threads are only created through get_or_create_chat_thread().

-- Messages. Created here if the project never had the table; otherwise threads are added to it.
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  request_id uuid references public.requests(id) on delete cascade,
  thread_id uuid references public.chat_threads(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  content text not null check (length(trim(content)) > 0),
  created_at timestamptz not null default now(),
  read_at timestamptz
);
alter table public.messages enable row level security;
alter table public.messages add column if not exists thread_id uuid references public.chat_threads(id) on delete cascade;
alter table public.messages alter column request_id drop not null;
create index if not exists messages_thread_id_idx on public.messages (thread_id, created_at);

drop policy if exists "Thread participants can read messages" on public.messages;
create policy "Thread participants can read messages" on public.messages
  for select to authenticated using (
    thread_id is not null and exists (
      select 1 from public.chat_threads t
      where t.id = messages.thread_id and auth.uid() in (t.renter_id, t.owner_id)
    )
  );

drop policy if exists "Thread participants can send messages" on public.messages;
create policy "Thread participants can send messages" on public.messages
  for insert to authenticated with check (
    sender_id = auth.uid()
    and thread_id is not null
    and exists (
      select 1 from public.chat_threads t
      where t.id = messages.thread_id and auth.uid() in (t.renter_id, t.owner_id)
    )
  );

drop policy if exists "Thread participants can mark messages read" on public.messages;
create policy "Thread participants can mark messages read" on public.messages
  for update to authenticated using (
    thread_id is not null and sender_id <> auth.uid() and exists (
      select 1 from public.chat_threads t
      where t.id = messages.thread_id and auth.uid() in (t.renter_id, t.owner_id)
    )
  );

-- Open (or create) the thread for a listing. The renter calls it with just the listing; the owner
-- passes the renter, which is only allowed once that renter has sent a request for the listing.
create or replace function public.get_or_create_chat_thread(p_listing_id uuid, p_renter_id uuid default null)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner uuid;
  v_title text;
  v_renter uuid := coalesce(p_renter_id, auth.uid());
  v_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Not signed in';
  end if;

  select owner_id, title into v_owner, v_title from public.listings where id = p_listing_id;
  if v_owner is null then
    raise exception 'Listing not found';
  end if;
  if v_renter = v_owner then
    raise exception 'You cannot message yourself';
  end if;
  if auth.uid() <> v_renter and auth.uid() <> v_owner then
    raise exception 'Not allowed';
  end if;
  if auth.uid() = v_owner and not exists (
    select 1 from public.requests where listing_id = p_listing_id and renter_id = v_renter
  ) then
    raise exception 'Not allowed';
  end if;

  insert into public.chat_threads (listing_id, renter_id, owner_id, listing_title)
  values (p_listing_id, v_renter, v_owner, v_title)
  on conflict (listing_id, renter_id) do update set listing_title = excluded.listing_title
  returning id into v_id;
  return v_id;
end;
$$;

grant execute on function public.get_or_create_chat_thread(uuid, uuid) to authenticated;

-- Move existing request chats into threads (one thread per listing + renter).
insert into public.chat_threads (listing_id, renter_id, owner_id, listing_title)
select distinct on (r.listing_id, r.renter_id) r.listing_id, r.renter_id, l.owner_id, l.title
from public.messages m
join public.requests r on r.id = m.request_id
join public.listings l on l.id = r.listing_id
where m.thread_id is null
on conflict (listing_id, renter_id) do nothing;

update public.messages m
set thread_id = t.id
from public.requests r
join public.chat_threads t on t.listing_id = r.listing_id and t.renter_id = r.renter_id
where m.request_id = r.id and m.thread_id is null;

-- Realtime for thread messages (messages is normally already in the publication; this is a no-op then).
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'messages'
  ) then
    execute 'alter publication supabase_realtime add table public.messages';
  end if;
end $$;

-- Check: threads created from old chats, and no message left without a thread or a request.
select count(*) as threads from public.chat_threads;
select count(*) as orphan_messages from public.messages where thread_id is null and request_id is null;
