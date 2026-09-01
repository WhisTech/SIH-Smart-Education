# AI-Enabled Skill Intelligence and Learning Platform for India's Official Statistical System

> **Smart India Hackathon (SIH) 2026**  
> **Problem Statement ID:** PS26101  
> **Organization:** Ministry of Statistics and Programme Implementation (MoSPI), Government of India  
> **Domain:** Smart Education & Capacity Building  

---

## 1. Problem Statement

India's Official Statistical System employs personnel across multiple cadres, designations, and field offices (such as NSO SDRD, FOD, DPD, ESD, SSD, NAD). These statistical officials possess varying levels of domain expertise, field experience, and analytical backgrounds. 

### Key Challenges in Existing Training Systems:
1. **Generic Training Courses:** Conventional learning portals offer one-size-fits-all courses that do not align with specific designation roles.
2. **Lack of Competency Diagnostics:** Absence of adaptive tools to accurately assess an official's current competency versus required job benchmarks.
3. **Unidentified Skill Gaps:** No automated mechanism to isolate specific skill deficiencies or prioritize training needs.
4. **Unmeasured Learning Impact:** Inability to continuously track progress or measure post-training competency improvement via structured reassessment.

---

## 2. Proposed Solution

Our platform introduces an end-to-end AI-driven Skill Intelligence and Capacity Building ecosystem:

```text
┌──────────┐     ┌──────────┐     ┌──────────────┐     ┌───────────┐     ┌───────┐
│  ASSESS  │ ──► │ ANALYZE  │ ──► │ IDENTIFY GAPS│ ──► │ RECOMMEND │ ──► │ LEARN │
└──────────┘     └──────────┘     └──────────────┘     └───────────┘     └───┬───┘
                                                                             │
┌──────────────────────┐     ┌────────────┐     ┌───────┐                    │
│ MEASURE IMPROVEMENT  │ ◄── │ RE-ASSESS  │ ◄── │ TRACK │ ◄──────────────────┘
└──────────────────────┘     └────────────┘     └───────┘
```

1. **Assess:** Adaptive AI-powered competency quizzes tailored to official statistical roles.
2. **Analyze:** Mathematical scoring across individual statistical competencies.
3. **Identify Gaps:** Automated delta calculation comparing actual performance against official designation benchmarks.
4. **Recommend:** Dynamic matching with verified iGOT Karmayogi and NSSTA learning modules.
5. **Learn:** Personalized learning path execution.
6. **Track:** Monitoring module status (`Pending`, `In Progress`, `Completed`).
7. **Re-assess:** Post-training evaluation to validate skill acquisition.
8. **Measure Improvement:** Visual side-by-side growth analytics proving training ROI.

---

## 3. Core Features & Implementation Status

| Feature Name | Description | Status |
| :--- | :--- | :--- |
| **Official Profile Manager** | Profile onboarding with designation lookup & skill mapping | `CURRENT / IMPLEMENTED` |
| **Adaptive AI Quiz Engine** | Dynamic single-question generation with difficulty adaptation | `CURRENT / IMPLEMENTED` |
| **PDF MCQ Generator** | Grounded question generation from MoSPI survey documents via Gemini | `CURRENT / IMPLEMENTED` |
| **Skill-Gap Analysis Engine** | Automated percentage gap calculation & priority grading | `CURRENT / IMPLEMENTED` |
| **iGOT Recommendations** | Personalized course recommendations catalog matched to gaps | `CURRENT / IMPLEMENTED` |
| **Reassessment Engine** | Before-and-after score comparison and improvement tracking | `CURRENT / IMPLEMENTED` |
| **Research Engine** | 4-Signal Fusion recommendation & Knowledge Graph visualizer | `CURRENT / IMPLEMENTED` |
| **Employee Dashboard** | Centralized dashboard for tracking competency scores | `CURRENT / IMPLEMENTED` |
| **Admin Analytics Panel** | MoSPI-wide department skill gap metrics & training planning | `PROPOSED / FUTURE` |

---

## 4. Technology Stack

* **Frontend:** React 19, Vite 8, React Router 7, Custom CSS Layouts
* **Backend:** Node.js (Express 5), Groq SDK (`groq-sdk`), Google Gemini API, Multer (PDF parsing), PDFParse
* **Database & Auth:** Supabase PostgreSQL with Row-Level Security (RLS), Supabase GoTrue Auth
* **AI Provider Engines:** Groq LLaMA / Compound models, Google Gemini `gemini-3.6-flash`
* **Linter & Build Tools:** Oxlint, Vite build pipeline

---

## 5. System Architecture Overview

The system is currently implemented using **Architecture A (Modular Monolith)**, optimized for demonstration reliability, zero infrastructure friction, and straightforward maintenance.

```text
React Single Page App (Frontend) ──► Express API Monolith (Backend) ──► Supabase PostgreSQL (Database)
                                              │
                                              ▼
                               Groq SDK & Google Gemini (AI Services)
```

