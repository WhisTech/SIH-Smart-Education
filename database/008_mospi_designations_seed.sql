-- 008_mospi_designations_seed.sql
-- Seeds missing official MoSPI cadres into the public.designations reference table.
-- Idempotent: safe to run multiple times.

INSERT INTO public.designations (name, description)
SELECT name, description
FROM (
  VALUES
    ('Additional Director General', 'Additional Director General in official statistical system'),
    ('Advisor & Faculty', 'Advisor & Faculty in official statistical institutions'),
    ('Assistant Director', 'Assistant Director handling statistical operations'),
    ('Assistant Director (Probationer)', 'Assistant Director (Probationer) under official training'),
    ('Chief Vigilance Officer', 'Chief Vigilance Officer overseeing institutional compliance'),
    ('Controller of Aid Accounts & Audit', 'Controller of Aid Accounts & Audit'),
    ('Deputy Director General', 'Deputy Director General in official statistical system'),
    ('Deputy Passport Officer', 'Deputy Passport Officer on deputation / administrative role'),
    ('Deputy Secretary', 'Deputy Secretary in central government ministry'),
    ('Director', 'Director in official statistical system'),
    ('Under Secretary', 'Under Secretary in central government ministry')
) AS seed(name, description)
WHERE NOT EXISTS (
  SELECT 1 FROM public.designations d WHERE d.name = seed.name
);
