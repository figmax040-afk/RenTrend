-- Optional, for the pitch demo. Run in the Supabase SQL editor after 20261030_pitch_demo_features.sql.
-- Both accounts must already have signed up (and opened Profile once so a profiles row exists).
-- Replace the two emails below.

-- Lender: Silver fee tier (8%) and the Power Lender badge (10+ completed rentals, 4.5+ rating).
update public.profiles p set
  completed_rentals_as_lender = greatest(p.completed_rentals_as_lender, 12),
  rating_as_lister = greatest(coalesce(p.rating_as_lister, 0), 4.8),
  review_count_as_lister = greatest(coalesce(p.review_count_as_lister, 0), 9)
from auth.users u
where u.id = p.id and u.email = 'LENDER_EMAIL_HERE';

-- Renter: starts as a new user (newUser ad set; HKUFRESH works on any rental).
-- To show the frequentRenter ad set instead, set this to 3.
update public.profiles p set completed_rentals_as_renter = 0, plan = 'free'
from auth.users u
where u.id = p.id and u.email = 'RENTER_EMAIL_HERE';
