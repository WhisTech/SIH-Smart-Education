-- 005_assessment_schema.sql
-- Establishes database schema for Stage 2: AI Competency Assessment

-- 1. ENHANCE public.assessments TABLE
ALTER TABLE public.assessments 
  ADD COLUMN IF NOT EXISTS employee_profile_id UUID REFERENCES public.employee_profiles(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'in_progress',
  ADD COLUMN IF NOT EXISTS total_questions INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS correct_answers INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS score_percentage NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- Add check constraints on assessments if not already existing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'assessments_status_check'
  ) THEN
    ALTER TABLE public.assessments 
      ADD CONSTRAINT assessments_status_check CHECK (status IN ('in_progress', 'completed', 'abandoned'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'assessments_score_percentage_check'
  ) THEN
    ALTER TABLE public.assessments 
      ADD CONSTRAINT assessments_score_percentage_check CHECK (score_percentage IS NULL OR (score_percentage >= 0 AND score_percentage <= 100));
  END IF;
END $$;

-- 2. ENHANCE public.assessment_questions TABLE
ALTER TABLE public.assessment_questions
  ADD COLUMN IF NOT EXISTS explanation TEXT,
  ADD COLUMN IF NOT EXISTS question_order INTEGER NOT NULL DEFAULT 1;

-- 3. ENHANCE public.assessment_answers TABLE
ALTER TABLE public.assessment_answers
  ADD COLUMN IF NOT EXISTS answered_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- Add unique constraint on assessment_answers (assessment_id, question_id)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'assessment_answers_assessment_id_question_id_key'
  ) THEN
    ALTER TABLE public.assessment_answers
      ADD CONSTRAINT assessment_answers_assessment_id_question_id_key UNIQUE (assessment_id, question_id);
  END IF;
END $$;

-- 4. CREATE public.assessment_skill_scores TABLE
CREATE TABLE IF NOT EXISTS public.assessment_skill_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES public.skills(id),
  questions_count INTEGER NOT NULL DEFAULT 0,
  correct_count INTEGER NOT NULL DEFAULT 0,
  score_percentage NUMERIC(5,2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT assessment_skill_scores_assessment_id_skill_id_key UNIQUE (assessment_id, skill_id),
  CONSTRAINT assessment_skill_scores_percentage_check CHECK (score_percentage >= 0 AND score_percentage <= 100)
);

-- 5. CREATE public.assessment_analyses TABLE
CREATE TABLE IF NOT EXISTS public.assessment_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL UNIQUE REFERENCES public.assessments(id) ON DELETE CASCADE,
  summary TEXT,
  strengths JSONB DEFAULT '[]'::jsonb,
  areas_to_improve JSONB DEFAULT '[]'::jsonb,
  priority_skills JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. CREATE INDEXES
CREATE INDEX IF NOT EXISTS idx_assessments_user_id ON public.assessments(user_id);
CREATE INDEX IF NOT EXISTS idx_assessments_employee_profile_id ON public.assessments(employee_profile_id);
CREATE INDEX IF NOT EXISTS idx_assessment_questions_assessment_id ON public.assessment_questions(assessment_id);
CREATE INDEX IF NOT EXISTS idx_assessment_questions_skill_id ON public.assessment_questions(skill_id);
CREATE INDEX IF NOT EXISTS idx_assessment_answers_assessment_id ON public.assessment_answers(assessment_id);
CREATE INDEX IF NOT EXISTS idx_assessment_answers_question_id ON public.assessment_answers(question_id);
CREATE INDEX IF NOT EXISTS idx_assessment_skill_scores_assessment_id ON public.assessment_skill_scores(assessment_id);
CREATE INDEX IF NOT EXISTS idx_assessment_skill_scores_skill_id ON public.assessment_skill_scores(skill_id);

-- 7. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_skill_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_analyses ENABLE ROW LEVEL SECURITY;

-- 7a. assessments RLS
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'assessments' AND policyname = 'Users can manage own assessments') THEN
    CREATE POLICY "Users can manage own assessments"
    ON public.assessments
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- 7b. assessment_questions RLS
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'assessment_questions' AND policyname = 'Users can manage questions of own assessments') THEN
    CREATE POLICY "Users can manage questions of own assessments"
    ON public.assessment_questions
    FOR ALL
    TO authenticated
    USING (EXISTS (SELECT 1 FROM public.assessments a WHERE a.id = assessment_questions.assessment_id AND a.user_id = auth.uid()))
    WITH CHECK (EXISTS (SELECT 1 FROM public.assessments a WHERE a.id = assessment_questions.assessment_id AND a.user_id = auth.uid()));
  END IF;
END $$;

-- 7c. assessment_answers RLS
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'assessment_answers' AND policyname = 'Users can manage answers of own assessments') THEN
    CREATE POLICY "Users can manage answers of own assessments"
    ON public.assessment_answers
    FOR ALL
    TO authenticated
    USING (EXISTS (SELECT 1 FROM public.assessments a WHERE a.id = assessment_answers.assessment_id AND a.user_id = auth.uid()))
    WITH CHECK (EXISTS (SELECT 1 FROM public.assessments a WHERE a.id = assessment_answers.assessment_id AND a.user_id = auth.uid()));
  END IF;
END $$;

-- 7d. assessment_skill_scores RLS
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'assessment_skill_scores' AND policyname = 'Users can manage skill scores of own assessments') THEN
    CREATE POLICY "Users can manage skill scores of own assessments"
    ON public.assessment_skill_scores
    FOR ALL
    TO authenticated
    USING (EXISTS (SELECT 1 FROM public.assessments a WHERE a.id = assessment_skill_scores.assessment_id AND a.user_id = auth.uid()))
    WITH CHECK (EXISTS (SELECT 1 FROM public.assessments a WHERE a.id = assessment_skill_scores.assessment_id AND a.user_id = auth.uid()));
  END IF;
END $$;

-- 7e. assessment_analyses RLS
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'assessment_analyses' AND policyname = 'Users can manage analyses of own assessments') THEN
    CREATE POLICY "Users can manage analyses of own assessments"
    ON public.assessment_analyses
    FOR ALL
    TO authenticated
    USING (EXISTS (SELECT 1 FROM public.assessments a WHERE a.id = assessment_analyses.assessment_id AND a.user_id = auth.uid()))
    WITH CHECK (EXISTS (SELECT 1 FROM public.assessments a WHERE a.id = assessment_analyses.assessment_id AND a.user_id = auth.uid()));
  END IF;
END $$;
