/**
 * geminiClient.js
 * 
 * Simple, beginner-friendly AI MCQ generation service using Google Gemini API.
 * 
 * Key Features:
 * 1. Extracts page-by-page text from uploaded PDF files using PDFParse.
 * 2. Sends grounded prompt to Gemini API requesting structured JSON MCQs.
 * 3. Enforces strict validation (4 unique options, valid answer key, explanation, source page).
 * 4. Deduplicates questions and options.
 * 5. Uses a single controlled retry if needed (no infinite loops).
 */

const pdfParseModule = require('pdf-parse');
const PDFParse = pdfParseModule.PDFParse || (typeof pdfParseModule === 'function' ? pdfParseModule : null);

// Load Gemini API Key and Model from environment variables
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const DEFAULT_MODEL = process.env.GEMINI_MODEL || 'gemini-3.6-flash';
const FALLBACK_MODELS = ['gemini-3.6-flash', 'gemini-2.5-flash', 'gemini-3.5-flash'];

/**
 * Step 1: Extract text from PDF buffer with page numbers
 * @param {Buffer} pdfBuffer - The uploaded PDF file buffer
 * @returns {Promise<{ text: string, totalPages: number, pageMap: Array<{ page: number, text: string }> }>}
 */
async function extractTextFromPdf(pdfBuffer) {
  if (!pdfBuffer || pdfBuffer.length < 100) {
    throw new Error('Invalid or empty PDF file.');
  }

  // Verify PDF header magic bytes (%PDF-)
  const header = pdfBuffer.slice(0, 5).toString('utf-8');
  if (!header.startsWith('%PDF-')) {
    throw new Error('Uploaded file is not a valid PDF document.');
  }

  const pageMap = [];
  let totalPages = 1;

  try {
    if (PDFParse && typeof PDFParse === 'function' && PDFParse.prototype && PDFParse.prototype.getText) {
      // Modern PDFParse class
      const parser = new PDFParse({ data: pdfBuffer });
      await parser.load();
      const parsedText = await parser.getText();
      
      if (parsedText && Array.isArray(parsedText.pages) && parsedText.pages.length > 0) {
        totalPages = parsedText.pages.length;
        parsedText.pages.forEach((p, idx) => {
          const pageNum = p.page || idx + 1;
          pageMap.push({
            page: pageNum,
            text: (p.text || '').trim()
          });
        });
      }
    } else if (typeof pdfParseModule === 'function') {
      // Classic pdf-parse function fallback
      const parsed = await pdfParseModule(pdfBuffer);
      totalPages = parsed.numpages || 1;
      pageMap.push({
        page: 1,
        text: (parsed.text || '').trim()
      });
    }
  } catch (parseErr) {
    console.error('Error during PDF parsing:', parseErr);
    throw new Error(`Failed to parse PDF document: ${parseErr.message}`);
  }

  // Build combined text labeled by page
  let combinedText = '';
  if (pageMap.length > 0) {
    combinedText = pageMap
      .filter(p => p.text.length > 0)
      .map(p => `--- PAGE ${p.page} ---\n${p.text}`)
      .join('\n\n');
  }

  if (!combinedText || combinedText.trim().length < 30) {
    throw new Error('Could not extract readable text from this PDF. Please ensure the PDF is not an image-only scanned document without text.');
  }

  return {
    text: combinedText,
    totalPages: totalPages,
    pageMap: pageMap
  };
}

/**
 * Step 2: Normalize and calculate similarity between two questions to prevent duplicates
 */
function normalizeText(str) {
  if (!str) return '';
  return String(str).toLowerCase().replace(/[^a-z0-9]/g, '');
}

function areQuestionsDuplicate(q1, q2) {
  const norm1 = normalizeText(q1);
  const norm2 = normalizeText(q2);
  if (!norm1 || !norm2) return false;
  if (norm1 === norm2) return true;

  // Word token overlap check
  const words1 = new Set(norm1.match(/.{1,4}/g) || []);
  const words2 = new Set(norm2.match(/.{1,4}/g) || []);
  if (words1.size === 0 || words2.size === 0) return false;

  let common = 0;
  for (let w of words1) {
    if (words2.has(w)) common++;
  }
  const ratio = (2 * common) / (words1.size + words2.size);
  return ratio > 0.85;
}

/**
 * Step 3: Validate a single MCQ object against strict quality rules
 * @param {Object} mcq 
 * @param {number} totalPages 
 * @param {string} targetDifficulty 
 * @returns {Object|null} Cleaned MCQ or null if invalid
 */
