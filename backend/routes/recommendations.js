const express = require('express');
const supabase = require('../db');

const router = express.Router();

function getPriority(gap) {
  if (gap >= 3) return 'High';
  if (gap === 2) return 'Medium';
  return 'Low';
}

// =========================================================================
// 1. GET RECOMMENDATIONS FOR AN EMPLOYEE
// =========================================================================
router.get('/:employeeProfileId', async (req, res) => {
  try {
    const { employeeProfileId } = req.params;

    if (!employeeProfileId) {
      return res.status(400).json({
        success: false,
        message: 'Employee profile ID is required'
      });
    }

    // 1. Fetch employee
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

    // 2. Fetch current competency levels
    const { data: employeeCompetencies, error: competencyError } = await supabase
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

    // 3. Fetch required framework for employee's job role
    const { data: framework, error: frameworkError } = await supabase
      .from('competency_framework')
      .select('id, competency_name, required_level, description')
      .eq('job_role', employee.job_role);

    if (frameworkError) {
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch competency framework',
        error: frameworkError.message
      });
    }

    // 4. Map current levels
    const currentLevelMap = new Map();
    for (const item of employeeCompetencies || []) {
      currentLevelMap.set(item.competency_id, item.current_level);
    }

    // 5. Calculate gaps
    const gaps = (framework || [])
      .map((item) => {
        const currentLevel = currentLevelMap.get(item.id) ?? 0;
        const gap = Math.max(item.required_level - currentLevel, 0);

        return {
          competencyId: item.id,
          competency: item.competency_name,
          currentLevel,
          requiredLevel: item.required_level,
          gap,
          priority: getPriority(gap),
          description: item.description
        };
      })
      .filter((item) => item.gap > 0)
      .sort((a, b) => {
        if (b.gap !== a.gap) {
          return b.gap - a.gap;
        }
        return a.competency.localeCompare(b.competency);
      });

    // 6. Find courses for each gap
    const recommendations = [];

    for (const gap of gaps) {
      const { data: resources, error: resourceError } = await supabase
        .from('igot_courses')
        .select(
          'id, competency_name, course_name, course_url, level, target_level, duration_minutes, description, source, source_type'
        )
        .eq('competency_name', gap.competency);

      if (resourceError) {
        console.error(`Resource lookup error for ${gap.competency}:`, resourceError.message);
        continue;
      }

      if (!resources || resources.length === 0) {
        recommendations.push({
          competencyId: gap.competencyId,
          competency: gap.competency,
          currentLevel: gap.currentLevel,
          requiredLevel: gap.requiredLevel,
          gap: gap.gap,
          priority: gap.priority,
          resourceFound: false,
          resources: []
        });
        continue;
      }

      // Sort resources closest to target proficiency level
      const sortedResources = [...resources].sort((a, b) => {
        const aLevelDiff = Math.abs((a.target_level || 5) - gap.requiredLevel);
        const bLevelDiff = Math.abs((b.target_level || 5) - gap.requiredLevel);
        return aLevelDiff - bLevelDiff;
      });

      recommendations.push({
        competencyId: gap.competencyId,
        competency: gap.competency,
        currentLevel: gap.currentLevel,
        requiredLevel: gap.requiredLevel,
        gap: gap.gap,
        priority: gap.priority,
        resourceFound: true,
        resources: sortedResources.map((resource) => ({
          id: resource.id,
          name: resource.course_name,
          url: resource.course_url,
          level: resource.level,
          targetLevel: resource.target_level,
          durationMinutes: resource.duration_minutes,
          description: resource.description,
          source: resource.source,
          sourceType: resource.source_type
        }))
      });
    }

    // 7. Return complete recommendations payload
    res.json({
      success: true,
      employee: {
        id: employee.id,
        name: employee.name,
        department: employee.department,
        designation: employee.designation,
        jobRole: employee.job_role
      },
      totalSkillGaps: gaps.length,
      gapsWithRecommendations: recommendations.filter((item) => item.resourceFound).length,
      gapsWithoutRecommendations: recommendations.filter((item) => !item.resourceFound).length,
      recommendations
    });
  } catch (error) {
    console.error('Recommendation API error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

// =========================================================================
// 2. COMPLETE COURSE / PROGRESS SYNC (Closed-Loop iGOT Integration)
// =========================================================================
router.post('/complete-course', async (req, res) => {
  try {
    const { employeeProfileId, competencyId, newLevel } = req.body;

    if (!employeeProfileId || !competencyId || newLevel === undefined) {
      return res.status(400).json({
        success: false,
        message: 'employeeProfileId, competencyId, and newLevel are required'
      });
    }

    // Update employee competency level in Supabase
    const { data, error } = await supabase
      .from('employee_competencies')
      .upsert(
        {
          employee_profile_id: employeeProfileId,
          competency_id: competencyId,
          current_level: newLevel
        },
        { onConflict: 'employee_profile_id,competency_id' }
      )
      .select();

    if (error) {
      return res.status(500).json({
        success: false,
        message: 'Failed to update competency level',
        error: error.message
      });
    }

    res.json({
      success: true,
      message: 'Course marked completed! Competency level updated and gap closed.',
      data
    });
  } catch (error) {
    console.error('Complete course error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
});

module.exports = router;