const express = require('express');
const supabase = require('../db');

const router = express.Router();

function getPriority(gap) {
  if (gap <= 0) {
    return 'No Gap';
  }

  if (gap === 1) {
    return 'Low';
  }

  if (gap === 2) {
    return 'Medium';
  }

  return 'High';
}

function getOverallStatus(readinessScore) {
  if (readinessScore >= 90) {
    return 'Ready';
  }

  if (readinessScore >= 75) {
    return 'Mostly Ready';
  }

  if (readinessScore >= 50) {
    return 'Needs Development';
  }

  return 'High Priority Development';
}

router.get('/:employeeProfileId', async (req, res) => {
  try {
    const { employeeProfileId } = req.params;

    // 1. Validate employee ID
    if (!employeeProfileId) {
      return res.status(400).json({
        success: false,
        message: 'Employee profile ID is required'
      });
    }

    // 2. Get employee profile
    const { data: employee, error: employeeError } = await supabase
      .from('employee_profiles')
      .select('id, name, department, designation, job_role')
      .eq('id', employeeProfileId)
      .single();

    if (employeeError) {
      return res.status(404).json({
        success: false,
        message: 'Employee profile not found',
        error: employeeError.message
      });
    }

    // 3. Check job role
    if (!employee.job_role) {
      return res.status(400).json({
        success: false,
        message: 'Employee does not have a job role'
      });
    }

    // 4. Get required competencies for this job role
    const { data: framework, error: frameworkError } = await supabase
      .from('competency_framework')
      .select(
        'id, competency_name, required_level, description'
      )
      .eq('job_role', employee.job_role)
      .order('competency_name');

    if (frameworkError) {
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch competency framework',
        error: frameworkError.message
      });
    }

    if (!framework || framework.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No competency framework found for this job role'
      });
    }

    // 5. Get employee's current competency levels
    const { data: currentCompetencies, error: competencyError } =
      await supabase
        .from('employee_competencies')
        .select('competency_id, current_level')
        .eq('employee_profile_id', employeeProfileId);

    if (competencyError) {
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch employee competencies',
        error: competencyError.message
      });
    }

    // 6. Create a lookup map for current competency levels
    const currentLevelMap = new Map();

    for (const item of currentCompetencies || []) {
      currentLevelMap.set(item.competency_id, item.current_level);
    }

    // 7. Calculate skill gaps
    const skillGaps = framework.map((item) => {
      const currentLevel = currentLevelMap.get(item.id) ?? 0;

      const gap = Math.max(
        item.required_level - currentLevel,
        0
      );

      return {
        competencyId: item.id,
        competency: item.competency_name,
        currentLevel,
        requiredLevel: item.required_level,
        gap,
        priority: getPriority(gap),
        description: item.description
      };
    });

    // 8. Sort biggest gaps first
    skillGaps.sort((a, b) => {
      return b.gap - a.gap;
    });

    // 9. Assessment completeness
    const totalRequired = framework.length;

    const assessed = skillGaps.filter((item) => {
      return currentLevelMap.has(item.competencyId);
    }).length;

    const missing = totalRequired - assessed;

    // 10. Calculate overall readiness
    let totalRequiredScore = 0;
    let totalAchievedScore = 0;

    for (const item of framework) {
      const currentLevel = currentLevelMap.get(item.id) ?? 0;

      totalRequiredScore += item.required_level;

      // Don't give extra readiness credit above the required level
      totalAchievedScore += Math.min(
        currentLevel,
        item.required_level
      );
    }

    const overallReadiness =
      totalRequiredScore === 0
        ? 0
        : Math.round(
            (totalAchievedScore / totalRequiredScore) * 100
          );

    // 11. Overall status
    const overallStatus = getOverallStatus(
      overallReadiness
    );

    // 12. Top 3 gaps
    const topGaps = skillGaps
      .filter((item) => item.gap > 0)
      .slice(0, 3)
      .map((item) => ({
        competency: item.competency,
        gap: item.gap,
        priority: item.priority
      }));

    // 13. Final response
    res.json({
      success: true,

      employee: {
        id: employee.id,
        name: employee.name,
        department: employee.department,
        designation: employee.designation,
        jobRole: employee.job_role
      },

      readiness: {
        score: overallReadiness,
        status: overallStatus
      },

      assessmentCompleteness: {
        totalRequired,
        assessed,
        missing
      },

      summary: {
        totalCompetencies: skillGaps.length,

        competenciesWithGaps:
          skillGaps.filter((item) => item.gap > 0).length,

        highPriorityGaps:
          skillGaps.filter(
            (item) => item.priority === 'High'
          ).length,

        mediumPriorityGaps:
          skillGaps.filter(
            (item) => item.priority === 'Medium'
          ).length,

        lowPriorityGaps:
          skillGaps.filter(
            (item) => item.priority === 'Low'
          ).length
      },

      topGaps,

      skillGaps
    });

  } catch (error) {
    console.error('Skill Gap API error:', error);

    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;