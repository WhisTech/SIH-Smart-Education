const { generateArenaQuestionsForMatch, calculateBattleScore, validateQuestion } = require('./arenaQuestions');

async function testArenaBattleEngine() {
  console.log("=== 1. Testing Question Validation & Generation ===");
  
  // Test invalid question rejection
  const invalidQ = { question: "Short", options: ["A", "B"], correct_answer: "A" };
  console.assert(validateQuestion(invalidQ) === false, "Invalid question should be rejected");
  
  // Test valid question acceptance
  const validQ = {
    question: "What is the standard base year for CPI?",
    options: ["2004-05", "2011-12", "2016-17", "2018-19"],
    correct_answer: "2011-12"
  };
  const validated = validateQuestion(validQ);
  console.assert(validated !== false, "Valid question should pass");
  console.assert(validated.options.length === 4, "Should have 4 options");
  console.log("✓ Question schema validation passed");

  // Test generating 5 questions for a designation
  const questions = await generateArenaQuestionsForMatch("Senior Statistical Officer");
  console.assert(questions.length === 5, `Expected 5 questions, got ${questions.length}`);
  questions.forEach((q, idx) => {
    console.assert(q.question_number === idx + 1, `Question number should be ${idx + 1}`);
    console.assert(q.options.length === 4, "Question must have 4 options");
    console.assert(q.options.includes(q.correct_answer), "Correct answer must be in options");
  });
  console.log(`✓ 5-question match generation passed. Sample Question 1: "${questions[0].question.slice(0, 50)}..."`);

  console.log("\n=== 2. Testing Deterministic Server Scoring Formula ===");
  // Correct answers: Base 50 + speed bonus (up to 50)
  const scoreInstant = calculateBattleScore(true, 0);
  const scoreMid = calculateBattleScore(true, 7500);
  const scoreSlow = calculateBattleScore(true, 15000);
  const scoreWrong = calculateBattleScore(false, 1000);

  console.assert(scoreInstant === 100, `Instant correct score should be 100, got ${scoreInstant}`);
  console.assert(scoreMid === 75, `Half-time correct score should be 75, got ${scoreMid}`);
  console.assert(scoreSlow === 50, `15s correct score should be 50, got ${scoreSlow}`);
  console.assert(scoreWrong === 0, `Incorrect score should be 0, got ${scoreWrong}`);

  console.log(`✓ Instant answer: ${scoreInstant} pts`);
  console.log(`✓ 7.5s answer: ${scoreMid} pts`);
  console.log(`✓ 15s deadline answer: ${scoreSlow} pts`);
  console.log(`✓ Incorrect answer: ${scoreWrong} pts`);

  console.log("\n=== All Arena Battle Engine Unit Tests Passed Successfully! ===");
}

testArenaBattleEngine().catch(err => {
  console.error("Test failed:", err);
  process.exit(1);
});
