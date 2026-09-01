# Architecture B: Service-Oriented Architecture (SOA)

> **Document Classification:** Technical Architecture Specification  
> **Target Audience:** Enterprise Architects, DevOps Teams, Production Scaling Lead  
> **System Status:** Recommended Evolution Path for High-Scale Enterprise Production (`PROPOSED / FUTURE`)

---

## 1. Overview & Operational Philosophy

**Architecture B (Service-Oriented Architecture)** splits the current monolithic application into independently deployable, specialized microservices managed behind a central **API Gateway**. Each service owns a clear domain context, operates its own database schema or storage boundary, and communicates with other services asynchronously via events or synchronously via gRPC/REST APIs.

### Why Architecture B for Enterprise Production?
* **Independent Scalability:** Assessment generation (compute-heavy AI calls) can scale independently without bottlenecking simple profile lookups.
* **Fault Isolation:** A crash in the PDF processing service or external LLM API will not bring down user authentication or progress dashboard reporting.
* **Modular Team Ownership:** Different engineering teams can manage the Assessment Engine, Recommendation Engine, and iGOT Connector independently.
* **Production Resilience:** Optimized for multi-region government cloud deployments (e.g., NIC Cloud / MeghRaj).

---

## 2. High-Level System Block Diagram

```text
                               ┌──────────────────────────┐
                               │  React Single Page App   │
                               └────────────┬─────────────┘
                                            │ HTTPS / REST / gRPC
                                            ▼
                               ┌──────────────────────────┐
                               │       API Gateway        │
                               │  (Auth Check & Routing)  │
                               └────────────┬─────────────┘
                                            │
         ┌──────────────────┬───────────────┼───────────────┬──────────────────┐
         │                  │               │               │                  │
         ▼                  ▼               ▼               ▼                  ▼
┌──────────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────────┐
│ Assessment Svc   │ │ Skill Svc   │ │ Learning Svc│ │ Research Svc│ │  AI Gateway Svc │
│ (Quiz Engine)    │ │ (Gap Engine)│ │ (iGOT Sync) │ │ (Fusion Engine)││  (Groq/Gemini)  │
└────────┬─────────┘ └──────┬──────┘ └──────┬──────┘ └──────┬──────┘ └────────┬────────┘
         │                  │               │               │                 │
         └──────────────────┴───────┬───────┴───────────────┴─────────────────┘
                                    ▼
                        ┌────────────────────────┐
                        │ Enterprise PostgreSQL  │
                        │   (Isolated Schemas)   │
                        └────────────────────────┘
```

---

## 3. Service Breakdown & Domain Boundaries

### 3.1 Service Responsibilities & API Boundaries

#### 1. Auth & Gateway Service (`PROPOSED / FUTURE`)
* **Responsibilities:** Request routing, SSL termination, JWT validation via Supabase Auth, rate limiting, and request logging.
* **API Boundary:** Accepts `/api/v1/*` public traffic and routes internally to private cluster IP addresses.

#### 2. Competency Assessment Service (`PROPOSED / FUTURE` - Evolved from `server.js` assessment endpoints)
* **Responsibilities:** Manages quiz sessions (`assessments`), adaptive question generation queues, scoring logic, and quiz history.
* **Data Ownership:** Owns `assessments`, `assessment_questions`, `assessment_answers`, `assessment_skill_scores`.
* **Inter-Service Communication:** Emits `AssessmentCompleted` events to the Event Bus when a user submits a quiz.

#### 3. Skill Intelligence & Gap Analysis Service (`PROPOSED / FUTURE` - Evolved from `computeAndStoreSkillGaps`)
* **Responsibilities:** Stores official designation competency frameworks (`designation_skills`), computes required vs. actual proficiency deltas, and assigns gap severity (`High`, `Medium`, `Low`).
* **Data Ownership:** Owns `designations`, `skills`, `employee_skills`, `designation_skills`, `skill_gaps`.
* **Trigger Mechanism:** Consumes `AssessmentCompleted` events to immediately update `skill_gaps`.

#### 4. Learning & Recommendation Service (`PROPOSED / FUTURE` - Evolved from `IgotDashboard.jsx` & `/api/recommendations`)
* **Responsibilities:** Maintains catalog of verified courses (`courses`), generates personalized recommendations (`recommendations`), and manages course completion state.
* **Data Ownership:** Owns `courses`, `recommendations`, `learning_progress`.
* **External Integration:** Mock iGOT Resource Adapter (`CURRENT / IMPLEMENTED`) expandable to direct REST webhooks with official iGOT Karmayogi API (`PROPOSED / FUTURE`).

#### 5. AI Middleware & Gateway Service (`PROPOSED / FUTURE` - Evolved from `groqClient.js` & `geminiClient.js`)
* **Responsibilities:** Centralized wrapper around Groq (LLaMA/Compound models) and Google Gemini 3.6 Flash. Handles rate limit queues, prompt caching, JSON schema enforcement, and fallback templates.
* **Security:** Prevents individual microservices from holding raw AI API keys.

#### 6. Research & Analytics Service (`PROPOSED / FUTURE` - Evolved from `backend/research/`)
* **Responsibilities:** Runs computationally intensive 4-Signal Fusion recommendation algorithm (KG + CF + Sequence + Metrics) and knowledge graph visualizer for administrators.

---

## 4. Pipeline Workflows in Architecture B

### 4.1 Assessment Pipeline
1. User clicks **Start Assessment**. API Gateway routes request to **Assessment Service**.
2. Assessment Service requests an adaptive question from **AI Middleware Service**.
3. User answers questions incrementally. Upon final answer, Assessment Service computes exact mathematical score percentage and publishes `AssessmentCompleted` payload to Kafka/RabbitMQ.

### 4.2 Skill-Gap Pipeline
1. **Skill Service** receives `AssessmentCompleted` event.
2. Fetches target designation requirements from `designation_skills`.
3. Calculates `gap_percentage = required_score - assessed_score`.
4. Saves rows to `skill_gaps` table and triggers `SkillGapsUpdated` event.

### 4.3 Learning & Recommendation Pipeline
1. **Learning Service** listens for `SkillGapsUpdated`.
2. Queries the internal `courses` catalog matching the weak `skill_id`.
3. Ranks courses by priority (`High` gap = Priority 1) and populates the user's `recommendations` list.

---

## 5. Migration Strategy: Monolith (A) to SOA (B)

```text
    Stage 1 (Current Baseline)             Stage 2 (Bvolved Service Separation)
┌─────────────────────────────────┐       ┌─────────────────────────────────┐
│       Express Monolith          │  ───► │  Assessment Service (Port 5001) │
│   (All routes in server.js)     │       │  Skill Service      (Port 5002) │
│                                 │       │  AI Gateway         (Port 5003) │
└─────────────────────────────────┘       └─────────────────────────────────┘
```

1. **Extract AI Middleware:** Move Groq and Gemini clients into an isolated internal service to prevent main process event loop blocking.
2. **Extract Assessment Engine:** Move `/api/assessment/*` into an independent Node.js container.
3. **Database Schema Modularization:** Maintain PostgreSQL database but divide tables into separate PostgreSQL logical schemas (`auth_schema`, `assessment_schema`, `learning_schema`).
