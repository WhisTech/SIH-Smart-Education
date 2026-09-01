# 12 — Learning Progress

## Feature Specifications

- **Feature Name:** Employee Learning Progress Tracker
- **Purpose:** Track employee status across recommended learning modules and record course completion states.
- **Current Status:** `PARTIALLY IMPLEMENTED`

---

## Learning Lifecycle States

```
┌──────────────┐      ┌─────────────┐      ┌───────────┐
│ NOT STARTED  │ ──►  │ IN PROGRESS │ ──►  │ COMPLETED │
└──────────────┘      └─────────────┘      └───────────┘
```

1. **NOT STARTED:** Recommended course assigned to employee profile following skill gap analysis.
2. **IN PROGRESS:** Employee clicks launch link to access course materials on iGOT Karmayogi.
3. **COMPLETED:** Employee completes learning module and unlocks reassessment option.

---

## UI Representation & Metrics
- Status chips render with designated color schemes:
  - **Completed:** Green badge (`✓ Completed`)
  - **In Progress:** Blue badge (`⏳ In Progress`)
  - **Not Started:** Slate badge (`Not Started`)
- Rendered within `IgotDashboard.jsx` and `Reassessment.jsx`.

---

## Source File References
- iGOT Dashboard UI: [IgotDashboard.jsx](file:///c:/Z%20Github%20Project/SIH-Smart-Education/frontend/src/pages/IgotDashboard.jsx#L1-L250)
- Reassessment UI: [Reassessment.jsx](file:///c:/Z%20Github%20Project/SIH-Smart-Education/frontend/src/pages/Reassessment.jsx#L1-L320)
