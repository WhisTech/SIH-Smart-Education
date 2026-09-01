# End-to-End User Flow & Workflow Specifications

> **Document Classification:** Functional & System Workflow Specification  
> **Target Audience:** Product Managers, UX Designers, Frontend & Backend Engineers, Evaluators  
> **System Status:** Comprehensive Operational Workflow Blueprint  

---

## 1. High-Level System User Journey

```text
┌─────────┐     ┌────────────────┐     ┌──────────────┐     ┌──────────────────┐
│  LOGIN  │ ──► │ PROFILE / ROLE │ ──► │  ASSESSMENT  │ ──► │ COMPETENCY SCORE │
└─────────┘     └────────────────┘     └──────────────┘     └─────────┬────────┘
                                                                      │
┌───────────────────────────┐     ┌───────────────────┐     ┌─────────▼────────┐
│ PERSONALIZED RECOMMEND    │ ◄── │     SKILL GAP     │ ◄── │  SKILL ANALYSIS  │
└─────────┬─────────────────┘     └───────────────────┘     └──────────────────┘
          │
┌─────────▼─────────┐     ┌─────────────────┐     ┌───────────────────┐
│   LEARNING PATH   │ ──► │ COURSE RESOURCE │ ──► │ PROGRESS TRACKING │
└───────────────────┘     └─────────────────┘     └─────────┬─────────┘
                                                            │
┌───────────────────┐     ┌─────────────────┐     ┌─────────▼─────────┐
│    IMPROVEMENT    │ ◄── │   REASSESSMENT  │ ◄── │ RECOMMEND REASSESS│
└───────────────────┘     └─────────────────┘     └───────────────────┘
```

---

## 2. Employee Detailed Workflow

| Step # | Flow Step | User Action | System Action | Data Generated | Database Interaction | AI Involvement | Result Shown to User |
| :---: | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **01** | **Login & Auth** | Enters email & password on `/login`. | Validates credentials via Supabase Auth API. | JWT Token & User Session. | Query `auth.users`. | None | Redirected to `/dashboard`. |
| **02** | **Profile Setup** | Selects Designation (e.g., *Statistical Officer*) & skills on `/profile`. | Validates selection against catalog. | Profile payload & skill links. | Upsert `employee_profiles` & `employee_skills`. | None | Active skills chips & designation badge displayed. |
| **03** | **Start Assessment** | Clicks "Start Assessment" on `/assessment`. | Initializes quiz session; determines question count. | Assessment record created (`status = 'in_progress'`). | Insert `assessments`. | None | Instructions screen & total questions count. |
| **04** | **Adaptive Questions** | Reads MCQ & selects answer. | Evaluates correctness, fetches next question adaptively. | Answer record with `is_correct` boolean. | Insert `assessment_questions` & `assessment_answers`. | **Groq LLaMA / Compound**: Generates dynamic question based on skill & difficulty. | MCQ text, 4 options, progress bar. |
| **05** | **Submit Assessment** | Clicks "Submit Assessment" on final question. | Calculates overall & skill-wise percentages; updates assessment status. | Overall score %, skill score rows. | Update `assessments`, insert `assessment_skill_scores`. | None (Rule-based math calculation). | Immediate redirect to `/assessment/result/:id`. |
| **06** | **Skill-Gap Analysis** | System auto-triggers upon submission. | Compares assessed scores against required designation benchmark (`designation_skills`). | Gap percentage, priority (`High`, `Medium`, `Low`). | Upsert `skill_gaps`. | **Groq LLaMA** (Optional summary interpretation). | Visual skill-gap breakdown on dashboard. |
| **07** | **Recommendations** | Navigates to `/igot-courses`. | Matches `skill_gaps` with course catalog (`courses`). | Recommendation records with priority ranks. | Query `courses`, upsert `recommendations`. | None (Fast DB match via `skill_id`). | Ranked list of iGOT Karmayogi modules. |
| **08** | **Start Learning** | Clicks "Start Module" external link. | Opens iGOT course URL in new browser tab. | Click log (`learning_progress` - `PROPOSED`). | Update `learning_progress` status to `In Progress` (`PROPOSED`). | None | iGOT Karmayogi learning platform. |
| **09** | **Reassessment** | Navigates to `/reassessment` after learning. | Loads previous assessment scores & prompts user to verify growth. | Reassessment attempt record (`assessment_type = 'reassessment'`). | Insert `assessments`. | **Groq LLaMA**: Generates adaptive reassessment questions. | Interactive reassessment quiz. |
| **10** | **Improvement Display** | Submits reassessment. | Calculates new score and generates comparison stats. | Deltas (e.g., +25% score increase). | Query historical `assessments` & `assessment_skill_scores`. | None | Side-by-side score comparison bar chart & remaining gap status. |

