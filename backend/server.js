const express = require('express')
const cors = require('cors')
const { createClient } = require('@supabase/supabase-js')
const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '.env') })

const { generateQuizQuestions, generateAssessmentAnalysis } = require('./groqClient')
const { generateMcqsFromPdf } = require('./geminiClient')
const multer = require('multer')

// Configure multer for PDF in-memory uploads (max 15MB)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf' || file.originalname.toLowerCase().endsWith('.pdf')) {
      cb(null, true)
    } else {
      cb(new Error('Only PDF files are allowed.'), false)
    }
  }
})

const app = express()

const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  'http://localhost:5000',
  process.env.FRONTEND_URL
].filter(Boolean)

app.use(cors({
  origin: (origin, callback) => {
    // Allow server-to-server, curl, mobile, or requests with no origin
    if (!origin) return callback(null, true)

    // Match allowedOrigins or FRONTEND_URL
    if (allowedOrigins.includes(origin) || (process.env.FRONTEND_URL && origin === process.env.FRONTEND_URL.trim())) {
      return callback(null, true)
    }

    // In local development (when FRONTEND_URL is not set), allow all origins
    if (!process.env.FRONTEND_URL) {
      return callback(null, true)
    }

    return callback(new Error('Not allowed by CORS'))
  },
  credentials: true
}))

app.use(express.json())
const activeGenerations = new Set();

const supabaseUrl = process.env.SUPABASE_URL
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY

if (!supabaseUrl || !supabaseSecretKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SECRET_KEY in environment')
}

const supabase = createClient(supabaseUrl, supabaseSecretKey)

/**
 * Authentication middleware to verify Supabase JWT Bearer token
 */
const authenticateUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Missing authorization token.'
      })
    }

    const token = authHeader.split(' ')[1]
    const { data: { user }, error } = await supabase.auth.getUser(token)

    if (error || !user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired authentication session. Please sign in again.'
      })
    }

    req.user = user
    next()
  } catch (err) {
    res.status(401).json({
      success: false,
      message: `Authentication error: ${err.message}`
    })
  }
}


// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Backend is running'
  })
})

// Supabase connectivity test endpoint
app.get('/api/supabase-test', async (req, res) => {
  const { error } = await supabase
    .from('employee_profiles')
    .select('id')
    .limit(1)

  if (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    })
  }

  res.json({
    success: true,
    message: 'Backend connected to Supabase'
  })
})

// Get all designations (reference data)
app.get('/api/designations', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('designations')
      .select('id, name, description')
      .order('name')

    if (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
        data: []
      })
    }

    res.json({
      success: true,
      data: data || []
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || 'Server error loading designations',
      data: []
    })
  }
})

// Get all skills (reference data)
app.get('/api/skills', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('skills')
      .select('id, name, description, category')
      .order('category', { ascending: true })
      .order('name', { ascending: true })

    if (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
        data: []
      })
    }

    res.json({
      success: true,
      data: data || []
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message || 'Server error loading skills',
      data: []
    })
  }
})

/* ==========================================================================
   STAGE 2 — ASSESSMENT API ENDPOINTS (CLEAN & UNIQUE)
   ========================================================================== */

/**
 * Helper function to retrieve or link an employee_profiles record for an authenticated user.
 */
async function resolveEmployeeProfile(userObj) {
  if (!userObj?.id) return null;
  const userId = userObj.id;

  // 1. Check by user_id
  let { data: profile } = await supabase
    .from('employee_profiles')
    .select('id, name, designation_id, employee_id')
    .eq('user_id', userId)
    .maybeSingle();

  if (profile) return profile;

  // 2. Check if user_metadata specifies an employee_id
  const meta = userObj.user_metadata || {};
  const empId = meta.employee_id || meta.employeeId;
  if (empId) {
    const { data: matched } = await supabase
      .from('employee_profiles')
      .select('id, name, designation_id, employee_id')
      .eq('employee_id', String(empId).trim())
      .maybeSingle();

    if (matched) {
      await supabase
        .from('employee_profiles')
        .update({ user_id: userId, updated_at: new Date().toISOString() })
        .eq('id', matched.id);
      return { ...matched, user_id: userId };
    }
  }

  // 3. Fallback: Create default profile for this user
  const { data: defaultDesig } = await supabase.from('designations').select('id').limit(1).maybeSingle();
  const desigId = defaultDesig?.id || 'd47400e0-c13a-4b26-b0d2-78e460ca56e3';

  const { data: newProf } = await supabase
    .from('employee_profiles')
    .insert({
      user_id: userId,
      name: meta.name || userObj.email?.split('@')[0] || 'Official Employee',
      employee_id: empId || `EMP-${userId.slice(0, 8)}`,
      designation_id: desigId,
      department: meta.department || 'National Statistical Office (NSO)',
      experience_years: meta.experience_years ?? 3
    })
    .select('id, name, designation_id, employee_id')
    .maybeSingle();

  return newProf || null;
}

/**
 * GET /api/assessment/info
 */
