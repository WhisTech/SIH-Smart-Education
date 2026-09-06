-- 010_relax_intelligence_user_id.sql
-- Relaxes the NOT NULL constraint on user_id in assessments, skill_gaps, and recommendations.
-- This allows skill intelligence, gap analysis, and course recommendations to link directly
-- to employee_profiles.id for directory officers prior to account creation.

ALTER TABLE public.assessments 
  ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE public.skill_gaps 
  ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE public.recommendations 
  ALTER COLUMN user_id DROP NOT NULL;
