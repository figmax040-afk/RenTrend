-- Run once in the Supabase SQL editor.
-- Before running: replace ADMIN_EMAIL_HERE (step 3) with the email of the account that should be admin.

-- 1. Who is an admin. RLS on with no policies: nobody can read or change this table from the app,
--    so users can't make themselves admin. Add/remove admins here in the SQL editor only.
create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);
alter table public.admins enable row level security;

-- 2. is_admin() for the signed-in user. Security definer so it can read the locked table.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;
grant execute on function public.is_admin() to authenticated;

-- 3. Make your account admin.
insert into public.admins (user_id)
select id from auth.users where email = 'ADMIN_EMAIL_HERE'
on conflict do nothing;

-- 4. Admins can take down / restore any listing and see everything on the admin pages.
--    Ordinary users keep whatever access your existing policies give them (their own listings).
drop policy if exists "Admins can update any listing" on public.listings;
create policy "Admins can update any listing" on public.listings
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Admins can read all listings" on public.listings;
create policy "Admins can read all listings" on public.listings
  for select to authenticated using (public.is_admin());

drop policy if exists "Admins can read all requests" on public.requests;
create policy "Admins can read all requests" on public.requests
  for select to authenticated using (public.is_admin());

drop policy if exists "Admins can read all profiles" on public.profiles;
create policy "Admins can read all profiles" on public.profiles
  for select to authenticated using (public.is_admin());

drop policy if exists "Admins can read recycle submissions" on public.recycle_submissions;
create policy "Admins can read recycle submissions" on public.recycle_submissions
  for select to authenticated using (public.is_admin());

drop policy if exists "Admins can update recycle submissions" on public.recycle_submissions;
create policy "Admins can update recycle submissions" on public.recycle_submissions
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

-- 5. Check. Expect one row (your email). If rls_on is false for listings, row-level security is OFF
--    and any signed-in user can still edit any listing through the API: turn it on in
--    Authentication > Policies, after making sure owners have their own insert/update/delete policies.
select u.email as admin_email from public.admins a join auth.users u on u.id = a.user_id;
select relname as table_name, relrowsecurity as rls_on
from pg_class where oid in ('public.listings'::regclass, 'public.requests'::regclass, 'public.recycle_submissions'::regclass);
