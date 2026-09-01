/**
 * Recommendation Fusion Engine
 * Fuses 4 signals (Skill Gap, Knowledge Graph TransE, Sequence Mining with Time Decay, Collaborative Filtering)
 * into a single normalized score with configurable weights and transparent explainability.
 */

const KGEngine = require('./kgEngine');
const SequenceEngine = require('./sequenceEngine');
const CFEngine = require('./cfEngine');

class FusionEngine {
  constructor(dataset) {
    this.dataset = dataset;
    this.kgEngine = new KGEngine(dataset.kgEdges, dataset.skills, dataset.courses, dataset.employees);
    this.sequenceEngine = new SequenceEngine(dataset.courseInteractions);
    this.cfEngine = new CFEngine(dataset.courseInteractions, dataset.employees, dataset.courses);
  }

  /**
   * Computes fused recommendations for a synthetic employee
   */
  getRecommendations(employeeId, customWeights = {}) {
    const emp = this.dataset.employees.find(e => e.id === employeeId || e.employee_id === employeeId);
    if (!emp) throw new Error(`Synthetic employee with ID ${employeeId} not found.`);

    // Signal weights (Default: Skill Gap=0.40, KG=0.25, Sequence=0.20, CF=0.15)
    const rawWeights = {
      w_gap: typeof customWeights.w_gap === 'number' ? customWeights.w_gap : 0.40,
      w_kg: typeof customWeights.w_kg === 'number' ? customWeights.w_kg : 0.25,
      w_seq: typeof customWeights.w_seq === 'number' ? customWeights.w_seq : 0.20,
      w_cf: typeof customWeights.w_cf === 'number' ? customWeights.w_cf : 0.15
    };

    // Normalize weights to sum to 1.0
    const wSum = (rawWeights.w_gap + rawWeights.w_kg + rawWeights.w_seq + rawWeights.w_cf) || 1.0;
    const weights = {
      w_gap: rawWeights.w_gap / wSum,
      w_kg: rawWeights.w_kg / wSum,
      w_seq: rawWeights.w_seq / wSum,
      w_cf: rawWeights.w_cf / wSum
    };

    // Fetch employee's skill gaps and required skills
    const empGaps = this.dataset.skillGaps.filter(g => g.employee_id === emp.id);
    const empScores = this.dataset.skillScores.filter(s => s.employee_id === emp.id);
    const targetSkillIds = empGaps.map(g => g.skill_id);

    // Map skill gaps by skill_id
    const gapMap = new Map(empGaps.map(g => [g.skill_id, g.gap_percentage]));

    const rankedCourses = this.dataset.courses.map(course => {
      // 1. Skill Gap Relevance Signal S_gap
      const gapPct = gapMap.get(course.skill_id) || 0;
      const s_gap = Math.min(1.0, gapPct / 100.0);

      // 2. TransE Knowledge Graph Signal S_kg
      const s_kg = this.kgEngine.getKGRelevanceScore(course, targetSkillIds, emp.designation_id);

      // 3. Sequence Mining Signal S_seq with Time Decay
      let s_seq = this.sequenceEngine.getSequenceScore(emp.id, course.id);

      // 4. Collaborative Filtering Signal S_cf
      let s_cf = this.cfEngine.getCFScore(emp.id, course.id);

      // Cold-start Fallback Check:
      let isColdStart = false;
      if (s_seq === 0 && s_cf === 0) {
        isColdStart = true;
        // Fallback redistribute weights to S_gap and S_kg
        s_seq = s_gap * 0.5;
        s_cf = s_kg * 0.5;
      }

      // Calculate Final Fused Score
      const finalScore = (weights.w_gap * s_gap) +
                        (weights.w_kg * s_kg) +
                        (weights.w_seq * s_seq) +
                        (weights.w_cf * s_cf);

      // Generate Transparent Explainability Reasons
      const reasons = this._generateExplanationReasons(course, emp, gapPct, s_kg, s_seq, s_cf, isColdStart);

      return {
        courseId: course.id,
        courseTitle: course.title,
        provider: course.provider,
        level: course.level,
        skillId: course.skill_id,
        finalScore: Math.round(finalScore * 100) / 100,
        signals: {
          s_gap: Math.round(s_gap * 100) / 100,
          s_kg: Math.round(s_kg * 100) / 100,
          s_seq: Math.round(s_seq * 100) / 100,
          s_cf: Math.round(s_cf * 100) / 100
        },
        weightedContributions: {
          w_gap: Math.round(weights.w_gap * s_gap * 100) / 100,
          w_kg: Math.round(weights.w_kg * s_kg * 100) / 100,
          w_seq: Math.round(weights.w_seq * s_seq * 100) / 100,
          w_cf: Math.round(weights.w_cf * s_cf * 100) / 100
        },
        reasons,
        isColdStart
      };
    });

    rankedCourses.sort((a, b) => b.finalScore - a.finalScore);

    // Get peer similarity details for frontend inspection
    const similarPeers = this.cfEngine.getSimilarEmployees(emp.id, 4).map(p => ({
      employeeId: p.employee.employee_id,
      name: p.employee.name,
      designation: p.employee.designation_name,
      similarityScore: Math.round(p.similarity * 100) / 100
    }));

    return {
      employee: emp,
      skillScores: empScores,
      skillGaps: empGaps,
      rawWeights,
      normalizedWeights: weights,
      weights,
      similarPeers,
      recommendations: rankedCourses.slice(0, 8)
    };
  }

  _generateExplanationReasons(course, emp, gapPct, s_kg, s_seq, s_cf, isColdStart) {
    const reasons = [];
    const skillName = this.dataset.skills.find(s => s.id === course.skill_id)?.name || 'Domain';
    
    if (gapPct > 0) {
      reasons.push(`Addresses ${skillName} gap of ${Math.round(gapPct)}%.`);
    } else {
      reasons.push(`Aligns with ${skillName} standard.`);
    }

    if (s_kg > 0) {
      reasons.push(`TransE KG relevance: ${Math.round(s_kg * 100)/100}.`);
    }

    if (s_seq > 0) {
      reasons.push(`Sequence mining relevance: ${Math.round(s_seq * 100)/100}.`);
    }

    if (s_cf > 0) {
      reasons.push(`Collaborative filtering relevance: ${Math.round(s_cf * 100)/100}. Selected by similar employees.`);
    }

    return reasons;
  }
}

module.exports = FusionEngine;
