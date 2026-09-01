/**
 * Collaborative Filtering Engine based on Employee x Course Interaction Matrix
 * Computes User Cosine Similarity & predicts course preference scores.
 */

class CFEngine {
  constructor(courseInteractions, employees, courses) {
    this.interactions = courseInteractions || [];
    this.employees = employees || [];
    this.courses = courses || [];
    this.userItemMatrix = new Map(); // empId -> Map(courseId -> weight)
    this._buildUserItemMatrix();
  }

  _buildUserItemMatrix() {
    const actionWeights = {
      'viewed': 1.0,
      'selected': 2.0,
      'started': 3.0,
      'completed': 5.0,
      'preferred': 5.0
    };

    this.interactions.forEach(inter => {
      if (!this.userItemMatrix.has(inter.employee_id)) {
        this.userItemMatrix.set(inter.employee_id, new Map());
      }
      const userVector = this.userItemMatrix.get(inter.employee_id);
      const w = actionWeights[inter.action] || 1.0;
      const current = userVector.get(inter.course_id) || 0;
      userVector.set(inter.course_id, Math.max(current, w));
    });
  }

  /**
   * Computes Cosine Similarity between User A and User B over interaction vectors
   */
  getUserSimilarity(empIdA, empIdB) {
    const vecA = this.userItemMatrix.get(empIdA);
    const vecB = this.userItemMatrix.get(empIdB);
    if (!vecA || !vecB) return 0;

    let dot = 0;
    let normA = 0;
    let normB = 0;

    vecA.forEach((valA, courseId) => {
      normA += valA * valA;
      if (vecB.has(courseId)) {
        dot += valA * vecB.get(courseId);
      }
    });

    vecB.forEach(valB => {
      normB += valB * valB;
    });

    if (normA === 0 || normB === 0) return 0;
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * Finds top-K similar synthetic employees for a given employee
   */
  getSimilarEmployees(targetEmpId, topK = 4) {
    const similarities = [];
    this.employees.forEach(emp => {
      if (emp.id !== targetEmpId) {
        const sim = this.getUserSimilarity(targetEmpId, emp.id);
        similarities.push({ employee: emp, similarity: sim });
      }
    });

    similarities.sort((a, b) => b.similarity - a.similarity);
    return similarities.filter(p => p.similarity > 0).slice(0, topK);
  }

  /**
   * Calculates Collaborative Filtering score S_cf for a candidate course
   */
  getCFScore(targetEmpId, candidateCourseId) {
    const similarPeers = this.getSimilarEmployees(targetEmpId, 5);
    if (similarPeers.length === 0) return 0.0;

    let weightedScoreSum = 0;
    let simSum = 0;

    similarPeers.forEach(({ employee, similarity }) => {
      if (similarity > 0) {
        const peerVector = this.userItemMatrix.get(employee.id);
        const interactionVal = peerVector ? (peerVector.get(candidateCourseId) || 0) : 0;
        weightedScoreSum += similarity * (interactionVal / 5.0);
        simSum += similarity;
      }
    });

    if (simSum === 0) return 0.0;
    return Math.min(1.0, Math.max(0.0, weightedScoreSum / simSum));
  }
}

module.exports = CFEngine;