app.get('/api/assessment/info', authenticateUser, async (req, res) => {
  try {
    const profile = await resolveEmployeeProfile(req.user);
    if (!profile) return res.status(400).json({ success: false, message: 'Profile not found. Please complete your profile.' });
    
    let designationName = 'Programmer';
    if (profile.designation_id) {
       const { data: desig } = await supabase.from('designations').select('name').eq('id', profile.designation_id).maybeSingle();
       if (desig) designationName = desig.name;
    }

    const { data: empSkills } = await supabase.from('employee_skills').select('skill_id').eq('employee_profile_id', profile.id);
    let skillIds = (empSkills || []).map(s => s.skill_id);

    // Fallback logic: If no explicitly selected employee skills, fetch from designation_skills or skills catalog
    if (skillIds.length === 0 && profile.designation_id) {
       const { data: desigSkills } = await supabase.from('designation_skills').select('skill_id').eq('designation_id', profile.designation_id);
       if (desigSkills && desigSkills.length > 0) {
          skillIds = desigSkills.map(s => s.skill_id);
       }
    }

    if (skillIds.length === 0) {
       const { data: topSkills } = await supabase.from('skills').select('id').limit(4);
       if (topSkills && topSkills.length > 0) {
          skillIds = topSkills.map(s => s.id);
       }
    }

    // Auto-populate employee_skills if we resolved fallback skills
    if (skillIds.length > 0 && (!empSkills || empSkills.length === 0)) {
       const rowsToInsert = skillIds.map(sId => ({ employee_profile_id: profile.id, skill_id: sId }));
       await supabase.from('employee_skills').insert(rowsToInsert).catch(console.warn);
    }
    
    if (skillIds.length === 0) {
       return res.json({
         success: true,
         designationName,
         currentSkills: [],
         requiredSkills: [],
         totalQuestions: 0,
         estimatedTime: 0
       });
    }

    const { data: skills } = await supabase.from('skills').select('id, name').in('id', skillIds);
    const { data: reqSkillsData } = await supabase.from('designation_skills').select('skill_id, required_level').eq('designation_id', profile.designation_id);
    
    res.json({
      success: true,
      designationName,
      currentSkills: skills || [],
      requiredSkills: reqSkillsData || [],
      totalQuestions: Math.min(15, (skills || []).length * 2),
      estimatedTime: Math.min(15, (skills || []).length * 2) * 1.5
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/assessment/reassessment-info (0 AI Calls - Fast JSON Metadata)
 */
app.get('/api/assessment/reassessment-info', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;

    // 1. Fetch Profile & Designation
    const profile = await resolveEmployeeProfile(req.user);
    if (!profile) return res.status(400).json({ success: false, message: 'Profile not found' });

    let designationName = 'Official';
    if (profile.designation_id) {
       const { data: desig } = await supabase.from('designations').select('name').eq('id', profile.designation_id).maybeSingle();
       if (desig) designationName = desig.name;
    }

    // 2. Fetch Latest Completed Assessment
    const { data: latestAssessment } = await supabase
      .from('assessments')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // 3. Fetch Latest Skill Gaps
    let skillGapsList = [];
    if (latestAssessment) {
      const { data: gaps } = await supabase
        .from('skill_gaps')
        .select('id, skill_id, assessed_score, required_score, gap_percentage, priority')
        .eq('assessment_id', latestAssessment.id);

      const { data: skillsCatalog } = await supabase.from('skills').select('id, name, category');
      const sMap = new Map((skillsCatalog || []).map(s => [s.id, s]));

      skillGapsList = (gaps || []).map(g => {
        const sObj = sMap.get(g.skill_id);
        return {
          id: g.id,
          skillId: g.skill_id,
          skillName: sObj ? sObj.name : 'Skill',
          category: sObj?.category || 'General',
          assessedScore: Number(g.assessed_score),
          requiredScore: Number(g.required_score),
          gapPercentage: Number(g.gap_percentage),
          priority: g.priority,
          isMet: Number(g.assessed_score) >= Number(g.required_score)
        };
      });
    }

    const skillsBelowRequired = skillGapsList.filter(g => !g.isMet);

    // 4. Fetch Recommended Courses for this User
    const { data: recRows } = await supabase
      .from('recommendations')
      .select('id, course_id, skill_id, reason, priority')
      .eq('user_id', userId);

    let recommendedCourses = [];
    if (recRows && recRows.length > 0) {
      const courseIds = recRows.map(r => r.course_id);
      const { data: coursesData } = await supabase.from('courses').select('*').in('id', courseIds);
      const cMap = new Map((coursesData || []).map(c => [c.id, c]));
      const { data: skillsCatalog } = await supabase.from('skills').select('id, name');
      const sMap = new Map((skillsCatalog || []).map(s => [s.id, s.name]));

      recommendedCourses = recRows.map(r => {
        const c = cMap.get(r.course_id) || {};
        return {
          id: r.id,
          courseId: r.course_id,
          title: c.title || 'Official Skill Module',
          provider: c.provider || 'iGOT Karmayogi',
          duration: c.duration || 'Self-paced',
          externalUrl: c.external_url || 'https://igotkarmayogi.gov.in/',
          skillId: r.skill_id,
          skillName: sMap.get(r.skill_id) || 'Skill',
          reason: r.reason,
          priority: r.priority === 1 ? 'High' : r.priority === 2 ? 'Medium' : 'Low'
        };
      });
    }

    const { data: empSkills } = await supabase.from('employee_skills').select('skill_id').eq('employee_profile_id', profile.id);
    const skillCount = (empSkills || []).length;
    const totalQuestions = Math.min(15, skillCount * 2);

    res.json({
      success: true,
      hasPreviousAssessment: !!latestAssessment,
      previousAssessment: latestAssessment ? {
        id: latestAssessment.id,
        overallScore: Number(latestAssessment.score_percentage || 0),
        totalQuestions: latestAssessment.total_questions,
        correctAnswers: latestAssessment.correct_answers,
        completedAt: latestAssessment.completed_at
      } : null,
      designationName,
      skillGaps: skillGapsList,
      skillsBelowRequired,
      recommendedCourses,
      totalQuestions,
      estimatedTime: totalQuestions * 1.5
    });

  } catch (err) {
    console.error('Error fetching reassessment info:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/assessment/latest-comparison
 */
app.get('/api/assessment/latest-comparison', authenticateUser, async (req, res) => {
   try {
      const { data: assessments } = await supabase.from('assessments')
         .select('id, score_percentage, completed_at').eq('user_id', req.user.id).eq('status', 'completed')
         .order('completed_at', { ascending: false }).limit(2);
         
      if (!assessments || assessments.length < 2) return res.json({ success: true, hasComparison: false });
      
      const [current, previous] = assessments;
      const { data: currentScores } = await supabase.from('assessment_skill_scores').select('skill_id, score_percentage').eq('assessment_id', current.id);
      const { data: previousScores } = await supabase.from('assessment_skill_scores').select('skill_id, score_percentage').eq('assessment_id', previous.id);
      
      res.json({
         success: true, 
         hasComparison: true,
         current: { 
           id: current.id, 
           overall: Number(current.score_percentage || 0), 
           scores: Array.isArray(currentScores) ? currentScores : [] 
         },
         previous: { 
           id: previous.id, 
           overall: Number(previous.score_percentage || 0), 
           scores: Array.isArray(previousScores) ? previousScores : [] 
         }
      });
   } catch(err) {
      res.status(500).json({ success: false, message: err.message, hasComparison: false });
   }
});

/**
 * GET /api/assessment/user/latest
 */
app.get('/api/assessment/user/latest', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id
    const { data: assessment } = await supabase
      .from('assessments')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!assessment) {
      return res.json({ success: true, latestAssessment: null })
    }

    const { data: skillScores } = await supabase
      .from('assessment_skill_scores')
      .select('skill_id, questions_count, correct_count, score_percentage')
      .eq('assessment_id', assessment.id)

    const { data: skillsCatalog } = await supabase.from('skills').select('id, name')
    const skillMap = new Map((skillsCatalog || []).map((s) => [s.id, s.name]))

    const detailedSkillScores = (skillScores || []).map((ss) => ({
      skillId: ss.skill_id,
      skillName: skillMap.get(ss.skill_id) || 'Skill',
      percentage: Number(ss.score_percentage)
    }))

    const { data: analysis } = await supabase
      .from('assessment_analyses')
      .select('summary, strengths, areas_to_improve')
      .eq('assessment_id', assessment.id)
      .maybeSingle()

    res.json({
      success: true,
      latestAssessment: {
        assessmentId: assessment.id,
        assessment_type: assessment.assessment_type || 'initial',
        overallScore: Number(assessment.score_percentage || 0),
        totalQuestions: assessment.total_questions,
        correctAnswers: assessment.correct_answers,
        completedAt: assessment.completed_at,
        skillScores: detailedSkillScores,
        strengths: analysis?.strengths || [],
        areasToImprove: analysis?.areas_to_improve || []
      }
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
});

/**
 * GET /api/assessment/user/workflow-status
 * Dynamically computes the full 4-stage competency workflow status and achievement status
 * from real user database records.
 */
app.get('/api/assessment/user/workflow-status', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const profile = await resolveEmployeeProfile(req.user);

    // Stage 1: Profile & Skills
    let profileCompleted = false;
    let skillsCount = 0;
    if (profile && profile.designation_id && profile.name) {
      const { count } = await supabase
        .from('employee_skills')
        .select('id', { count: 'exact', head: true })
        .eq('employee_profile_id', profile.id);
      skillsCount = count || 0;
      profileCompleted = skillsCount > 0;
    }

    // Stage 2: Initial AI Assessment
    const { data: allUserAssessments, error: assessErr } = await supabase
      .from('assessments')
      .select('id, assessment_type, score_percentage, total_questions, correct_answers, completed_at, status')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false });

    if (assessErr) throw assessErr;

    const completedAssessments = allUserAssessments || [];
    const initialAssessment = completedAssessments.find(a => a.assessment_type === 'initial') || completedAssessments[completedAssessments.length - 1];
    const initialAssessmentCompleted = Boolean(initialAssessment);

    // Stage 3: Skill Gap Analysis
    let skillGapAnalysisCompleted = false;
    let gapsCount = 0;
    if (initialAssessment) {
      const { data: gaps } = await supabase
        .from('skill_gaps')
        .select('id, priority, gap_percentage')
        .eq('assessment_id', initialAssessment.id);
      
      gapsCount = gaps?.length || 0;
      skillGapAnalysisCompleted = gapsCount > 0;
    }

    // Stage 4: Learning / iGOT Reassessment
    const reassessment = completedAssessments.find(a => a.assessment_type === 'reassessment');
    const reassessmentCompleted = Boolean(reassessment);

    // Full Cycle Complete
    const isCycleFullyCompleted = Boolean(profileCompleted && initialAssessmentCompleted && skillGapAnalysisCompleted && reassessmentCompleted);

    // Real Achievements & Badges calculation
    const allSkillScores = [];
    if (completedAssessments.length > 0) {
      const assessIds = completedAssessments.map(a => a.id);
      const { data: scores } = await supabase
        .from('assessment_skill_scores')
        .select('assessment_id, skill_id, score_percentage')
        .in('assessment_id', assessIds);
      if (scores) allSkillScores.push(...scores);
    }

    const hasAnyAssessment = completedAssessments.length > 0;
    const hasHighScore = completedAssessments.some(a => Number(a.score_percentage || 0) >= 80);
    const hasPerfectSkill = allSkillScores.some(s => Number(s.score_percentage || 0) === 100);
    const hasGapRegistered = skillGapAnalysisCompleted;
    const hasReassessment = reassessmentCompleted;
    const hasFullCycle = isCycleFullyCompleted;

    // Calculate total accumulated XP from all completed activities
    let totalXp = 0;
    completedAssessments.forEach(a => {
      const scorePct = Number(a.score_percentage || 0);
      const correct = Number(a.correct_answers || 0);
      totalXp += Math.round(scorePct * 10) + (correct * 25) + (a.assessment_type === 'reassessment' ? 150 : 100);
    });

    if (hasFullCycle) {
      totalXp += 500; // Bonus for completing entire competency workflow cycle!
    }

    res.json({
      success: true,
      workflow: {
        stage1_profile: {
          completed: profileCompleted,
          title: 'Profile & Skills',
          description: profileCompleted ? `${skillsCount} skills mapped to designation` : 'Incomplete profile or skills',
          skillsCount
        },
        stage2_assessment: {
          completed: initialAssessmentCompleted,
          title: 'AI Competency Assessment',
          description: initialAssessmentCompleted ? `Completed (${Math.round(initialAssessment.score_percentage)}%)` : 'Pending initial evaluation',
          score: initialAssessment ? Number(initialAssessment.score_percentage) : null
        },
        stage3_skillGaps: {
          completed: skillGapAnalysisCompleted,
          title: 'Skill Gap Analysis',
          description: skillGapAnalysisCompleted ? `${gapsCount} competency benchmarks evaluated` : 'Pending assessment completion',
          gapsCount
        },
        stage4_reassessment: {
          completed: reassessmentCompleted,
          title: 'Learning / iGOT Reassessment',
          description: reassessmentCompleted ? `Reassessment verified (${Math.round(reassessment.score_percentage)}%)` : 'Ready for adaptive re-evaluation',
          score: reassessment ? Number(reassessment.score_percentage) : null
        },
        isCycleFullyCompleted
      },
      achievements: [
        { id: 'first_assessment', title: 'First Step', icon: '🎯', description: 'Completed your first official AI competency assessment', earned: hasAnyAssessment },
        { id: 'high_scorer', title: 'Merit Holder', icon: '🌟', description: 'Achieved 80% or higher overall competency score', earned: hasHighScore },
        { id: 'perfectionist', title: 'Flawless Section', icon: '🏆', description: 'Scored 100% on at least one statistical skill domain', earned: hasPerfectSkill },
        { id: 'gap_closer', title: 'Active Learner', icon: '📚', description: 'Identified competency benchmarks and registered for learning', earned: hasGapRegistered },
        { id: 'reassessment_ready', title: 'Resilient Analyst', icon: '🔄', description: 'Participated in a competency reassessment cycle', earned: hasReassessment },
        { id: 'cycle_master', title: 'Cycle Master', icon: '👑', description: 'Successfully completed the entire 4-stage MoSPI competency cycle', earned: hasFullCycle }
      ],
      totalXp
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});


/**
 * GET /api/assessment/user/history
 */
app.get('/api/assessment/user/history', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id
    const { data: assessments, error } = await supabase
      .from('assessments')
      .select('id, score_percentage, total_questions, correct_answers, completed_at, started_at')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })

    if (error) throw error

    const history = (assessments || []).map((a) => ({
      id: a.id,
      assessmentId: a.id,
      completedAt: a.completed_at || a.started_at,
      overallScore: Number(a.score_percentage || 0),
      totalQuestions: a.total_questions,
      correctAnswers: a.correct_answers
    }))

    res.json({
      success: true,
      history
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, history: [] })
  }
});

/**
 * GET /api/assessment/result/:assessmentId
 */
app.get('/api/assessment/result/:assessmentId', authenticateUser, async (req, res) => {
  try {
    const { assessmentId } = req.params
    const userId = req.user.id

    const { data: assessment, error: aErr } = await supabase
      .from('assessments')
      .select('*')
      .eq('id', assessmentId)
      .eq('user_id', userId)
      .maybeSingle()

    if (aErr || !assessment) {
      return res.status(404).json({ success: false, message: 'Assessment result not found or access denied.' })
    }

    const { data: skillScores } = await supabase
      .from('assessment_skill_scores')
      .select('skill_id, questions_count, correct_count, score_percentage')
      .eq('assessment_id', assessmentId)

    const { data: skillsCatalog } = await supabase.from('skills').select('id, name, category')
    const skillMap = new Map((skillsCatalog || []).map((s) => [s.id, s]))

    const detailedSkillScores = (skillScores || []).map((ss) => {
      const sObj = skillMap.get(ss.skill_id)
      return {
        skillId: ss.skill_id,
        skillName: sObj ? sObj.name : 'Skill',
        category: sObj?.category || 'General',
        questionsCount: ss.questions_count,
        correctCount: ss.correct_count,
        percentage: Number(ss.score_percentage)
      }
    })

    const { data: analysis } = await supabase
      .from('assessment_analyses')
      .select('summary, strengths, areas_to_improve, priority_skills')
      .eq('assessment_id', assessmentId)
      .maybeSingle()

    res.json({
      success: true,
      result: {
        assessmentId,
        overallScore: Number(assessment.score_percentage || 0),
        totalQuestions: assessment.total_questions,
        correctAnswers: assessment.correct_answers,
        completedAt: assessment.completed_at,
        skillScores: detailedSkillScores,
        analysis
      }
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
});

/**
 * GET /api/assessment/active-session
 * Checks if the user has an active or recently terminated assessment attempt.
 * Guarantees persistent warning count & lockouts across page refreshes and URL direct visits.
 */
app.get('/api/assessment/active-session', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const { data: assessment } = await supabase
      .from('assessments')
      .select('*')
      .eq('user_id', userId)
      .in('status', ['in_progress', 'terminated'])
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!assessment) {
      return res.json({ success: true, hasActiveSession: false, assessment: null });
    }

    const { data: violations } = await supabase
      .from('assessment_violations')
      .select('id, violation_type, warning_number, created_at')
      .eq('assessment_id', assessment.id)
      .order('created_at', { ascending: true });

    res.json({
      success: true,
      hasActiveSession: true,
      assessment,
      warningCount: assessment.warning_count || (violations || []).length || 0,
      violations: violations || []
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/assessment/:assessmentId (Wildcard route placed AFTER static routes!)
 */
app.get('/api/assessment/:assessmentId', authenticateUser, async (req, res) => {
  try {
    const { assessmentId } = req.params
    const userId = req.user.id

    const { data: assessment, error: aErr } = await supabase
      .from('assessments')
      .select('*')
      .eq('id', assessmentId)
      .eq('user_id', userId)
      .maybeSingle()

    if (aErr || !assessment) {
      return res.status(404).json({ success: false, message: 'Assessment not found or access denied.' })
    }

    const { data: questions } = await supabase
      .from('assessment_questions')
      .select('id, skill_id, question_text, options, difficulty, question_order')
      .eq('assessment_id', assessmentId)
      .order('question_order', { ascending: true })

    const { data: violations } = await supabase
      .from('assessment_violations')
      .select('id, violation_type, warning_number, created_at')
      .eq('assessment_id', assessmentId)
      .order('created_at', { ascending: true })

    const { data: allSkills } = await supabase.from('skills').select('id, name')
    const skillsMap = new Map((allSkills || []).map((s) => [s.id, s.name]))

    res.json({
      success: true,
      assessment,
      warningCount: assessment.warning_count || (violations || []).length || 0,
      violations: violations || [],
      questions: (questions || []).map((q) => ({
        id: q.id,
        skillId: q.skill_id,
        skillName: skillsMap.get(q.skill_id) || 'Skill',
        questionText: q.question_text,
        options: q.options,
        difficulty: q.difficulty,
        questionOrder: q.question_order
      }))
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
});

/**
 * POST /api/assessment/:assessmentId/violation
 * Logs proctoring violations and enforces the 3-warning limit.
 * Warning 1: Logged, assessment continues.
 * Warning 2: Logged, assessment continues with strong warning.
 * Warning 3: Assessment immediately terminated.
 */
app.post('/api/assessment/:assessmentId/violation', authenticateUser, async (req, res) => {
  try {
    const { assessmentId } = req.params;
    const userId = req.user.id;
    const { violationType, metadata } = req.body;

    const validViolations = [
      'CAMERA_DENIED', 'CAMERA_DISCONNECTED', 'CAMERA_INTERRUPTED', 
      'TAB_SWITCH', 'WINDOW_BLUR', 'FULLSCREEN_EXIT',
      'FACE_NOT_DETECTED', 'MULTIPLE_FACES',
      'tab_switch', 'window_blur', 'fullscreen_exit', 'camera_disabled'
    ];
    if (!validViolations.includes(violationType)) {
      return res.status(400).json({ success: false, message: 'Invalid violation type.' });
    }

    const { data: assessment, error: aErr } = await supabase
      .from('assessments')
      .select('id, status, warning_count')
      .eq('id', assessmentId)
      .eq('user_id', userId)
      .maybeSingle();

    if (aErr || !assessment) {
      return res.status(404).json({ success: false, message: 'Assessment not found or access denied.' });
    }

    if (assessment.status === 'terminated') {
      return res.json({ success: true, warningNumber: 3, terminated: true, message: 'Assessment is already terminated.' });
    }

    if (assessment.status !== 'in_progress') {
      return res.status(400).json({ success: false, message: 'Assessment is not currently active.' });
    }

    // Count existing violations from database to guarantee tamper-proof tracking
    const { count: existingCount } = await supabase
      .from('assessment_violations')
      .select('*', { count: 'exact', head: true })
      .eq('assessment_id', assessmentId);

    const warningNumber = Math.min(3, (existingCount || 0) + 1);

    // Record violation in database
    await supabase.from('assessment_violations').insert({
      assessment_id: assessmentId,
      user_id: userId,
      violation_type: violationType,
      warning_number: warningNumber,
      metadata: metadata || {}
    });

    const isTerminated = warningNumber >= 3;

    if (isTerminated) {
      await supabase.from('assessments').update({
        warning_count: warningNumber,
        status: 'terminated',
        termination_reason: violationType,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }).eq('id', assessmentId);

      return res.json({
        success: true,
        warningNumber: 3,
        terminated: true,
        violationType,
        message: 'Assessment has been terminated due to reaching 3 proctoring violations.'
      });
    } else {
      await supabase.from('assessments').update({
        warning_count: warningNumber,
        updated_at: new Date().toISOString()
      }).eq('id', assessmentId);

      return res.json({
        success: true,
        warningNumber,
        terminated: false,
        violationType,
        message: `Warning ${warningNumber} of 3 recorded.`
      });
    }
  } catch (err) {
    console.error('Violation recording error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/assessment/:assessmentId/terminate
 * Manual or client-confirmed termination
 */
app.post('/api/assessment/:assessmentId/terminate', authenticateUser, async (req, res) => {
  try {
    const { assessmentId } = req.params;
    const userId = req.user.id;
    const { reason } = req.body;

    const { data: assessment, error: aErr } = await supabase
      .from('assessments')
      .select('id, status')
      .eq('id', assessmentId)
      .eq('user_id', userId)
      .maybeSingle();

    if (aErr || !assessment) {
      return res.status(404).json({ success: false, message: 'Assessment not found or access denied.' });
    }

    await supabase.from('assessments').update({
      status: 'terminated',
      termination_reason: reason || 'manual_cancellation',
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }).eq('id', assessmentId);

    res.json({ success: true, terminated: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/assessment/proctoring/vision-verify
 * Optional backend vision verification endpoint (Layer 3 fallback).
 * Accepts occasional base64 still frames only when local face detection is unavailable.
 */
app.post('/api/assessment/proctoring/vision-verify', authenticateUser, async (req, res) => {
  try {
    const { imageBase64 } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ success: false, message: 'Missing imageBase64 payload.' });
    }
    const groqClient = require('./groqClient');
    const result = await groqClient.analyzeProctoringFrame(imageBase64);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/assessment/start-new
 */
app.post('/api/assessment/start-new', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const requestedType = req.body?.assessmentType;

    const profile = await resolveEmployeeProfile(req.user);
    if (!profile) return res.status(400).json({ success: false, message: 'Profile missing' });

    const { data: empSkills } = await supabase.from('employee_skills').select('skill_id').eq('employee_profile_id', profile.id);
    let skillIds = (empSkills || []).map(s => s.skill_id);

    if (skillIds.length === 0 && profile.designation_id) {
       const { data: desigSkills } = await supabase.from('designation_skills').select('skill_id').eq('designation_id', profile.designation_id);
       if (desigSkills && desigSkills.length > 0) {
          skillIds = desigSkills.map(s => s.skill_id);
       }
    }

    if (skillIds.length === 0) {
       const { data: topSkills } = await supabase.from('skills').select('id').limit(4);
       if (topSkills && topSkills.length > 0) {
          skillIds = topSkills.map(s => s.id);
       }
    }

    if (skillIds.length === 0) return res.status(400).json({ success: false, message: 'No skills found' });

    const totalQuestions = Math.min(15, skillIds.length * 2);

    // Determine type (initial or reassessment)
    let assessmentType = requestedType || 'initial';
    if (!requestedType) {
      const { count } = await supabase.from('assessments').select('*', { count: 'exact', head: true }).eq('user_id', userId).eq('status', 'completed');
      if (count && count > 0) assessmentType = 'reassessment';
    }

    // Reuse active in-progress assessment if one already exists to prevent duplicate attempts
    const { data: existingActive } = await supabase
      .from('assessments')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'in_progress')
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (existingActive) {
      return res.json({
        success: true,
        assessmentId: existingActive.id,
        totalQuestions: existingActive.total_questions || totalQuestions,
        assessmentType: existingActive.assessment_type || assessmentType,
        isExisting: true
      });
    }

    const { data: assessment, error: createErr } = await supabase
      .from('assessments')
      .insert({
        user_id: userId,
        employee_profile_id: profile.id,
        assessment_type: assessmentType,
        status: 'in_progress',
        total_questions: totalQuestions,
        started_at: new Date().toISOString()
      })
      .select('*').single();

    if (createErr || !assessment) throw createErr;

    res.json({ success: true, assessmentId: assessment.id, totalQuestions, assessmentType });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/assessment/:assessmentId/next-question
 */
app.post('/api/assessment/:assessmentId/next-question', authenticateUser, async (req, res) => {
  const { assessmentId } = req.params;
  const userId = req.user.id;

  if (activeGenerations.has(assessmentId)) {
    return res.status(429).json({ success: false, message: 'Question generation already in progress.' });
  }
  activeGenerations.add(assessmentId);

  try {
    const { assessmentId } = req.params;
    const userId = req.user.id;
    
    const { data: assessment } = await supabase.from('assessments').select('*').eq('id', assessmentId).eq('user_id', userId).maybeSingle();
    if (!assessment || assessment.status !== 'in_progress') return res.status(400).json({ success: false, message: 'Invalid or already completed assessment' });

    const { data: existingQuestions } = await supabase.from('assessment_questions').select('*').eq('assessment_id', assessmentId).order('question_order', { ascending: true });
    const { data: answers } = await supabase.from('assessment_answers').select('*').eq('assessment_id', assessmentId);
    
    const answeredQIds = (answers || []).map(a => a.question_id);
    const unansweredQuestions = (existingQuestions || []).filter(q => !answeredQIds.includes(q.id));

    if (unansweredQuestions.length > 0) {
      const q = unansweredQuestions[0];
      const { data: skillObj } = await supabase.from('skills').select('name').eq('id', q.skill_id).single();
      return res.json({
        success: true, complete: false,
        question: { id: q.id, skillId: q.skill_id, skillName: skillObj ? skillObj.name : 'Skill', questionText: q.question_text, options: q.options, difficulty: q.difficulty, questionOrder: q.question_order }
      });
    }

    if ((existingQuestions || []).length >= assessment.total_questions) {
       return res.json({ success: true, complete: true });
    }

    const { data: empSkills } = await supabase.from('employee_skills').select('skill_id').eq('employee_profile_id', assessment.employee_profile_id);
    const skillIds = (empSkills || []).map(s => s.skill_id);
    
    const skillCounts = {};
    skillIds.forEach(id => skillCounts[id] = 0);
    (existingQuestions || []).forEach(q => { if (skillCounts[q.skill_id] !== undefined) skillCounts[q.skill_id]++; });
    
    let nextSkillId = skillIds[0];
    let minCount = Infinity;
    skillIds.forEach(id => {
       if (skillCounts[id] < minCount) { minCount = skillCounts[id]; nextSkillId = id; }
    });

    const { data: nextSkill } = await supabase.from('skills').select('id, name').eq('id', nextSkillId).single();

    let nextDiff = 'medium';
    if (answers && answers.length > 0) {
       const lastAnswersForSkill = answers.filter(a => {
           const q = existingQuestions.find(eq => eq.id === a.question_id);
           return q && q.skill_id === nextSkillId;
       });
       const targetAnswer = lastAnswersForSkill.length > 0 ? lastAnswersForSkill[lastAnswersForSkill.length - 1] : answers[answers.length - 1];
       const lastQuestion = existingQuestions.find(q => q.id === targetAnswer.question_id);
       if (lastQuestion) {
          const oldDiff = lastQuestion.difficulty || 'medium';
          nextDiff = targetAnswer.is_correct ? (oldDiff === 'easy' ? 'medium' : 'hard') : (oldDiff === 'hard' ? 'medium' : 'easy');
       }
    }

    // STRICT USER DEDUPLICATION: Fetch all past questions generated for THIS user across ALL attempts
    const { data: userAssessments } = await supabase.from('assessments').select('id').eq('user_id', userId);
    const userAssessmentIds = (userAssessments || []).map(a => a.id);

    let previousTexts = [];
    let previousFingerprints = [];
    if (userAssessmentIds.length > 0) {
      const { data: allPastQuestions } = await supabase
        .from('assessment_questions')
        .select('question_text, fingerprint')
        .in('assessment_id', userAssessmentIds);

      previousTexts = (allPastQuestions || []).map(q => q.question_text).filter(Boolean);
      previousFingerprints = (allPastQuestions || []).map(q => q.fingerprint).filter(Boolean);
    }

    const groqClient = require('./groqClient');
    const lang = req.headers['accept-language'] || 'en';
    const qData = await groqClient.generateAdaptiveQuestion(nextSkill, nextDiff, previousTexts, previousFingerprints, lang);
    
    const { data: insertedQ, error: iErr } = await supabase.from('assessment_questions').insert({
       assessment_id: assessmentId, skill_id: nextSkill.id, question_text: qData.question_text, options: qData.options,
       correct_answer: qData.correct_answer, explanation: qData.explanation, difficulty: qData.difficulty || nextDiff,
       question_order: (existingQuestions || []).length + 1, fingerprint: qData.fingerprint
    }).select('*').single();

    if (iErr || !insertedQ) throw iErr || new Error("Failed to save question");

    res.json({
      success: true, complete: false,
      question: { id: insertedQ.id, skillId: insertedQ.skill_id, skillName: nextSkill.name, questionText: insertedQ.question_text, options: insertedQ.options, difficulty: insertedQ.difficulty, questionOrder: insertedQ.question_order }
    });

  } catch (err) {
    console.error("Next question error:", err);
    res.status(500).json({ success: false, message: err.message });
  } finally {
    activeGenerations.delete(assessmentId);
  }
});

app.post('/api/assessment/:assessmentId/answer', authenticateUser, async (req, res) => {
  try {
    const { assessmentId } = req.params;
    const { questionId, selectedAnswer } = req.body;
    const userId = req.user.id;

    if (!questionId || typeof selectedAnswer !== 'string') {
      return res.status(400).json({ success: false, message: 'Missing questionId or selectedAnswer in request payload.' });
    }

    const { data: assessment } = await supabase
      .from('assessments')
      .select('status')
      .eq('id', assessmentId)
      .eq('user_id', userId)
      .maybeSingle();

    if (!assessment || assessment.status !== 'in_progress') {
      return res.status(403).json({
        success: false,
        terminated: assessment?.status === 'terminated',
        message: 'Assessment is not in progress or has been terminated.'
      });
    }
    
    const { data: question, error: qErr } = await supabase
      .from('assessment_questions')
      .select('id, correct_answer')
      .eq('id', questionId)
      .eq('assessment_id', assessmentId)
      .maybeSingle();

    if (qErr || !question) {
      return res.status(404).json({ success: false, message: 'Question not found for this active assessment.' });
    }

    const isCorrect = (String(selectedAnswer).trim().toLowerCase() === String(question.correct_answer || '').trim().toLowerCase());

    await supabase.from('assessment_answers').upsert({
      assessment_id: assessmentId,
      question_id: questionId,
      selected_answer: selectedAnswer,
      is_correct: isCorrect,
      answered_at: new Date().toISOString()
    }, { onConflict: 'assessment_id, question_id' });

    res.json({ success: true, isCorrect });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/assessment/:assessmentId/submit
 * Reads answered questions from assessment_answers table directly!
 */
app.post('/api/assessment/:assessmentId/submit', authenticateUser, async (req, res) => {
  try {
    const { assessmentId } = req.params;
    const userId = req.user.id;

    const { data: assessment } = await supabase.from('assessments').select('*').eq('id', assessmentId).eq('user_id', userId).maybeSingle();
    if (!assessment) return res.status(404).json({ success: false, message: 'Assessment not found' });

    if (assessment.status === 'terminated') {
      return res.status(403).json({
        success: false,
        terminated: true,
        message: 'Assessment was terminated due to proctoring violations and cannot be submitted.'
      });
    }

    // IDEMPOTENCY CHECK: If already completed, return existing score immediately
    if (assessment.status === 'completed') {
      return res.json({ success: true, overallPercentage: assessment.score_percentage || assessment.total_score || 0 });
    }

    const { data: questions } = await supabase.from('assessment_questions').select('*').eq('assessment_id', assessmentId);
    const { data: answers } = await supabase.from('assessment_answers').select('*').eq('assessment_id', assessmentId);

    let correctCount = 0;
    const skillStats = {};

    (questions || []).forEach(q => {
       const answer = (answers || []).find(a => a.question_id === q.id);
       const isCorrect = answer ? answer.is_correct : false;
       if (isCorrect) correctCount++;
       
       if (!skillStats[q.skill_id]) skillStats[q.skill_id] = { total: 0, correct: 0 };
       skillStats[q.skill_id].total++;
       if (isCorrect) skillStats[q.skill_id].correct++;
    });

    const totalQuestions = questions ? questions.length : 0;
    const overallPercentage = totalQuestions > 0 ? Number(((correctCount / totalQuestions) * 100).toFixed(2)) : 0;

    const skillScoreRows = [];
    const skillScoresSummary = [];
    const { data: skillsCatalog } = await supabase.from('skills').select('id, name');
    const skillNameMap = new Map((skillsCatalog || []).map((s) => [s.id, s.name]));

    for (const [skillId, stats] of Object.entries(skillStats)) {
      const pct = stats.total > 0 ? Number(((stats.correct / stats.total) * 100).toFixed(2)) : 0;
      skillScoreRows.push({
        assessment_id: assessmentId,
        skill_id: skillId,
        questions_count: stats.total,
        correct_count: stats.correct,
        score_percentage: pct
      });
      skillScoresSummary.push({
        skill_id: skillId,
        skill_name: skillNameMap.get(skillId) || 'Skill',
        questions_count: stats.total,
        correct_count: stats.correct,
        score_percentage: pct
      });
    }

    if (skillScoreRows.length > 0) {
      await supabase.from('assessment_skill_scores').upsert(skillScoreRows, { onConflict: 'assessment_id, skill_id' });
    }

    const completedAt = new Date().toISOString();
    await supabase.from('assessments').update({
      status: 'completed',
      total_score: overallPercentage,
      score_percentage: overallPercentage,
      total_questions: totalQuestions,
      correct_answers: correctCount,
      completed_at: completedAt,
      updated_at: completedAt
    }).eq('id', assessmentId);

    // Compute Skill Gaps & Recommendations (Local DB calculation)
    await computeAndStoreSkillGaps(userId, assessmentId, supabase);

    // ZERO AI API CALLS DURING SUBMIT: Fast Rule-Based Assessment Analysis
    const strengths = skillScoresSummary.filter((s) => s.score_percentage >= 80).map((s) => s.skill_name);
    const areasToImprove = skillScoresSummary.filter((s) => s.score_percentage < 60).map((s) => s.skill_name);
    const prioritySkills = skillScoresSummary
      .filter((s) => s.score_percentage < 60)
      .sort((a, b) => a.score_percentage - b.score_percentage)
      .map((s) => s.skill_name);

    const lang = req.headers['accept-language'] || 'en';
    let summaryText = '';
    
    if (lang === 'hi') {
      summaryText = `कर्मचारी ने कुल मिलाकर ${overallPercentage}% (${totalQuestions} में से ${correctCount} प्रश्न सही) स्कोर किया। ${
        strengths.length > 0 ? `निम्नलिखित में मजबूत दक्षता प्रदर्शित करता है: ${strengths.join(', ')}।` : 'मूल्यांकन की गई योग्यताओं में सुधार की गुंजाइश है।'
      } ${
        areasToImprove.length > 0 ? `${areasToImprove.join(', ')} में लक्षित प्रशिक्षण की सिफारिश की जाती है।` : 'मूल्यांकन किए गए क्षेत्रों में ठोस सांख्यिकीय प्रदर्शन बनाए रखा।'
      }`;
    } else if (lang === 'mr') {
      summaryText = `कर्मचाऱ्याने एकूण ${overallPercentage}% (${totalQuestions} पैकी ${correctCount} प्रश्न बरोबर) गुण मिळवले आहेत. ${
        strengths.length > 0 ? `खालील गोष्टींमध्ये मजबूत प्राविण्य दर्शवते: ${strengths.join(', ')}.` : 'मूल्यांकन केलेल्या क्षमतांमध्ये सुधारणेला वाव आहे.'
      } ${
        areasToImprove.length > 0 ? `${areasToImprove.join(', ')} मध्ये लक्ष्यित प्रशिक्षणाची शिफारस केली जाते.` : 'मूल्यांकन केलेल्या क्षेत्रांमध्ये भक्कम सांख्यिकीय कामगिरी राखली आहे.'
      }`;
    } else {
      summaryText = `The employee scored ${overallPercentage}% overall (${correctCount} of ${totalQuestions} questions correct). ${
        strengths.length > 0 ? `Demonstrates strong proficiency in ${strengths.join(', ')}.` : 'Performance shows scope for improvement across evaluated competencies.'
      } ${
        areasToImprove.length > 0 ? `Targeted training is recommended in ${areasToImprove.join(', ')}.` : 'Solid statistical performance maintained across evaluated areas.'
      }`;
    }

    await supabase.from('assessment_analyses').upsert({
      assessment_id: assessmentId,
      summary: summaryText,
      strengths: strengths,
      areas_to_improve: areasToImprove,
      priority_skills: prioritySkills
    }, { onConflict: 'assessment_id' });

    res.setHeader('Content-Type', 'application/json');
    res.json({
      success: true,
      assessment_attempt_id: assessmentId,
      overall_score: overallPercentage,
      overallPercentage
    });
  } catch (err) {
    console.error('Submit assessment error:', err);
    res.setHeader('Content-Type', 'application/json');
    res.status(500).json({ success: false, error: 'Database/Server Error', message: err.message });
  }
});

async function computeAndStoreSkillGaps(userId, assessmentId, supabaseClient) {
  try {
    const profile = await resolveEmployeeProfile({ id: userId });
    const designationId = profile?.designation_id || null;

    const { data: skillScores } = await supabaseClient
      .from('assessment_skill_scores')
      .select('skill_id, score_percentage')
      .eq('assessment_id', assessmentId);

    if (!skillScores || skillScores.length === 0) return;

    let reqSkillsMap = new Map();
    if (designationId) {
      const { data: reqRows } = await supabaseClient
        .from('designation_skills')
        .select('skill_id, required_level, importance')
        .eq('designation_id', designationId);

      if (reqRows && reqRows.length > 0) {
        reqSkillsMap = new Map(reqRows.map((r) => [r.skill_id, (r.required_level || 4) * 20]));
      }
    }

    const skillGapRows = [];
    const gapSkillIds = [];

    for (const ss of skillScores) {
      const assessedPct = Number(ss.score_percentage);
      const requiredPct = reqSkillsMap.get(ss.skill_id) || 80.00;
      const gapPct = Math.max(0, Number((requiredPct - assessedPct).toFixed(2)));

      let priority = 'Low';
      if (gapPct >= 25 || assessedPct < 60) {
        priority = 'High';
      } else if (gapPct >= 10 || assessedPct < 75) {
        priority = 'Medium';
      }

      skillGapRows.push({
        user_id: userId,
        assessment_id: assessmentId,
        skill_id: ss.skill_id,
        assessed_score: assessedPct,
        required_score: requiredPct,
        gap_percentage: gapPct,
        priority,
        updated_at: new Date().toISOString()
      });

      if (gapPct > 0) {
        gapSkillIds.push({ skillId: ss.skill_id, priority, assessedPct, requiredPct, gapPct });
      }
    }

    if (skillGapRows.length > 0) {
      await supabaseClient
        .from('skill_gaps')
        .upsert(skillGapRows, { onConflict: 'assessment_id, skill_id' });
    }

    if (gapSkillIds.length > 0) {
      const { data: catalogCourses } = await supabaseClient
        .from('courses')
        .select('id, skill_id, title, provider');

      if (catalogCourses && catalogCourses.length > 0) {
        const recMap = new Map();

        for (const gItem of gapSkillIds) {
          const matched = catalogCourses.filter((c) => c.skill_id === gItem.skillId);

          for (const c of matched) {
            const pVal = gItem.priority === 'High' ? 1 : gItem.priority === 'Medium' ? 2 : 3;
            recMap.set(c.id, {
              user_id: userId,
              assessment_id: assessmentId,
              skill_id: gItem.skillId,
              course_id: c.id,
              reason: `Recommended to close ${gItem.priority} Priority Skill Gap (Assessed: ${gItem.assessedPct}%, Required: ${gItem.requiredPct}%)`,
              priority: pVal
            });
          }
        }

        const recRows = Array.from(recMap.values());
        if (recRows.length > 0) {
          await supabaseClient
            .from('recommendations')
            .upsert(recRows, { onConflict: 'user_id, course_id' });
        }
      }
    }
  } catch (err) {
    console.error('Error computing skill gaps & recommendations:', err);
  }
}

/* ==========================================================================
   STAGE 3 — SKILL-GAP & RECOMMENDATIONS API
   ========================================================================== */

/**
 * GET /api/skill-gap/latest
 */
app.get('/api/skill-gap/latest', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id
    const { data: latestAssessment } = await supabase
      .from('assessments')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!latestAssessment) {
      return res.json({ success: true, skillGaps: [], summary: { high: 0, medium: 0, low: 0 } })
    }

    const { data: gaps } = await supabase
      .from('skill_gaps')
      .select('id, skill_id, assessed_score, required_score, gap_percentage, priority, updated_at')
      .eq('assessment_id', latestAssessment.id)

    const { data: skillsCatalog } = await supabase.from('skills').select('id, name, category')
    const skillMap = new Map((skillsCatalog || []).map((s) => [s.id, s]))

    const detailedGaps = (gaps || []).map((g) => {
      const sk = skillMap.get(g.skill_id)
      return {
        id: g.id,
        skillId: g.skill_id,
        skillName: sk?.name || 'Skill',
        skillCategory: sk?.category || 'General',
        assessedScore: Number(g.assessed_score),
        requiredScore: Number(g.required_score),
        gapPercentage: Number(g.gap_percentage),
        priority: g.priority
      }
    })

    const summary = {
      high: detailedGaps.filter((g) => g.priority === 'High').length,
      medium: detailedGaps.filter((g) => g.priority === 'Medium').length,
      low: detailedGaps.filter((g) => g.priority === 'Low').length
    }

    res.json({
      success: true,
      assessmentId: latestAssessment.id,
      skillGaps: detailedGaps,
      summary
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, skillGaps: [] })
  }
});

/**
 * GET /api/recommendations/user
 */
app.get('/api/recommendations/user', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id
    
    // Check if user has a completed assessment
    const { data: latestAssessment } = await supabase
      .from('assessments')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!latestAssessment) {
      return res.json({ success: true, recommendations: [] })
    }

    const { data: recs } = await supabase
      .from('recommendations')
      .select('id, skill_id, course_id, reason, priority, created_at')
      .eq('user_id', userId)
      .eq('assessment_id', latestAssessment.id)

    if (!recs || recs.length === 0) {
      return res.json({ success: true, recommendations: [] })
    }

    const courseIds = recs.map((r) => r.course_id)
    const skillIds = recs.map((r) => r.skill_id)

    const { data: courses } = await supabase
      .from('courses')
      .select('id, title, provider, description, level, external_url, source_type')
      .in('id', courseIds)

    const { data: skills } = await supabase
      .from('skills')
      .select('id, name')
      .in('id', skillIds)

    const courseMap = new Map((courses || []).map((c) => [c.id, c]))
    const skillMap = new Map((skills || []).map((s) => [s.id, s.name]))

    const detailedRecs = recs.map((r) => {
      const c = courseMap.get(r.course_id) || {}
      return {
        id: r.id,
        courseId: r.course_id,
        title: c.title || 'Official Skill Development Module',
        provider: c.provider || 'NSSTA / iGOT Karmayogi',
        description: c.description || '',
        level: c.level || 'intermediate',
        externalUrl: c.external_url || 'https://igotkarmayogi.gov.in/',
        sourceType: c.source_type || 'iGOT',
        skillId: r.skill_id,
        skillName: skillMap.get(r.skill_id) || 'Skill',
        reason: r.reason || 'Recommended based on skill analysis',
        priority: r.priority === 1 ? 'High' : r.priority === 2 ? 'Medium' : 'Low'
      }
    })

    res.json({
      success: true,
      recommendations: detailedRecs
    })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message, recommendations: [] })
  }
});

// ==========================================
// AI MCQ GENERATOR ROUTE (Gemini Powered)
// ==========================================
app.post('/api/mcq/generate', (req, res, next) => {
  upload.single('pdf')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: 'The uploaded PDF file is too large. Maximum allowed size is 15MB.'
        });
      }
      return res.status(400).json({
        success: false,
        message: `File upload error: ${err.message}`
      });
    } else if (err) {
      return res.status(400).json({
        success: false,
        message: err.message || 'Invalid file uploaded. Only PDF files are accepted.'
      });
    }
    next();
  });
}, async (req, res) => {
  try {
    // 1. Validate PDF file presence
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({
        success: false,
        message: 'No PDF file was uploaded. Please select and upload a valid PDF document.'
      });
    }

    // 2. Validate question count and difficulty parameters
    const count = parseInt(req.body.count, 10) || 5;
    const allowedCounts = [5, 10, 15, 20];
    const finalCount = allowedCounts.includes(count) ? count : 5;

    const rawDifficulty = (req.body.difficulty || 'MEDIUM').toUpperCase();
    const allowedDifficulties = ['EASY', 'MEDIUM', 'HARD'];
    const difficulty = allowedDifficulties.includes(rawDifficulty) ? rawDifficulty : 'MEDIUM';

    console.log(`[MCQ-Generator] Starting generation: ${finalCount} questions, Difficulty: ${difficulty}, PDF: ${req.file.originalname} (${(req.file.size / 1024).toFixed(1)} KB)`);

    // 3. Generate MCQs using Gemini AI with grounding & validation
    const lang = req.headers['accept-language'] || 'en';
    const result = await generateMcqsFromPdf(req.file.buffer, {
      count: finalCount,
      difficulty: difficulty,
      language: lang
    });

    console.log(`[MCQ-Generator] Successfully generated ${result.count} MCQs`);

    return res.json({
      success: true,
      filename: req.file.originalname,
      count: result.count,
      requestedCount: result.requestedCount,
      difficulty: result.difficulty,
      totalPages: result.totalPages,
      model: result.model,
      note: result.note,
      mcqs: result.mcqs
    });
  } catch (err) {
    console.error('[MCQ-Generator] Error:', err.message);
    return res.status(500).json({
      success: false,
      message: err.message || 'An unexpected error occurred while generating MCQs. Please try again.'
    });
  }
});

/* ==========================================================================
   RESEARCH RECOMMENDATION ENGINE ENDPOINTS (COMPLETELY ISOLATED MODULE)
   ========================================================================== */

const fs = require('fs');
const FusionEngine = require('./research/fusionEngine');
const MetricsEngine = require('./research/metricsEngine');

let researchDataset = null;
let researchFusionEngine = null;
let researchMetricsEngine = null;

function loadResearchEngine() {
  if (!researchFusionEngine) {
    const seedPath = path.join(__dirname, 'data', 'research_seed.json');
    if (fs.existsSync(seedPath)) {
      researchDataset = JSON.parse(fs.readFileSync(seedPath, 'utf-8'));
      researchFusionEngine = new FusionEngine(researchDataset);
      researchMetricsEngine = new MetricsEngine(researchFusionEngine);
    }
  }
}

/**
 * GET /api/research/employees
 * Returns the list of 50 synthetic demo employees
 */
app.get('/api/research/employees', (req, res) => {
  try {
    loadResearchEngine();
    if (!researchDataset) return res.status(500).json({ success: false, message: 'Research dataset not initialized.' });

    res.json({
      success: true,
      metadata: researchDataset.metadata,
      employees: researchDataset.employees
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/research/employee/:id
 * Returns synthetic profile, skill scores, skill gaps, and assessment attempts
 */
app.get('/api/research/employee/:id', (req, res) => {
  try {
    loadResearchEngine();
    const { id } = req.params;
    const emp = researchDataset.employees.find(e => e.id === id || e.employee_id === id);
    if (!emp) return res.status(404).json({ success: false, message: 'Synthetic employee not found.' });

    const attempts = researchDataset.assessmentHistory.filter(a => a.employee_id === emp.id);
    const gaps = researchDataset.skillGaps.filter(g => g.employee_id === emp.id);
    const scores = researchDataset.skillScores.filter(s => s.employee_id === emp.id);
    const interactions = researchDataset.courseInteractions.filter(i => i.employee_id === emp.id);

    res.json({
      success: true,
      employee: emp,
      assessmentHistory: attempts,
      skillScores: scores,
      skillGaps: gaps,
      courseInteractions: interactions
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/research/recommendations
 * Runs 4-Signal Fusion Recommendation algorithm
 */
app.post('/api/research/recommendations', (req, res) => {
  try {
    loadResearchEngine();
    const { employeeId, weights } = req.body;
    if (!employeeId) return res.status(400).json({ success: false, message: 'Missing employeeId.' });

    const result = researchFusionEngine.getRecommendations(employeeId, weights || {});
    res.json({
      success: true,
      ...result
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/research/metrics
 * Returns evaluation metrics & ablation study results
 */
app.get('/api/research/metrics', (req, res) => {
  try {
    loadResearchEngine();
    const metrics = researchMetricsEngine.evaluateAll(5);
    const ablation = researchMetricsEngine.runAblationStudy();

    res.json({
      success: true,
      metrics,
      ablation
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * GET /api/research/knowledge-graph
 * Returns graph nodes and edges
 */
app.get('/api/research/knowledge-graph', (req, res) => {
  try {
    loadResearchEngine();
    const { employeeId } = req.query;
    let edges = researchDataset.kgEdges;

    if (employeeId && employeeId !== 'undefined') {
      const emp = researchDataset.employees.find(e => e.id === employeeId || e.employee_id === employeeId);
      if (emp) {
        // Find designation -> skill edges
        const desigEdges = edges.filter(e => e.source_type === 'DESIGNATION' && e.source_id === emp.designation_id);
        const reqSkillIds = new Set(desigEdges.map(e => e.target_id));
        // Find course -> skill edges
        const courseEdges = edges.filter(e => e.source_type === 'COURSE' && reqSkillIds.has(e.target_id));
        
        edges = [...desigEdges, ...courseEdges];
      }
    } else {
      // If no specific employee, limit to a smaller global sample
      edges = edges.slice(0, 150);
    }

    // Build unique nodes map
    const nodes = new Map();
    edges.forEach(e => {
      if (!nodes.has(e.source_id)) {
        let name = e.source_id;
        if (e.source_type === 'DESIGNATION') name = researchDataset.employees.find(x => x.designation_id === e.source_id)?.designation_name || 'Designation';
        if (e.source_type === 'COURSE') name = researchDataset.courses.find(x => x.id === e.source_id)?.title || 'Course';
        if (e.source_type === 'SKILL') name = researchDataset.skills.find(x => x.id === e.source_id)?.name || 'Skill';
        nodes.set(e.source_id, { id: e.source_id, group: e.source_type, label: name });
      }
      if (!nodes.has(e.target_id)) {
        let name = e.target_id;
        if (e.target_type === 'SKILL') name = researchDataset.skills.find(x => x.id === e.target_id)?.name || 'Skill';
        nodes.set(e.target_id, { id: e.target_id, group: e.target_type, label: name });
      }
    });

    res.json({
      success: true,
      nodesCount: nodes.size,
      edgesCount: edges.length,
      sampleEdges: edges.slice(0, 30),
      nodes: Array.from(nodes.values()),
      links: edges.map(e => ({ source: e.source_id, target: e.target_id, label: e.relation }))
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

/**
 * POST /api/auth/register-user
 * Instant Auto-Confirmed Multi-User Registration Endpoint
 */
app.post('/api/auth/register-user', async (req, res) => {
  try {
    const { email, password, name, employeeId, designationId, department, experienceYears, skillIds } = req.body;

    if (!email || !password || !name || !employeeId) {
      return res.status(400).json({ success: false, message: 'Missing required registration fields.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();
    const cleanEmpId = employeeId.trim();

    // 1. Check if user already exists in auth.users
    const { data: userList } = await supabase.auth.admin.listUsers();
    let existingUser = userList?.users?.find(u => u.email?.toLowerCase() === cleanEmail);
    let userId = existingUser?.id;

    if (!existingUser) {
      // Create user with email_confirm = true
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: cleanEmail,
        password: password,
        email_confirm: true,
        user_metadata: {
          name: cleanName,
          employee_id: cleanEmpId,
          designation_id: designationId,
          department: department,
          experience_years: Number(experienceYears) || 0,
          skill_ids: skillIds || []
        }
      });

      if (createError) {
        return res.status(400).json({ success: false, message: createError.message });
      }
      userId = newUser.user.id;
    } else {
      // Auto-confirm existing user and update password if needed
      await supabase.auth.admin.updateUserById(userId, {
        password: password,
        email_confirm: true,
        user_metadata: {
          name: cleanName,
          employee_id: cleanEmpId,
          designation_id: designationId,
          department: department,
          experience_years: Number(experienceYears) || 0,
          skill_ids: skillIds || []
        }
      });
    }

    // 2. Ensure employee_profiles row exists for this user
    let targetDesigId = designationId;
    if (!targetDesigId) {
      const { data: desigData } = await supabase.from('designations').select('id').limit(1).maybeSingle();
      targetDesigId = desigData?.id || 'd47400e0-c13a-4b26-b0d2-78e460ca56e3';
    }

    // 2a. Check if profile already linked to this user_id
    let { data: existingProfile } = await supabase
      .from('employee_profiles')
      .select('id')
      .eq('user_id', userId)
      .maybeSingle();

    let profileId = existingProfile?.id;

    // 2b. If not linked by user_id, check if an unlinked Civil List profile matches this employee_id
    if (!profileId && cleanEmpId) {
      const { data: unlinkedMatch } = await supabase
        .from('employee_profiles')
        .select('id')
        .eq('employee_id', cleanEmpId)
        .is('user_id', null)
        .maybeSingle();

      if (unlinkedMatch) {
        profileId = unlinkedMatch.id;
        await supabase
          .from('employee_profiles')
          .update({
            user_id: userId,
            name: cleanName,
            designation_id: targetDesigId,
            department: department || 'National Statistical Office (NSO)',
            experience_years: Number(experienceYears) || 0,
            updated_at: new Date().toISOString()
          })
          .eq('id', profileId);
      }
    }

    // 2c. If still no profile, insert a new one
    if (!profileId) {
      // Check if employee_id is already used by another user
      let finalEmpId = cleanEmpId;
      const { data: empIdTaken } = await supabase
        .from('employee_profiles')
        .select('id')
        .eq('employee_id', cleanEmpId)
        .maybeSingle();

      if (empIdTaken) {
        finalEmpId = `MOSPI-${userId.slice(0, 8)}`;
      }

      const { data: newProfile, error: profileErr } = await supabase
        .from('employee_profiles')
        .insert({
          user_id: userId,
          name: cleanName,
          employee_id: finalEmpId,
          designation_id: targetDesigId,
          department: department || 'National Statistical Office (NSO)',
          experience_years: Number(experienceYears) || 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select('id')
        .single();

      if (profileErr) {
        console.error('Profile creation error:', profileErr.message);
      } else {
        profileId = newProfile.id;
      }
    } else {
      // Update existing linked profile
      await supabase
        .from('employee_profiles')
        .update({
          name: cleanName,
          designation_id: targetDesigId,
          department: department || 'National Statistical Office (NSO)',
          experience_years: Number(experienceYears) || 0,
          updated_at: new Date().toISOString()
        })
        .eq('id', profileId);
    }

    // 3. Insert skills into employee_skills if profileId available
    if (profileId && Array.isArray(skillIds) && skillIds.length > 0) {
      await supabase.from('employee_skills').delete().eq('employee_profile_id', profileId);
      const skillRows = skillIds.map(sId => ({ employee_profile_id: profileId, skill_id: sId }));
      await supabase.from('employee_skills').insert(skillRows).catch(console.warn);
    }

    return res.json({
      success: true,
      message: 'Account registered and confirmed successfully! You can now sign in immediately.',
      userId: userId
    });
  } catch (err) {
    console.error('Registration API error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Registration failed.' });
  }
});

// ==========================================
// ARENA API ENDPOINTS
// ==========================================

app.get('/api/arena/leaderboard', authenticateUser, async (req, res) => {
  try {
    const { data: profiles, error } = await supabase
      .from('arena_profiles')
      .select('user_id, arena_points, arena_rating, wins, losses, draws, current_streak, best_streak, total_matches')
      .order('arena_points', { ascending: false })
      .order('wins', { ascending: false })
      .order('best_streak', { ascending: false })
      .limit(20);

    if (error) throw error;

    if (!profiles || profiles.length === 0) {
      return res.json([]);
    }

    const userIds = profiles.map(p => p.user_id).filter(Boolean);
    const { data: empProfiles } = await supabase
      .from('employee_profiles')
      .select('user_id, name')
      .in('user_id', userIds);

    const empMap = new Map((empProfiles || []).map(e => [e.user_id, e.name]));

    const ranked = profiles.map((p, index) => ({
      userId: p.user_id,
      name: empMap.get(p.user_id) || 'Statistical Officer',
      points: Math.max(0, Number(p.arena_points) || 0),
      wins: Number(p.wins) || 0,
      streak: Number(p.current_streak) || 0,
      bestStreak: Number(p.best_streak) || 0,
      rating: Number(p.arena_rating) || 1200,
      rank: index + 1
    }));

    res.json(ranked);
  } catch (err) {
    console.error('Leaderboard fetch error:', err);
    res.status(500).json({ error: 'Failed to load leaderboard' });
  }
});

app.get('/api/arena/history', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;
    // Fetch last 5 completed matches for this user
    const { data: matches, error } = await supabase
      .from('arena_matches')
      .select(`
        id,
        mode,
        result,
        player1_score,
        player2_score,
        winner_id,
        started_at,
        ended_at,
        created_at,
        player1_id,
        player2_id
      `)
      .or(`player1_id.eq.${userId},player2_id.eq.${userId}`)
      .eq('status', 'COMPLETED')
      .order('ended_at', { ascending: false, nullsFirst: false })
      .limit(5);

    if (error) throw error;

    if (!matches || matches.length === 0) {
      return res.json({ success: true, history: [] });
    }

    // Collect opponent user_ids
    const opponentIds = matches
      .map(m => (m.player1_id === userId ? m.player2_id : m.player1_id))
      .filter(id => id && !String(id).startsWith('ai_'));

    let empMap = new Map();
    if (opponentIds.length > 0) {
      const { data: empProfiles } = await supabase
        .from('employee_profiles')
        .select('user_id, name')
        .in('user_id', opponentIds);
      if (empProfiles) {
        empMap = new Map(empProfiles.map(e => [e.user_id, e.name]));
      }
    }

    const history = matches.map((m) => {
      const isP1 = m.player1_id === userId;
      let isWin = false;
      let isDraw = m.result === 'DRAW';
      if (!isDraw) {
        if (m.winner_id) {
          isWin = m.winner_id === userId;
        } else if (m.result === 'PLAYER1_WIN') {
          isWin = isP1;
        } else if (m.result === 'PLAYER2_WIN') {
          isWin = !isP1;
        }
      }

      const opponentId = isP1 ? m.player2_id : m.player1_id;
      let opponentName = 'Arena AI';
      if (m.mode === 'HUMAN') {
        opponentName = (opponentId && empMap.get(opponentId)) || 'Colleague';
      }

      const myScore = isP1 ? (m.player1_score || 0) : (m.player2_score || 0);
      const oppScore = isP1 ? (m.player2_score || 0) : (m.player1_score || 0);

      // AP gained/lost
      let apChange = 0;
      if (m.mode === 'AI') {
        if (isWin) apChange = 10;
        else if (!isDraw) apChange = -10;
      } else {
        if (isWin) apChange = 50;
        else if (!isDraw) apChange = -30;
      }

      return {
        id: m.id,
        mode: m.mode,
        opponentName,
        isWin,
        isDraw,
        myScore,
        oppScore,
        apChange,
        date: m.ended_at || m.started_at || m.created_at
      };
    });

    res.json({ success: true, history });
  } catch (err) {
    console.error('Arena history fetch error:', err);
    res.status(500).json({ success: false, error: 'Failed to load arena history' });
  }
});

app.get('/api/arena/profile', authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;
    let { data: profile } = await supabase
      .from('arena_profiles')
      .select('arena_points, arena_rating, wins, losses, draws, current_streak, best_streak, total_matches')
      .eq('user_id', userId)
      .maybeSingle();

    if (!profile) {
      await supabase.from('arena_profiles').insert({
        user_id: userId,
        arena_points: 0,
        arena_rating: 1200,
        wins: 0,
        losses: 0,
        draws: 0,
        current_streak: 0,
        best_streak: 0,
        total_matches: 0,
        is_available: true
      }).catch(() => {});

      const { data: createdProfile } = await supabase
        .from('arena_profiles')
        .select('arena_points, arena_rating, wins, losses, draws, current_streak, best_streak, total_matches')
        .eq('user_id', userId)
        .maybeSingle();

      profile = createdProfile || {
        arena_points: 0,
        arena_rating: 1200,
        wins: 0,
        losses: 0,
        draws: 0,
        current_streak: 0,
        best_streak: 0,
        total_matches: 0
      };
    }

    // Fetch badges
    const { data: userBadges, error: badgeErr } = await supabase
      .from('user_arena_badges')
      .select('badge_id, awarded_at, arena_badges(*)')
      .eq('user_id', userId);

    res.json({
      arena_points: Math.max(0, Number(profile.arena_points) || 0),
      arena_rating: Number(profile.arena_rating) || 1200,
      wins: Number(profile.wins) || 0,
      losses: Number(profile.losses) || 0,
      draws: Number(profile.draws) || 0,
      current_streak: Number(profile.current_streak) || 0,
      best_streak: Number(profile.best_streak) || 0,
      total_matches: Number(profile.total_matches) || 0,
      badges: (userBadges || []).map(b => b.arena_badges).filter(Boolean)
    });
  } catch (err) {
    console.error('Arena profile error:', err);
    res.status(500).json({ error: 'Failed to load arena profile' });
  }
});

const http = require('http');
const initArenaSocket = require('./arenaSocket');

const PORT = process.env.PORT || 5000;

const server = http.createServer(app);

// Initialize Arena Socket.IO
initArenaSocket(server, supabaseUrl, supabaseSecretKey);

server.listen(PORT, () => {
  console.log(`Backend running on http://localhost:${PORT}`);
});

