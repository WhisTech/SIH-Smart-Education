-- 014_proctoring_schema.sql
-- Establishes database schema for Free Browser-Based Proctoring System

-- 1. ENHANCE public.assessments TABLE
ALTER TABLE public.assessments 
  ADD COLUMN IF NOT EXISTS warning_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS termination_reason TEXT DEFAULT NULL;

-- 2. UPDATE status constraint on assessments to include 'terminated'
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'assessments_status_check'
  ) THEN
    ALTER TABLE public.assessments DROP CONSTRAINT assessments_status_check;
  END IF;

  ALTER TABLE public.assessments 
    ADD CONSTRAINT assessments_status_check 
    CHECK (status IN ('in_progress', 'completed', 'abandoned', 'terminated'));
END $$;

-- 3. CREATE public.assessment_violations TABLE WITH STANDARDIZED EVENT TYPES
CREATE TABLE IF NOT EXISTS public.assessment_violations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  violation_type TEXT NOT NULL CHECK (violation_type IN (
    'CAMERA_DENIED', 'CAMERA_DISCONNECTED', 'CAMERA_INTERRUPTED', 
    'TAB_SWITCH', 'WINDOW_BLUR', 'FULLSCREEN_EXIT',
    'tab_switch', 'window_blur', 'fullscreen_exit', 'camera_disabled'
  )),
  warning_number INTEGER NOT NULL CHECK (warning_number BETWEEN 1 AND 3),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. CREATE INDEXES
CREATE INDEX IF NOT EXISTS idx_violations_assessment_id ON public.assessment_violations(assessment_id);
CREATE INDEX IF NOT EXISTS idx_violations_user_id ON public.assessment_violations(user_id);

-- 5. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.assessment_violations ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'assessment_violations' AND policyname = 'Users can view own assessment violations'
  ) THEN
    CREATE POLICY "Users can view own assessment violations"
    ON public.assessment_violations
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'assessment_violations' AND policyname = 'Users can insert own assessment violations'
  ) THEN
    CREATE POLICY "Users can insert own assessment violations"
    ON public.assessment_violations
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;
