-- 007_make_user_id_nullable.sql
-- Relaxes the NOT NULL constraint on user_id in public.employee_profiles.
-- This allows bulk importing official MoSPI ISS Civil List directory records
-- before employee authentication accounts are created.

ALTER TABLE public.employee_profiles 
  ALTER COLUMN user_id DROP NOT NULL;
