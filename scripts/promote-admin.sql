-- Promote an account to admin. Run this ONCE after you have signed up
-- in the app with the email below.
--
-- How to run:
--   Option A (Supabase Dashboard): open your project -> SQL Editor ->
--     paste this file -> replace the email -> Run.
--   Option B (Supabase CLI, linked project):
--     npx supabase db execute --file scripts/promote-admin.sql
--
-- This runs as the service role, which bypasses the role-escalation
-- trigger guard (auth.uid() is null), so no prior admin is needed.

update public.profiles
set role = 'admin'
where id = (
  select id from auth.users
  where email = 'YOUR_EMAIL_HERE@example.com'
);

-- Verify: should return one row with role = 'admin'
select p.id, u.email, p.display_name, p.role
from public.profiles p
join auth.users u on u.id = p.id
where p.role = 'admin';
