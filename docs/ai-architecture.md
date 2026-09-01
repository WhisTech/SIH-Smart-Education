# Artificial Intelligence Architecture & Boundaries

> **Document Classification:** AI System Architecture & Governance Specification  
> **AI Models:** Groq SDK (LLaMA / Compound models), Google Gemini API (`gemini-3.6-flash`)  
> **System Status:** Active Grounded AI Service  

---

## 1. AI Pipeline Architecture

```text
┌────────────────────────────────────────────────────────────────────────┐
│                        React Application Frontend                      │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ HTTP API Trigger
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        Backend Express Server                          │
│                      (`backend/server.js`)                             │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Service Invocation
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        Backend AI Services Layer                       │
│        (`groqClient.js` - Groq SDK  |  `geminiClient.js` - Gemini API)  │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Prompt + Constraints Payload
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                           External AI Models                           │
│           (Groq LLaMA / Compound  |  Google Gemini 3.6 Flash)          │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Raw Text / JSON Response
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        JSON Extraction & Cleaning                      │
│        (Regex strip `<think>` tags, extract `{...}` JSON substring)   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Unvalidated Data Object
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                      Strict Validation & Guard Layer                   │
│   (Schema Validation, Deduplication Check, SHA-256 Fingerprinting)      │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Cleaned & Verified Data Payload
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                        Application Business Logic                      │
│     (Score Calculation, Gap Priority Assignment, Persistence)         │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Direct Database Operation
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                      Supabase PostgreSQL Database                      │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. AI Capabilities & Responsibilities

### 2.1 AI Supported Features

#### 1. Adaptive Assessment Question Generation (`groqClient.js`)
* **Model:** Groq SDK (`groq/compound-mini` / LLaMA)
* **Function:** Generates single adaptive statistical MCQs based on the employee's target skill and current difficulty level (`easy`, `medium`, `hard`).
* **Deduplication:** Computes SHA-256 fingerprints (`generateFingerprint`) of question text and checks against user history to guarantee zero question repetitions.

#### 2. PDF-Grounded MCQ Generation (`geminiClient.js`)
* **Model:** Google Gemini API (`gemini-3.6-flash`)
* **Function:** Extracts page-by-page text from uploaded MoSPI training PDFs (`pdf-parse`) and generates grounded MCQs with explicit page citations (`sourcePage`) and detailed explanations.
* **Fallback Strategy:** Graceful model fallback array (`['gemini-3.6-flash', 'gemini-2.5-flash', 'gemini-3.5-flash']`) with single-retry logic.

#### 3. Qualitative Assessment Analysis (`groqClient.js`)
* **Function:** Analyzes calculated skill score breakdowns and writes structured qualitative feedback (`summary`, `strengths`, `areasToImprove`, `prioritySkills`).

#### 4. Research Fusion Recommendation Engine (`backend/research/`)
* **Function:** Computes 4-signal hybrid recommendations using Knowledge Graph (KG) edges, Collaborative Filtering (CF), sequential learning progression, and multi-metric evaluations.

---

## 3. Strict AI Boundaries & Non-Responsibilities

```text
  ┌───────────────────────────────────────────────────────────────────┐
  │                 WHAT AI MUST NEVER CONTROL (STRICT RULES)         │
  └───────────────────────────────────────────────────────────────────┘
```

1. **Authentication & Authorization:** AI models have zero access to user passwords, session tokens, or JWT verification. Auth is strictly enforced by Supabase GoTrue Auth.
2. **Database Permissions:** AI cannot bypass Supabase Row Level Security (RLS) policies. All database writes are performed using explicit SQL parameters under service controls.
3. **Score Calculation:** Final quiz scores are calculated using **pure mathematical formulas** (`(correct / total) * 100`) inside Node.js. AI is never trusted to calculate scores.
4. **Competency Benchmarks:** Official required proficiency levels for designations are retrieved directly from database reference tables (`designation_skills`). AI is never allowed to hallucinate official government standards.
5. **Skill-Gap Priority Rules:** Gap priority (`High`, `Medium`, `Low`) is determined by strict numeric code logic (`gap_percentage >= 25%`), not AI prompts.

---

## 4. Fallback Architecture & Reliability

If external AI APIs experience outages or rate limit errors, the system **never fails or crashes**. Built-in domain fallback banks (`generateFallbackQuestions`) instantly return validated statistical questions to ensure 100% platform availability.

```text
                 ┌────────────────────────────────┐
                 │       AI Request Trigger       │
                 └───────────────┬────────────────┘
                                 │
                                 ▼
                 ┌────────────────────────────────┐
                 │  External AI Call (Groq/Gemini) │
                 └───────────────┬────────────────┘
                                 │
                   ┌─────────────┴─────────────┐
                   │ Success?                  │
              YES  │                           │ NO (Error / Timeout)
                   ▼                           ▼
       ┌───────────────────────┐   ┌───────────────────────┐
       │ Parse JSON & Validate │   │  Trigger Domain-Based │
       │   Grounded Payload    │   │ Static Fallback Bank  │
       └───────────────────────┘   └───────────────────────┘
```