> Detailed architecture blueprints are documented in [`docs/architecture-a.md`](./docs/architecture-a.md), [`docs/architecture-b.md`](./docs/architecture-b.md), and [`docs/architecture-comparison.md`](./docs/architecture-comparison.md).

---

## 6. User Roles

### 1. Employee (`CURRENT / IMPLEMENTED`)
* Create and update employee profile (Name, Employee ID, Designation, Department).
* Select active statistical competencies.
* Take adaptive AI competency assessments.
* Review skill-gap breakdowns and priority warnings.
* Access personalized iGOT Karmayogi course recommendations.
* Complete reassessments to measure proficiency improvement over time.
* Generate grounded MCQs from custom PDF training manuals.

### 2. Administrator (`PROPOSED / FUTURE`)
* View MoSPI-wide employee assessment statistics.
* Inspect department-level skill gaps across divisions (SDRD, FOD, DPD, ESD, NAD).
* Plan institutional training batches for NSSTA / TPAC physical training programmes.

---

## 7. AI Integration Architecture

AI is integrated strictly as an **intelligence and generation layer** bounded by rigid application rules:
* **AI Handles:** Adaptive question generation, grounded PDF MCQ extraction, qualitative summary reporting.
* **Application Handles:** Authenticated sessions, numerical score calculation, required competency level benchmarks, database persistence.

> Full AI governance specification available in [`docs/ai-architecture.md`](./docs/ai-architecture.md).

---

## 8. External Ecosystem Integration

```text
                               ┌───────────────────────────┐
                               │  MoSPI Smart Education    │
                               └─────────────┬─────────────┘
                                             │
      ┌──────────────────────────────┬───────┴──────────────────────────────┐
      ▼                              ▼                                      ▼
┌──────────┐          ┌───────────────────────────┐          ┌───────────────────────────┐
│  NSSTA   │          │      iGOT Karmayogi       │          │           TPAC            │
│ Training │          │   Course Recommendation   │          │     Capacity Building     │
└──────────┘          └───────────────────────────┘          └───────────────────────────┘
```

* **NSSTA (National Statistical Systems Training Academy):** Institutional partner for physical training batch allocation.
* **iGOT Karmayogi:** Integrated via verified database catalog and Mock REST Adapter, ready for live API webhook activation upon official key release.

---

## 9. Installation & Setup Guide

### Prerequisites
* **Node.js:** v18.0.0 or higher
* **npm:** v9.0.0 or higher
* **Supabase Project:** Configured PostgreSQL instance with schema scripts applied.

### Step 1: Clone the Repository
```bash
git clone https://github.com/WhisTech/SIH-Smart-Education.git
cd SIH-Smart-Education
```

### Step 2: Configure Environment Variables

#### Backend Environment Setup (`backend/.env`)
```env
PORT=5000
SUPABASE_URL=https://your-supabase-project.supabase.co
SUPABASE_SECRET_KEY=your-supabase-service-role-secret-key
GROQ_API_KEY=your-groq-api-key
GEMINI_API_KEY=your-gemini-api-key
```

#### Frontend Environment Setup (`frontend/.env`)
```env
VITE_SUPABASE_URL=https://your-supabase-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_BACKEND_URL=http://localhost:5000
```

### Step 3: Install Dependencies & Run Applications

#### Running Backend Server:
```bash
cd backend
npm install
npm run dev
```

#### Running Frontend Application:
```bash
cd frontend
npm install
npm run dev
```

---

## 10. Repository Directory Structure

```text
SIH-Smart-Education/
├── backend/                  # Express 5 backend server & AI clients
│   ├── data/                 # Synthetic research datasets
│   ├── research/             # 4-Signal Fusion & Knowledge Graph engines
│   ├── geminiClient.js       # Gemini API client & PDF parser
│   ├── groqClient.js         # Groq SDK adaptive MCQ generator
│   └── server.js             # Express API route endpoints
├── database/                 # SQL database migration scripts
│   ├── 002_designations_seed.sql
│   ├── 003_skills_seed.sql
│   ├── 004_rls_policies.sql
│   ├── 005_assessment_schema.sql
│   └── 006_skill_gap_schema.sql
├── docs/                     # Comprehensive Architecture & Flow Specifications
│   ├── ai-architecture.md
│   ├── architecture-a.md
│   ├── architecture-b.md
│   ├── architecture-comparison.md
│   ├── backend-architecture.md
│   ├── database-architecture.md
│   ├── frontend-architecture.md
│   ├── security-architecture.md
│   ├── system-data-flow.md
│   └── user-flows.md
└── frontend/                 # React 19 Single Page Application
    └── src/
        ├── components/       # Layout, ProtectedRoute, SkillSelector
        ├── context/          # AuthContext provider
        ├── lib/              # Supabase & Reference Data helpers
        └── pages/            # Dashboard, Assessment, iGOT, Profile, Reassessment
```

---

## 11. Complete Project Documentation Directory (`/docs`)

