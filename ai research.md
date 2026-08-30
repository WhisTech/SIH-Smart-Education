

IEEE Research Paper Analysis

Paper 1 — Personalized Learning Path Recommendation

Title:Personalized Learning Path Recommendations: Fusing Knowledge Graph Embedding, Sequence Mining, and Collaborative Filtering*

Publication:2024 IEEE International Conference on Big Data (BigData)
DOI:10.1109/BigData62323.2024.10825001 ([DOI][1])

| Criteria                        | Analysis                                                                                                                                                                                                                                                                              |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Problem Addressed**           | Online learning platforms contain a large number of courses and resources. Learners have different backgrounds, goals and learning sequences, making it difficult to recommend the most suitable learning path for each learner.                                                      |
| **Method / Technology Used**    | Combines **Knowledge Graph Embedding (KGE), Collaborative Filtering (CF), and Sequential Pattern Mining (SPM)**. A MOOC-specific knowledge graph connects users, courses and learning resources. ([DOI][1])                                                                           |
| **Dataset / System Used**       | Evaluated using **real-world XuetangX MOOC data**, including learner interactions with courses and video resources. ([DOI][1])                                                                                                                                                        |
| **Key Findings**                | The combined approach effectively recommends personalized learning paths and resource sequences and outperformed comparison/state-of-the-art methods across several evaluation metrics. ([DOI][1])                                                                                    |
| **Limitations**                 | The study is mainly focused on **MOOC learning behaviour and resource recommendation**. It does not specifically address government competency frameworks, Official Statistics, document-based MCQ generation, or a continuous competency-remediation cycle.                          |
| **How Our Project Improves It** | Our system can use the recommendation concept but make it **competency-driven**: identify the learner's current competency, compare it with the required competency for their role, recommend targeted training, and use assessment results to continuously update the learning path. |

**IEEE Link:** [IEEE Xplore — Paper 1](https://ieeexplore.ieee.org/document/10825001/?utm_source=chatgpt.com)

---

### Paper 2 — AI-Based MCQ Generation

**Title:** *Learning to Reuse Distractors to Support Multiple-Choice Question Generation in Education*

**Publication:** *IEEE Transactions on Learning Technologies*, Vol. 17, pp. 375–390, 2024
**DOI:** 10.1109/TLT.2022.3226523 ([Biblio][2])

| Criteria                        | Analysis                                                                                                                                                                                                                                                                                     |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Problem Addressed**           | Creating new MCQs is time-consuming for teachers. A major challenge is generating **good distractors**, i.e., incorrect options that are plausible and relevant to the question. ([ERIC][3])                                                                                                 |
| **Method / Technology Used**    | Uses **data-driven models with context-aware representations** of questions and distractors. These are compared with static feature-based approaches. ([ERIC][3])                                                                                                                            |
| **Dataset / System Used**       | Uses a large multilingual pool of existing questions and distractors. The researchers created a benchmark containing **298 educational questions and a 77,000-item multilingual distractor vocabulary pool**. ([ERIC][3])                                                                    |
| **Key Findings**                | Context-aware models performed better than static feature-based approaches. In teacher evaluation, the best model had approximately **3 of 10 suggested distractors rated as high-quality** on average. ([ERIC][3])                                                                          |
| **Limitations**                 | The approach focuses primarily on **question/distractor generation** and depends on an existing pool of distractors. It does not provide competency-gap identification, personalized training recommendations, or a complete adaptive learning cycle.                                        |
| **How Our Project Improves It** | Our platform can extend this idea by taking **uploaded Official Statistics learning material**, using RAG/LLM techniques to generate MCQs, answers and distractors, mapping questions to competencies, evaluating the learner and using the results to recommend the next training activity. |

**IEEE Link:** [IEEE Xplore — Paper 2](https://ieeexplore.ieee.org/document/9969921?utm_source=chatgpt.com)

---

## Overall Research Gap

The two IEEE papers address **separate parts** of our problem:

**Paper 1:**

> Learner behaviour → Personalized learning path

**Paper 2:**

> Existing question data → MCQ/distractor generation

Our proposed platform combines these capabilities with **competency-gap identification and continuous assessment**:

> **Competency Assessment → Gap Identification → Personalized Training → Uploaded Material → AI MCQ Generation → Assessment → Performance Analysis → Updated Competency → New Training Recommendation**

### Proposed Improvement

The main innovation is therefore **not simply using AI for learning**. It is creating a **continuous, competency-driven learning loop specifically for India's Official Statistical System**.

This allows our platform to:

* Identify **what competency the learner is missing**
* Recommend **what training should be taken**
* Generate **MCQs from uploaded learning material**
* Assess the learner automatically
* Identify remaining weak areas
* Update the competency profile
* Recommend the **next appropriate learning activity**
* Complement the existing **iGOT Karmayogi ecosystem**

This provides a clear research basis for the SIH requirement of **competency-gap identification, personalized training, iGOT integration, and AI-generated quizzes/MCQs**.

[1]: https://doi.org/10.1109/bigdata62323.2024.10825001?utm_source=chatgpt.com "Personalized Learning Path Recommendations: Fusing Knowledge Graph Embedding, Sequence Mining, and Collaborative Filtering"
[2]: https://biblio.ugent.be/publication/01GQ8AVSQN2JJ7WNRS5NBXZY74?utm_source=chatgpt.com "Learning to reuse distractors to support multiple choice question generation in education"
[3]: https://eric.ed.gov/?id=EJ1405532&utm_source=chatgpt.com "ERIC - EJ1405532 - Learning to Reuse Distractors to Support Multiple-Choice Question Generation in Education, IEEE Transactions on Learning Technologies, 2024"
