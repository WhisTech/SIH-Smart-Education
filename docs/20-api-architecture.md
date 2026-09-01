# 20 — API Architecture

## Master API Map & Endpoint Directory

| Feature Area | Method | Endpoint Path | Frontend Caller | Backend Route Handler | DB / Service Layer | Authentication Required |
| :--- | :---: | :--- | :--- | :--- | :--- | :---: |
| **System Health** | `GET` | `/api/health` | Diagnostic Ping | `server.js:79-84` | Memory Check | No |
| **Supabase Health**| `GET` | `/api/supabase-test` | Connectivity Test | `server.js:87-104` | `employee_profiles` | No |
| **Reference Data** | `GET` | `/api/designations` | `referenceData.js` | `server.js:107-133` | `designations` | No |
| **Reference Data** | `GET` | `/api/skills` | `referenceData.js` | `server.js:136-163` | `skills` | No |
| **Assessment Info**| `GET` | `/api/assessment/info` | `Assessment.jsx` | `server.js:172-234` | `employee_skills`, `skills` | Yes (Bearer JWT) |
| **Reassessment Metadata**| `GET` | `/api/assessment/reassessment-info` | `Reassessment.jsx` | `server.js:238-349` | `assessments`, `skill_gaps` | Yes (Bearer JWT) |
| **Score Comparison**| `GET` | `/api/assessment/latest-comparison` | `Reassessment.jsx` | `server.js:354-374` | `assessment_skill_scores` | Yes (Bearer JWT) |
| **Latest Result** | `GET` | `/api/assessment/user/latest` | `Dashboard.jsx` | `server.js:378-431` | `assessments`, `assessment_analyses` | Yes (Bearer JWT) |
| **Attempt History**| `GET` | `/api/assessment/user/history` | Profile History | `server.js:435-464` | `assessments` | Yes (Bearer JWT) |
| **Result Detail** | `GET` | `/api/assessment/result/:id` | `AssessmentResult.jsx` | `server.js:468-526` | `assessment_analyses` | Yes (Bearer JWT) |
| **Start Assessment**| `POST` | `/api/assessment/start-new` | `Assessment.jsx` | `server.js:576-631` | `assessments` | Yes (Bearer JWT) |
| **Next Question** | `POST` | `/api/assessment/:id/next-question` | `Assessment.jsx` | `server.js:635-738` | Groq AI / `assessment_questions` | Yes (Bearer JWT) |
| **Submit Choice** | `POST` | `/api/assessment/:id/answer` | `Assessment.jsx` | `server.js:740-774` | `assessment_answers` | Yes (Bearer JWT) |
| **Final Submit** | `POST` | `/api/assessment/:id/submit` | `Assessment.jsx` | `server.js:780-887` | `skill_gaps`, `recommendations` | Yes (Bearer JWT) |
| **Skill Gaps** | `GET` | `/api/skill-gap/latest` | Skill Gap Views | `server.js:997-1052` | `skill_gaps` | Yes (Bearer JWT) |
| **Recommendations**| `GET` | `/api/recommendations/user` | `IgotDashboard.jsx` | `server.js:1055-1126` | `recommendations`, `courses` | Yes (Bearer JWT) |
| **MCQ Generator** | `POST` | `/api/mcq/generate` | `McqGenerator.jsx` | `server.js:1131-1200` | Gemini 3.6 Flash / Multer | No (Public Ingestion) |
| **Research Cohort**| `GET` | `/api/research/employees` | `ResearchEngine.jsx` | `server.js:1229-1242` | `research_seed.json` | No |
| **Research Fusion**| `POST` | `/api/research/recommendations` | `ResearchEngine.jsx` | `server.js:1276-1291` | `FusionEngine` | No |
| **Research Metrics**| `GET` | `/api/research/metrics` | `ResearchEngine.jsx` | `server.js:1296-1311` | `MetricsEngine` | No |
| **Knowledge Graph**| `GET` | `/api/research/knowledge-graph` | `ResearchEngine.jsx` | `server.js:1316-1367` | `KGEngine` | No |

---

## Source File References
- Server Route Manifest: [server.js](file:///c:/Z%20Github%20Project/SIH-Smart-Education/backend/server.js#L1-L1375)
