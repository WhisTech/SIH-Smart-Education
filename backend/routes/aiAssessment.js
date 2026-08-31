const express = require('express');
const { analyzeSkillGaps } = require('../services/aiService');

const router = express.Router();

router.get('/:employeeProfileId', async (req, res) => {
  try {
    const { employeeProfileId } = req.params;

    if (!employeeProfileId) {
      return res.status(400).json({
        success: false,
        message: 'Employee profile ID is required'
      });
    }

    // Get the real skill-gap data from our backend
    const skillGapResponse = await fetch(
      `http://localhost:5000/api/skill-gap/${employeeProfileId}`
    );

    const skillGapData = await skillGapResponse.json();

    if (!skillGapResponse.ok || !skillGapData.success) {
      return res.status(400).json({
        success: false,
        message: 'Unable to get skill gap data',
        error: skillGapData.message
      });
    }

    // Send real skill-gap data to Groq
    const assessment = await analyzeSkillGaps({
      employee: skillGapData.employee,
      skillGaps: skillGapData.skillGaps
    });

    res.json({
      success: true,
      employee: skillGapData.employee,
      readiness: skillGapData.readiness,
      topGaps: skillGapData.topGaps,
      assessment
    });

  } catch (error) {
    console.error('AI assessment error:', error);

    res.status(500).json({
      success: false,
      message: 'AI assessment failed',
      error: error.message
    });
  }
});

module.exports = router;