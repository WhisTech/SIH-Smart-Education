/**
 * Research Evaluation & Metrics Engine
 * Calculates Precision@5, Recall@5, NDCG@5, Hit Rate@5, Coverage, and performs Ablation Study.
 */

class MetricsEngine {
  constructor(fusionEngine) {
    this.fusionEngine = fusionEngine;
    this.dataset = fusionEngine.dataset;
  }

  /**
   * Calculates NDCG@K for a recommended list against relevant items
   */
  calculateNDCG(recommendedIds, relevantSet, k = 5) {
    let dcg = 0;
    let idcg = 0;

    const topK = recommendedIds.slice(0, k);
    topK.forEach((id, idx) => {
      if (relevantSet.has(id)) {
        dcg += 1 / Math.log2(idx + 2);
      }
    });

    const relevantCount = Math.min(k, relevantSet.size);
    for (let i = 0; i < relevantCount; i++) {
      idcg += 1 / Math.log2(i + 2);
    }

    return idcg === 0 ? 0 : dcg / idcg;
  }

  /**
   * Runs evaluation metrics across all 50 synthetic employees
   */
  evaluateAll(k = 5) {
    let totalPrecision = 0;
    let totalRecall = 0;
    let totalNDCG = 0;
    let totalHitRate = 0;
    const recommendedCoursesSet = new Set();

    const employees = this.dataset.employees;

    employees.forEach(emp => {
      // Find ground truth relevant courses (courses the employee completed or preferred)
      const userInteractions = this.dataset.courseInteractions.filter(
        i => i.employee_id === emp.id && (i.action === 'completed' || i.action === 'started' || i.action === 'preferred')
      );
      const relevantSet = new Set(userInteractions.map(i => i.course_id));

      if (relevantSet.size === 0) {
        // Fallback relevant courses: courses addressing active skill gaps
        const gaps = this.dataset.skillGaps.filter(g => g.employee_id === emp.id);
        const gapSkills = new Set(gaps.map(g => g.skill_id));
        this.dataset.courses.forEach(c => {
          if (gapSkills.has(c.skill_id)) relevantSet.add(c.id);
        });
      }

      const recResult = this.fusionEngine.getRecommendations(emp.id);
      const recIds = recResult.recommendations.map(r => r.courseId);

      recIds.slice(0, k).forEach(id => recommendedCoursesSet.add(id));

      // Calculate hits
      let hits = 0;
      recIds.slice(0, k).forEach(id => {
        if (relevantSet.has(id)) hits++;
      });

      const precision = hits / k;
      const recall = relevantSet.size > 0 ? hits / relevantSet.size : 0;
      const ndcg = this.calculateNDCG(recIds, relevantSet, k);
      const hitRate = hits > 0 ? 1 : 0;

      totalPrecision += precision;
      totalRecall += recall;
      totalNDCG += ndcg;
      totalHitRate += hitRate;
    });

    const N = employees.length || 1;
    const totalCoursesCount = this.dataset.courses.length || 1;

    return {
      evalCount: N,
      k,
      precision: Math.round((totalPrecision / N) * 100) / 100,
      recall: Math.round((totalRecall / N) * 100) / 100,
      ndcg: Math.round((totalNDCG / N) * 100) / 100,
      hitRate: Math.round((totalHitRate / N) * 100) / 100,
      coveragePct: Math.round((recommendedCoursesSet.size / totalCoursesCount) * 100)
    };
  }

  /**
   * Runs Ablation Study across 4 configurations
   */
  runAblationStudy() {
    const configs = [
      { name: 'Baseline (Skill Gap Only)', weights: { w_gap: 1.0, w_kg: 0.0, w_seq: 0.0, w_cf: 0.0 } },
      { name: 'Skill Gap + TransE KG', weights: { w_gap: 0.6, w_kg: 0.4, w_seq: 0.0, w_cf: 0.0 } },
      { name: 'Skill Gap + KG + Sequence Mining', weights: { w_gap: 0.45, w_kg: 0.35, w_seq: 0.20, w_cf: 0.0 } },
      { name: 'Full Fusion Engine (Gap+KG+Seq+CF)', weights: { w_gap: 0.40, w_kg: 0.25, w_seq: 0.20, w_cf: 0.15 } }
    ];

    const results = configs.map(cfg => {
      let precisionSum = 0;
      let ndcgSum = 0;
      const N = this.dataset.employees.length;

      this.dataset.employees.forEach(emp => {
        const userInteractions = this.dataset.courseInteractions.filter(
          i => i.employee_id === emp.id && (i.action === 'completed' || i.action === 'started')
        );
        const relevantSet = new Set(userInteractions.map(i => i.course_id));

        const recResult = this.fusionEngine.getRecommendations(emp.id, cfg.weights);
        const recIds = recResult.recommendations.map(r => r.courseId);

        let hits = 0;
        recIds.slice(0, 5).forEach(id => {
          if (relevantSet.has(id)) hits++;
        });

        precisionSum += (hits / 5);
        ndcgSum += this.calculateNDCG(recIds, relevantSet, 5);
      });

      return {
        stage: cfg.name,
        precisionAt5: Math.round((precisionSum / N) * 100) / 100,
        ndcgAt5: Math.round((ndcgSum / N) * 100) / 100
      };
    });

    return results;
  }
}

module.exports = MetricsEngine;
