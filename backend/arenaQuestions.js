require('dotenv').config();
const { Groq } = require('groq-sdk');

const groqApiKey = process.env.GROQ_API_KEY && !process.env.GROQ_API_KEY.includes('your_groq_api_key_here')
  ? process.env.GROQ_API_KEY
  : null;

const groq = groqApiKey ? new Groq({ apiKey: groqApiKey }) : null;

// Comprehensive Fallback Bank categorized by MoSPI official statistical domains
const FALLBACK_ARENA_QUESTIONS = [
  {
    question: "In National Accounts Statistics, which method is primarily used to estimate Gross Value Added (GVA) for the unorganized manufacturing sector?",
    options: [
      "Production Approach (Output Method)",
      "Labor Input Method (Workforce × Value Added Per Worker)",
      "Direct Corporate Tax Auditing Approach",
      "Expenditure on Final Consumption Method"
    ],
    correct_answer: "Labor Input Method (Workforce × Value Added Per Worker)"
  },
  {
    question: "Which statistical index is compiled monthly by the National Statistical Office (NSO) to measure short-term volume changes in industrial output?",
    options: [
      "Consumer Price Index (CPI)",
      "Index of Industrial Production (IIP)",
      "Wholesale Price Index (WPI)",
      "Purchasing Managers' Index (PMI)"
    ],
    correct_answer: "Index of Industrial Production (IIP)"
  },
  {
    question: "What is the standard base year currently utilized for calculating the All India Consumer Price Index (CPI-Combined)?",
    options: [
      "2004-05",
      "2011-12",
      "2016-17",
      "2018-19"
    ],
    correct_answer: "2011-12"
  },
  {
    question: "In sample survey methodology (such as NSSO surveys), what sampling design is most commonly used for socio-economic multi-subject inquiries?",
    options: [
      "Simple Random Sampling with Replacement (SRSWR)",
      "Stratified Multi-Stage Sampling (First Stage Units: Villages/Urban Blocks)",
      "Quota Convenience Sampling",
      "Snowball Sampling Method"
    ],
    correct_answer: "Stratified Multi-Stage Sampling (First Stage Units: Villages/Urban Blocks)"
  },
  {
    question: "Which United Nations statistical standard provides the overarching conceptual framework for compiling National Accounts?",
    options: [
      "System of National Accounts 2008 (SNA 2008)",
      "Balance of Payments Manual 6 (BPM6)",
      "Government Finance Statistics Manual (GFSM 2014)",
      "International Standard Industrial Classification (ISIC Rev 4)"
    ],
    correct_answer: "System of National Accounts 2008 (SNA 2008)"
  },
  {
    question: "What is the primary objective of the Periodic Labour Force Survey (PLFS) conducted by the NSO?",
    options: [
      "To estimate short-term quarterly employment indicators in urban areas and annual rural/urban parameters",
      "To measure agricultural crop yields across districts",
      "To calculate annual corporate income taxes",
      "To estimate national foreign direct investment"
    ],
    correct_answer: "To estimate short-term quarterly employment indicators in urban areas and annual rural/urban parameters"
  },
  {
    question: "In time-series econometrics, what test is standardly used to check for the presence of a unit root (non-stationarity)?",
    options: [
      "Augmented Dickey-Fuller (ADF) Test",
      "Student's Two-Sample t-Test",
      "Shapiro-Wilk Normality Test",
      "Pearson Correlation Test"
    ],
    correct_answer: "Augmented Dickey-Fuller (ADF) Test"
  },
  {
    question: "Which formula is used for compiling the Index of Industrial Production (IIP) in India?",
    options: [
      "Laspeyres Base-Weighted Formula",
      "Paasche Current-Weighted Formula",
      "Fisher's Ideal Index Formula",
      "Marshall-Edgeworth Formula"
    ],
    correct_answer: "Laspeyres Base-Weighted Formula"
  }
];

/**
 * Validates that a question object has the strict schema:
 * - question (string, > 5 chars)
 * - options (array of exactly 4 non-empty strings)
 * - correct_answer (must match one of the 4 options)
 */
function validateQuestion(q) {
  if (!q || typeof q.question !== 'string' || q.question.trim().length < 5) return false;
  if (!Array.isArray(q.options) || q.options.length !== 4) return false;
  
  const cleanOptions = q.options.map(o => String(o).trim());
  if (cleanOptions.some(o => o.length === 0)) return false;

  // Unique options
  if (new Set(cleanOptions).size !== 4) return false;

  const cleanCorrect = String(q.correct_answer).trim();
  if (!cleanOptions.includes(cleanCorrect)) return false;

  return {
    question: q.question.trim(),
    options: cleanOptions,
    correct_answer: cleanCorrect
  };
}

