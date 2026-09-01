# 09 — Skill Gap Analysis

## Feature Specifications

- **Feature Name:** Deterministic Skill Gap Analysis Engine
- **Purpose:** Compare assessed competency scores against official designation standards to identify, quantify, and prioritize skill deficiencies.
- **Current Status:** `CURRENT / IMPLEMENTED`

---

## Mathematical Formula & Rules

### 1. Benchmark Required Score Calculation
Required proficiency is defined per designation in `public.designation_skills` on a 1–5 scale:
$$	ext{Required Score (\%)} = 	ext{required\_level} 	imes 20$$
*(Default benchmark if unmapped: 80.00%)*

### 2. Gap Percentage Formula
$$	ext{Gap Percentage (\%)} = \max\left(0, 	ext{Required Score} - 	ext{Assessed Score}ight)$$

### 3. Priority Classification Matrix

| Assessed Score | Gap Percentage | Priority Classification | Action Triggered |
| :---: | :---: | :---: | :--- |
| $< 60.00\%$ | $\ge 25.00\%$ | **High** | Mandatory iGOT module recommendation |
| $60.00\% - 74.99\%$ | $10.00\% - 24.99\%$ | **Medium** | Recommended skill enhancement course |
| $\ge 75.00\%$ | $< 10.00\%$ | **Low** | Optional refresher content |

---

## Database Storage & Trigger Execution

Skill gap calculation executes automatically during assessment submission in `computeAndStoreSkillGaps` ([server.js:889-990](file:///c:/Z%20Github%20Project/SIH-Smart-Education/backend/server.js#L889-L990)):

```js
const assessedPct = Number(ss.score_percentage);
const requiredPct = reqSkillsMap.get(ss.skill_id) || 80.00;
const gapPct = Math.max(0, Number((requiredPct - assessedPct).toFixed(2)));

let priority = 'Low';
if (gapPct >= 25 || assessedPct < 60) {
  priority = 'High';
} else if (gapPct >= 10 || assessedPct < 75) {
  priority = 'Medium';
}
```

Records are stored in `public.skill_gaps` table with columns: `user_id`, `assessment_id`, `skill_id`, `assessed_score`, `required_score`, `gap_percentage`, `priority`.

---

## Source File References
- Skill Gap Schema & Seed: [006_skill_gap_schema.sql](file:///c:/Z%20Github%20Project/SIH-Smart-Education/database/006_skill_gap_schema.sql#L1-L30)
- Backend Calculation Function: [server.js](file:///c:/Z%20Github%20Project/SIH-Smart-Education/backend/server.js#L889-L990)
- Skill Gap API Endpoint: [server.js](file:///c:/Z%20Github%20Project/SIH-Smart-Education/backend/server.js#L997-L1052)
