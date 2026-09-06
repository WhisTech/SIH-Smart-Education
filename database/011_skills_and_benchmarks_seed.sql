-- 011_skills_and_benchmarks_seed.sql
-- Seeds designation_skills benchmark requirements across all official MoSPI cadres.
-- Uses 1-5 scale: level 4 = 80% benchmark target, level 5 = 100% target.

-- 1. Additional Director General & Deputy Director General (Senior Cadre Leadership)
INSERT INTO public.designation_skills (designation_id, skill_id, required_level, importance)
SELECT d.id, s.id, 5, 5
FROM public.designations d, public.skills s
WHERE d.name IN ('Additional Director General', 'Deputy Director General')
  AND s.name IN ('Official Statistics', 'National Accounts', 'Official Statistics Governance', 'Data Governance', 'Statistical Coordination', 'Statistical Analysis')
ON CONFLICT DO NOTHING;

-- 2. Director & Joint Director
INSERT INTO public.designation_skills (designation_id, skill_id, required_level, importance)
SELECT d.id, s.id, 4, 5
FROM public.designations d, public.skills s
WHERE d.name IN ('Director', 'Joint Director')
  AND s.name IN ('Official Statistics', 'Survey Methodology', 'Economic Statistics', 'National Accounts', 'Data Quality Management', 'Statistical Report Preparation')
ON CONFLICT DO NOTHING;

-- 3. Deputy Director & Assistant Director
INSERT INTO public.designation_skills (designation_id, skill_id, required_level, importance)
SELECT d.id, s.id, 4, 4
FROM public.designations d, public.skills s
WHERE d.name IN ('Deputy Director', 'Assistant Director', 'Assistant Director (Probationer)')
  AND s.name IN ('Statistical Analysis', 'Survey Design', 'Data Quality Assessment', 'Python Programming', 'R Programming', 'Data Visualization')
ON CONFLICT DO NOTHING;

-- 4. Advisor & Faculty
INSERT INTO public.designation_skills (designation_id, skill_id, required_level, importance)
SELECT d.id, s.id, 5, 5
FROM public.designations d, public.skills s
WHERE d.name = 'Advisor & Faculty'
  AND s.name IN ('Statistical Modelling', 'Research Methodology', 'Data Storytelling', 'Technical Communication', 'Official Statistical Standards')
ON CONFLICT DO NOTHING;

-- 5. Chief Vigilance Officer & Controller of Aid Accounts & Audit
INSERT INTO public.designation_skills (designation_id, skill_id, required_level, importance)
SELECT d.id, s.id, 4, 5
FROM public.designations d, public.skills s
WHERE d.name IN ('Chief Vigilance Officer', 'Controller of Aid Accounts & Audit', 'Deputy Secretary', 'Under Secretary', 'Deputy Passport Officer')
  AND s.name IN ('Data Governance', 'Data Security', 'Statistical Ethics', 'Report Writing & Presentation', 'Official Statistics Governance')
ON CONFLICT DO NOTHING;

-- 6. Senior Statistical Officer, Statistical Officer, Assistant Statistical Officer & Statistical Assistant
INSERT INTO public.designation_skills (designation_id, skill_id, required_level, importance)
SELECT d.id, s.id, 4, 4
FROM public.designations d, public.skills s
WHERE d.name IN ('Senior Statistical Officer', 'Statistical Officer', 'Assistant Statistical Officer', 'Statistical Assistant', 'Statistical Investigator')
  AND s.name IN ('Survey Data Collection', 'Data Validation', 'Descriptive Statistics', 'Field Survey Operations', 'Sampling Techniques', 'Data Cleaning')
ON CONFLICT DO NOTHING;

-- 7. Programmer, Data Analyst & Research Officer
INSERT INTO public.designation_skills (designation_id, skill_id, required_level, importance)
SELECT d.id, s.id, 4, 5
FROM public.designations d, public.skills s
WHERE d.name IN ('Programmer', 'Data Analyst', 'Research Officer')
  AND s.name IN ('Python for Data Science', 'SQL', 'Data Visualization', 'Pandas', 'Dashboard Development', 'Statistical Software Selection')
ON CONFLICT DO NOTHING;
