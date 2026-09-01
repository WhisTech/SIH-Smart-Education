# 10 — Recommendation Engine

## Feature Specifications

- **Feature Name:** Learning Resource Recommendation Engine
- **Purpose:** Automatically map identified skill gaps to verified educational courses from iGOT Karmayogi and NSSTA catalogs.
- **Current Status:** `CURRENT / IMPLEMENTED` (Rule-Based Production Mapping & 4-Signal Research Fusion Engine)

---

## Dual Recommendation Architectures

### 1. Production Rule-Based Mapping Engine (`server.js:955-986`)
- Operates during assessment submit.
- Queries `public.courses` for courses matching the `skill_id` of identified skill gaps.
- Sets priority numeric weights: High Priority = `1`, Medium Priority = `2`, Low Priority = `3`.
- Saves persistent records to `public.recommendations`.

### 2. Advanced 4-Signal Research Fusion Engine (`backend/research/fusionEngine.js`)
Fuses four distinct signals into a single normalized score ($S_{	ext{final}} \in [0, 1]$):

```math
S_{	ext{final}} = w_{	ext{gap}} S_{	ext{gap}} + w_{	ext{kg}} S_{	ext{kg}} + w_{	ext{seq}} S_{	ext{seq}} + w_{	ext{cf}} S_{	ext{cf}}
```

- **Signal 1 ($S_{	ext{gap}}$):** Direct skill gap magnitude relevance.
- **Signal 2 ($S_{	ext{kg}}$):** TransE Knowledge Graph embeddings linking Designation $ightarrow$ Skill $ightarrow$ Course.
- **Signal 3 ($S_{	ext{seq}}$):** Sequence mining with exponential time decay ($e^{-\lambda t}$).
- **Signal 4 ($S_{	ext{cf}}$):** User-based collaborative filtering using Jaccard and Cosine peer similarity.

---

## Recommendation API Endpoint Specifications
- **Production API:** `GET /api/recommendations/user` ([server.js:1055-1126](file:///c:/Z%20Github%20Project/SIH-Smart-Education/backend/server.js#L1055-L1126))
- **Research API:** `POST /api/research/recommendations` ([server.js:1276-1291](file:///c:/Z%20Github%20Project/SIH-Smart-Education/backend/server.js#L1276-L1291))

---

## Source File References
- Production Auto-Recommendation Function: [server.js](file:///c:/Z%20Github%20Project/SIH-Smart-Education/backend/server.js#L955-L986)
- Research Fusion Class: [fusionEngine.js](file:///c:/Z%20Github%20Project/SIH-Smart-Education/backend/research/fusionEngine.js#L11-L156)
