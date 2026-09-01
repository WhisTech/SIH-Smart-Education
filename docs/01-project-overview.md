# 01 — Project Overview

## Project Identity
- **Project Title:** AI-Enabled Skill Intelligence and Learning Platform for India's Official Statistical System
- **Event:** Smart India Hackathon (SIH) 2026
- **Problem Statement ID:** PS26101
- **Nodal Ministry / Organization:** Ministry of Statistics and Programme Implementation (MoSPI), Government of India
- **Domain:** Smart Education & Digital Capacity Building

---

## Executive Summary
The **Official Statistical System of India**, managed under MoSPI, comprises personnel across various cadres (e.g., Senior Statistical Officer, Statistical Officer, Assistant Statistical Officer, Data Analyst, Programmer, Statistical Assistant). Employees operate at different administrative levels, handle specialized statistical domains (National Accounts, Sample Survey Operations, Economic Censuses, Price Statistics, Consumer Expenditure Surveys), and possess varying levels of proficiency.

Traditional competency development approaches face several challenges:
1. **Generic Training Allocation:** Off-the-shelf training programs fail to address role-specific competency gaps.
2. **Absence of Objective Skill Gap Analysis:** Skill proficiency is rarely measured dynamically against benchmark role requirements.
3. **Fragmented Learning Resources:** Educational content across platforms like iGOT Karmayogi and NSSTA (National Statistical Systems Training Academy) is not automatically recommended based on assessed gaps.
4. **Lack of Continuous Reassessment:** Training completion is not systematically linked to measurable competency improvement.

This platform introduces an end-to-end **AI-driven Skill Intelligence and Learning System** tailored specifically for MoSPI.

---

## Core Operational Workflow

```
┌──────────┐     ┌──────────┐     ┌─────────────────────┐     ┌───────────┐
│  ASSESS  │ ──► │  ANALYZE │ ──► │ IDENTIFY SKILL GAPS │ ──► │ RECOMMEND │
└──────────┘     └──────────┘     └─────────────────────┘     └───────────┘
                                                                    │
┌──────────┐     ┌──────────┐     ┌─────────────────────┐           ▼
│ IMPROVE  │ ◄── │ REASSESS │ ◄── │   TRACK PROGRESS    │ ◄── ┌───────────┐
└──────────┘     └──────────┘     └─────────────────────┘     │   LEARN   │
                                                              └───────────┘
```

1. **ASSESS:** Employees undergo adaptive AI competency evaluations generated question-by-question based on their official designation and selected skills.
2. **ANALYZE:** The system evaluates domain performance across statistical analysis, survey methodology, data quality management, Python/R programming, and official statistics.
3. **IDENTIFY SKILL GAPS:** Scores are compared against benchmark competency requirements established for each MoSPI designation.
4. **RECOMMEND:** Personalized learning paths map identified gaps to curated iGOT Karmayogi and NSSTA courses.
5. **LEARN:** Employees access verified learning modules with progress tracking.
6. **TRACK:** Real-time dashboards summarize active learning and competency levels.
7. **REASSESS:** Targeted reassessments evaluate skill growth following course completion.
8. **IMPROVE:** Comparative analytics quantify percentage improvements and skill gap closure over time.

---

## Key Platform Features

| Feature | Description | Implementation Status |
| :--- | :--- | :--- |
| **Authentication & Profile** | Supabase GoTrue authentication with MoSPI designation and skill mapping | `CURRENT / IMPLEMENTED` |
| **Adaptive AI Assessment** | Groq LLaMA 3.3 / compound-mini powered 1-by-1 question generation with fingerprint deduplication | `CURRENT / IMPLEMENTED` |
| **Skill Gap Analysis** | Deterministic gap scoring ($Gap = Required - Assessed$) with High/Medium/Low priority classification | `CURRENT / IMPLEMENTED` |
| **iGOT Course Recommendations** | Auto-mapping of skill gaps to curated iGOT Karmayogi & NSSTA course catalog | `CURRENT / IMPLEMENTED` |
| **Reassessment & Analytics** | Historical attempt tracking and side-by-side competency score comparison | `CURRENT / IMPLEMENTED` |
| **AI MCQ Generator** | Grounded PDF document processing via Gemini 3.6 Flash for test creation | `CURRENT / IMPLEMENTED` |
| **Research Engine** | 4-Signal Fusion recommendation engine (TransE KG, Sequence Mining, CF, Gap) on synthetic MoSPI cohort | `CURRENT / IMPLEMENTED` |
| **MoSPI Employee Dashboard** | Unified command center for competency metrics, latest scores, and active learning | `CURRENT / IMPLEMENTED` |
| **Admin Analytics Panel** | Departmental skill gap aggregation and capacity building planning | `PROPOSED / FUTURE` |
| **Live iGOT API Integration** | Direct OAuth 2.0 and API sync with iGOT Karmayogi government servers | `PROPOSED / FUTURE` |

---

## Source File References
- Backend Server: [server.js](file:///c:/Z%20Github%20Project/SIH-Smart-Education/backend/server.js#L1-L1375)
- Frontend App: [App.jsx](file:///c:/Z%20Github%20Project/SIH-Smart-Education/frontend/src/App.jsx#L1-L84)
- Reference Data: [referenceData.js](file:///c:/Z%20Github%20Project/SIH-Smart-Education/frontend/src/lib/referenceData.js#L1-L75)
