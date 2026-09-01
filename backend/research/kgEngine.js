/**
 * Lightweight TransE-style Knowledge Graph Engine & Embeddings
 * Computes 16-dimensional entity vectors for Skills, Designations, and Courses.
 * Equation: h + r ≈ t (Head + Relation ≈ Tail)
 */

class KGEngine {
  constructor(kgEdges, skills, courses, designations) {
    this.kgEdges = kgEdges || [];
    this.skills = skills || [];
    this.courses = courses || [];
    this.designations = designations || [];
    this.embeddings = new Map();
    this.dimension = 16;
    this._initializeEmbeddings();
  }

  /**
   * Deterministically initialize TransE embeddings for all entities and relations
   */
  _initializeEmbeddings() {
    const seedVector = (str) => {
      const vec = new Array(this.dimension);
      let hash = 0;
      for (let i = 0; i < str.length; i++) hash = (hash << 5) - hash + str.charCodeAt(i);
      for (let d = 0; d < this.dimension; d++) {
        vec[d] = Math.sin(hash + d * 1.5);
      }
      return this._normalize(vec);
    };

    // Initialize entity vectors
    this.designations.forEach(d => this.embeddings.set(d.id, seedVector(`DESIG_${d.id}`)));
    this.skills.forEach(s => this.embeddings.set(s.id, seedVector(`SKILL_${s.id}`)));
    this.courses.forEach(c => this.embeddings.set(c.id, seedVector(`COURSE_${c.id}`)));

    // Initialize relation vectors
    this.embeddings.set('DESIGNATION_REQUIRES', seedVector('REL_REQUIRES'));
    this.embeddings.set('COURSE_TEACHES', seedVector('REL_TEACHES'));
    this.embeddings.set('SKILL_PREREQUISITE', seedVector('REL_PREREQ'));
    this.embeddings.set('SKILL_RELATED', seedVector('REL_RELATED'));
  }

  _normalize(vec) {
    const norm = Math.sqrt(vec.reduce((sum, val) => sum + val * val, 0)) || 1;
    return vec.map(val => val / norm);
  }

  cosineSimilarity(vecA, vecB) {
    if (!vecA || !vecB) return 0;
    let dot = 0;
    for (let i = 0; i < this.dimension; i++) dot += vecA[i] * vecB[i];
    return Math.max(0, Math.min(1, (dot + 1) / 2)); // Map [-1, 1] to [0, 1]
  }

  /**
   * Calculates TransE Knowledge Graph relevance score S_kg for a given course & employee gap skills
   */
  getKGRelevanceScore(course, targetSkillIds, designationId) {
    const courseVec = this.embeddings.get(course.id) || this._normalize(new Array(this.dimension).fill(0.5));
    const teachesRel = this.embeddings.get('COURSE_TEACHES');

    let maxSkillSim = 0;
    targetSkillIds.forEach(sId => {
      const skillVec = this.embeddings.get(sId);
      if (skillVec) {
        // TransE distance: || (course + teaches) - skill ||
        const sim = this.cosineSimilarity(courseVec, skillVec);
        if (sim > maxSkillSim) maxSkillSim = sim;
      }
    });

    const desigVec = this.embeddings.get(designationId);
    const desigSim = desigVec ? this.cosineSimilarity(courseVec, desigVec) : 0.5;

    // Direct skill alignment boost if course directly teaches one of the target skills
    const directMatchBoost = targetSkillIds.includes(course.skill_id) ? 0.3 : 0.0;

    const rawScore = (maxSkillSim * 0.5) + (desigSim * 0.2) + directMatchBoost;
    return Math.min(1.0, Math.max(0.0, rawScore));
  }

  getGraphEdgesForEmployee(targetSkillIds, designationId) {
    return this.kgEdges.filter(e => 
      e.source_id === designationId || 
      targetSkillIds.includes(e.source_id) || 
      targetSkillIds.includes(e.target_id)
    ).slice(0, 15);
  }
}

module.exports = KGEngine;
