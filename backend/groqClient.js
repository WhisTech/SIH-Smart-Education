const { Groq } = require('groq-sdk')
const crypto = require('crypto')

const groqApiKey = process.env.GROQ_API_KEY && !process.env.GROQ_API_KEY.includes('your_groq_api_key_here')
  ? process.env.GROQ_API_KEY
  : null

const groq = groqApiKey ? new Groq({ apiKey: groqApiKey }) : null

const ACTIVE_MODEL = 'groq/compound-mini';

function generateFingerprint(questionText) {
  if (!questionText) return '';
  const normalized = String(questionText).toLowerCase().replace(/[^a-z0-9]/g, '');
  return crypto.createHash('sha256').update(normalized).digest('hex');
}

function isSimilarText(text1, text2) {
  if (!text1 || !text2) return false;
  const norm1 = String(text1).toLowerCase().replace(/[^a-z0-9 ]/g, '').trim();
  const norm2 = String(text2).toLowerCase().replace(/[^a-z0-9 ]/g, '').trim();
  if (norm1 === norm2) return true;
  
  const words1 = new Set(norm1.split(/\s+/).filter(w => w.length > 3));
  const words2 = new Set(norm2.split(/\s+/).filter(w => w.length > 3));
  if (words1.size === 0 || words2.size === 0) return false;
  
  let intersection = 0;
  words1.forEach(w => { if (words2.has(w)) intersection++; });
  const union = new Set([...words1, ...words2]).size;
  const similarity = intersection / union;
  return similarity >= 0.7;
}

function generateFallbackQuestions(skills) {
  const fallbackBank = {
    'Statistical Analysis': [
      {
        question_text: 'What statistical measure is used to compare the means of three or more independent groups?',
        options: ['Analysis of Variance (ANOVA)', 'Student\'s t-test', 'Pearson Correlation', 'Chi-Square Test'],
        correct_answer: 'Analysis of Variance (ANOVA)',
        explanation: 'ANOVA evaluates whether the means of several groups differ significantly from one another.',
        difficulty: 'medium'
      },
      {
        question_text: 'In linear regression analysis, what does the R-squared value represent?',
        options: [
          'The proportion of variance in the dependent variable explained by independent variables',
          'The exact slope of the regression line',
          'The statistical significance of the sample mean',
          'The probability of a Type I error occurring'
        ],
        correct_answer: 'The proportion of variance in the dependent variable explained by independent variables',
        explanation: 'R-squared (coefficient of determination) measures the goodness of fit of the regression model.',
        difficulty: 'medium'
      }
    ],
    'Data Interpretation': [
      {
        question_text: 'When interpreting a skewed distribution where mean > median, what type of skewness is present?',
        options: ['Positive (Right) Skewness', 'Negative (Left) Skewness', 'Zero Skewness (Symmetric)', 'Bimodal Skewness'],
        correct_answer: 'Positive (Right) Skewness',
        explanation: 'In positively skewed data, extreme high values pull the mean to the right of the median.',
        difficulty: 'easy'
      },
      {
        question_text: 'What does a 95% Confidence Interval for a mean estimate signify?',
        options: [
          'If sampling is repeated, 95% of constructed intervals will contain the true population mean',
          'There is a 95% probability that the sample mean equals the population mean',
          '95% of individual data points fall within the interval bounds',
          'The population standard deviation is within 5% of the sample mean'
        ],
        correct_answer: 'If sampling is repeated, 95% of constructed intervals will contain the true population mean',
        explanation: 'A 95% confidence interval indicates long-run coverage probability under repeated sampling.',
        difficulty: 'hard'
      }
    ],
    'Data Management': [
      {
        question_text: 'Which data management practice ensures primary key uniqueness and referential integrity across relational tables?',
        options: ['Relational Schema Normalization', 'Data Deduplication', 'ETL Pipelining', 'Lossy Compression'],
        correct_answer: 'Relational Schema Normalization',
        explanation: 'Normalization eliminates redundancy and enforces entity and referential constraints.',
        difficulty: 'medium'
      },
      {
        question_text: 'What is the primary risk of not handling missing values (NAs) prior to statistical aggregation?',
        options: ['Biased estimates and reduced effective sample size', 'Automatic database corruption', 'Overestimation of standard errors', 'Zero variance output'],
        correct_answer: 'Biased estimates and reduced effective sample size',
        explanation: 'Improper missing value treatment can distort central tendency and inflate variance.',
        difficulty: 'easy'
      }
    ],
    'Data Visualization': [
      {
        question_text: 'Which chart type is best suited for demonstrating trends over continuous time periods in official survey data?',
        options: ['Line Graph', 'Pie Chart', 'Scatter Plot', 'Stacked Bar Chart'],
        correct_answer: 'Line Graph',
        explanation: 'Line charts effectively visualize continuous temporal trends and time series progression.',
        difficulty: 'easy'
      },
      {
        question_text: 'What visualization principle prevents misleading presentation when displaying bar chart comparisons?',
        options: ['Starting the numerical frequency axis at zero', 'Using 3D visual extrusion effects', 'Coloring every bar differently', 'Truncating highest categories'],
        correct_answer: 'Starting the numerical frequency axis at zero',
        explanation: 'Bar length represents magnitude; non-zero baselines artificially distort relative proportions.',
        difficulty: 'medium'
      }
    ]
  }

  const generated = []
  let order = 1

  for (const skill of skills) {
    const templates = fallbackBank[skill.name] || [
      {
        question_text: `What fundamental principle is key to applying ${skill.name} effectively in official statistical analysis?`,
        options: [
          'Verifying statistical assumptions and input data quality',
          'Disregarding sampling variability',
          'Ignoring missing data indicators',
          'Using unvalidated raw outputs'
        ],
        correct_answer: 'Verifying statistical assumptions and input data quality',
        explanation: 'Valid conclusions rely on verifying input quality and underlying domain assumptions.',
        difficulty: 'medium'
      }
    ]

    for (const t of templates) {
      generated.push({
        skill_id: skill.id,
        question_text: t.question_text,
        options: t.options,
        correct_answer: t.correct_answer,
        explanation: t.explanation,
        difficulty: t.difficulty,
        question_order: order++
      })
    }
  }

  return generated
}

