-- 006_skill_gap_schema.sql
-- Establishes schema and seed data for Stage 3: Skill-Gap Analysis & iGOT Recommendations

-- 1. CREATE public.skill_gaps TABLE
CREATE TABLE IF NOT EXISTS public.skill_gaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assessment_id UUID NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES public.skills(id),
  assessed_score NUMERIC(5,2) NOT NULL DEFAULT 0.00,
  required_score NUMERIC(5,2) NOT NULL DEFAULT 80.00,
  gap_percentage NUMERIC(5,2) NOT NULL DEFAULT 0.00,
  priority TEXT NOT NULL DEFAULT 'Medium' CHECK (priority IN ('High', 'Medium', 'Low')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT skill_gaps_assessment_id_skill_id_key UNIQUE (assessment_id, skill_id)
);

-- 2. ENHANCE public.recommendations TABLE
ALTER TABLE public.recommendations
  ADD COLUMN IF NOT EXISTS assessment_id UUID REFERENCES public.assessments(id) ON DELETE CASCADE;

-- 3. CREATE INDEXES
CREATE INDEX IF NOT EXISTS idx_skill_gaps_user_id ON public.skill_gaps(user_id);
CREATE INDEX IF NOT EXISTS idx_skill_gaps_assessment_id ON public.skill_gaps(assessment_id);
CREATE INDEX IF NOT EXISTS idx_skill_gaps_skill_id ON public.skill_gaps(skill_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_user_id ON public.recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_course_id ON public.recommendations(course_id);

-- 4. RLS POLICIES
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.designation_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skill_gaps ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'courses' AND policyname = 'Allow public read access to courses') THEN
    CREATE POLICY "Allow public read access to courses" ON public.courses FOR SELECT TO public USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'designation_skills' AND policyname = 'Allow public read access to designation_skills') THEN
    CREATE POLICY "Allow public read access to designation_skills" ON public.designation_skills FOR SELECT TO public USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'recommendations' AND policyname = 'Users can manage own recommendations') THEN
    CREATE POLICY "Users can manage own recommendations" ON public.recommendations FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'skill_gaps' AND policyname = 'Users can manage own skill_gaps') THEN
    CREATE POLICY "Users can manage own skill_gaps" ON public.skill_gaps FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- 5. SEED public.designation_skills (using level 1-5 scale: 4 = 80% required)
INSERT INTO public.designation_skills (designation_id, skill_id, required_level, importance)
SELECT d.id, s.id, 4, 5
FROM public.designations d, public.skills s
WHERE d.name = 'Statistical Officer' AND s.name IN ('Statistical Analysis', 'Survey Methodology', 'Data Quality Management', 'Official Statistics')
ON CONFLICT DO NOTHING;

INSERT INTO public.designation_skills (designation_id, skill_id, required_level, importance)
SELECT d.id, s.id, 4, 5
FROM public.designations d, public.skills s
WHERE d.name = 'Programmer' AND s.name IN ('Python Programming', 'Data Analysis', 'Data Visualization', 'Data Management')
ON CONFLICT DO NOTHING;

INSERT INTO public.designation_skills (designation_id, skill_id, required_level, importance)
SELECT d.id, s.id, 4, 5
FROM public.designations d, public.skills s
WHERE d.name = 'Data Analyst' AND s.name IN ('Data Visualization', 'Statistical Analysis', 'Data Analysis', 'Data Interpretation')
ON CONFLICT DO NOTHING;

INSERT INTO public.designation_skills (designation_id, skill_id, required_level, importance)
SELECT d.id, s.id, 4, 4
FROM public.designations d, public.skills s
WHERE d.name IN ('Assistant Statistical Officer', 'Statistical Investigator', 'Statistical Assistant', 'Senior Statistical Officer') 
  AND s.name IN ('Official Statistics', 'Survey Methodology', 'Data Quality Management', 'Data Interpretation')
ON CONFLICT DO NOTHING;

-- 6. SEED public.courses CATALOG WITH VERIFIED iGOT COURSES
INSERT INTO public.courses (title, provider, skill_id, description, level, external_url, source_type, verified)
SELECT 
  'Introduction to Official Statistical System & NSO Operations',
  'National Statistical Systems Training Academy (NSSTA) / iGOT Karmayogi',
  s.id,
  'Comprehensive orientation on the structure, standards, and survey workflows of India official statistical system.',
  'intermediate',
  'https://igotkarmayogi.gov.in/',
  'iGOT',
  true
FROM public.skills s WHERE s.name = 'Official Statistics'
ON CONFLICT DO NOTHING;

INSERT INTO public.courses (title, provider, skill_id, description, level, external_url, source_type, verified)
SELECT 
  'Data Analysis and Visualization for Public Policy',
  'Capacity Building Commission (CBC) / iGOT Karmayogi',
  s.id,
  'Master analytical charts, dashboards, and quantitative storytelling for government survey and economic reports.',
  'intermediate',
  'https://igotkarmayogi.gov.in/',
  'iGOT',
  true
FROM public.skills s WHERE s.name = 'Data Visualization'
ON CONFLICT DO NOTHING;

INSERT INTO public.courses (title, provider, skill_id, description, level, external_url, source_type, verified)
SELECT 
  'Python & R Programming for Statistical Computing',
  'IT & Computer Centre, MoSPI / iGOT Karmayogi',
  s.id,
  'Practical data wrangling, automation scripts, and statistical modelling using open-source Python and R packages.',
  'advanced',
  'https://igotkarmayogi.gov.in/',
  'iGOT',
  true
FROM public.skills s WHERE s.name = 'Python Programming'
ON CONFLICT DO NOTHING;

INSERT INTO public.courses (title, provider, skill_id, description, level, external_url, source_type, verified)
SELECT 
  'Sample Survey Design & Field Operation Standards',
  'Survey Design & Research Division (SDRD), NSO / iGOT Karmayogi',
  s.id,
  'Guidelines on probability sampling, multi-stage stratification, questionnaire design, and field data auditing.',
  'intermediate',
  'https://igotkarmayogi.gov.in/',
  'iGOT',
  true
FROM public.skills s WHERE s.name = 'Survey Methodology'
ON CONFLICT DO NOTHING;

INSERT INTO public.courses (title, provider, skill_id, description, level, external_url, source_type, verified)
SELECT 
  'Data Quality Management & Audit in National Surveys',
  'Data Processing Division (DPD), NSO / iGOT Karmayogi',
  s.id,
  'Learn logical validation rules, deduplication, imputation techniques, and anomaly detection in large datasets.',
  'beginner',
  'https://igotkarmayogi.gov.in/',
  'iGOT',
  true
FROM public.skills s WHERE s.name = 'Data Quality Management'
ON CONFLICT DO NOTHING;

INSERT INTO public.courses (title, provider, skill_id, description, level, external_url, source_type, verified)
SELECT 
  'Advanced Statistical Analysis and Regression Methods',
  'NSSTA / iGOT Karmayogi',
  s.id,
  'In-depth statistical hypothesis testing, multivariate analysis, regression modelling, and inference for official statistics.',
  'advanced',
  'https://igotkarmayogi.gov.in/',
  'iGOT',
  true
FROM public.skills s WHERE s.name = 'Statistical Analysis'
ON CONFLICT DO NOTHING;