function validateSingleMcq(mcq, totalPages = 1, targetDifficulty = 'MEDIUM') {
  if (!mcq || typeof mcq !== 'object') return null;

  const question = typeof mcq.question === 'string' ? mcq.question.trim() : '';
  if (!question || question.length < 5) return null;

  // Validate options (Must have exactly A, B, C, D)
  const rawOptions = mcq.options;
  if (!rawOptions || typeof rawOptions !== 'object') return null;

  const optionA = typeof rawOptions.A === 'string' ? rawOptions.A.trim() : '';
  const optionB = typeof rawOptions.B === 'string' ? rawOptions.B.trim() : '';
  const optionC = typeof rawOptions.C === 'string' ? rawOptions.C.trim() : '';
  const optionD = typeof rawOptions.D === 'string' ? rawOptions.D.trim() : '';

  // All 4 options must be present and non-empty
  if (!optionA || !optionB || !optionC || !optionD) return null;

  // Check for duplicate options within the same question
  const optSet = new Set([
    optionA.toLowerCase(),
    optionB.toLowerCase(),
    optionC.toLowerCase(),
    optionD.toLowerCase()
  ]);
  if (optSet.size !== 4) return null; // Found duplicate options

  // Validate correct answer key
  let correctAnswer = typeof mcq.correctAnswer === 'string' ? mcq.correctAnswer.trim().toUpperCase() : '';
  if (!['A', 'B', 'C', 'D'].includes(correctAnswer)) {
    // If the model returned the full answer text instead of the letter, match it
    if (optionA.toLowerCase() === String(mcq.correctAnswer).trim().toLowerCase()) correctAnswer = 'A';
    else if (optionB.toLowerCase() === String(mcq.correctAnswer).trim().toLowerCase()) correctAnswer = 'B';
    else if (optionC.toLowerCase() === String(mcq.correctAnswer).trim().toLowerCase()) correctAnswer = 'C';
    else if (optionD.toLowerCase() === String(mcq.correctAnswer).trim().toLowerCase()) correctAnswer = 'D';
    else return null;
  }

  // Validate explanation
  const explanation = typeof mcq.explanation === 'string' ? mcq.explanation.trim() : '';
  if (!explanation || explanation.length < 5) return null;

  // Validate sourcePage
  let sourcePage = parseInt(mcq.sourcePage, 10);
  if (isNaN(sourcePage) || sourcePage < 1) {
    sourcePage = 1;
  } else if (sourcePage > totalPages) {
    sourcePage = totalPages;
  }

  // Validate difficulty
  let difficulty = typeof mcq.difficulty === 'string' ? mcq.difficulty.trim().toUpperCase() : targetDifficulty;
  if (!['EASY', 'MEDIUM', 'HARD'].includes(difficulty)) {
    difficulty = targetDifficulty;
  }

  return {
    question: question,
    options: {
      A: optionA,
      B: optionB,
      C: optionC,
      D: optionD
    },
    correctAnswer: correctAnswer,
    explanation: explanation,
    sourcePage: sourcePage,
    difficulty: difficulty
  };
}

/**
 * Step 4: Validate and filter an array of MCQs, removing invalid items and duplicates
 */
function validateAndCleanMcqs(rawMcqs, totalPages = 1, targetDifficulty = 'MEDIUM') {
  if (!Array.isArray(rawMcqs)) return [];

  const validList = [];

  for (const raw of rawMcqs) {
    const cleaned = validateSingleMcq(raw, totalPages, targetDifficulty);
    if (!cleaned) continue;

    // Check duplicate against already accepted questions
    const isDuplicate = validList.some(existing => areQuestionsDuplicate(existing.question, cleaned.question));
    if (isDuplicate) continue;

    validList.push(cleaned);
  }

  return validList;
}

/**
 * Step 5: Helper to call Gemini generateContent API
 */
async function callGeminiApi(promptText, modelName) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Gemini API key is not configured in backend environment variables.');
  }

  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

  const payload = {
    contents: [
      {
        parts: [
          { text: promptText }
        ]
      }
    ],
    generationConfig: {
      responseMimeType: 'application/json',
      temperature: 0.2
    }
  };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json();

  if (!response.ok || data.error) {
    const errorMsg = data.error?.message || `Gemini API returned status ${response.status}`;
    const err = new Error(errorMsg);
    err.status = response.status;
    err.errorDetails = data.error;
    throw err;
  }

  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) {
    throw new Error('Gemini returned an empty response.');
  }

  return JSON.parse(rawText);
}

/**
 * Step 6: Main generator function with smart model fallback and single retry
 * 
 * @param {Buffer} pdfBuffer - Uploaded PDF file
 * @param {Object} options - { count: number, difficulty: 'EASY'|'MEDIUM'|'HARD' }
 */
