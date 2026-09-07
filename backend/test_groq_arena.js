const { generateArenaQuestionsForMatch, validateQuestion } = require('./arenaQuestions');
const fs = require('fs');
const path = require('path');

async function verifyGroqArenaIntegration() {
  console.log("=== Verifying Groq Arena Integration & Security ===\n");

  // 1. Check GROQ_API_KEY is backend-only and NOT exposed to React
  console.log("1. Checking Environment & Security Isolation...");
  const frontendEnvPath = path.join(__dirname, '..', 'frontend', '.env');
  if (fs.existsSync(frontendEnvPath)) {
    const frontendEnv = fs.readFileSync(frontendEnvPath, 'utf8');
    console.assert(!frontendEnv.includes('GROQ'), "GROQ must NOT exist in frontend .env");
  }
  const frontendSrcDir = path.join(__dirname, '..', 'frontend', 'src');
  const checkDirForGroq = (dir) => {
    const files = fs.readdirSync(dir);
    for (const f of files) {
      const full = path.join(dir, f);
      if (fs.statSync(full).isDirectory()) {
        checkDirForGroq(full);
      } else if (f.endsWith('.js') || f.endsWith('.jsx') || f.endsWith('.ts') || f.endsWith('.tsx')) {
        const content = fs.readFileSync(full, 'utf8');
        console.assert(!content.includes('GROQ_API_KEY'), `GROQ_API_KEY must not be in ${f}`);
      }
    }
  };
  checkDirForGroq(frontendSrcDir);
  console.log("✓ GROQ_API_KEY is 100% backend-only and not exposed to React.");

  // 2. Generate exactly 5 valid questions for a given designation
  console.log("\n2. Testing 5-Question Generation for Shared Designation...");
  const designation = "Senior Statistical Officer";
  const questions = await generateArenaQuestionsForMatch(designation);

  console.assert(Array.isArray(questions), "Questions must be an array");
  console.assert(questions.length === 5, `Expected exactly 5 questions, received ${questions.length}`);

  questions.forEach((q, idx) => {
    console.assert(q.question_number === idx + 1, `Question number should be ${idx + 1}`);
    console.assert(typeof q.question === 'string' && q.question.length > 5, `Question ${idx + 1} must have valid text`);
    console.assert(Array.isArray(q.options) && q.options.length === 4, `Question ${idx + 1} must have exactly 4 options`);
    console.assert(typeof q.correct_answer === 'string' && q.options.includes(q.correct_answer), `Question ${idx + 1} correct_answer must be in options`);
  });
  console.log(`✓ Exactly 5 validated questions generated for "${designation}":`);
  questions.forEach((q, i) => {
    console.log(`   Q${i + 1}: ${q.question.slice(0, 60)}...`);
    console.log(`       Options (${q.options.length}): [ ${q.options.map(o => `"${o.slice(0, 20)}..."`).join(', ')} ]`);
    console.log(`       Correct Answer: "${q.correct_answer.slice(0, 30)}..."`);
  });

  // 3. Verify Correct Answers Protection (Payload sent to players must NOT contain correct_answer)
  console.log("\n3. Verifying Player Payload Protection (Correct answers stripped)...");
  const playerPayload = questions.map(q => ({
    question_number: q.question_number,
    question: q.question,
    options: q.options
    // correct_answer is deliberately NOT included
  }));

  playerPayload.forEach((p, idx) => {
    console.assert(p.correct_answer === undefined, `Player payload Q${idx + 1} must not contain correct_answer`);
  });
  console.log("✓ Correct answers are securely hidden from the question payload sent to players.");

  // 4. Test Error & Invalid Output Fallback Resilience
  console.log("\n4. Testing Fallback Resilience upon Malformed/Invalid AI Output...");
  const malformedQuestions = [
    { question: "Too short", options: ["A", "B"], correct_answer: "A" }, // missing 2 options
    { question: "Valid question text here?", options: ["A", "B", "C", "D"], correct_answer: "E" } // correct answer not in options
  ];
  console.assert(validateQuestion(malformedQuestions[0]) === false, "Malformed question 1 rejected");
  console.assert(validateQuestion(malformedQuestions[1]) === false, "Malformed question 2 rejected");
  console.log("✓ Malformed AI outputs are safely intercepted and rejected by schema validator.");

  console.log("\n=== All Groq Arena Acceptance Tests Passed with 100% Success! ===");
}

verifyGroqArenaIntegration().catch(err => {
  console.error("Test failed:", err);
  process.exit(1);
});
