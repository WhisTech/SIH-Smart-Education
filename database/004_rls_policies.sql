-- 004_rls_policies.sql
-- Establishes standard Row Level Security (RLS) policies for Stage 1 tables:
-- 1. `designations` (Public read for all users)
-- 2. `skills` (Public read for all users)
-- 3. `employee_profiles` (Users can read and update their own profile, insert on signup)
-- 4. `employee_skills` (Users can read, insert, delete their own mapped skills)

-- 1. designations
ALTER TABLE public.designations ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'designations' AND policyname = 'Allow public read access to designations'
  ) THEN
    CREATE POLICY "Allow public read access to designations"
    ON public.designations
    FOR SELECT
    TO public
    USING (true);
  END IF;
END $$;

-- 2. skills
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'skills' AND policyname = 'Allow public read access to skills'
  ) THEN
    CREATE POLICY "Allow public read access to skills"
    ON public.skills
    FOR SELECT
    TO public
    USING (true);
  END IF;
END $$;

-- 3. employee_profiles
ALTER TABLE public.employee_profiles ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'employee_profiles' AND policyname = 'Users can select own profile'
  ) THEN
    CREATE POLICY "Users can select own profile"
    ON public.employee_profiles
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'employee_profiles' AND policyname = 'Users can insert own profile'
  ) THEN
    CREATE POLICY "Users can insert own profile"
    ON public.employee_profiles
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'employee_profiles' AND policyname = 'Users can update own profile'
  ) THEN
    CREATE POLICY "Users can update own profile"
    ON public.employee_profiles
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- 4. employee_skills
ALTER TABLE public.employee_skills ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'employee_skills' AND policyname = 'Users can manage own employee_skills'
  ) THEN
    CREATE POLICY "Users can manage own employee_skills"
    ON public.employee_skills
    FOR ALL
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.employee_profiles ep
        WHERE ep.id = employee_skills.employee_profile_id
        AND ep.user_id = auth.uid()
      )
    )
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM public.employee_profiles ep
        WHERE ep.id = employee_skills.employee_profile_id
        AND ep.user_id = auth.uid()
      )
    );
  END IF;
END $$;
