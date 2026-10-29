-- Run once in the Supabase SQL editor, after the earlier migrations.
-- Adds what the pitch demo needs to persist: escrow + checkout, pickup method and lockers,
-- video handovers, Lendy Plus, boosts, listing views and completed-rental counters.
-- Payments, lockers and video storage are mocked in the app; nothing here talks to a third party.

-- 1. Requests: checkout, escrow and handovers.
alter table public.requests
  add column if not exists escrow_status text not null default 'unpaid',
  add column if not exists paid_at timestamptz,
  add column if not exists released_at timestamptz,
  add column if not exists amount_paid integer,
  add column if not exists delivery_fee integer,
  add column if not exists promo_code text,
  add column if not exists discount integer,
  add column if not exists pickup_method text,
  add column if not exists locker_id text,
  add column if not exists locker_code text,
  add column if not exists pickup_clip_at timestamptz,
  add column if not exists pickup_clip_seconds integer,
  add column if not exists pickup_renter_ok_at timestamptz,
  add column if not exists pickup_lender_ok_at timestamptz,
  add column if not exists return_clip_at timestamptz,
  add column if not exists return_clip_seconds integer,
  add column if not exists return_renter_ok_at timestamptz,
  add column if not exists return_lender_ok_at timestamptz;

alter table public.requests drop constraint if exists requests_escrow_status_check;
alter table public.requests add constraint requests_escrow_status_check
  check (escrow_status in ('unpaid', 'held', 'released', 'refunded'));

alter table public.requests drop constraint if exists requests_pickup_method_check;
alter table public.requests add constraint requests_pickup_method_check
  check (pickup_method is null or pickup_method in ('meetup', 'locker', 'delivery'));

-- Rentals finished before escrow existed count as settled.
update public.requests set escrow_status = 'released'
where status = 'completed' and escrow_status = 'unpaid';

-- 2. Listings: Boost (Featured for 7 days) and a view counter for lender stats.
alter table public.listings
  add column if not exists boosted_until timestamptz,
  add column if not exists view_count integer not null default 0;

-- 3. Profiles: Lendy Plus and completed-rental counters (fee tier, Power Lender, ad targeting).
alter table public.profiles
  add column if not exists plan text not null default 'free',
  add column if not exists plan_billing text,
  add column if not exists plan_started_at timestamptz,
  add column if not exists completed_rentals_as_lender integer not null default 0,
  add column if not exists completed_rentals_as_renter integer not null default 0;

alter table public.profiles drop constraint if exists profiles_plan_check;
alter table public.profiles add constraint profiles_plan_check check (plan in ('free', 'plus'));

-- Backfill the counters from rentals already completed.
update public.profiles p set completed_rentals_as_lender = sub.n
from (
  select l.owner_id, count(*)::int as n
  from public.requests r join public.listings l on l.id = r.listing_id
  where r.status = 'completed'
  group by l.owner_id
) sub
where sub.owner_id = p.id;

update public.profiles p set completed_rentals_as_renter = sub.n
from (
  select renter_id, count(*)::int as n from public.requests where status = 'completed' group by renter_id
) sub
where sub.renter_id = p.id;

-- 4. When both parties confirm the return handover, release the escrow and complete the rental.
create or replace function public.release_escrow_on_return()
returns trigger
language plpgsql
as $$
begin
  if new.escrow_status = 'held'
     and new.return_renter_ok_at is not null
     and new.return_lender_ok_at is not null then
    new.escrow_status := 'released';
    new.released_at := now();
    new.status := 'completed';
    new.completed_at := coalesce(new.completed_at, now());
  end if;
  return new;
end;
$$;

drop trigger if exists requests_release_escrow on public.requests;
create trigger requests_release_escrow
  before update on public.requests
  for each row execute function public.release_escrow_on_return();

-- 5. Keep the completed-rental counters current. Security definer: the renter's confirmation can
--    complete a rental, and the renter can't otherwise update the lender's profile.
create or replace function public.count_completed_rental()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'completed' and old.status is distinct from 'completed' then
    update public.profiles set completed_rentals_as_renter = completed_rentals_as_renter + 1
    where id = new.renter_id;
    update public.profiles set completed_rentals_as_lender = completed_rentals_as_lender + 1
    where id = (select owner_id from public.listings where id = new.listing_id);
  end if;
  return new;
end;
$$;

drop trigger if exists requests_count_completed on public.requests;
create trigger requests_count_completed
  after update on public.requests
  for each row execute function public.count_completed_rental();

-- 6. Count a listing view. Security definer so visitors can bump a listing they don't own.
create or replace function public.bump_listing_view(p_listing_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.listings set view_count = view_count + 1
  where id = p_listing_id and owner_id is distinct from auth.uid();
$$;
grant execute on function public.bump_listing_view(uuid) to anon, authenticated;
