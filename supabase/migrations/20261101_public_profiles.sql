-- Run once in the Supabase SQL editor.
-- Public lender card for listing pages. RLS on profiles only lets users read their own row (and
-- admins read all), so renters saw "—" for every lender. This returns only the safe, public fields
-- (no email or phone) for the given users, and still works when a user never created a profiles row.

create or replace function public.get_public_profiles(p_ids uuid[])
returns table (
  id uuid,
  name text,
  avatar_url text,
  university text,
  member_since timestamptz,
  completed_rentals_as_lender integer,
  rating_as_lister numeric,
  review_count_as_lister integer
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
    p.avatar_url,
    p.university,
    u.created_at as member_since,
    coalesce(p.completed_rentals_as_lender, 0)::integer,
    p.rating_as_lister::numeric,
    coalesce(p.review_count_as_lister, 0)::integer
  from auth.users u
  left join public.profiles p on p.id = u.id
  where u.id = any(p_ids);
$$;

grant execute on function public.get_public_profiles(uuid[]) to anon, authenticated;

-- Check: expect one row per user with a name filled in.
-- select * from public.get_public_profiles(array(select id from auth.users limit 3));
