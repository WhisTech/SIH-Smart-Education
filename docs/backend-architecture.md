# Backend Architecture & Layered Pattern Specification

> **Document Classification:** Backend Server Architecture Specification  
> **Runtime Environment:** Node.js (CommonJS, Express 5)  
> **System Status:** Active Express Backend Baseline & Proposed Layered Separation Plan  

---

## 1. Current Backend Architecture (`CURRENT / IMPLEMENTED`)

The current backend is a clean, unified Express application centered in `backend/server.js` with isolated specialized engine modules.

```text
backend/
├── server.js                 # Central Express HTTP server, routes, middleware & DB handlers
├── groqClient.js             # Groq SDK wrapper for adaptive MCQ & qualitative assessment analysis
├── geminiClient.js           # Google Gemini API wrapper & PDF parsing pipeline
├── seedResearchData.js       # Script populating synthetic data for research engine
├── data/
│   └── research_seed.json    # Synthetic seed dataset (50 employees, 30 courses, KG edges)
└── research/                 # Isolated Recommendation Science Engine
    ├── cfEngine.js           # Collaborative Filtering Recommendation Engine
    ├── fusionEngine.js       # 4-Signal Hybrid Recommendation Fusion Engine
    ├── kgEngine.js           # Knowledge Graph Traversal & Reasoning Engine
    ├── metricsEngine.js      # Recommendation Precision/Recall/NDCG Metrics Calculator
    └── sequenceEngine.js     # Sequential Learning Path Recommendation Engine
```

---

## 2. Request Processing Lifecycle

```text
HTTP Request (e.g., POST /api/assessment/start-new)
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│               `authenticateUser` Middleware              │
│ (Extracts Bearer token from header; verifies user session)│
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│                    Route Handler                        │
│ (Parses payload, validates input, checks user profile)  │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│                Database SQL Operations                  │
│  (Supabase Client queries PostgreSQL under Service Key) │
└──────────────────────┬──────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────┐
│                   JSON API Response                     │
│ (`{ success: true, assessmentId: '...', ... }`)         │
└─────────────────────────────────────────────────────────┘
```

---

## 3. Endpoints & Controller Responsibilities

### 3.1 Public & Reference Endpoints
* `GET /api/health`: System health check endpoint.
* `GET /api/supabase-test`: Verifies backend-to-Supabase database connectivity.
* `GET /api/designations`: Retrieves catalog of official MoSPI job designations.
* `GET /api/skills`: Retrieves master catalog of statistical skills.

### 3.2 Assessment API Endpoints
* `GET /api/assessment/info`: Fetches employee's designation & active skill metadata.
* `GET /api/assessment/reassessment-info`: Fast metadata query for reassessment setup (0 AI calls).
* `GET /api/assessment/latest-comparison`: Compares scores between last two completed assessments.
* `GET /api/assessment/user/latest`: Retrieves the employee's most recent assessment breakdown.
* `GET /api/assessment/user/history`: Retrieves history list of all completed assessments.
* `GET /api/assessment/result/:assessmentId`: Returns full assessment results & qualitative analysis.
* `POST /api/assessment/start-new`: Initializes a new assessment attempt (`initial` or `reassessment`).
* `POST /api/assessment/:assessmentId/next-question`: Generates/fetches next adaptive MCQ (`groqClient.js`).
* `POST /api/assessment/:assessmentId/answer`: Saves question response & evaluates correctness.
* `POST /api/assessment/:assessmentId/submit`: Finalizes attempt, computes overall scores, and triggers `computeAndStoreSkillGaps`.

### 3.3 Skill-Gap & Recommendation Endpoints
* `GET /api/skill-gap/latest`: Returns computed skill deficiencies for the user's latest assessment.
* `GET /api/recommendations/user`: Returns personalized iGOT course recommendations matched against skill gaps.

### 3.4 PDF MCQ Generator & Research Endpoints
* `POST /api/mcq/generate`: Accepts PDF upload (`multer`), extracts text, and generates grounded MCQs (`geminiClient.js`).
* `GET /api/research/*`: Interacts with 4-signal fusion recommendation algorithms and Knowledge Graph simulator.

---

## 4. Proposed Layered Architecture (`PROPOSED / FUTURE`)

To prepare for enterprise scaling, backend route handlers in `server.js` can be refactored into a **4-Layered Modular Architecture**:

```text
backend/src/
├── config/                   # Environment & Database config (`supabase.js`, `env.js`)
├── middlewares/              # Express middlewares (`authMiddleware.js`, `uploadMiddleware.js`)
├── routes/                   # Pure HTTP route routing files
│   ├── authRoutes.js
│   ├── assessmentRoutes.js
│   ├── skillGapRoutes.js
│   └── recommendationRoutes.js
├── controllers/              # Request parsing & HTTP response formatting
│   ├── assessmentController.js
│   └── recommendationController.js
├── services/                 # Core business logic & AI orchestration
│   ├── assessmentService.js
│   ├── skillGapService.js
│   ├── aiService.js
│   └── recommendationService.js
└── repositories/             # Database access abstractions (PostgreSQL queries)
    ├── userRepository.js
    ├── assessmentRepository.js
    └── courseRepository.js
```
