# 25 — Feature Matrix

## Master Platform Capabilities Matrix

| Feature Module | Implementation Status | Frontend Page / Component | Backend API Endpoint | Database Table | AI Engine | External Integration |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Authentication & Registration** | `CURRENT / IMPLEMENTED` | `Login.jsx`, `Signup.jsx` | `supabase.auth.*` | `auth.users` | None | Supabase GoTrue |
| **Profile & Skill Management** | `CURRENT / IMPLEMENTED` | `Profile.jsx`, `SkillSelector.jsx` | Direct Supabase & `/api/designations` | `employee_profiles`, `employee_skills` | None | None |
| **Adaptive AI Assessment** | `CURRENT / IMPLEMENTED` | `Assessment.jsx` | `/api/assessment/*` | `assessments`, `assessment_questions` | Groq `compound-mini` | Groq Cloud API |
| **Skill Gap Analysis** | `CURRENT / IMPLEMENTED` | `AssessmentResult.jsx` | `/api/skill-gap/latest` | `skill_gaps`, `designation_skills` | None | None |
| **iGOT Recommendations** | `CURRENT / IMPLEMENTED` | `AssessmentResult.jsx` | `/api/recommendations/user` | `recommendations`, `courses` | None | None |
| **iGOT Learning Dashboard** | `MOCK / DEMO` | `IgotDashboard.jsx` | `/api/recommendations/user` | `courses` | None | External Link (`igotkarmayogi.gov.in`) |
| **Learning Progress Tracking** | `PARTIALLY IMPLEMENTED` | `IgotDashboard.jsx` | None | `recommendations` | None | None |
| **Reassessment & Score Comparison** | `CURRENT / IMPLEMENTED` | `Reassessment.jsx` | `/api/assessment/latest-comparison` | `assessments`, `assessment_skill_scores` | Groq `compound-mini` | Groq Cloud API |
| **AI Document MCQ Generator** | `CURRENT / IMPLEMENTED` | `McqGenerator.jsx` | `/api/mcq/generate` | None (In-Memory) | Gemini 3.6 Flash | Google Gemini API |
| **4-Signal Research Fusion Engine** | `CURRENT / IMPLEMENTED` | `ResearchEngine.jsx` | `/api/research/*` | `research_seed.json` | Custom Fusion / TransE | None |
| **Employee Command Dashboard** | `CURRENT / IMPLEMENTED` | `Dashboard.jsx` | `/api/assessment/user/latest` | `assessments`, `employee_profiles` | None | None |
| **Production Admin Analytics** | `PROPOSED / FUTURE` | None (Synthetic demo in Research Engine) | None | Proposed `admin_analytics` | None | None |
| **Live iGOT API Synchronization** | `PROPOSED / FUTURE` | None | None | Proposed `igot_sync_logs` | None | Proposed iGOT OAuth 2.0 API |

---

## Status Definitions
- **`CURRENT / IMPLEMENTED`:** Fully operational in codebase with active frontend UI, backend API, and database persistence.
- **`PARTIALLY IMPLEMENTED`:** Functional UI and database integration with scope for expanded state tracking.
- **`MOCK / DEMO`:** Functional demonstration UI utilizing pre-seeded verified catalogs or external links.
- **`PROPOSED / FUTURE`:** Architecture or module specification planned for production national rollout.
