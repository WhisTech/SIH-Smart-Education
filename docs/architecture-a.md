# Architecture A: Modular Monolith Architecture

> **Document Classification:** Technical Architecture Specification  
> **Target Audience:** SIH Evaluators, Student Developers, MoSPI Stakeholders  
> **System Status:** Current Baseline & Recommended Demonstration Architecture  

---

## 1. Overview & Operational Philosophy

**Architecture A (Modular Monolith)** is a single, unified backend application paired with a single-page React frontend. All backend modules (Authentication, Assessments, Skill-Gap Analysis, Recommendations, AI Integration, and Research Engine) live in one cohesive repository and run inside a single process.

### Why Architecture A?
* **SIH Demonstration Optimization:** Easy to launch locally or on a single virtual server with zero microservice orchestration overhead.
* **Beginner-Friendly Maintenance:** Simple for student teams to debug using basic console logs and single-process debuggers.
* **Low Infrastructure Complexity:** Requires only one Node.js process and one Supabase PostgreSQL instance.
* **Data Consistency:** Database transactions and joins happen directly in PostgreSQL without cross-service network calls.

---

## 2. High-Level System Block Diagram

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        React Single Page App (Frontend)                 │
│  (Auth State, React Router 7, UI Components, Skill Selector, Dashboards)│
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTP / REST APIs + JWT Bearer
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                      Express API Server (Backend Monolith)             │
│                                                                        │
│   ┌───────────────────┐ ┌───────────────────┐ ┌────────────────────┐   │
│   │ Auth Middleware   │ │ Assessment Module │ │ Skill-Gap Module   │   │
│   └───────────────────┘ └───────────────────┘ └────────────────────┘   │
│   ┌───────────────────┐ ┌───────────────────┐ ┌────────────────────┐   │
│   │ Recommendation    │ │ Research Engine   │ │ PDF MCQ Generator  │   │
│   │ Service           │ │ (4-Signal Fusion) │ │ (Gemini Grounded)  │   │
│   └───────────────────┘ └───────────────────┘ └────────────────────┘   │
└───────────────┬───────────────────┬───────────────────┬────────────────┘
                │                   │                   │
                ▼                   ▼                   ▼
     ┌───────────────────┐ ┌─────────────────┐ ┌─────────────────┐
     │ Supabase Postgres │ │ Groq LLaMA /    │ │ Google Gemini   │
     │  Database & RLS   │ │ Compound Models │ │   3.6 Flash     │
     └───────────────────┘ └─────────────────┘ └─────────────────┘
```

---

## 3. Detailed Architectural Layers

### 3.1 Frontend Architecture (`frontend/`)

* **Application Shell:** Responsive global container defined in `frontend/src/components/Layout.jsx` with official MoSPI header, navigation bar, and footer.
* **Sidebar & Navigation:** Top navigation bar supporting links to Dashboard, AI Assessment, MCQ Generator, iGOT Courses, Research Engine, and Profile (`frontend/src/App.jsx`).
* **Pages (`frontend/src/pages/`):**
  * `Login.jsx` & `Signup.jsx`: Handles user authentication & initial metadata setup.
  * `Dashboard.jsx`: Central employee hub showing current designation, assigned skills, and latest assessment score.
  * `Profile.jsx`: Profile manager allowing users to select designations, manage skills, and review history.
  * `Assessment.jsx`: Interactive quiz engine supporting step-by-step adaptive question delivery.
  * `AssessmentResult.jsx`: Visual performance breakdown showing percentage score, strengths, and areas to improve.
  * `Reassessment.jsx`: Before-and-after comparison dashboard tracking skill progress over time.
  * `IgotDashboard.jsx`: Catalog of verified iGOT Karmayogi courses matched against skill gaps.
  * `McqGenerator.jsx`: PDF upload tool generating grounded MCQs using Google Gemini.
  * `ResearchEngine.jsx`: Experimental 4-signal fusion recommendation and knowledge-graph simulator.
* **Reusable Components (`frontend/src/components/`):**
  * `ProtectedRoute.jsx`: Enforces session authentication.
  * `GuestRoute.jsx`: Redirects logged-in users away from auth pages.
  * `SkillSelector.jsx`: Interactive chip selector for choosing competencies.
  * `LoadingScreen.jsx`: Official loading spinner overlay.
* **UI State Management:** React `useState` and `useEffect` hooks managed locally within page components, combined with `AuthContext.jsx` for global user auth state.
* **API Client:** Direct `fetch()` calls communicating with the backend REST endpoints (`http://localhost:5000/api`) using Supabase JWT Bearer headers.

