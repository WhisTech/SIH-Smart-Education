# 05 — Employee Workflow

## Persona Context
- **User Role:** Ministry of Statistics and Programme Implementation (MoSPI) Employee
- **Designations Handled:** Senior Statistical Officer, Statistical Officer, Assistant Statistical Officer, Data Analyst, Programmer, Statistical Assistant.
- **Primary Goal:** Evaluate competency in assigned domain, identify skill gaps against designation standards, access curated learning resources, and demonstrate measurable skill improvement.

---

## Detailed Stage-by-Stage Workflow

### Stage 1: Registration & Onboarding Profile
- **User Action:** Employee registers using official credentials and completes profile details (Designation, Department, Years of Experience, and Mapped Skills).
- **System Action:** Validates designation against official reference catalog (`public.designations`) and stores selected skill associations in `public.employee_skills`.
- **Data Persistence:** Records created in `public.employee_profiles` and `public.employee_skills`.
- **Next Step:** Redirect to main Employee Dashboard (`/dashboard`).

### Stage 2: Adaptive AI Competency Assessment
- **User Action:** Clicks "Start Assessment" on Dashboard or Navigation.
- **System Action:** Backend retrieves user skills. Questions are fetched adaptively one by one. Groq AI generates single-item MCQs grounded in MoSPI statistical standards with SHA-256 fingerprint deduplication.
- **Data Persistence:** Questions saved to `public.assessment_questions`, answers saved to `public.assessment_answers`.
- **Next Step:** Complete 10–15 questions and submit test.

### Stage 3: Skill Gap Analysis & Result Review
- **User Action:** Views final assessment results on `/assessment/result/:assessmentId`.
- **System Action:** System compares assessed percentage against designation required proficiency level ($Required = Level 	imes 20\%$). Skill gaps are stored with High/Medium/Low priority tags.
- **Data Persistence:** Scores saved in `public.assessment_skill_scores`, gaps in `public.skill_gaps`, analysis in `public.assessment_analyses`.
- **Output:** Detailed score breakdown, strengths, areas to improve, and recommended iGOT courses.

### Stage 4: iGOT Karmayogi Learning
- **User Action:** Accesses `/igot-courses` or clicks recommended course link from result page.
- **System Action:** Displays catalog of verified iGOT Karmayogi and NSSTA courses mapped to identified gap skills.
- **Output:** Direct external navigation link to official learning portal (`https://igotkarmayogi.gov.in/`).

### Stage 5: Reassessment & Competency Growth
- **User Action:** Retakes assessment via `/reassessment`.
- **System Action:** Compares new assessment score against previous attempt scores using `GET /api/assessment/latest-comparison`.
- **Output:** Side-by-side comparison chart displaying percentage growth (+%) and skill gap reduction.

---

## Source File References
- Profile Setup Page: [Profile.jsx](file:///c:/Z%20Github%20Project/SIH-Smart-Education/frontend/src/pages/Profile.jsx#L1-L300)
- Assessment UI: [Assessment.jsx](file:///c:/Z%20Github%20Project/SIH-Smart-Education/frontend/src/pages/Assessment.jsx#L1-L350)
- Assessment Result Page: [AssessmentResult.jsx](file:///c:/Z%20Github%20Project/SIH-Smart-Education/frontend/src/pages/AssessmentResult.jsx#L1-L280)
- Reassessment Page: [Reassessment.jsx](file:///c:/Z%20Github%20Project/SIH-Smart-Education/frontend/src/pages/Reassessment.jsx#L1-L320)
