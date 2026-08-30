// backend/services/aiService.js
const Groq = require('groq-sdk');

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

// 1. Skill Gap AI Assessment
async function analyzeSkillGaps({ employee, skillGaps }) {
  const gaps = skillGaps
    .filter((item) => item.gap > 0)
    .map((item) => ({
      competency: item.competency,
      currentLevel: item.currentLevel,
      requiredLevel: item.requiredLevel,
      gap: item.gap,
      priority: item.priority
    }));

  const prompt = `
You are an AI competency assessment assistant for the National Statistical Systems Training Academy (NSSTA), Ministry of Statistics and Programme Implementation (MoSPI), Government of India.

Employee:
Name: ${employee.name}
Department: ${employee.department}
Designation: ${employee.designation}
Job Role: ${employee.jobRole}

Identified Skill Gaps:
${JSON.stringify(gaps, null, 2)}

Provide a concise, professional competency assessment:
1. Overall Readiness Assessment summary.
2. Top 3 priority competencies needing immediate intervention.
3. Why each competency is critical for their official statistical role.
4. Recommended training action for each.

Tone: Professional, constructive, civil-service oriented.
`;

  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      {
        role: 'system',
        content: 'You are an AI competency assessment assistant for Indian official statistics officers.'
      },
      { role: 'user', content: prompt }
    ],
    temperature: 0.2,
    max_completion_tokens: 800
  });

  const assessment = completion.choices[0]?.message?.content?.trim();
  if (!assessment) {
    throw new Error('Groq returned no assessment text');
  }

  return assessment;
}

// 2. AI Document -> MCQ & Quiz Generator
async function generateQuizFromText({ text, fileName, numQuestions = 5 }) {
  const limitedText = text.slice(0, 25000);

  const prompt = `
You are an expert Examination Controller for the National Statistical Systems Training Academy (NSSTA), Ministry of Statistics and Programme Implementation (MoSPI), Government of India.

Source Document: ${fileName}
Learning Material:
"""
${limitedText}
"""

Generate exactly ${numQuestions} high-quality Multiple Choice Questions (MCQs) strictly grounded in the learning material above.

Rules:
1. Exactly 4 plausible options (A, B, C, D) per question and exactly 1 correct answer.
2. Provide a clear explanation referencing the source text.
3. Difficulty levels: 1 (Basic Recall), 2 (Application/Analysis), 3 (Advanced Statistical Reasoning).
4. Extract the exact sentence/passage as "sourceCitation".
5. Output ONLY valid JSON matching this exact structure:

{
  "quizTitle": "Assessment: ${fileName}",
  "questions": [
    {
      "id": 1,
      "question": "Question text here?",
      "options": {
        "A": "Option A text",
        "B": "Option B text",
        "C": "Option C text",
        "D": "Option D text"
      },
      "correctAnswer": "A",
      "explanation": "Why A is correct based on the material.",
      "difficulty": 2,
      "sourceCitation": "Exact sentence quoted from source document"
    }
  ]
}
`;

  const completion = await groq.chat.completions.create({
    model: 'llama-3.3-70b-versatile',
    messages: [
      {
        role: 'system',
        content: 'You are an AI assessment generator that strictly outputs valid JSON.'
      },
      { role: 'user', content: prompt }
    ],
    temperature: 0.2,
    response_format: { type: 'json_object' }
  });

  const content = completion.choices[0]?.message?.content?.trim();
  if (!content) throw new Error('Groq returned empty response');

  return JSON.parse(content);
}

module.exports = {
  analyzeSkillGaps,
  generateQuizFromText
};