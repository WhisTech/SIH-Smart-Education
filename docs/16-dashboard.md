# 16 — Dashboard

## Feature Specifications

- **Feature Name:** MoSPI Employee Central Command Dashboard
- **Purpose:** Provide employees with an immediate executive summary of their profile details, active designation, latest assessment results, current skills, and active learning workflow status.
- **Current Status:** `CURRENT / IMPLEMENTED`

---

## Dashboard Layout Blocks & Data Sources

```
┌────────────────────────────────────────────────────────────────────────┐
│ Top Banner: Official Avatar, Name, Email & Department                  │
├────────────────────────────────────────────────────────────────────────┤
│ Employee Overview Grid: Employee ID | Designation | Department | Exp.  │
├────────────────────────────────────────────────────────────────────────┤
│ AI Competency Assessment Card:                                         │
│   - Latest Score (%) & Accuracy (Correct / Total)                      │
│   - Action Buttons: "Start Reassessment", "View Assessment Result"     │
│   - Skill Performance Progress Bars                                    │
├────────────────────────────────────────────────────────────────────────┤
│ Current Mapped Skills: Category Badges & Skill Chips                   │
├────────────────────────────────────────────────────────────────────────┤
│ Active Workflow Stage Indicator (Pills 1 to 4)                         │
└────────────────────────────────────────────────────────────────────────┘
```

| Dashboard Block | Component / Element | Data Source Endpoint | Database Table |
| :--- | :--- | :--- | :--- |
| **Top Banner** | `.dashboard-header` | `AuthContext` (State) | `employee_profiles` |
| **Overview Grid** | `.stat-grid` | `AuthContext` & `fetchDesignations()` | `designations` |
| **Assessment Summary** | `.assessment-dashboard-card` | `GET /api/assessment/user/latest` | `assessments`, `assessment_skill_scores` |
| **Mapped Skills** | `.dashboard-skills-chips` | Direct Supabase Client | `employee_skills`, `skills` |
| **Workflow Status** | `.workflow-steps-indicator` | Client State Calculation | Local UI Logic |

---

## Source File References
- Dashboard UI Component: [Dashboard.jsx](file:///c:/Z%20Github%20Project/SIH-Smart-Education/frontend/src/pages/Dashboard.jsx#L1-L305)
- Latest Assessment API: [server.js](file:///c:/Z%20Github%20Project/SIH-Smart-Education/backend/server.js#L378-L431)
