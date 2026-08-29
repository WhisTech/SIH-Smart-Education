# PS101 — MoSPI Reference Datasets

This folder contains the reference datasets prepared for SIH 2026
Problem Statement PS101 (MoSPI).

These datasets support:

- Feature 1 — AI Competency Assessment, Skill-Gap Analysis and Personalized Training Recommendations
- Feature 2 — AI Document-to-Quiz Engine

## Datasets

| File | Purpose | Feature |
|---|---|---|
| `competencies.csv` | Competency reference for the Official Statistical System | Feature 1 + Feature 2 |
| `roles.csv` | Official Statistical System roles | Feature 1 |
| `role_competencies.csv` | Maps roles to required competencies | Feature 1 |
| `igot_courses.csv` | iGOT Karmayogi learning resources | Feature 1 |
| `nssta_tpac_programmes.csv` | NSSTA/TPAC training programmes | Feature 1 |

## How the Data is Used

### Feature 1

Role → Required Competencies → Competency Assessment → Skill Gap → iGOT / NSSTA Recommendation

### Feature 2

Uploaded Learning Material → Text Extraction → AI Question Generation → Competency Tagging → Adaptive Quiz

The `competencies.csv` file provides the controlled competency vocabulary
used by Feature 2 for tagging generated questions.

## Data Sources

The datasets are curated from available official/public sources including:

- Ministry of Statistics and Programme Implementation (MoSPI)
- National Statistical Systems Training Academy (NSSTA)
- iGOT Karmayogi

Each dataset contains source/reference information wherever available.

## Important Limitations

These are seed/reference datasets prepared for the SIH 2026 prototype
and are not live data feeds.

iGOT does not currently provide a documented public bulk API.
The iGOT course dataset therefore uses a curated set of published
course information.

NSSTA training information is published through official training
calendar documents and may need to be refreshed when a new training
calendar is released.

Some relationships between roles, competencies, courses and training
programmes require explicit mapping before being used by the
recommendation engine.

## Detailed Documentation

For complete dataset schemas, sources, relationships, data-quality
notes and limitations, see:

`Dataset_Documentation_v2.pdf`