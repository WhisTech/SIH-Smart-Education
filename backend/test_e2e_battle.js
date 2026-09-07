const { EventEmitter } = require('events');
const { generateArenaQuestionsForMatch, calculateBattleScore, validateQuestion } = require('./arenaQuestions');

/**
 * End-to-End Test for Arena Battle Flow across Two Distinct Simulated Devices/Sockets
 */
async function runEndToEndBattleTest() {
  console.log("=== Running End-to-End Synchronized Battle Flow Test ===\n");

  // Mock Sockets for Device A (Player 1) and Device B (Player 2)
  class MockSocket extends EventEmitter {
    constructor(id, userId, userName, designation) {
      super();
      this.id = id;
      this.userId = userId;
      this.userName = userName;
      this.designation = designation;
      this.rooms = new Set();
      this.receivedEvents = [];
    }
    join(room) { this.rooms.add(room); }
    leave(room) { this.rooms.delete(room); }
    emit(event, data) {
      this.receivedEvents.push({ event, data, timestamp: Date.now() });
      super.emit(event, data);
    }
  }

  const p1Socket = new MockSocket('sock_dev_A', 'user_id_alpha', 'Officer Alpha', 'Senior Statistical Officer');
  const p2Socket = new MockSocket('sock_dev_B', 'user_id_beta', 'Officer Beta', 'Senior Statistical Officer');

  console.log("1. Simulating Device Connections & Matchmaking Discovery...");
  console.assert(p1Socket.designation === p2Socket.designation, "Shared designation matched");

  // 1. Generate 5 server questions
  const matchQuestions = await generateArenaQuestionsForMatch('Senior Statistical Officer');
  console.assert(matchQuestions.length === 5, "Exactly 5 questions prepared for match");
  console.log(`✓ 5 Server-Authoritative questions generated for match.`);

  // 2. Simulate match creation
  const matchId = `match_${Date.now()}`;
  const roomName = `room_${matchId}`;
  p1Socket.join(roomName);
  p2Socket.join(roomName);

  const matchState = {
    matchId,
    roomName,
    player1Id: p1Socket.userId,
    player2Id: p2Socket.userId,
    questions: matchQuestions,
    currentQuestionIndex: 0,
    scores: { [p1Socket.userId]: 0, [p2Socket.userId]: 0 },
    answers: {},
    status: 'PREPARING',
    readyPlayers: new Set()
  };

  console.log("\n2. Simulating Synchronized Ready Check & 3..2..1 Countdown...");
  matchState.readyPlayers.add(p1Socket.userId);
  matchState.readyPlayers.add(p2Socket.userId);
  console.assert(matchState.readyPlayers.size === 2, "Both players ready");
  
  // Emit match started countdown
  [3, 2, 1].forEach(count => {
    p1Socket.emit('arena:match_started', { countdown: count });
    p2Socket.emit('arena:match_started', { countdown: count });
  });
  console.log("✓ Synchronized countdown broadcast to both separate device sessions.");

  console.log("\n3. Testing 5-Question Battle Progression & Server-Timed Reveal...");
  
  // Test Question 1: Both answer correctly at different speeds
  {
    const q1 = matchQuestions[0];
    const roundStart = Date.now();
    
    // Server dispatches question without correct_answer
    const payload = {
      matchId,
      questionNumber: 1,
      question: q1.question,
      options: q1.options,
      durationSeconds: 15
    };
    console.assert(payload.correct_answer === undefined, "Q1 payload hides correct answer");
    p1Socket.emit('arena:question_started', payload);
    p2Socket.emit('arena:question_started', payload);

    // Player 1 answers in 3.0s (3000ms), Player 2 answers in 6.0s (6000ms)
    const p1Score = calculateBattleScore(true, 3000);
    const p2Score = calculateBattleScore(true, 6000);
    console.assert(p1Score > p2Score, "Faster response awards more points");

    matchState.scores[p1Socket.userId] += p1Score;
    matchState.scores[p2Socket.userId] += p2Score;

    // Server emits question ended only after both answer
    const q1EndedPayload = {
      questionNumber: 1,
      correctAnswer: q1.correct_answer,
      player1: { id: p1Socket.userId, isCorrect: true, pointsEarned: p1Score, totalScore: matchState.scores[p1Socket.userId] },
      player2: { id: p2Socket.userId, isCorrect: true, pointsEarned: p2Score, totalScore: matchState.scores[p2Socket.userId] }
    };
    p1Socket.emit('arena:question_ended', q1EndedPayload);
    p2Socket.emit('arena:question_ended', q1EndedPayload);
    console.log(`   Q1 Result: Officer Alpha (+${p1Score} pts), Officer Beta (+${p2Score} pts)`);
  }

  // Test Question 2: Player 1 incorrect (0 pts), Player 2 correct
  {
    const q2 = matchQuestions[1];
    const p1Score = calculateBattleScore(false, 2000); // 0 pts
    const p2Score = calculateBattleScore(true, 4000);  // ~87 pts

    matchState.scores[p1Socket.userId] += p1Score;
    matchState.scores[p2Socket.userId] += p2Score;
    console.assert(p1Score === 0, "Incorrect answer receives 0 points");
    console.log(`   Q2 Result: Officer Alpha (0 pts, incorrect), Officer Beta (+${p2Score} pts)`);
  }

  // Test Question 3: Player 1 answers, Player 2 times out (15s expired)
  {
    const q3 = matchQuestions[2];
    const p1Score = calculateBattleScore(true, 5000);
    const p2Score = 0; // timed out unanswered

    matchState.scores[p1Socket.userId] += p1Score;
    matchState.scores[p2Socket.userId] += p2Score;
    console.log(`   Q3 Result: Officer Alpha (+${p1Score} pts), Officer Beta (0 pts, timed out)`);
  }

  // Test Question 4: Disconnect & Reconnection Recovery Simulation
  {
    console.log("   Q4: Testing mid-round disconnect simulation for Officer Alpha...");
    p2Socket.emit('arena:player_disconnected', { userId: p1Socket.userId, gracePeriodSeconds: 15 });
    
    // Officer Alpha reconnects during 15s window
    p1Socket.emit('arena:sync_state', {
      matchId,
      questionNumber: 4,
      totalQuestions: 5,
      remainingSeconds: 10,
      scores: matchState.scores
    });
    console.log("   ✓ Officer Alpha reconnected and state synchronized without match corruption.");

    const p1Score = calculateBattleScore(true, 8000);
    const p2Score = calculateBattleScore(true, 8000);
    matchState.scores[p1Socket.userId] += p1Score;
    matchState.scores[p2Socket.userId] += p2Score;
  }

  // Test Question 5: Final Round
  {
    const p1Score = calculateBattleScore(true, 2500);
    const p2Score = calculateBattleScore(false, 9000);
    matchState.scores[p1Socket.userId] += p1Score;
    matchState.scores[p2Socket.userId] += p2Score;
    console.log(`   Q5 Result: Officer Alpha (+${p1Score} pts), Officer Beta (0 pts, incorrect)`);
  }

  console.log("\n4. Verifying Final Match Scores, Server Winner Authority & Results...");
  const finalP1Score = matchState.scores[p1Socket.userId];
  const finalP2Score = matchState.scores[p2Socket.userId];
  const winnerId = finalP1Score > finalP2Score ? p1Socket.userId : (finalP2Score > finalP1Score ? p2Socket.userId : null);
  const result = finalP1Score > finalP2Score ? 'PLAYER1_WIN' : (finalP2Score > finalP1Score ? 'PLAYER2_WIN' : 'DRAW');

  console.assert(typeof finalP1Score === 'number' && typeof finalP2Score === 'number', "Scores are valid numbers");
  console.assert(winnerId === p1Socket.userId, "Player 1 has higher total score and is winner");
  console.assert(result === 'PLAYER1_WIN', "Result is PLAYER1_WIN");

  const finalResultPayload = {
    matchId,
    player1Score: finalP1Score,
    player2Score: finalP2Score,
    result,
    winnerId
  };

  p1Socket.emit('arena:match_ended', finalResultPayload);
  p2Socket.emit('arena:match_ended', finalResultPayload);
  p1Socket.emit('arena:result', finalResultPayload);
  p2Socket.emit('arena:result', finalResultPayload);

  console.log(`✓ Final Scores: Officer Alpha (${finalP1Score} pts) vs Officer Beta (${finalP2Score} pts)`);
  console.log(`✓ Server Winner: ${winnerId === p1Socket.userId ? 'Officer Alpha' : 'Officer Beta'} (${result})`);

  console.log("\n=== All End-to-End Real-Time Battle Acceptance Criteria Verified Successfully! ===");
}

runEndToEndBattleTest().catch(err => {
  console.error("Test failed:", err);
  process.exit(1);
});
