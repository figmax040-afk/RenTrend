-- Run once in the Supabase SQL editor.

-- Listings no longer wait for admin approval: new ones go live immediately.
-- 'rejected' now means an admin took the listing down.
alter table public.listings alter column approval_status set default 'approved';

-- Publish everything that was stuck waiting for approval.
update public.listings set approval_status = 'approved' where approval_status = 'pending';
