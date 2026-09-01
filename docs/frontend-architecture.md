# Frontend Architecture Specification

> **Document Classification:** Frontend UI & State Architecture Specification  
> **Framework:** React 19 + Vite 8 + React Router 7  
> **Styling:** Custom Modular CSS (`App.css`, `index.css`)  
> **System Status:** Active Component Baseline & Modular Reorganization Blueprint  

---

## 1. Existing Frontend Directory Structure (`CURRENT / IMPLEMENTED`)

```text
frontend/src/
├── App.css                   # Global theme tokens, flexbox/grid layout rules & component styles
├── App.jsx                   # Central React Router 7 setup & AuthProvider wrapper
├── index.css                 # CSS reset, typography, and root variables
├── main.jsx                  # React 19 application entrypoint (`ReactDOM.createRoot`)
├── assets/                   # Static media (hero background, icons, logos)
├── components/               # Shared reusable UI elements
│   ├── GuestRoute.jsx        # Navigation guard restricting auth pages for logged-in users
│   ├── Layout.jsx            # Application shell (Header, Navigation, Main, Footer)
│   ├── LoadingScreen.jsx     # Official full-screen loading spinner
│   ├── ProtectedRoute.jsx    # Navigation guard enforcing active session authentication
│   └── SkillSelector.jsx     # Interactive multi-category competency chip selector
├── context/
│   └── AuthContext.jsx       # Global Auth & Profile context provider (Supabase session listener)
├── lib/
│   ├── referenceData.js      # Reference fetch helpers (`fetchDesignations`, `fetchSkills`)
│   └── supabase.js           # Supabase JS Client initialization (`createClient`)
└── pages/                    # Main application view screens
    ├── Assessment.jsx        # Interactive adaptive quiz runner
    ├── AssessmentResult.jsx  # Post-assessment score & analysis report
    ├── Dashboard.jsx         # Employee summary dashboard
    ├── IgotDashboard.jsx     # Recommended iGOT Karmayogi course catalog
    ├── Login.jsx             # Official login authentication screen
    ├── McqGenerator.jsx      # PDF document MCQ generator tool
    ├── Profile.jsx           # Employee profile manager & skill mapping
    ├── Reassessment.jsx      # Before-and-after competency growth comparison
    ├── ResearchEngine.jsx    # Experimental 4-Signal Fusion & Knowledge Graph simulator
    └── Signup.jsx            # Employee onboarding & account registration
```

---

## 2. Component & State Breakdown

### 2.1 State Management Pattern
* **Global Auth State (`AuthContext.jsx`):** Subscribes to `supabase.auth.onAuthStateChange()`. Provides `user`, `profile`, `loading`, `signOut()`, and `reloadProfile()` to all child routes.
* **Local UI State:** React `useState` hooks manage transient form inputs, modal visibility, selection indexes, active tabs, and loading spinners locally within page components.
* **Reference Data Caching:** `referenceData.js` queries Supabase PostgreSQL directly for master catalogs (`designations`, `skills`), falling back to REST API endpoints (`http://localhost:5000/api`) if direct DB connections time out.

---

### 2.2 Reusable UI Components

| Component | Props | Purpose | Status |
| :--- | :--- | :--- | :--- |
| `Layout` | `children` (via `<Outlet />`) | Standardized MoSPI enterprise page frame with brand header & navigation links. | `CURRENT / IMPLEMENTED` |
| `ProtectedRoute` | `children` | Enforces authentication; redirects unauthenticated visitors to `/login`. | `CURRENT / IMPLEMENTED` |
| `GuestRoute` | `children` | Prevents authenticated users from viewing `/login` or `/signup`. | `CURRENT / IMPLEMENTED` |
| `SkillSelector` | `availableSkills`, `selectedSkillIds`, `onToggleSkill` | Categorized chip selector for selecting competencies during profile setup. | `CURRENT / IMPLEMENTED` |
| `LoadingScreen` | `message` | Standardized loading screen with official emblem spinner. | `CURRENT / IMPLEMENTED` |

---

## 3. Proposed Future Feature-Based Structure (`PROPOSED / FUTURE`)

For national-scale production, the frontend codebase can be reorganized into a **Feature-Driven Architecture** without changing runtime behavior:

```text
src/
├── assets/
├── components/               # Global generic components (Button, Modal, Card)
├── layouts/                  # AppShell, AdminShell
├── features/                 # Modular feature domains
│   ├── auth/                 # Login, Signup, AuthContext, ProtectedRoute
│   ├── assessment/           # Quiz engine, AssessmentResult, Reassessment
│   ├── profile/              # Profile manager, SkillSelector
│   ├── recommendations/      # IgotDashboard, CourseCard, PriorityFilter
│   └── research/             # KnowledgeGraph, FusionMetrics
├── services/                 # API client services (`apiClient.js`, `supabase.js`)
├── hooks/                    # Custom hooks (`useAssessment`, `useSkillGaps`)
├── utils/                    # Helper formatting functions (`dateFormatter`, `mathUtils`)
└── types/                    # TypeScript interfaces (`EmployeeProfile.ts`, `MCQ.ts`)
```
