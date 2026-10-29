-- Run once in the Supabase SQL editor.
-- Deleting a listing failed with "violates foreign key constraint reviews_listing_id_fkey"
-- once the listing had a review. Reviews rate the owner (and renter), not the listing,
-- so keep them and just unlink the listing. Saved/bookmarked copies go with the listing.

do $$
declare
  fk record;
begin
  -- 1. Reviews: keep, set listing_id to null.
  alter table public.reviews alter column listing_id drop not null;

  for fk in
    select con.conname
    from pg_constraint con
    join pg_attribute att on att.attrelid = con.conrelid and att.attnum = any (con.conkey)
    where con.contype = 'f'
      and con.conrelid = 'public.reviews'::regclass
      and con.confrelid = 'public.listings'::regclass
      and att.attname = 'listing_id'
  loop
    execute format('alter table public.reviews drop constraint %I', fk.conname);
  end loop;

  alter table public.reviews
    add constraint reviews_listing_id_fkey
    foreign key (listing_id) references public.listings(id) on delete set null;

  -- 2. Saved listings: remove the bookmark along with the listing.
  if to_regclass('public.saved_listings') is not null then
    for fk in
      select con.conname
      from pg_constraint con
      join pg_attribute att on att.attrelid = con.conrelid and att.attnum = any (con.conkey)
      where con.contype = 'f'
        and con.conrelid = 'public.saved_listings'::regclass
        and con.confrelid = 'public.listings'::regclass
        and att.attname = 'listing_id'
    loop
      execute format('alter table public.saved_listings drop constraint %I', fk.conname);
    end loop;

    alter table public.saved_listings
      add constraint saved_listings_listing_id_fkey
      foreign key (listing_id) references public.listings(id) on delete cascade;
  end if;
end $$;

-- 3. Check. Every row should show 'set null' or 'cascade'. Any 'no action' / 'restrict' row
--    is another table that will still block deleting a listing.
select con.conrelid::regclass as table_name, con.conname,
       case con.confdeltype when 'a' then 'no action' when 'r' then 'restrict'
         when 'c' then 'cascade' when 'n' then 'set null' when 'd' then 'set default' end as on_delete
from pg_constraint con
where con.contype = 'f' and con.confrelid = 'public.listings'::regclass
order by 1;
