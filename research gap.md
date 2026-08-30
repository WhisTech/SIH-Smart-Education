

# Research-Gap Analysis

## 1. Selected IEEE Research Papers

**Paper 1:** *Personalized Learning Path Recommendations: Fusing Knowledge Graph Embedding, Sequence Mining, and Collaborative Filtering* — 2024 IEEE International Conference on Big Data. It proposes personalized learning-path recommendations using Knowledge Graph Embedding (KGE), Collaborative Filtering (CF), and Sequential Pattern Mining (SPM), evaluated using real-world XuetangX MOOC data. ([DOI][1])

**Paper 2:** *Learning to Reuse Distractors to Support Multiple-Choice Question Generation in Education* — *IEEE Transactions on Learning Technologies*, Vol. 17, pp. 375–390. The research addresses the difficulty of creating MCQs by using existing question/distractor data to support automated MCQ generation. ([IEEE Xplore][2])

---

## 2. Comparison of Existing Research and Proposed System

| Aspect                    | Existing Research / System                                                                                                | Limitation / Gap                                                                                                                              | Proposed Platform                                                                                              |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| **Personalized Learning** | Paper 1 recommends personalized learning paths based on learner behaviour and learning-resource relationships. ([DOI][1]) | Mainly focused on MOOC learning behaviour and resource sequences.                                                                             | Personalized training based on **competency gaps, role requirements and assessment results**.                  |
| **Recommendation**        | Uses KGE, collaborative filtering and sequential pattern mining to recommend learning resources. ([DOI][1])               | Recommendation is largely based on historical learning behaviour; it does not specifically target India's Official Statistical System.        | Recommend **specific training to close a measured competency gap**.                                            |
| **Competency Gap**        | Paper 1 focuses on personalized paths rather than a government competency framework.                                      | Does not establish a role-specific statistical competency gap and remediation cycle.                                                          | AI identifies **current competency vs. required competency** and calculates the gap.                           |
| **MCQ Generation**        | Paper 2 supports automated MCQ creation by reusing suitable distractors. ([Biblio][3])                                    | It focuses mainly on question/distractor generation rather than complete competency-based adaptive learning.                                  | Generate **questions + distractors + difficulty levels + competency mapping** from uploaded learning material. |
| **Learning Material**     | Paper 2 uses an existing pool of manually created questions/distractors. ([Biblio][3])                                    | Does not represent the complete workflow of uploading arbitrary Official Statistics training material and generating a competency-aware quiz. | **PDF/document → RAG/LLM → MCQs → validation → competency assessment**.                                        |
| **Assessment**            | MCQs support automated assessment.                                                                                        | Assessment is not necessarily connected to personalized remediation.                                                                          | Assessment results directly update the learner's competency profile and next learning recommendation.          |
| **Continuous Learning**   | Existing research addresses individual components.                                                                        | No unified diagnosis → learning → testing → remediation loop for this SIH context.                                                            | **Closed-loop adaptive learning system**.                                                                      |
| **Domain**                | Paper 1 uses MOOC data; Paper 2 covers educational MCQ generation.                                                        | Not designed specifically for government statistical personnel.                                                                               | Designed for **India's Official Statistical System and iGOT ecosystem**.                                       |

---

# 3. What Existing Systems Already Do

Importantly, **iGOT Karmayogi already provides competency-driven learning and AI-assisted capability-building features**. Its current AI-driven CBP tool advertises AI-based role/competency mapping, competency-gap tracking, smart course recommendations and training-effectiveness analytics. ([iGot Karmayogi][4])

Therefore, your project should **not claim**:

> "Existing systems cannot identify competency gaps or recommend courses."

Instead:

> **Existing systems already provide these capabilities, but our proposed platform adds a deeper continuous learning and assessment layer.**

---

# 4. Main Research Gap

The major gap is the **integration of multiple capabilities into one continuous learning loop**.

### Existing research

```text
Learner Behaviour
       ↓
Personalized Recommendation
```

Paper 1 focuses on this area. ([DOI][1])

And:

```text
Existing Questions
       ↓
MCQ / Distractor Generation
```

Paper 2 focuses on this area. ([Biblio][3])

### Our proposed system

```text
Learner / Employee
        ↓
Competency Assessment
        ↓
Competency Gap Detection
        ↓
Personalized Training
        ↓
Uploaded Learning Material
        ↓
AI / RAG-based MCQ Generation
        ↓
Adaptive Assessment
        ↓
Performance Analysis
        ↓
Updated Competency Profile
        ↓
New Personalized Training
```

This creates a **closed-loop competency development system**.

---

# 5. Problems in Existing Approaches

### Problem 1 — Recommendation is not necessarily competency-remediation

A system may recommend a course based on learner behaviour, but your system should answer:

> **Which competency is weak, why is it weak, and which exact training activity can improve it?**

### Problem 2 — Assessment and recommendation are disconnected

Existing MCQ-generation research demonstrates automated assessment support, but your system connects the result to the **next training recommendation**. ([Biblio][3])

### Problem 3 — Generic educational datasets

Paper 1 uses **XuetangX MOOC data**, rather than data representing government statistical competencies. ([DOI][1])

