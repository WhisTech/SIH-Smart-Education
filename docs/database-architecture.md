# Database Architecture & Entity Relationship Specification

> **Document Classification:** Database Design & Data Model Specification  
> **Database Engine:** Supabase PostgreSQL  
> **System Status:** Active Production Schema & Future Extensions Blueprint  

---

## 1. Conceptual Entity Relationship Model

```text
                               ┌──────────────────────────┐
                               │       auth.users         │
                               └────────────┬─────────────┘
                                            │ 1:1
                                            ▼
┌──────────────────────────┐   1:N   ┌──────────────────────────┐   N:1   ┌──────────────────────────┐
│       designations       │ ◄────── │    employee_profiles     │ ──────► │          skills          │
└────────────┬─────────────┘         └────────────┬─────────────┘         └────────────┬─────────────┘
             │                                    │                                    │
             │ 1:N                                │ 1:N                                │ 1:N
             ▼                                    ▼                                    ▼
┌──────────────────────────┐         ┌──────────────────────────┐         ┌──────────────────────────┐
│    designation_skills    │         │       employee_skills    │         │         courses          │
└──────────────────────────┘         └──────────────────────────┘         └────────────┬─────────────┘
                                                  │                                    │
                                                  │ 1:N                                │ 1:N
                                                  ▼                                    ▼
                                     ┌──────────────────────────┐         ┌──────────────────────────┐
                                     │       assessments        │ ◄────── │     recommendations      │
                                     └────────────┬─────────────┘         └──────────────────────────┘
                                                  │
                ┌─────────────────────────────────┼─────────────────────────────────┐
                │ 1:N                             │ 1:N                             │ 1:N
                ▼                                 ▼                                 ▼
┌──────────────────────────┐       ┌──────────────────────────┐       ┌──────────────────────────┐
│   assessment_questions   │       │  assessment_skill_scores │       │        skill_gaps        │
└────────────┬─────────────┘       └──────────────────────────┘       └──────────────────────────┘
             │
             │ 1:1
             ▼
┌──────────────────────────┐
│    assessment_answers    │
└──────────────────────────┘
```

---

## 2. Table Specifications & Implementation Status

### 2.1 Core User & Profile Tables

#### 1. `public.employee_profiles` (`CURRENT / IMPLEMENTED`)
* **Purpose:** Extends Supabase `auth.users` with MoSPI-specific metadata.
* **Primary Key:** `id` (UUID, `default gen_random_uuid()`)
* **Foreign Keys:**
  * `user_id` ──► `auth.users(id)` ON DELETE CASCADE (Unique)
  * `designation_id` ──► `public.designations(id)`
* **Columns & Constraints:**
  * `name` (TEXT, NOT NULL)
  * `employee_id` (TEXT, UNIQUE, NOT NULL)
  * `department` (TEXT)
  * `experience_years` (INTEGER, CHECK >= 0)
  * `created_at` (TIMESTAMPTZ, DEFAULT now())
  * `updated_at` (TIMESTAMPTZ, DEFAULT now())

#### 2. `public.designations` (`CURRENT / IMPLEMENTED`)
* **Purpose:** Official job roles within India's Official Statistical System.
* **Primary Key:** `id` (UUID, `default gen_random_uuid()`)
* **Columns:** `name` (TEXT, UNIQUE, NOT NULL), `description` (TEXT), `created_at` (TIMESTAMPTZ).

#### 3. `public.skills` (`CURRENT / IMPLEMENTED`)
* **Purpose:** Master taxonomy of statistical and analytical skills.
* **Primary Key:** `id` (UUID, `default gen_random_uuid()`)
* **Columns:** `name` (TEXT, UNIQUE, NOT NULL), `category` (TEXT, NOT NULL), `description` (TEXT).

#### 4. `public.employee_skills` (`CURRENT / IMPLEMENTED`)
* **Purpose:** Junction table linking employees to their current self-selected competencies.
* **Primary Key:** `id` (UUID)
* **Foreign Keys:**
  * `employee_profile_id` ──► `employee_profiles(id)` ON DELETE CASCADE
  * `skill_id` ──► `skills(id)` ON DELETE CASCADE
* **Constraints:** `UNIQUE(employee_profile_id, skill_id)`

#### 5. `public.designation_skills` (`CURRENT / IMPLEMENTED`)
* **Purpose:** Benchmark competency levels required for each designation.
* **Primary Key:** `id` (UUID)
* **Foreign Keys:** `designation_id` ──► `designations(id)`, `skill_id` ──► `skills(id)`
* **Columns:** `required_level` (INTEGER, 1-5 scale, DEFAULT 4 = 80%), `importance` (INTEGER, 1-5 scale).

---

### 2.2 Assessment Engine Tables

