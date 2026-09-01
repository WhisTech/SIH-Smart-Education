# 04 — Complete User Workflow

## End-to-End Platform Journey Flowchart

```mermaid
sequenceDiagram
    autonumber
    actor User as MoSPI Official
    participant FE as React Frontend
    participant Auth as Supabase Auth
    participant BE as Express Backend
    participant AI as Groq / Gemini AI
    participant DB as Supabase Postgres

    User->>FE: 1. Sign Up / Sign In
    FE->>Auth: 2. Authenticate Email/Password
    Auth-->>FE: 3. Return Session & JWT Bearer Token
    
    User->>FE: 4. Complete Profile (Designation & Skills)
    FE->>DB: 5. Upsert employee_profiles & employee_skills
    
    User->>FE: 6. Click 'Start AI Competency Assessment'
    FE->>BE: 7. POST /api/assessment/start-new
    BE->>DB: 8. Create assessment record (status: 'in_progress')
    
    loop Dynamic Adaptive Question Cycle (1 to N questions)
        FE->>BE: 9. POST /api/assessment/:id/next-question
        BE->>AI: 10. Request question for skill & difficulty (Groq)
        AI-->>BE: 11. Return JSON question & options
        BE->>DB: 12. Save to assessment_questions table
        BE-->>FE: 13. Deliver question to UI
        User->>FE: 14. Select Option & Submit Answer
        FE->>BE: 15. POST /api/assessment/:id/answer
        BE->>DB: 16. Store answer in assessment_answers table
    end
    
    FE->>BE: 17. POST /api/assessment/:id/submit
    BE->>DB: 18. Calculate score, skill scores, skill gaps & recommendations
    BE-->>FE: 19. Return completion status & overall score
    
    FE->>User: 20. Display Assessment Result & iGOT Recommendations
    User->>FE: 21. Navigate to iGOT Courses & Complete Modules
    User->>FE: 22. Click 'Start Reassessment'
    FE->>BE: 23. GET /api/assessment/latest-comparison
    BE-->>FE: 24. Return previous vs current scores
    FE->>User: 25. Display Skill Improvement Delta (+%)
```

---

## Detailed Step-by-Step Breakdown

| Step # | Stage | User Action | Frontend Page | Backend API Endpoint | Database Table | AI Involvement | Output |
| :---: | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | Auth | Enter Email & Password | `Login.jsx` / `Signup.jsx` | `supabase.auth.signInWithPassword` | `auth.users` | None | Active JWT Session |
| **2** | Profile | Select Designation & Skills | `Profile.jsx` | Direct Supabase Client | `employee_profiles`, `employee_skills` | None | Saved Profile Record |
| **3** | Assessment Info | Click AI Assessment | `Dashboard.jsx` | `GET /api/assessment/info` | `skills`, `designation_skills` | None | Assessment Metadata |
| **4** | Assessment Start | Click Start Test | `Assessment.jsx` | `POST /api/assessment/start-new` | `assessments` | None | `assessmentId` |
| **5** | Question Gen | View Question | `Assessment.jsx` | `POST /api/assessment/:id/next-question` | `assessment_questions` | Groq `compound-mini` | Grounded MCQ |
| **6** | Answer Submit | Select Choice | `Assessment.jsx` | `POST /api/assessment/:id/answer` | `assessment_answers` | None | Is Correct Flag |
| **7** | Final Submit | Complete Test | `Assessment.jsx` | `POST /api/assessment/:id/submit` | `assessment_skill_scores`, `skill_gaps`, `recommendations` | Fast Rule Analysis | Calculated Scores & Gaps |
| **8** | Result View | Review Performance | `AssessmentResult.jsx` | `GET /api/assessment/result/:id` | `assessment_analyses` | None | Score Breakdown & Courses |
| **9** | Learning | Click iGOT Module | `IgotDashboard.jsx` | `GET /api/recommendations/user` | `courses`, `recommendations` | None | Course Catalog & Link |
| **10** | Reassessment | Initiate Retest | `Reassessment.jsx` | `GET /api/assessment/reassessment-info` | `assessments`, `skill_gaps` | Groq `compound-mini` | Score Comparison & Delta |