Your system can be designed around:

* Official Statistics
* Statistical methods
* Data collection
* Survey methodology
* Data analysis
* AI/ML for statistics
* Role-specific government competencies

### Problem 4 — Static competency profile

Your proposed system can continuously update:

**Current competency → Assessment → Improvement → Remaining gap**

rather than treating course completion as the main outcome.

---

# 6. What Our Platform Proposes

## AI Learning Intelligence Layer

Your platform can act as an intelligent layer around the existing learning ecosystem.

### Module 1 — Competency Gap Engine

Compares:

**Required competency level − Current competency level**

and identifies weak areas.

### Module 2 — Personalized Recommendation Engine

Uses:

* Competency gap
* Role
* Previous learning
* Assessment results
* Learning history

to recommend the next training activity.

### Module 3 — AI Quiz Generator

Uploaded:

**PDF / PPT / Training Material**

↓

AI/RAG

↓

**MCQs + Answers + Distractors + Difficulty**

### Module 4 — Adaptive Assessment

If the learner performs poorly:

> Recommend remedial content.

If the learner performs well:

> Move to advanced content.

### Module 5 — Continuous Competency Profile

After every assessment:

> **Update competency → recalculate gap → update learning path.**

---

# 7. Why Our Approach Is Innovative

The innovation is **not simply AI**, because AI is already used in learning systems.

The innovation is the **combination and application** of existing AI techniques to this specific problem.

### Our five innovation points

**1. Closed-loop learning**

> Diagnose → Learn → Test → Analyze → Relearn

**2. Competency-first personalization**

Instead of merely recommending popular courses, recommend training based on the **actual competency gap**.

**3. Document-to-Quiz**

Turn uploaded Official Statistics learning material into an assessment automatically.

**4. Dynamic competency profile**

Continuously update learner competency based on assessment performance.

**5. Domain-specific capacity building**

Adapt the system to the competency requirements of **India's Official Statistical System**, while complementing the iGOT ecosystem.

---

# 8. How It Supports the SIH Problem Statement

| SIH Requirement             | Our Solution                         |
| --------------------------- | ------------------------------------ |
| Identify competency gaps    | AI competency-gap engine             |
| Personalized training       | Recommendation engine                |
| iGOT ecosystem              | Integration/augmentation layer       |
| Generate quizzes            | AI quiz generator                    |
| Generate MCQs               | LLM/RAG-based MCQ generation         |
| Uploaded learning materials | Document processing                  |
| Capacity building           | Role-specific competency development |
| Continuous improvement      | Adaptive assessment                  |
| Measure learning outcomes   | Pre/post competency assessment       |

---

# 9. Final Research-Gap Statement for SIH

> **Existing IEEE research demonstrates effective techniques for personalized learning-path recommendation and automated MCQ generation. However, these capabilities are primarily addressed as separate components. Existing platforms such as iGOT Karmayogi already provide competency-driven learning, competency-gap tracking and course recommendations. The identified opportunity is therefore not to replace these capabilities, but to extend them through an integrated AI Learning Intelligence Layer that connects competency diagnosis, personalized remediation, document-grounded MCQ generation, adaptive assessment and continuous competency re-evaluation. By tailoring this closed-loop approach to India's Official Statistical System, the proposed platform can provide more targeted, measurable and adaptive capacity building while complementing the existing iGOT ecosystem.** ([DOI][1])

### IEEE References

1. H. Ngo, K. Vo and T. Nguyen, **“Personalized Learning Path Recommendations: Fusing Knowledge Graph Embedding, Sequence Mining, and Collaborative Filtering,”** *2024 IEEE International Conference on Big Data (BigData)*, DOI: 10.1109/BigData62323.2024.10825001. ([DOI][1])
   [IEEE Xplore — Paper 1](https://ieeexplore.ieee.org/document/10825001/?utm_source=chatgpt.com)

2. S. K. Bitew, A. Hadifar, L. Sterckx, J. Deleu, C. Develder and T. Demeester, **“Learning to Reuse Distractors to Support Multiple-Choice Question Generation in Education,”** *IEEE Transactions on Learning Technologies*, vol. 17, pp. 375–390, 2024, DOI: 10.1109/TLT.2022.3226523. ([IEEE Xplore][2])
   [IEEE Xplore — Paper 2](https://ieeexplore.ieee.org/document/9969921?utm_source=chatgpt.com)

[1]: https://doi.org/10.1109/bigdata62323.2024.10825001?utm_source=chatgpt.com "Personalized Learning Path Recommendations: Fusing Knowledge Graph Embedding, Sequence Mining, and Collaborative Filtering"
[2]: https://ieeexplore.ieee.org/document/9969921?utm_source=chatgpt.com "Learning to Reuse Distractors to Support Multiple-Choice Question Generation in Education"
[3]: https://biblio.ugent.be/publication/01GQ8AVSQN2JJ7WNRS5NBXZY74?utm_source=chatgpt.com "Learning to reuse distractors to support multiple choice question generation in education"
[4]: https://portal.igotkarmayogi.gov.in/training-pla-ai/?utm_source=chatgpt.com "iGot"