#### 6. `public.assessments` (`CURRENT / IMPLEMENTED`)
* **Purpose:** Master quiz header attempt record.
* **Primary Key:** `id` (UUID)
* **Foreign Keys:** `user_id` ──► `auth.users(id)`, `employee_profile_id` ──► `employee_profiles(id)`
* **Columns & Constraints:**
  * `assessment_type` (TEXT, CHECK IN ('initial', 'reassessment'))
  * `status` (TEXT, CHECK IN ('in_progress', 'completed', 'abandoned'))
  * `total_questions` (INTEGER, DEFAULT 0)
  * `correct_answers` (INTEGER, DEFAULT 0)
  * `score_percentage` (NUMERIC(5,2), CHECK 0-100)
  * `started_at` (TIMESTAMPTZ), `completed_at` (TIMESTAMPTZ)

#### 7. `public.assessment_questions` (`CURRENT / IMPLEMENTED`)
* **Purpose:** Stores generated MCQs for a specific assessment attempt.
* **Primary Key:** `id` (UUID)
* **Foreign Keys:** `assessment_id` ──► `assessments(id)` ON DELETE CASCADE, `skill_id` ──► `skills(id)`
* **Columns:** `question_text` (TEXT), `options` (JSONB / Array), `correct_answer` (TEXT), `explanation` (TEXT), `difficulty` (TEXT), `fingerprint` (TEXT for deduplication), `question_order` (INTEGER).

#### 8. `public.assessment_answers` (`CURRENT / IMPLEMENTED`)
* **Purpose:** User responses submitted for each question.
* **Primary Key:** `id` (UUID)
* **Foreign Keys:** `assessment_id` ──► `assessments(id)`, `question_id` ──► `assessment_questions(id)`
* **Columns & Constraints:** `selected_answer` (TEXT), `is_correct` (BOOLEAN), `answered_at` (TIMESTAMPTZ). `UNIQUE(assessment_id, question_id)`

#### 9. `public.assessment_skill_scores` (`CURRENT / IMPLEMENTED`)
* **Purpose:** Skill-wise percentage breakdown computed upon assessment submission.
* **Primary Key:** `id` (UUID)
* **Foreign Keys:** `assessment_id` ──► `assessments(id)`, `skill_id` ──► `skills(id)`
* **Columns:** `questions_count` (INT), `correct_count` (INT), `score_percentage` (NUMERIC(5,2)). `UNIQUE(assessment_id, skill_id)`

#### 10. `public.assessment_analyses` (`CURRENT / IMPLEMENTED`)
* **Purpose:** Qualitative summary report generated for an assessment attempt.
* **Primary Key:** `id` (UUID)
* **Foreign Keys:** `assessment_id` ──► `assessments(id)` (Unique)
* **Columns:** `summary` (TEXT), `strengths` (JSONB), `areas_to_improve` (JSONB), `priority_skills` (JSONB).

---

### 2.3 Skill-Gap & Recommendation Tables

#### 11. `public.skill_gaps` (`CURRENT / IMPLEMENTED`)
* **Purpose:** Stores computed competency deficiencies.
* **Primary Key:** `id` (UUID)
* **Foreign Keys:** `user_id` ──► `auth.users(id)`, `assessment_id` ──► `assessments(id)`, `skill_id` ──► `skills(id)`
* **Columns & Constraints:** `assessed_score` (NUMERIC), `required_score` (NUMERIC), `gap_percentage` (NUMERIC), `priority` (TEXT, CHECK IN ('High', 'Medium', 'Low')). `UNIQUE(assessment_id, skill_id)`

#### 12. `public.courses` (`CURRENT / IMPLEMENTED`)
* **Purpose:** Verified learning resources catalog (iGOT Karmayogi & NSSTA).
* **Primary Key:** `id` (UUID)
* **Foreign Keys:** `skill_id` ──► `skills(id)`
* **Columns:** `title` (TEXT), `provider` (TEXT), `description` (TEXT), `level` (TEXT), `external_url` (TEXT), `source_type` (TEXT DEFAULT 'iGOT'), `verified` (BOOLEAN DEFAULT true).

#### 13. `public.recommendations` (`CURRENT / IMPLEMENTED`)
* **Purpose:** Personalized course assignments generated per skill gap.
* **Primary Key:** `id` (UUID)
* **Foreign Keys:** `user_id` ──► `auth.users(id)`, `assessment_id` ──► `assessments(id)`, `skill_id` ──► `skills(id)`, `course_id` ──► `courses(id)`
* **Columns:** `reason` (TEXT), `priority` (INTEGER: 1=High, 2=Medium, 3=Low). `UNIQUE(user_id, course_id)`

---

### 2.4 Future Extension Tables (`PROPOSED / FUTURE`)

#### 14. `public.learning_progress` (`PROPOSED / FUTURE`)
* **Purpose:** Detailed tracking of course start/completion times and external learning state.
* **Columns:** `id` (UUID), `user_id` (UUID), `course_id` (UUID), `status` ('pending', 'in_progress', 'completed'), `progress_percentage` (NUMERIC), `started_at` (TIMESTAMPTZ), `completed_at` (TIMESTAMPTZ).

#### 15. `public.department_analytics` (`PROPOSED / FUTURE`)
* **Purpose:** Pre-aggregated monthly skill metrics per MoSPI division.
