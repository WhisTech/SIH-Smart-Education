-- 003_skills_seed.sql
-- Seeds reference data into the existing `skills` table.
-- This is reference data for the MoSPI Skill Intelligence Platform.
-- The seed is idempotent: it only inserts if the skill name does not already exist.

INSERT INTO public.skills (name, description, category)
SELECT name, description, category
FROM (
  VALUES
    ('Statistical Analysis', 'Techniques and principles of analyzing statistical datasets and indicators', 'Statistics'),
    ('Data Interpretation', 'Interpreting complex official statistics, survey results, and macroeconomic indicators', 'Data Analysis'),
    ('Data Management', 'Data collection, validation, cleaning, transformation, and governance', 'Data Management'),
    ('Survey Methodology', 'Sampling design, questionnaire design, field survey operations, and quality control', 'Survey & Sampling'),
    ('Python for Data Science', 'Data manipulation, statistical analysis, and machine learning using Python', 'Programming'),
    ('R Programming', 'Statistical computing, econometric modeling, and data visualization with R', 'Programming'),
    ('SQL & Database Queries', 'Querying relational databases, aggregations, joins, and data extraction', 'Programming'),
    ('Official Statistics Governance', 'National statistical system protocols, MoSPI standards, and data dissemination policies', 'Domain Knowledge'),
    ('Report Writing & Presentation', 'Drafting analytical reports, policy briefs, and statistical bulletins', 'Communication'),
    ('Time Series & Forecasting', 'Techniques for analyzing temporal data, trend estimation, and economic forecasting', 'Statistics'),
    ('Data Visualization & Dashboards', 'Designing interactive charts, maps, and visual dashboards for statistical communication', 'Data Analysis'),
    ('Sampling Theory & Estimation', 'Probability sampling methods, variance estimation, and weighting techniques', 'Survey & Sampling')
) AS seed(name, description, category)
WHERE NOT EXISTS (
  SELECT 1 FROM public.skills s WHERE s.name = seed.name
);

-- Ensure RLS allows reading reference skills
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
