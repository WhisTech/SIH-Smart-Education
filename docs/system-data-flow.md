# System Data Flow & Information Lifecycle

> **Document Classification:** Data Architecture Specification  
> **Target Audience:** Systems Engineers, Data Architects, Integration Developers  
> **System Status:** End-to-End Operational Data Flow Specification  

---

## 1. End-to-End System Data Flow Diagram

```text
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌────────────────┐     ┌────────────┐
│ Employee │ ──► │ Frontend │ ──► │ Backend  │ ──► │ Authentication │ ──► │ Assessment │
└──────────┘     └──────────┘     └──────────┘     └────────────────┘     └─────┬──────┘
                                                                                │
                                                                                ▼
┌──────────────┐     ┌───────────────┐     ┌────────────────┐             ┌────────────┐
│ Reassessment │ ◄── │  Progress     │ ◄── │    Learning    │ ◄────────── │  Database  │
└──────────────┘     └───────────────┘     └────────────────┘             └─────┬──────┘
                                                                                │
                                                                                ▼
                                           ┌────────────────┐             ┌────────────┐
                                           │ Recommendations│ ◄── [ AI ] ◄┤   Skill    │
                                           └────────────────┘             │  Analysis  │
                                                                          └────────────┘
```

---

## 2. Step-by-Step Information Lifecycle

### Stage 1: User Profile & Competency Selection
1. **Creation:** Employee submits name, employee ID, designation, and assigned skills via `/signup` or `/profile`.
2. **Transformation:** React converts form inputs into structured JSON payload.
3. **Storage:** Saved to `employee_profiles` and `employee_skills` tables in Supabase PostgreSQL under user ID context.
4. **Consumption:** Used by `/dashboard` and `/assessment` to determine required competency benchmarks (`designation_skills`).

### Stage 2: Assessment Generation & Execution
1. **Creation:** Employee triggers assessment creation (`/api/assessment/start-new`).
2. **Transformation:** Backend fetches active skills, queries past question fingerprints to prevent duplicates, and calls Groq LLaMA AI SDK.
3. **Storage:** Assessment attempt saved in `assessments`, generated MCQs stored in `assessment_questions`, answers saved incrementally in `assessment_answers`.
4. **Consumption:** Rendered question-by-question on `Assessment.jsx` screen with interactive progress indicators.

### Stage 3: Scoring & Skill-Gap Analysis
1. **Creation:** Employee submits final question response (`/api/assessment/:id/submit`).
2. **Transformation:**
   * Node.js calculates overall score percentage: `(correct_answers / total_questions) * 100`.
   * Calculates skill-wise scores: `(skill_correct / skill_total) * 100`.
   * Evaluates gap percentage: `Math.max(0, required_score - assessed_score)`.
   * Assigns gap priority (`High`, `Medium`, `Low`).
3. **Storage:** Saved to `assessment_skill_scores`, `assessment_analyses`, and `skill_gaps` tables.
4. **Consumption:** Displayed on `AssessmentResult.jsx` and updated on `Dashboard.jsx`.

### Stage 4: Recommendation Generation
1. **Creation:** Triggered automatically upon `skill_gaps` persistence.
2. **Transformation:** Backend queries `courses` catalog matching `skill_id` for identified gaps. Sets recommendation priority (`High` gap = Priority 1).
3. **Storage:** Saved to `recommendations` table in Supabase.
4. **Consumption:** Rendered on `IgotDashboard.jsx` as personalized course cards with external launch links.

### Stage 5: Reassessment & Progress Tracking
1. **Creation:** Employee initiates a reassessment after completing learning modules (`/reassessment`).
2. **Transformation:** System compares Attempt #1 scores vs. Attempt #2 scores to calculate net improvement percentage.
3. **Storage:** Saved as new row in `assessments` table (`assessment_type = 'reassessment'`).
4. **Consumption:** Rendered on `/reassessment` as side-by-side score comparison charts.