---

## 3. Administrator Detailed Workflow

```text
Admin Login ──► Admin Dashboard ──► Employee Overview ──► Department Analysis ──► Competency Overview
                                                                                       │
Reports & Analytics ◄── Progress Monitoring ◄── Course Insights ◄── Training Priorities ◄──┘
```

> **Implementation Note:** Admin workflows are currently `PROPOSED / FUTURE` for production enhancement. Synthetic data visualization is accessible in `ResearchEngine.jsx`.

### Step-by-Step Breakdown:
1. **Admin Login:** Authentication via Supabase Auth with administrator role (`auth.users.role = 'admin'`).
2. **Admin Dashboard:** Central view displaying total onboarded employees, completed assessments count, and average competency score across MoSPI.
3. **Employee Overview:** Searchable directory listing all statistical personnel, their designated roles, and assessment status.
4. **Department / Role Analysis:** Aggregated skill statistics grouped by division (e.g., SDRD, FOD, DPD, ESD, NAD).
5. **Competency Overview:** Heatmap showing macro-level proficiency across key statistical domain areas.
6. **Common Skill Gaps:** System highlights top MoSPI-wide deficiencies (e.g., 62% of Statistical Officers have gaps in *Sample Survey Design*).
7. **Training Priorities:** Auto-generated institutional recommendations for NSSTA / TPAC physical training batch allocation.
8. **Course / Learning Insights:** Analytics tracking employee engagement with recommended iGOT Karmayogi courses.
9. **Progress Monitoring:** Real-time tracking of post-training reassessment scores across departments.
10. **Reports & Analytics:** Exportable PDF/Excel reports for MoSPI executive decision-making.

---

## 4. Technical Assessment Workflow & AI Responsibilities

```text
[ Assessment Start ] ──► [ Fetch Designation & Skills ] ──► [ Generate / Fetch MCQ ]
                                                                       │
[ Store Result & Compute Gap ] ◄── [ Calculate Skill Scores ] ◄── [ Answer Submission ]
```

### Strict Architectural Boundaries: AI vs. Application Logic

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        AI MAY HANDLE (Groq / Gemini)                   │
├────────────────────────────────────────────────────────────────────────┤
│ • Generating context-aware, domain-specific statistical MCQs           │
│ • Adapting question difficulty (Easy / Medium / Hard) dynamically      │
│ • Generating grounded MCQs from uploaded MoSPI survey PDF documents    │
│ • Writing natural language qualitative feedback & strength summaries   │
└────────────────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────────────────┐
│                     APPLICATION LOGIC MUST HANDLE                      │
├────────────────────────────────────────────────────────────────────────┤
│ • Authenticating user session & verifying RLS authorization           │
│ • Calculating numerical scores (e.g., correct / total * 100)           │
│ • Enforcing official competency standards & required levels            │
│ • Computing skill-gap percentages mathematically (`required - actual`)  │
│ • Persisting all records to Supabase PostgreSQL database               │
│ • Deduplicating questions to ensure no user sees duplicate MCQs        │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Skill-Gap Analysis Flow

```text
Assessed Skill Score (e.g., 50%)
              │
              ▼
Required Benchmark Level (e.g., Level 4 = 80%)
              │
              ▼
Formula: Gap % = Max(0, Required Score - Assessed Score)
       = 80% - 50% = 30%
              │
              ▼
Priority Rule Assignment:
• Gap >= 25% OR Assessed < 60%  ──► High Priority
• Gap >= 10% OR Assessed < 75%  ──► Medium Priority
• Gap < 10%                     ──► Low Priority
```

