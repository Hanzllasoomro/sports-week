-- ============================================================
-- Migration: Add 'scorer' role to admins table
-- ============================================================

-- Update check constraint on admins table to include 'scorer'
alter table admins drop constraint if exists admins_role_check;
alter table admins add constraint admins_role_check check (role in ('admin', 'superadmin', 'scorer'));

-- Insert the 5 official scorers if their Supabase Auth users exist
insert into admins (id, name, role)
select id, (raw_user_meta_data->>'name')::text, 'scorer'
from auth.users
where email in (
  'sajid@muet.edu.pk',
  'abdullah@muet.edu.pk',
  'zaheer@muet.edu.pk',
  'aina@muet.edu.pk',
  'tayyaba@muet.edu.pk'
)
on conflict (id) do update set role = 'scorer', name = excluded.name;
