const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY);

const DEPARTMENTS = [
  'NSO - Survey Design & Research Division (SDRD)',
  'NSO - Data Processing Division (DPD)',
  'NSO - Field Operations Division (FOD)',
  'Economic Statistics Division (ESD)',
  'National Accounts Division (NAD)',
  'Social Statistics Division (SSD)',
  'Computer Centre & IT Division'
];

const FIRST_NAMES = [
  'Aarav', 'Ananya', 'Rohan', 'Priya', 'Vikram', 'Neha', 'Aditya', 'Pooja', 'Rahul', 'Kavita',
  'Siddharth', 'Meera', 'Amit', 'Sneha', 'Rajesh', 'Divya', 'Suresh', 'Anita', 'Manish', 'Ritu',
  'Deepak', 'Swati', 'Alok', 'Sunita', 'Nikhil', 'Shweta', 'Gaurav', 'Preeti', 'Varun', 'Monika',
  'Kiran', 'Aarti', 'Tarun', 'Shalini', 'Nitin', 'Bhavna', 'Harish', 'Vandana', 'Sachin', 'Anjali',
  'Manoj', 'Archana', 'Yash', 'Rachna', 'Ashish', 'Geeta', 'Sanjay', 'Seema', 'Pankaj', 'Nisha'
];

const LAST_NAMES = [
  'Sharma', 'Verma', 'Gupta', 'Singh', 'Patel', 'Kumar', 'Joshi', 'Mehta', 'Rao', 'Nair',
  'Deshmukh', 'Chaudhary', 'Mishra', 'Agarwal', 'Reddy', 'Pandey', 'Bhat', 'Srivastava', 'Saxena', 'Kapoor'
];

