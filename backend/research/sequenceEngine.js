/**
 * Sequential Pattern Mining Engine with Exponential Time Decay
 * Learns frequent course transition paths across employees and weights recency.
 */

class SequenceEngine {
  constructor(courseInteractions, lambda = 0.03) {
    this.interactions = courseInteractions || [];
    this.lambda = lambda; // Time decay constant
    this.sequenceTransitions = new Map(); // "courseA->courseB" => weighted count
    this._mineSequences();
  }

  /**
   * Applies exponential time decay weighting to an interaction timestamp
   * w = e^(-lambda * daysAgo)
   */
  getRecencyWeight(daysAgo) {
    const d = typeof daysAgo === 'number' ? daysAgo : 10;
    return Math.exp(-this.lambda * d);
  }

  /**
   * Mines sequential patterns across employee interaction logs
   */
  _mineSequences() {
    // Group completed/started course interactions by employee ordered by timestamp
    const empHistory = new Map();
    this.interactions.forEach(inter => {
      if (inter.action === 'started' || inter.action === 'completed' || inter.action === 'selected') {
        if (!empHistory.has(inter.employee_id)) empHistory.set(inter.employee_id, []);
        empHistory.get(inter.employee_id).push(inter);
      }
    });

    // Build transition frequency table
    empHistory.forEach(userLogs => {
      userLogs.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
      for (let i = 0; i < userLogs.length - 1; i++) {
        const fromCourse = userLogs[i].course_id;
        const toCourse = userLogs[i + 1].course_id;
        if (fromCourse !== toCourse) {
          const key = `${fromCourse}->${toCourse}`;
          const recency = this.getRecencyWeight(userLogs[i + 1].days_ago);
          this.sequenceTransitions.set(key, (this.sequenceTransitions.get(key) || 0) + recency);
        }
      }
    });
  }

  /**
   * Calculates Sequence Mining Score S_seq for a target course given employee's completed courses
   */
  getSequenceScore(employeeId, candidateCourseId) {
    const userLogs = this.interactions.filter(i => i.employee_id === employeeId && (i.action === 'completed' || i.action === 'started'));
    if (userLogs.length === 0) return 0.0;

    userLogs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    const recentCompletedCourseId = userLogs[0].course_id;

    const transitionKey = `${recentCompletedCourseId}->${candidateCourseId}`;
    const transitionWeight = this.sequenceTransitions.get(transitionKey) || 0;

    // Normalize to [0, 1]
    const rawScore = Math.min(1.0, transitionWeight / 3.0);
    return Math.max(0.0, rawScore);
  }

  getFrequentSequences(topN = 5) {
    const list = Array.from(this.sequenceTransitions.entries()).map(([key, count]) => {
      const [fromId, toId] = key.split('->');
      return { fromId, toId, transitionStrength: Math.round(count * 100) / 100 };
    });
    list.sort((a, b) => b.transitionStrength - a.transitionStrength);
    return list.slice(0, topN);
  }
}

module.exports = SequenceEngine;