async function generateMcqsFromPdf(pdfBuffer, options = {}) {
  const requestedCount = Math.min(Math.max(parseInt(options.count, 10) || 5, 5), 20);
  const difficulty = (options.difficulty || 'MEDIUM').toUpperCase();

  // 1. Extract text from PDF
  const { text: pdfText, totalPages } = await extractTextFromPdf(pdfBuffer);

  // 2. Build structured prompt for Gemini
  const prompt = `
You are an expert examination question generator.
Your task is to generate exactly ${requestedCount} Multiple Choice Questions (MCQs) strictly based ONLY on the provided PDF document text below.

CRITICAL INSTRUCTIONS:
1. Every question MUST be directly supported by facts, concepts, or figures explicitly mentioned in the PDF text.
2. Do NOT use outside knowledge or hallucinate facts not in the document.
3. If the document has limited content, generate as many distinct valid questions as you can without repeating.
4. Each question must have exactly 4 distinct choices labeled "A", "B", "C", "D".
5. Exactly one choice must be correct, indicated by "correctAnswer": "A" (or "B", "C", "D").
6. Provide a clear, concise explanation referencing the document.
7. Include the "sourcePage" number (integer from 1 to ${totalPages}) where the content is found in the text.
8. The difficulty level for all questions should be "${difficulty}".

REQUIRED JSON FORMAT (return a JSON array of objects):
[
  {
    "question": "Question text here?",
    "options": {
      "A": "First option",
      "B": "Second option",
      "C": "Third option",
      "D": "Fourth option"
    },
    "correctAnswer": "A",
    "explanation": "Clear explanation grounded in the text.",
    "sourcePage": 1,
    "difficulty": "${difficulty}"
  }
]

DOCUMENT CONTENT:
${pdfText}
`;

  // 3. Call Gemini with model fallback
  let rawMcqs = [];
  let usedModel = DEFAULT_MODEL;

  for (const model of FALLBACK_MODELS) {
    try {
      rawMcqs = await callGeminiApi(prompt, model);
      usedModel = model;
      break;
    } catch (err) {
      console.warn(`Model ${model} failed: ${err.message}. Trying next fallback...`);
      if (model === FALLBACK_MODELS[FALLBACK_MODELS.length - 1]) {
        throw new Error(`Failed to generate questions with Gemini: ${err.message}`);
      }
    }
  }

  // 4. Validate and deduplicate
  let validMcqs = validateAndCleanMcqs(rawMcqs, totalPages, difficulty);

  // 5. Single controlled retry if short of requested count and document has enough content
  if (validMcqs.length < requestedCount && validMcqs.length > 0) {
    const missingCount = requestedCount - validMcqs.length;
    console.log(`Generated ${validMcqs.length}/${requestedCount} valid MCQs. Requesting ${missingCount} more in single retry...`);
    
    const existingQuestionsSummary = validMcqs.map((q, i) => `${i+1}. ${q.question}`).join('\n');
    const retryPrompt = `
You are an expert examination question generator.
Generate ${missingCount} ADDITIONAL Multiple Choice Questions (MCQs) strictly based ONLY on the provided PDF document text.

CRITICAL RULES:
- Do NOT generate questions similar to these already created questions:
${existingQuestionsSummary}
- Each MCQ must have exactly 4 unique options (A, B, C, D), 1 correctAnswer, 1 explanation, valid sourcePage (1 to ${totalPages}), and difficulty "${difficulty}".
- Return a JSON array matching the same schema.

DOCUMENT CONTENT:
${pdfText}
`;

    try {
      const retryRaw = await callGeminiApi(retryPrompt, usedModel);
      const retryValid = validateAndCleanMcqs(retryRaw, totalPages, difficulty);
      
      for (const q of retryValid) {
        if (validMcqs.length >= requestedCount) break;
        const isDup = validMcqs.some(existing => areQuestionsDuplicate(existing.question, q.question));
        if (!isDup) {
          validMcqs.push(q);
        }
      }
    } catch (retryErr) {
      console.warn('Single retry attempt encountered error, proceeding with existing valid MCQs:', retryErr.message);
    }
  }

  // Final trim to requestedCount
  const finalMcqs = validMcqs.slice(0, requestedCount);

  let note = null;
  if (finalMcqs.length === 0) {
    throw new Error('Unable to generate valid MCQs from this document. Please ensure the PDF has readable informative text.');
  } else if (finalMcqs.length < requestedCount) {
    note = `Generated ${finalMcqs.length} high-quality MCQs based strictly on the content available in the PDF (requested: ${requestedCount}).`;
  }

  return {
    success: true,
    count: finalMcqs.length,
    requestedCount: requestedCount,
    difficulty: difficulty,
    totalPages: totalPages,
    model: usedModel,
    note: note,
    mcqs: finalMcqs
  };
}

module.exports = {
  extractTextFromPdf,
  validateSingleMcq,
  validateAndCleanMcqs,
  generateMcqsFromPdf
};