async function seedResearchData() {
  console.log('=== SEEDING 50 SYNTHETIC EMPLOYEES & RESEARCH DATA ===\n');

  // 1. Fetch reference catalog from DB
  const { data: designations } = await supabase.from('designations').select('id, name');
  const { data: skills } = await supabase.from('skills').select('id, name, category');
  const { data: courses } = await supabase.from('courses').select('id, title, skill_id, provider, level');

  if (!designations || !skills || !courses) {
    throw new Error('Failed to fetch reference catalog from Supabase.');
  }

  console.log(`Loaded ${designations.length} designations, ${skills.length} skills, and ${courses.length} courses.`);

  // 2. Generate 50 Synthetic Employees
  const syntheticEmployees = [];
  const skillScores = [];
  const skillGaps = [];
  const courseInteractions = [];
  const assessmentHistory = [];

  const now = new Date();

  for (let i = 1; i <= 50; i++) {
    const empId = `DEMO-${1000 + i}`;
    const name = `${FIRST_NAMES[(i - 1) % FIRST_NAMES.length]} ${LAST_NAMES[(i * 7) % LAST_NAMES.length]}`;
    const desig = designations[(i - 1) % designations.length];
    const dept = DEPARTMENTS[i % DEPARTMENTS.length];
    const exp = Math.floor(Math.random() * 18) + 2;

    // Pick 4-6 designation required skills
    const assignedSkills = skills.slice((i * 3) % (skills.length - 6), ((i * 3) % (skills.length - 6)) + 5);

    const empProfile = {
      id: `synth-emp-${i}`,
      employee_id: empId,
      name,
      designation_id: desig.id,
      designation_name: desig.name,
      department: dept,
      experience_years: exp,
      created_at: new Date(now.getTime() - (exp * 365 * 86400000)).toISOString()
    };

    syntheticEmployees.push(empProfile);

    // Generate assessment history & skill scores for each employee
    const attemptsCount = (i % 3) + 1; // 1 to 3 attempts
    for (let att = 1; att <= attemptsCount; att++) {
      const attemptDate = new Date(now.getTime() - ((attemptsCount - att + 1) * 30 * 86400000)).toISOString();
      const attemptId = `synth-att-${i}-${att}`;

      let totalScoreSum = 0;
      const empAttemptScores = [];

      assignedSkills.forEach((s) => {
        // Base skill score with variation per attempt
        const requiredScore = 80;
        const baseProficiency = 35 + ((i * 11 + s.name.length * 5) % 55); // 35 to 90
        const assessedScore = Math.min(100, Math.max(20, baseProficiency + (att - 1) * 8 + (i % 5)));
        totalScoreSum += assessedScore;

        empAttemptScores.push({
          attempt_id: attemptId,
          employee_id: empProfile.id,
          skill_id: s.id,
          skill_name: s.name,
          category: s.category,
          assessed_score: assessedScore,
          required_score: requiredScore,
          gap_percentage: Math.max(0, requiredScore - assessedScore)
        });
      });

      const overallPct = Math.round(totalScoreSum / assignedSkills.length);
      assessmentHistory.push({
        id: attemptId,
        employee_id: empProfile.id,
        attempt_number: att,
        assessment_type: att === 1 ? 'initial' : 'reassessment',
        score_percentage: overallPct,
        completed_at: attemptDate
      });

      // Save latest attempt scores into skillScores & skillGaps
      if (att === attemptsCount) {
        empAttemptScores.forEach((scoreObj) => {
          skillScores.push(scoreObj);
          if (scoreObj.gap_percentage > 0) {
            skillGaps.push({
              employee_id: empProfile.id,
              skill_id: scoreObj.skill_id,
              skill_name: scoreObj.skill_name,
              assessed_score: scoreObj.assessed_score,
              required_score: scoreObj.required_score,
              gap_percentage: scoreObj.gap_percentage,
              priority: scoreObj.gap_percentage > 35 ? 'HIGH' : scoreObj.gap_percentage > 15 ? 'MEDIUM' : 'LOW'
            });
          }
        });
      }
    }

    // Generate realistic course interaction history with recency timestamps
    const relevantCourses = courses.filter((c) => assignedSkills.some((s) => s.id === c.skill_id));
    const interCourses = relevantCourses.length > 0 ? relevantCourses : courses.slice(0, 4);

    interCourses.forEach((c, idx) => {
      const daysAgo = Math.floor(Math.random() * 60) + 1;
      const interactionTime = new Date(now.getTime() - (daysAgo * 86400000)).toISOString();
      const actions = ['viewed', 'selected', 'started', 'completed'];

      const maxActionIdx = (i + idx) % actions.length;
      for (let actIdx = 0; actIdx <= maxActionIdx; actIdx++) {
        courseInteractions.push({
          id: `inter-${i}-${idx}-${actIdx}`,
          employee_id: empProfile.id,
          course_id: c.id,
          course_title: c.title,
          skill_id: c.skill_id,
          action: actions[actIdx],
          days_ago: daysAgo,
          timestamp: interactionTime
        });
      }
    });
  }

  // 3. Knowledge Graph Edges Construction
  const kgEdges = [];
  designations.forEach((d) => {
    skills.slice(0, 8).forEach((s) => {
      kgEdges.push({
        source_id: d.id,
        source_type: 'DESIGNATION',
        target_id: s.id,
        target_type: 'SKILL',
        relation: 'DESIGNATION_REQUIRES',
        weight: 0.9
      });
    });
  });

  courses.forEach((c) => {
    kgEdges.push({
      source_id: c.id,
      source_type: 'COURSE',
      target_id: c.skill_id,
      target_type: 'SKILL',
      relation: 'COURSE_TEACHES',
      weight: 1.0
    });
  });

  for (let sIdx = 0; sIdx < skills.length - 1; sIdx += 2) {
    kgEdges.push({
      source_id: skills[sIdx].id,
      source_type: 'SKILL',
      target_id: skills[sIdx + 1].id,
      target_type: 'SKILL',
      relation: sIdx % 4 === 0 ? 'SKILL_PREREQUISITE' : 'SKILL_RELATED',
      weight: 0.8
    });
  }

  // 4. Assemble Complete Synthetic Research Dataset
  const researchDataset = {
    metadata: {
      generated_at: now.toISOString(),
      employees_count: syntheticEmployees.length,
      skills_count: skills.length,
      courses_count: courses.length,
      interactions_count: courseInteractions.length,
      kg_edges_count: kgEdges.length
    },
    employees: syntheticEmployees,
    skills,
    courses,
    assessmentHistory,
    skillScores,
    skillGaps,
    courseInteractions,
    kgEdges
  };

  const dataDir = path.join(__dirname, 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const seedPath = path.join(dataDir, 'research_seed.json');
  fs.writeFileSync(seedPath, JSON.stringify(researchDataset, null, 2), 'utf-8');

  console.log(`✓ Synthetic Research Data seeded successfully to ${seedPath}`);
  console.log(`  - 50 Synthetic Employees created`);
  console.log(`  - ${assessmentHistory.length} Historical Assessment Attempts`);
  console.log(`  - ${skillGaps.length} Active Skill Gap records`);
  console.log(`  - ${courseInteractions.length} Course Interaction Logs`);
  console.log(`  - ${kgEdges.length} Knowledge Graph Edges`);
}

seedResearchData().catch((err) => {
  console.error('SEEDING FAILED:', err);
  process.exit(1);
});