### User Representation
The employee sees clear visual progress bars on `/dashboard` and `/igot-courses`:
* **Assessed Score:** 50% (Current Proficiency)
* **Required Level:** 80% (Official Target)
* **Status:** 30% Skill Gap — **HIGH PRIORITY**

---

## 6. Recommendation Flow & Integration Architecture

```text
Employee Profile (Role + Assigned Skills)
                   +
Assessed Skill Gaps (High/Medium/Low Priority)
                   │
                   ▼
┌──────────────────────────────────────────────────┐
│              Recommendation Engine               │
│  (Database SQL Query matching skill_id in catalog)│
└──────────────────┬───────────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────────┐
│            Verified Learning Catalog             │
│        (iGOT Karmayogi & NSSTA Modules)          │
└──────────────────┬───────────────────────────────┘
                   │
                   ▼
Ranked Personalized Learning Recommendations (Priority 1, 2, 3)
```

### Real Integration vs. Mock Adapter Architecture

```text
                               ┌───────────────────────────┐
                               │   Recommendation Engine   │
                               └─────────────┬─────────────┘
                                             │
                       ┌─────────────────────┴─────────────────────┐
                       │                                           │
                       ▼                                           ▼
         ┌───────────────────────────┐               ┌───────────────────────────┐
         │     Database Catalog      │               │   Mock iGOT REST Adapter  │
         │   `courses` SQL Table     │               │   (Fallback JSON Mock)    │
         │  (CURRENT / IMPLEMENTED)  │               │  (CURRENT / IMPLEMENTED)  │
         └─────────────┬─────────────┘               └─────────────┬─────────────┘
                       │                                           │
                       └─────────────────────┬─────────────────────┘
                                             │
                                             ▼
                               ┌───────────────────────────┐
                               │  Official iGOT API Webhook│
                               │    (PROPOSED / FUTURE)    │
                               └───────────────────────────┘
```

> **Crucial Distinction:** Currently, iGOT Karmayogi course data is populated via verified seed catalog entries in the database (`courses` table) and formatted using a fallback Mock Adapter. Once official government API keys are released by the Capacity Building Commission, the adapter layer will be swapped seamlessly with direct live API calls.

---

## 7. Learning-Progress Flow

```text
Recommended Course ──► Start Course (In Progress) ──► Complete Module ──► Update Progress Record ──► Recommend Reassessment
```

### Course Lifecycle States

```text
 ┌─────────┐       Click "Start"       ┌─────────────┐       User Complete       ┌───────────┐
 │ PENDING │ ────────────────────────► │ IN_PROGRESS │ ────────────────────────► │ COMPLETED │
 └─────────┘                           └─────────────┘                           └─────┬─────┘
                                                                                       │
                                                                                       ▼
                                                                            [ Unlock Reassessment ]
```

---

## 8. Reassessment Flow & Score Comparison

```text
   Baseline Assessment (Attempt #1)          Learning Intervention              Reassessment (Attempt #2)
┌───────────────────────────────────┐     ┌────────────────────────┐     ┌───────────────────────────────────┐
│  Assessed Score: 40%              │ ──► │  Completed iGOT Course │ ──► │  Assessed Score: 75%              │
│  Status: High Priority Gap        │     │  "Survey Methodology"  │     │  Status: Gap Reduced to 5%        │
└───────────────────────────────────┘     └────────────────────────┘     └─────────────────┬─────────────────┘
                                                                                           │
                                                                                           ▼
                                                                         ┌───────────────────────────────────┐
                                                                         │    Visual Comparison Report       │
                                                                         │  • Previous Score: 40%            │
                                                                         │  • New Score:      75%            │
                                                                         │  • Net Improvement: +35%          │
                                                                         │  • Remaining Gap:   5% (Low)     │
                                                                         └───────────────────────────────────┘
```