---

### 3.2 Backend Architecture (`backend/`)

* **Routes & Controller (`backend/server.js`):** Unified Express server containing route handlers for health checks, designations, skills, assessment flows, skill gaps, recommendations, MCQ PDF parsing, and research endpoints.
* **Services & Engines:**
  * **AI Service (`groqClient.js` & `geminiClient.js`):** Connects to Groq SDK and Google Gemini REST API with fallback templates and error bounds.
  * **Assessment Service:** Handles quiz creation (`/api/assessment/start-new`), adaptive question fetching (`/api/assessment/:id/next-question`), answer recording, and score calculation (`/api/assessment/:id/submit`).
  * **Skill-Gap Service (`computeAndStoreSkillGaps`):** Internal database routine calculating percentage gap between employee assessed score and designation required score.
  * **Recommendation Service:** Matches identified skill gaps with verified iGOT courses in database catalog.
  * **Learning-Progress Service:** Tracks completed assessments and updates skill growth records.
  * **Research Fusion Engine (`backend/research/`):** Modular sub-engine implementing Knowledge-Graph (KG), Collaborative Filtering (CF), Sequence-based, and Multi-Metric fusion recommendation algorithms.

---

### 3.3 Database Layer (`database/`)

The database uses **Supabase PostgreSQL** with Row-Level Security (RLS).

#### Data Entities & Implementation Status

| Entity Name | Description | Status |
| :--- | :--- | :--- |
| `employee_profiles` | Stores employee name, employee ID, designation, department, experience | `CURRENT / IMPLEMENTED` |
| `designations` | Official job titles (Statistical Officer, Programmer, Data Analyst, etc.) | `CURRENT / IMPLEMENTED` |
| `skills` | Master catalog of statistical, analytical, and technical skills | `CURRENT / IMPLEMENTED` |
| `employee_skills` | Junction table linking employees to selected skills | `CURRENT / IMPLEMENTED` |
| `designation_skills` | Required skills and proficiency benchmarks for each designation | `CURRENT / IMPLEMENTED` |
| `assessments` | Header record for each quiz attempt (status, total score, timestamps) | `CURRENT / IMPLEMENTED` |
| `assessment_questions` | Individual questions generated for an assessment attempt | `CURRENT / IMPLEMENTED` |
| `assessment_answers` | User submitted answers with correctness boolean | `CURRENT / IMPLEMENTED` |
| `assessment_skill_scores` | Skill-wise score breakdown per assessment | `CURRENT / IMPLEMENTED` |
| `assessment_analyses` | Rule-based and AI summaries of strengths and weak areas | `CURRENT / IMPLEMENTED` |
| `skill_gaps` | Computed difference between required score vs assessed score | `CURRENT / IMPLEMENTED` |
| `courses` | Catalog of verified iGOT Karmayogi & NSSTA learning modules | `CURRENT / IMPLEMENTED` |
| `recommendations` | Personalized course assignments generated per skill gap | `CURRENT / IMPLEMENTED` |
| `learning_progress` | Detailed course completion status & time tracking | `PROPOSED / FUTURE` |
| `department_analytics` | Aggregate department-wide skill gap reports for leadership | `PROPOSED / FUTURE` |

---

## 4. Key Strengths & Constraints of Architecture A

### Strengths
1. **Zero Cold-Start Lag:** Single process maintains open connection pools to Supabase.
2. **Simplified Deployment:** Can be deployed using Docker on a single VM (Render, Railway, or AWS EC2).
3. **Transparent Debugging:** Single terminal log stream shows the complete lifecycle of a request from API trigger to SQL execution.

### Constraints
1. **Single Point of Failure:** If backend process crashes due to an unhandled memory exception in PDF parsing, all endpoints are temporarily unavailable until auto-restart.
2. **Resource Competition:** Heavy AI generation tasks share CPU/memory cycles with basic CRUD endpoints.