/**
 * Shuffle array utility (Fisher-Yates)
 */
function shuffleArray(arr) {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

let groqCallCount = 0;

function getGroqCallCount() {
  return groqCallCount;
}

function resetGroqCallCount() {
  groqCallCount = 0;
}

/**
 * Generates or selects exactly 5 validated questions for an Arena Match based on designation.
 * GUARANTEE: Calls Groq at most ONCE per invocation, producing all 5 questions together.
 */
async function generateArenaQuestionsForMatch(designationName = 'Statistical Officer') {
  const targetCount = 5;
  let questions = [];

  // 1. Try AI Generation if Groq is available - Single Groq Request for all 5 questions
  if (groq) {
    try {
      groqCallCount++;
      const prompt = `You are the chief examiner for the Ministry of Statistics and Programme Implementation (MoSPI), Government of India.
Generate exactly 5 competitive multiple-choice battle questions for the designation "${designationName}".
Domains: National Accounts, Sample Surveys, CPI/IIP Indices, Official Statistics Standards, Data Analytics.

Return ONLY a valid JSON array of 5 objects with NO markdown formatting, NO backticks.
Each object must have:
- "question": string
- "options": array of exactly 4 strings
- "correct_answer": string (must be an EXACT match to one of the 4 options)

Example format:
[
  {
    "question": "Which base year is currently used for India CPI?",
    "options": ["2004-05", "2011-12", "2016-17", "2020-21"],
    "correct_answer": "2011-12"
  }
]`;

      const response = await groq.chat.completions.create({
        model: 'groq/compound-mini',
        messages: [
          { role: 'system', content: 'You are an AI assessment engine for MoSPI. Output ONLY a valid JSON array of questions.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.4,
        max_tokens: 1500
      });

      let rawContent = response.choices?.[0]?.message?.content || '';
      // Remove reasoning tokens if present
      rawContent = rawContent.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
      rawContent = rawContent.replace(/```json/gi, '').replace(/```/g, '').trim();

      const firstBracket = rawContent.indexOf('[');
      const lastBracket = rawContent.lastIndexOf(']');
      if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
        rawContent = rawContent.substring(firstBracket, lastBracket + 1);
      }

      const parsed = JSON.parse(rawContent);
      if (Array.isArray(parsed)) {
        for (const item of parsed) {
          const valid = validateQuestion(item);
          if (valid) questions.push(valid);
        }
      }
    } catch (aiErr) {
      console.warn('AI question generation fallback triggered:', aiErr.message);
    }
  }

  // 2. If AI didn't provide 5 valid questions, backfill from the high-quality curated bank
  if (questions.length < targetCount) {
    const shuffledBank = shuffleArray(FALLBACK_ARENA_QUESTIONS);
    for (const item of shuffledBank) {
      if (questions.length >= targetCount) break;
      const valid = validateQuestion(item);
      if (valid && !questions.some(q => q.question === valid.question)) {
        questions.push(valid);
      }
    }
  }

  // Strict validation: must have exactly 5 questions
  if (questions.length < targetCount) {
    throw new Error(`Failed to generate required ${targetCount} valid questions (only ${questions.length} available)`);
  }

  // Ensure options within each question are also shuffled for unpredictability
  return questions.slice(0, targetCount).map((q, idx) => {
    const shuffledOpts = shuffleArray(q.options);
    return {
      question_number: idx + 1,
      question: q.question,
      options: shuffledOpts,
      correct_answer: q.correct_answer
    };
  });
}

/**
 * Isolated deterministic scoring function for Arena battles:
 * - Correct answer: 50 base points + up to 50 points based on speed (max 100)
 * - Incorrect / Unanswered: 0 points
 */
function calculateBattleScore(isCorrect, responseTimeMs) {
  if (!isCorrect) return 0;
  const maxTimeMs = 15000;
  const time = (typeof responseTimeMs === 'number' && !isNaN(responseTimeMs)) ? responseTimeMs : maxTimeMs;
  const clampedTime = Math.min(Math.max(0, time), maxTimeMs);
  const speedBonus = Math.round((1 - (clampedTime / maxTimeMs)) * 50);
  return 50 + speedBonus; // 50 - 100 points
}

module.exports = {
  generateArenaQuestionsForMatch,
  calculateBattleScore,
  validateQuestion,
  getGroqCallCount,
  resetGroqCallCount
};
