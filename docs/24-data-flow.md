# 24 — Complete Data Flow

## Comprehensive Data Lifecycle

```mermaid
flowchart TD
    User([MoSPI Employee]) -->|1. Credentials| Auth[Supabase GoTrue Auth]
    Auth -->|2. JWT Token & User ID| Profile[Profile Setup]
    Profile -->|3. Save Designation & Skills| DB_Profiles[(employee_profiles & employee_skills)]
    
    DB_Profiles -->|4. Trigger Assessment| AI_Groq[Groq AI Client - compound-mini]
    AI_Groq -->|5. Question JSON| AssessmentUI[Assessment Page]
    
    AssessmentUI -->|6. Answers| DB_Answers[(assessment_answers)]
    DB_Answers -->|7. Submit Trigger| Evaluator[Backend Scoring Engine]
    
    Evaluator -->|8. Calculated Scores| DB_Scores[(assessment_skill_scores)]
    Evaluator -->|9. Gap = Required - Assessed| DB_Gaps[(skill_gaps)]
    
    DB_Gaps -->|10. Match Courses| DB_Recs[(recommendations)]
    DB_Recs -->|11. Display Curated iGOT Links| iGOTUI[iGOT Dashboard]
    
    iGOTUI -->|12. Complete Learning| ReassessmentUI[Reassessment Page]
    ReassessmentUI -->|13. Historical Delta Comparison| GrowthReport[Competency Growth Chart]
```

---

## Detailed Data Transformations & Formats

### 1. Ingestion Phase (User Metadata $\rightarrow$ Database Profile)
- Input: `{ name: "Ananya Roy", designation_id: "<UUID>", skill_ids: ["<UUID1>", "<UUID2>"] }`
- Storage: Standardized records in `public.employee_profiles` and `public.employee_skills`.

### 2. Assessment Phase (Dynamic Generation $\rightarrow$ Answer Persistence)
- Input: Selected skill object + difficulty (`medium`).
- AI Output: `{ skill_id: "...", question_text: "...", options: [...], correct_answer: "...", explanation: "..." }`
- Answer Payload: `{ questionId: "<UUID>", selectedAnswer: "Option Text" }`
- Calculation: `isCorrect = (selectedAnswer.trim().toLowerCase() === correct_answer.trim().toLowerCase())`

### 3. Analytics Phase (Deterministic Gap Scoring $\rightarrow$ Recommendation Mapping)
- Gap Percentage: $\max(0, \text{Required Score} - \text{Assessed Score})$
- Recommendation Payload: `{ user_id: "...", course_id: "...", skill_id: "...", reason: "Recommended to close High Priority Gap", priority: 1 }`

---

## Source File References
- Backend Data Transformations: [server.js](file:///c:/Z%20Github%20Project/SIH-Smart-Education/backend/server.js#L780-L990)
