-- 002_designations_seed.sql
-- Seeds reference data into the existing `designations` table.
-- This is a data seed, NOT a schema change. It uses only the existing
-- columns (id, name, description, created_at).
--
-- These are the designation values used by the signup/profile forms.
-- The seed is idempotent: it only inserts a designation if its name is
-- not already present, so re-running is safe.

INSERT INTO public.designations (name, description)
SELECT name, description
FROM (
  VALUES
    ('Joint Director', 'Joint Director in the official statistical system'),
    ('Deputy Director', 'Deputy Director in the official statistical system'),
    ('Statistical Officer', 'Statistical Officer handling surveys and data'),
    ('Statistical Assistant', 'Statistical Assistant supporting data operations'),
    ('Data Entry Operator', 'Data entry operations and records management'),
    ('Programmer', 'Software and statistical programming'),
    ('Senior Statistical Officer', 'Senior Statistical Officer overseeing statistical work'),
    ('Research Officer', 'Research and analysis in statistics'),
    ('Other', 'Other designation')
) AS seed(name, description)
WHERE NOT EXISTS (
  SELECT 1 FROM public.designations d WHERE d.name = seed.name
);
