-- Run once in the Supabase SQL editor.

-- 1. Separate admin approval from the owner's "available" toggle (is_active).
-- Listings that already exist are treated as approved; new ones start as pending.
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'listings' and column_name = 'approval_status'
  ) then
    alter table public.listings
      add column approval_status text not null default 'approved'
      check (approval_status in ('pending', 'approved', 'rejected'));
    alter table public.listings alter column approval_status set default 'pending';
  end if;
end $$;

-- 2. Conditions used to be saved as the UI label in the user's language. Store English only.
update public.listings set condition = 'Works perfectly' where condition = '運作完好';
update public.listings set condition = 'Minor issues'    where condition = '輕微問題';
update public.listings set condition = 'For parts'       where condition = '部分零件損壞';

-- 3. Keep request history (and chats) when an owner deletes a listing.
alter table public.requests alter column listing_id drop not null;

do $$
declare
  fk record;
begin
  for fk in
    select con.conname
    from pg_constraint con
    join pg_attribute att on att.attrelid = con.conrelid and att.attnum = any (con.conkey)
    where con.contype = 'f'
      and con.conrelid = 'public.requests'::regclass
      and con.confrelid = 'public.listings'::regclass
      and att.attname = 'listing_id'
  loop
    execute format('alter table public.requests drop constraint %I', fk.conname);
  end loop;

  alter table public.requests
    add constraint requests_listing_id_fkey
    foreign key (listing_id) references public.listings(id) on delete set null;
end $$;