async function generateQuizQuestions(skills) {
  return generateFallbackQuestions(skills)
}

/**
 * Generate a single adaptive quiz question WITH GUARANTEED SINGLE-CALL LIMIT (NO RETRY LOOPS)
 */
async function generateAdaptiveQuestion(skill, difficulty, previousQuestionsText = [], previousFingerprints = []) {
  if (groq) {
    const prevTextPrompt = previousQuestionsText.length > 0
      ? `DO NOT GENERATE ANY OF THESE PREVIOUS QUESTIONS:\n${previousQuestionsText.slice(-5).map(t => '- ' + t).join('\n')}`
      : '';

    const prompt = `You are a Senior Assessment Specialist for India's Ministry of Statistics (MoSPI).
Generate ONE multiple-choice competency question for official statistical employees.

SKILL: "${skill.name}"
DIFFICULTY: ${difficulty.toUpperCase()}

SCHEMA (Output raw JSON only, no markdown):
{"skill_id":"${skill.id}","question_text":"...","options":["Option 1","Option 2","Option 3","Option 4"],"correct_answer":"Exact option text","explanation":"...","difficulty":"${difficulty}"}

${prevTextPrompt}
`;

    try {
      // EXACTLY 1 AI CALL PER QUESTION - NO RETRY LOOPS!
      const response = await groq.chat.completions.create({
        messages: [
          { role: 'system', content: 'You are an AI assessment engine. Output valid JSON only.' },
          { role: 'user', content: prompt }
        ],
        model: ACTIVE_MODEL,
        temperature: 0.5
      });

      let text = response.choices[0]?.message?.content || '{}';
      text = text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

      const firstBrace = text.indexOf('{');
      const lastBrace = text.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
         text = text.substring(firstBrace, lastBrace + 1);
      }

      const parsed = JSON.parse(text);
      
      if (parsed.question_text && Array.isArray(parsed.options) && parsed.options.length === 4 && parsed.correct_answer) {
         const fp = generateFingerprint(parsed.question_text);
         const isDuplicateFp = previousFingerprints.includes(fp);
         const isSimilar = previousQuestionsText.some(prev => isSimilarText(prev, parsed.question_text));

         if (!isDuplicateFp && !isSimilar) {
            parsed.fingerprint = fp;
            return parsed;
         }
      }
    } catch (err) {
      console.error('Groq API Error:', err.message);
    }
  }

  // Fallback: Return a unique domain fallback without extra AI calls
  const fallbacks = generateFallbackQuestions([skill]);
  if (fallbacks && fallbacks.length > 0) {
     for (const f of fallbacks) {
        const fp = generateFingerprint(f.question_text);
        const isDuplicateFp = previousFingerprints.includes(fp);
        const isSimilar = previousQuestionsText.some(prev => isSimilarText(prev, f.question_text));
        if (!isDuplicateFp && !isSimilar) {
           f.fingerprint = fp;
           f.difficulty = difficulty;
           return f;
        }
     }
  }

  // Guaranteed Unique Dynamic Fallback
  const timestamp = Date.now().toString().slice(-4);
  const fallbackQText = `In official survey execution, what specific methodology governs optimal ${skill.name} under ${difficulty} scenario constraints (Ref-${timestamp})?`;
  const fp = generateFingerprint(fallbackQText);
  return {
    skill_id: skill.id,
    question_text: fallbackQText,
    options: [
      'Standardized sampling frame validation and variance control',
      'Unweighted arbitrary group aggregation',
      'Elimination of statistical audit logs',
      'Disregarding non-response adjustments'
    ],
    correct_answer: 'Standardized sampling frame validation and variance control',
    explanation: 'Official statistics require rigorous methodology validation under scenario constraints.',
    difficulty: difficulty,
    fingerprint: fp
  };
}