For exhaustive technical blueprints, user workflows, AI architecture, API specifications, and presentation deck material, refer to the complete documentation suite in `/docs`:

| File | Document Title | Description | Status |
| :--- | :--- | :--- | :--- |
| [`01-project-overview.md`](./docs/01-project-overview.md) | **Project Overview** | Problem statement, solution, MoSPI context, core features | `CURRENT` |
| [`02-system-architecture.md`](./docs/02-system-architecture.md) | **System Architecture** | Main architecture diagram, layer breakdown, system components | `CURRENT` |
| [`03-technology-stack.md`](./docs/03-technology-stack.md) | **Technology Stack** | Layer-by-layer technology matrix with codebase evidence | `CURRENT` |
| [`04-complete-user-workflow.md`](./docs/04-complete-user-workflow.md) | **Complete User Workflow** | End-to-end platform journey diagram and step breakdown | `CURRENT` |
| [`05-employee-workflow.md`](./docs/05-employee-workflow.md) | **Employee Workflow** | Persona-driven employee journey across 5 operational stages | `CURRENT` |
| [`06-admin-workflow.md`](./docs/06-admin-workflow.md) | **Admin Workflow** | Proposed production admin functions & research engine demo | `PROPOSED / DEMO` |
| [`07-authentication-workflow.md`](./docs/07-authentication-workflow.md) | **Authentication Workflow** | Supabase GoTrue Auth, JWT validation middleware, route guards | `CURRENT` |
| [`08-assessment-workflow.md`](./docs/08-assessment-workflow.md) | **Assessment Workflow** | Dynamic Groq AI question cycle, SHA-256 fingerprinting | `CURRENT` |
| [`09-skill-gap-analysis.md`](./docs/09-skill-gap-analysis.md) | **Skill Gap Analysis** | Deterministic gap formula ($Gap = Req - Assessed$), priority rules | `CURRENT` |
| [`10-recommendation-engine.md`](./docs/10-recommendation-engine.md) | **Recommendation Engine** | Rule-based catalog mapping & 4-Signal Research Fusion Engine | `CURRENT` |
| [`11-igot-learning.md`](./docs/11-igot-learning.md) | **iGOT Learning** | Verified MoSPI/NSSTA course catalog with iGOT links | `MOCK / DEMO` |
| [`12-learning-progress.md`](./docs/12-learning-progress.md) | **Learning Progress** | Course completion lifecycle & UI tracking status | `PARTIAL` |
| [`13-reassessment-improvement.md`](./docs/13-reassessment-improvement.md) | **Reassessment & Improvement**| Comparative score analytics (+% delta) & gap reduction | `CURRENT` |
| [`14-mcq-generator.md`](./docs/14-mcq-generator.md) | **MCQ Generator** | Grounded PDF document processing via Gemini 3.6 Flash | `CURRENT` |
| [`15-research-engine.md`](./docs/15-research-engine.md) | **Research Engine** | 4-Signal Fusion recommendation laboratory, TransE KG, metrics | `CURRENT` |
| [`16-dashboard.md`](./docs/16-dashboard.md) | **Employee Dashboard** | MoSPI command dashboard layout blocks and API sources | `CURRENT` |
| [`17-profile-management.md`](./docs/17-profile-management.md) | **Profile Management** | Cadre metadata, skill mapping, fallback cascade logic | `CURRENT` |
| [`18-ai-architecture.md`](./docs/18-ai-architecture.md) | **AI Architecture** | Dual model allocation (Groq/Gemini) & AI guard boundaries | `CURRENT` |
| [`19-database-architecture.md`](./docs/19-database-architecture.md) | **Database Architecture** | Supabase PostgreSQL ERD, master tables, RLS policies | `CURRENT` |
| [`20-api-architecture.md`](./docs/20-api-architecture.md) | **API Architecture** | Complete REST endpoint directory, callers, and handlers | `CURRENT` |
| [`21-frontend-architecture.md`](./docs/21-frontend-architecture.md) | **Frontend Architecture** | React SPA component tree, routing, layout shell, AuthContext | `CURRENT` |
| [`22-backend-architecture.md`](./docs/22-backend-architecture.md) | **Backend Architecture** | Express gateway layering, middleware, AI & research clients | `CURRENT` |
| [`23-security-architecture.md`](./docs/23-security-architecture.md) | **Security Architecture** | JWT validation, PostgreSQL RLS, in-memory PDF buffer safety | `CURRENT` |
| [`24-data-flow.md`](./docs/24-data-flow.md) | **Complete Data Flow** | End-to-end data creation, transformation, storage, and usage | `CURRENT` |
| [`25-feature-matrix.md`](./docs/25-feature-matrix.md) | **Feature Matrix** | Master capabilities table mapping status, stack, and APIs | `CURRENT` |
| [`26-ppt-ready-content.md`](./docs/26-ppt-ready-content.md) | **PPT Ready Content** | 17 presentation slides ready for SIH 2026 evaluation | `CURRENT` |

