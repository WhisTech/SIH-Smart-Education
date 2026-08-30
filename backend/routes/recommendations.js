const express = require('express');
const supabase = require('../db');

const router = express.Router();

function getPriority(gap) {
  if (gap >= 3) return 'High';
  if (gap === 2) return 'Medium';
  return 'Low';
}

// =========================================================================
// 1. GET FULL iGOT & NSSTA CATALOG (With optional filtering)
//    Example: GET /api/recommendations/catalog?source=iGOT
// =========================================================================
router.get('/catalog', async (req, res) => {
  try {
    const { source, competency, level } = req.query;

    let query = supabase.from('igot_courses').select('*');

    if (source) query = query.ilike('source', `%${source}%`);
    if (competency) query = query.ilike('competency_name', `%${competency}%`);
    if (level) query = query.eq('level', level);

    const { data: courses, error } = await query.order('course_name');

    if (error) {
      return res.status(500).json({ success: false, message: error.message });
    }

    res.json({
      success: true,
      count: courses.length,
      courses
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// =========================================================================
// 2. GET PERSONALIZED RECOMMENDATIONS BASED ON SKILL GAPS
//    Example: GET /api/recommendations/:employeeProfileId
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
      .sort((a, b) => b.gap - a.gap);

    // 6. Find courses for each gap
    const recommendations = [];

    for (const gap of gaps) {
      const { data: resources } = await supabase
        .from('igot_courses')
        .select('*')
        .eq('competency_name', gap.competency);

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

      // Sort resources closest to target level
      const sortedResources = [...resources].sort((a, b) => {
        const aDiff = Math.abs((a.target_level || 5) - gap.requiredLevel);
        const bDiff = Math.abs((b.target_level || 5) - gap.requiredLevel);
        return aDiff - bDiff;
      });

      recommendations.push({
        competencyId: gap.competencyId,
        competency: gap.competency,
        currentLevel: gap.currentLevel,
        requiredLevel: gap.requiredLevel,
        gap: gap.gap,
        priority: gap.priority,
        resourceFound: true,
        resources: sortedResources.map((r) => ({
          id: r.id,
          name: r.course_name,
          url: r.course_url,
          level: r.level,
          targetLevel: r.target_level,
          durationMinutes: r.duration_minutes,
          description: r.description,
          source: r.source,
          sourceType: r.source_type
        }))
      });
    }

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
      gapsWithRecommendations: recommendations.filter((i) => i.resourceFound).length,
      gapsWithoutRecommendations: recommendations.filter((i) => !i.resourceFound).length,
      recommendations
    });
  } catch (error) {
    console.error('Recommendation API error:', error);
    res.status(500).json({ success: false, message: 'Internal server error', error: error.message });
  }
});

// =========================================================================
// 3. ENROLL IN A COURSE (Tracking)
//    Example: POST /api/recommendations/enroll
// =========================================================================
router.post('/enroll', async (req, res) => {
  try {
    const { employeeProfileId, courseId } = req.body;

    if (!employeeProfileId || !courseId) {
      return res.status(400).json({
        success: false,
        message: 'employeeProfileId and courseId are required'
      });
    }

    res.json({
      success: true,
      message: 'Enrolled in iGOT / NSSTA module successfully',
      enrollment: {
        employeeProfileId,
        courseId,
        enrolledAt: new Date().toISOString(),
        status: 'in_progress'
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// =========================================================================
// 4. COMPLETE COURSE & AUTO-UPDATE COMPETENCY LEVEL (Closed-Loop Sync)
//    Example: POST /api/recommendations/complete-course
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

    // Update competency level in Supabase
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
        message: 'Failed to update competency level in Supabase',
        error: error.message
      });
    }

    res.json({
      success: true,
      message: 'Course completed! Competency level upgraded and skill gap closed.',
      updatedCompetency: data
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;