async function generateAssessmentAnalysis(scoreData) {
  const { overallScore, totalQuestions, correctAnswers, skillScores } = scoreData

  const fallbackStrengths = skillScores.filter((s) => s.score_percentage >= 80).map((s) => s.skill_name)
  const fallbackWeaknesses = skillScores.filter((s) => s.score_percentage < 60).map((s) => s.skill_name)
  const fallbackPriority = skillScores
    .filter((s) => s.score_percentage < 60)
    .sort((a, b) => a.score_percentage - b.score_percentage)
    .map((s) => s.skill_name)

  const fallbackResult = {
    summary: `The employee scored ${overallScore}% overall (${correctAnswers} of ${totalQuestions} questions correct). ${
      fallbackStrengths.length > 0
        ? `Demonstrates strong proficiency in ${fallbackStrengths.join(', ')}.`
        : 'Performance shows scope for improvement across key competency areas.'
    } ${
      fallbackWeaknesses.length > 0
        ? `Targeted training is recommended in ${fallbackWeaknesses.join(', ')}.`
        : 'Solid statistical performance maintained across evaluated areas.'
    }`,
    strengths: fallbackStrengths,
    areasToImprove: fallbackWeaknesses,
    prioritySkills: fallbackPriority
  }

  if (!groq) return fallbackResult

  const prompt = `You are a Skill Intelligence Analyst for India's Ministry of Statistics (MoSPI).
Interpret the following REAL calculated assessment scores for an employee.

CALCULATED SCORES:
- Overall Score: ${overallScore}% (${correctAnswers}/${totalQuestions} correct)
- Skill Breakdown:
${skillScores.map((s) => `  * ${s.skill_name}: ${s.score_percentage}%`).join('\n')}

RULES:
- Identify strengths (skills >= 80%), areas to improve (skills < 60%), and priority training skills.
- Output MUST be valid JSON formatted as:
{
  "summary": "Concise professional summary.",
  "strengths": ["Skill Name 1"],
  "areasToImprove": ["Skill Name 2"],
  "prioritySkills": ["Skill Name 2"]
}
`

  try {
    const response = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: 'You are an AI assessment analyst. Respond ONLY in valid JSON.' },
        { role: 'user', content: prompt }
      ],
      model: ACTIVE_MODEL,
      temperature: 0.3
    })

    let text = response.choices[0]?.message?.content || '{}'
    text = text.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
       text = text.substring(firstBrace, lastBrace + 1);
    }
    
    const parsed = JSON.parse(text)

    if (parsed && typeof parsed.summary === 'string') {
      return {
        summary: parsed.summary,
        strengths: Array.isArray(parsed.strengths) ? parsed.strengths : fallbackStrengths,
        areasToImprove: Array.isArray(parsed.areasToImprove) ? parsed.areasToImprove : fallbackWeaknesses,
        prioritySkills: Array.isArray(parsed.prioritySkills) ? parsed.prioritySkills : fallbackPriority
      }
    }

    return fallbackResult
  } catch (err) {
    return fallbackResult
  }
}

module.exports = {
  generateQuizQuestions,
  generateAssessmentAnalysis,
  generateAdaptiveQuestion,
  generateFingerprint
}
