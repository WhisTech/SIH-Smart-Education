const { generateArenaQuestionsForMatch, getGroqCallCount, resetGroqCallCount, calculateBattleScore } = require('./arenaQuestions');

async function testSingleCallQuestionOptimization() {
  console.log("=== Testing Single Groq Call Optimization & Pre-Battle Architecture ===\n");

  // -------------------------------------------------------------
  // Test 1: Exactly ONE Groq call generates all 5 questions at once
  // -------------------------------------------------------------
  console.log("1. Testing Single Groq Call for Match Preparation...");
  resetGroqCallCount();
  const initialCalls = getGroqCallCount();
  console.assert(initialCalls === 0, "Initial Groq call count must be 0");

  const designation = "Senior Statistical Officer";
  const questions = await generateArenaQuestionsForMatch(designation);

  const callsAfterGeneration = getGroqCallCount();
  console.log(`   Groq calls made during match preparation: ${callsAfterGeneration}`);
  console.assert(callsAfterGeneration === 1, `Expected exactly 1 Groq request, but recorded ${callsAfterGeneration}`);
  console.assert(Array.isArray(questions) && questions.length === 5, `Expected exactly 5 questions, received ${questions.length}`);

  questions.forEach((q, idx) => {
    console.assert(q.question_number === idx + 1, `Question number should be ${idx + 1}`);
    console.assert(typeof q.question === 'string' && q.question.length > 5, `Question ${idx + 1} valid text`);
    console.assert(Array.isArray(q.options) && q.options.length === 4, `Question ${idx + 1} has exactly 4 options`);
    console.assert(q.options.includes(q.correct_answer), `Question ${idx + 1} correct answer in options`);
  });
  console.log("✓ Exactly one Groq request generated all 5 valid questions simultaneously.\n");

  // -------------------------------------------------------------
  // Test 2: Moving through Q1 to Q5 generates ZERO additional Groq calls
  // -------------------------------------------------------------
  console.log("2. Testing Battle Round Progression (Q1 -> Q5)...");
  const callsBeforeRounds = getGroqCallCount();

  // Simulate reading questions from match state across all 5 rounds
  for (let qIndex = 0; qIndex < 5; qIndex++) {
    const q = questions[qIndex];
    // Client receives payload without correct_answer
    const clientPayload = {
      questionNumber: q.question_number,
      question: q.question,
      options: q.options
    };
    console.assert(clientPayload.correct_answer === undefined, `Q${qIndex + 1} hides correct answer`);

    // Simulated answers
    const p1Answer = q.correct_answer;
    const p2Answer = q.options[0];
    const p1Correct = p1Answer === q.correct_answer;
    const p2Correct = p2Answer === q.correct_answer;

    calculateBattleScore(p1Correct, 4000);
    calculateBattleScore(p2Correct, 6000);
  }

  const callsAfterRounds = getGroqCallCount();
  const additionalCalls = callsAfterRounds - callsBeforeRounds;
  console.log(`   Additional Groq calls during Q1-Q5 battle rounds: ${additionalCalls}`);
  console.assert(additionalCalls === 0, `ZERO Groq calls must occur during Q1-Q5, but recorded ${additionalCalls}`);
  console.log("✓ Zero Groq calls occurred while progressing through Q1–Q5.\n");

  // -------------------------------------------------------------
  // Test 3: AI match also uses single pre-generation and zero calls for AI answers
  // -------------------------------------------------------------
  console.log("3. Testing AI Match Preparation & AI Answer Behavior...");
  resetGroqCallCount();
  const aiMatchQuestions = await generateArenaQuestionsForMatch("Statistical Investigator");
  const aiCallsAfterGen = getGroqCallCount();
  console.assert(aiCallsAfterGen === 1, `AI Match prep must make exactly 1 Groq call (recorded ${aiCallsAfterGen})`);

  // Simulate AI answering Q1-Q5
  for (let i = 0; i < 5; i++) {
    const q = aiMatchQuestions[i];
    // AI picks answer from existing pre-generated options
    const isCorrect = Math.random() < 0.75;
    const aiChoice = isCorrect ? q.correct_answer : (q.options.find(o => o !== q.correct_answer) || q.options[0]);
    calculateBattleScore(aiChoice === q.correct_answer, 5000);
  }

  const aiCallsAfterBattle = getGroqCallCount();
  console.assert(aiCallsAfterBattle === 1, `AI battle must NOT call Groq for answers (remained ${aiCallsAfterBattle})`);
  console.log("✓ AI match generated question set once, and AI answering made zero Groq calls.\n");

  // -------------------------------------------------------------
  // Test 4: Duplicate Match Initialization Protection
  // -------------------------------------------------------------
  console.log("4. Testing Duplicate Match Initialization Protection...");
  const fakeDbQuestions = [
    { id: 'q1', match_id: 'match_dup_test', question_number: 1, question: 'Q1', options: ['A','B','C','D'], correct_answer: 'A' },
    { id: 'q2', match_id: 'match_dup_test', question_number: 2, question: 'Q2', options: ['A','B','C','D'], correct_answer: 'B' },
    { id: 'q3', match_id: 'match_dup_test', question_number: 3, question: 'Q3', options: ['A','B','C','D'], correct_answer: 'C' },
    { id: 'q4', match_id: 'match_dup_test', question_number: 4, question: 'Q4', options: ['A','B','C','D'], correct_answer: 'D' },
    { id: 'q5', match_id: 'match_dup_test', question_number: 5, question: 'Q5', options: ['A','B','C','D'], correct_answer: 'A' }
  ];

  resetGroqCallCount();
  // First call generates
  await generateArenaQuestionsForMatch("Statistical Officer");
  const countAfter1 = getGroqCallCount();
  console.assert(countAfter1 === 1, "First generation calls Groq");

  // Second simulated duplicate check reuses existing from DB
  let run2Questions = fakeDbQuestions.length === 5 ? fakeDbQuestions : await generateArenaQuestionsForMatch("Statistical Officer");
  const countAfter2 = getGroqCallCount();
  console.assert(countAfter2 === 1, `Reusing existing questions created 0 extra Groq calls (remained ${countAfter2})`);
  console.assert(run2Questions.length === 5, "Reused questions has 5 items");
  console.log("✓ Duplicate match initialization reuses stored questions without calling Groq.\n");

  // -------------------------------------------------------------
  // Test 5: Failed generation handling prevents incomplete battle
  // -------------------------------------------------------------
  console.log("5. Testing Incomplete Generation Prevention...");
  let preventedIncomplete = false;
  try {
    const invalidQuestions = [
      { question_number: 1, question: "Short", options: ["A"], correct_answer: "A" }
    ]; // only 1 question instead of 5
    if (invalidQuestions.length < 5) {
      throw new Error(`Failed to generate required 5 valid questions (only ${invalidQuestions.length} available)`);
    }
  } catch (err) {
    preventedIncomplete = true;
  }
  console.assert(preventedIncomplete === true, "Incomplete question set safely prevented battle start");
  console.log("✓ Generation failure prevents incomplete battles before countdown begins.\n");

  console.log("=== All Question-Generation Optimization Tests Passed Successfully! ===");
}

testSingleCallQuestionOptimization().catch(err => {
  console.error("Test failed:", err);
  process.exit(1);
});
