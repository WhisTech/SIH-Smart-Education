const { Server } = require('socket.io');
const { createClient } = require('@supabase/supabase-js');
const { checkAndAwardBadges } = require('./arenaBadgeService');
const { generateArenaQuestionsForMatch, calculateBattleScore } = require('./arenaQuestions');

// In-memory state
const activePlayers = new Map(); // userId -> { socketId, status, designationId, designationName, lat, lng, lastSeen, currentMatchId }
const searchQueue = new Set(); // set of userIds currently searching
const pendingChallenges = new Map(); // challengeId -> { challengerId, targetId, timeoutId }
const activeMatches = new Map(); // matchId -> MatchState
const activeGenerationPromises = new Map(); // matchId -> Promise<questions>

const ROUND_DURATION_MS = 15000;
const ROUND_TRANSITION_MS = 3500;
const RECONNECT_GRACE_PERIOD_MS = 15000;

// Configurable AI Difficulty Profiles
const AI_DIFFICULTY_PROFILES = {
  EASY: {
    name: 'Easy',
    minDelayMs: 6500,
    maxDelayMs: 11500,
    accuracy: 0.50
  },
  MEDIUM: {
    name: 'Medium',
    minDelayMs: 4000,
    maxDelayMs: 8000,
    accuracy: 0.72
  },
  HARD: {
    name: 'Hard',
    minDelayMs: 2000,
    maxDelayMs: 5000,
    accuracy: 0.88
  }
};

/**
 * Simulates an AI answer based on question and difficulty profile.
 * ZERO Groq API calls - uses deterministic server application logic.
 */
function simulateAiAnswer(question, difficultyKey = 'MEDIUM') {
  const profile = AI_DIFFICULTY_PROFILES[String(difficultyKey).toUpperCase()] || AI_DIFFICULTY_PROFILES.MEDIUM;
  const delayMs = Math.floor(Math.random() * (profile.maxDelayMs - profile.minDelayMs)) + profile.minDelayMs;
  const isCorrect = Math.random() < profile.accuracy;

  let selectedOption;
  if (isCorrect) {
    selectedOption = question.correct_answer;
  } else {
    const wrongOptions = question.options.filter(opt => String(opt).trim() !== String(question.correct_answer).trim());
    if (wrongOptions.length > 0) {
      selectedOption = wrongOptions[Math.floor(Math.random() * wrongOptions.length)];
    } else {
      selectedOption = question.options[0];
    }
  }

  const actuallyCorrect = String(selectedOption).trim() === String(question.correct_answer).trim();
  const points = calculateBattleScore(actuallyCorrect, delayMs);

  return {
    option: selectedOption,
    isCorrect: actuallyCorrect,
    delayMs,
    points
  };
}

function initArenaSocket(server, supabaseUrl, supabaseSecretKey) {
  const io = new Server(server, {
    cors: {
      origin: [
        'http://localhost:5173',
        'http://localhost:3000',
        'http://localhost:5000',
        process.env.FRONTEND_URL
      ].filter(Boolean),
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  const supabase = createClient(supabaseUrl, supabaseSecretKey);

  io.on('connection', (socket) => {
    let currentUserId = null;

    // 1. Authenticate the socket connection
    socket.on('arena:auth', async ({ token }) => {
      try {
        if (!token) {
          socket.emit('arena:error', { message: 'Missing token' });
          return;
        }

        const { data: { user }, error } = await supabase.auth.getUser(token);
        if (error || !user) {
          socket.emit('arena:error', { message: 'Authentication failed' });
          return;
        }

        currentUserId = user.id;

        // Fetch designation details safely with fallback
        const { data: profile } = await supabase
          .from('employee_profiles')
          .select('designation_id, department, designations(name)')
          .eq('user_id', currentUserId)
          .maybeSingle();

        let designationName = profile?.designations?.name || null;
        const designationId = profile?.designation_id || null;

        if (!designationName && designationId) {
          const { data: desigRow } = await supabase
            .from('designations')
            .select('name')
            .eq('id', designationId)
            .maybeSingle();
          if (desigRow) designationName = desigRow.name;
        }

        if (!designationName) {
          designationName = profile?.department || 'Statistical Officer';
        }

        // Ensure arena_profiles row exists with default 1200 competitive rating
        const { data: arenaProf } = await supabase
          .from('arena_profiles')
          .select('user_id, arena_rating, arena_points')
          .eq('user_id', currentUserId)
          .maybeSingle();

        if (!arenaProf) {
          try {
            await supabase.from('arena_profiles').insert({
              user_id: currentUserId,
              arena_rating: 1200,
              arena_points: 0,
              wins: 0,
              losses: 0,
              draws: 0,
              current_streak: 0,
              best_streak: 0,
              total_matches: 0,
              is_available: true
            });
          } catch (e) {
            console.warn('Initial arena profile auto-insert skipped:', e.message);
          }
        }

        // Check if player was in an active match (reconnection)
        const existingPlayer = activePlayers.get(currentUserId);
        const matchId = existingPlayer?.currentMatchId;
        let playerStatus = 'ARENA_AVAILABLE';

        if (matchId && activeMatches.has(matchId)) {
          const match = activeMatches.get(matchId);
          if (match.status !== 'COMPLETED') {
            playerStatus = 'IN_MATCH';
            // Cancel disconnect grace timer if running
            if (match.disconnectTimers && match.disconnectTimers[currentUserId]) {
              clearTimeout(match.disconnectTimers[currentUserId]);
              delete match.disconnectTimers[currentUserId];
            }
            socket.join(match.roomName);
          }
        }

        activePlayers.set(currentUserId, {
          socketId: socket.id,
          status: playerStatus,
          designationId,
          designationName,
          lat: null,
          lng: null,
          lastSeen: Date.now(),
          currentMatchId: playerStatus === 'IN_MATCH' ? matchId : null
        });

        socket.join(`user:${currentUserId}`);
        socket.emit('arena:auth_success', { status: playerStatus, currentMatchId: matchId || null });

        // If reconnected to an active match, synchronize state
        if (playerStatus === 'IN_MATCH' && matchId) {
          syncMatchStateToReconnectedPlayer(socket, currentUserId, activeMatches.get(matchId));
        }

      } catch (err) {
        console.error('Socket auth error:', err);
        socket.emit('arena:error', { message: 'Authentication error' });
      }
    });

    // 2. Start Search / Matchmaking
    socket.on('arena:search', (data) => {
      if (!currentUserId || !activePlayers.has(currentUserId)) return;
      
      const player = activePlayers.get(currentUserId);
      if (player.status === 'IN_MATCH' || player.status === 'CHALLENGE_PENDING') {
        socket.emit('arena:error', { message: 'Cannot search while in a match or challenge' });
        return;
      }

      player.lat = typeof data?.lat === 'number' ? data.lat : null;
      player.lng = typeof data?.lng === 'number' ? data.lng : null;
      player.status = 'SEARCHING';
      searchQueue.add(currentUserId);

      // Update presence in Supabase
      supabase
        .from('arena_profiles')
        .update({
          is_available: true,
          latitude: player.lat,
          longitude: player.lng,
          last_seen_at: new Date().toISOString()
        })
        .eq('user_id', currentUserId)
        .then(() => {});

      attemptMatchmaking(currentUserId);
    });

    // Matchmaking Evaluation
    const attemptMatchmaking = (searcherId) => {
      const searcher = activePlayers.get(searcherId);
      if (!searcher || searcher.status !== 'SEARCHING') return;

      let bestMatchId = null;
      let minDistance = Infinity;

      for (const candidateId of searchQueue) {
        if (candidateId === searcherId) continue;
        const candidate = activePlayers.get(candidateId);
        
        if (!candidate || candidate.status !== 'SEARCHING') {
          searchQueue.delete(candidateId);
          continue;
        }

        // HARD REQUIREMENT: exact same designation (by ID or designation name)
        const isSameDesig = (searcher.designationId && candidate.designationId && searcher.designationId === candidate.designationId) ||
                            (searcher.designationName && candidate.designationName && searcher.designationName.toLowerCase() === candidate.designationName.toLowerCase());

        if (isSameDesig) {
          if (searcher.lat && searcher.lng && candidate.lat && candidate.lng) {
            const dist = getDistance(searcher.lat, searcher.lng, candidate.lat, candidate.lng);
            if (dist < minDistance) {
              minDistance = dist;
              bestMatchId = candidateId;
            }
          } else {
            bestMatchId = candidateId;
            break;
          }
        }
      }

      if (bestMatchId) {
        createChallenge(searcherId, bestMatchId);
      }
    };

    // 3. Create Challenge (Atomically lock both players out of searchQueue)
    const createChallenge = async (p1Id, p2Id) => {
      const p1 = activePlayers.get(p1Id);
      const p2 = activePlayers.get(p2Id);
      if (!p1 || !p2) return;

      // Atomic lock
      p1.status = 'CHALLENGE_PENDING';
      p2.status = 'CHALLENGE_PENDING';
      searchQueue.delete(p1Id);
      searchQueue.delete(p2Id);

      const challengeId = `chal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const timeoutId = setTimeout(() => {
        handleChallengeExpiry(challengeId);
      }, 15000);

      pendingChallenges.set(challengeId, {
        challengerId: p1Id,
        targetId: p2Id,
        timeoutId
      });

      // Fetch profile details for notifications
      const { data: p1Profile } = await supabase.from('employee_profiles').select('name, department, designations(name)').eq('user_id', p1Id).maybeSingle();
      const { data: p2Profile } = await supabase.from('employee_profiles').select('name, department, designations(name)').eq('user_id', p2Id).maybeSingle();
      const { data: p1Arena } = await supabase.from('arena_profiles').select('arena_rating, arena_points').eq('user_id', p1Id).maybeSingle();
      const { data: p2Arena } = await supabase.from('arena_profiles').select('arena_rating, arena_points').eq('user_id', p2Id).maybeSingle();

      // Challenger receives opponent found
      io.to(`user:${p1Id}`).emit('arena:opponent_found', {
        challengeId,
        opponent: {
          id: p2Id,
          name: p2Profile?.name || 'Colleague',
          department: p2Profile?.department || p2Profile?.designations?.name || 'MoSPI',
          rating: p2Arena?.arena_rating || 1200,
          points: p2Arena?.arena_points || 0
        }
      });

      // Target receives incoming challenge
      io.to(`user:${p2Id}`).emit('arena:challenge_received', {
        challengeId,
        challenger: {
          id: p1Id,
          name: p1Profile?.name || 'Colleague',
          department: p1Profile?.department || p1Profile?.designations?.name || 'MoSPI',
          rating: p1Arena?.arena_rating || 1200,
          points: p1Arena?.arena_points || 0
        }
      });
    };

    const handleChallengeExpiry = (challengeId) => {
      const chal = pendingChallenges.get(challengeId);
      if (!chal) return;
      pendingChallenges.delete(challengeId);

      const p1 = activePlayers.get(chal.challengerId);
      const p2 = activePlayers.get(chal.targetId);

      if (p2) p2.status = 'ARENA_AVAILABLE';

      // Challenger returns to SEARCHING queue seamlessly
      if (p1) {
        p1.status = 'SEARCHING';
        searchQueue.add(chal.challengerId);
        attemptMatchmaking(chal.challengerId);
      }

      io.to(`user:${chal.challengerId}`).emit('arena:challenge_expired', { 
        message: 'Challenge request timed out. Resuming matchmaking queue...' 
      });
      io.to(`user:${chal.targetId}`).emit('arena:challenge_expired', { 
        message: 'Challenge request expired.' 
      });
    };

    /**
     * Pre-generates and stores exactly 5 questions for an Arena match.
     * OPTIMIZATION & PROTECTION:
     * 1. Calls Groq at most ONCE per match to generate all 5 questions together.
     * 2. Checks arena_questions first; reuses existing stored questions if match was already initialized.
     * 3. Prevents duplicate question generation via in-memory lock activeGenerationPromises.
     * 4. Validates all 5 questions completely before returning.
     * 5. If generation fails, throws an error so match cannot start with incomplete questions.
     */
    async function getOrGenerateMatchQuestions(matchId, designationName) {
      if (!matchId) throw new Error('Missing matchId for question preparation');

      // 1. Concurrent deduplication lock
      if (activeGenerationPromises.has(matchId)) {
        return await activeGenerationPromises.get(matchId);
      }

      const promise = (async () => {
        // 2. Check if questions are already in the database for this match
        const { data: existingQuestions, error: fetchErr } = await supabase
          .from('arena_questions')
          .select('id, match_id, question_number, question, options, correct_answer')
          .eq('match_id', matchId)
          .order('question_number', { ascending: true });

        if (!fetchErr && existingQuestions && existingQuestions.length === 5) {
          return existingQuestions;
        }

        // 3. Generate exactly 5 questions in ONE single Groq call
        const generated = await generateArenaQuestionsForMatch(designationName || 'Statistical Officer');
        if (!generated || !Array.isArray(generated) || generated.length !== 5) {
          throw new Error(`Question generation failed to produce exactly 5 questions (got ${generated ? generated.length : 0})`);
        }

        // 4. Store all 5 validated questions in arena_questions
        const dbQuestions = generated.map(q => ({
          match_id: matchId,
          question_number: q.question_number,
          question: q.question,
          options: q.options,
          correct_answer: q.correct_answer
        }));

        const { data: insertedQuestions, error: insertErr } = await supabase
          .from('arena_questions')
          .insert(dbQuestions)
          .select('id, match_id, question_number, question, options, correct_answer')
          .order('question_number', { ascending: true });

        if (insertErr || !insertedQuestions || insertedQuestions.length !== 5) {
          // If unique constraint hit or partial insert, fetch existing
          const { data: retryQuestions } = await supabase
            .from('arena_questions')
            .select('id, match_id, question_number, question, options, correct_answer')
            .eq('match_id', matchId)
            .order('question_number', { ascending: true });

          if (retryQuestions && retryQuestions.length === 5) {
            return retryQuestions;
          }
          throw insertErr || new Error('Failed to insert all 5 questions into arena_questions');
        }

        return insertedQuestions;
      })();

      activeGenerationPromises.set(matchId, promise);
      try {
        return await promise;
      } finally {
        activeGenerationPromises.delete(matchId);
      }
    }

    // 4. Accept Challenge & Match Preparation (Human vs Human)
    socket.on('arena:accept_challenge', async (data) => {
      const { challengeId } = data;
      const chal = pendingChallenges.get(challengeId);
      if (!chal) return;

      // Clear immediately to prevent double processing
      clearTimeout(chal.timeoutId);
      pendingChallenges.delete(challengeId);

      const p1 = activePlayers.get(chal.challengerId);
      const p2 = activePlayers.get(chal.targetId);
      if (!p1 || !p2) return;

      p1.status = 'IN_MATCH';
      p2.status = 'IN_MATCH';

      let matchId = null;
      try {
        // Create match in DB
        const { data: matchRow, error: matchErr } = await supabase
          .from('arena_matches')
          .insert({
            player1_id: chal.challengerId,
            player2_id: chal.targetId,
            mode: 'HUMAN',
            status: 'IN_PROGRESS',
            started_at: new Date().toISOString()
          })
          .select('id')
          .single();

        if (matchErr || !matchRow) {
          throw matchErr || new Error('Could not create match in database');
        }

        matchId = matchRow.id;
        const roomName = `match_${matchId}`;
        p1.currentMatchId = matchId;
        p2.currentMatchId = matchId;

        // Make sockets join private match room
        const p1Socket = io.sockets.sockets.get(p1.socketId);
        const p2Socket = io.sockets.sockets.get(p2.socketId);
        if (p1Socket) p1Socket.join(roomName);
        if (p2Socket) p2Socket.join(roomName);

        // Pre-generate and store all 5 questions ONCE before battle starts
        const questions = await getOrGenerateMatchQuestions(matchId, p1.designationName || 'Statistical Officer');

        // Initialize in-memory Match State
        const matchState = {
          matchId,
          roomName,
          mode: 'HUMAN',
          player1Id: chal.challengerId,
          player2Id: chal.targetId,
          designationName: p1.designationName,
          questions: questions,
          currentQuestionIndex: 0,
          roundStartTime: null,
          roundTimer: null,
          roundTransitionTimer: null,
          answers: {}, // [questionNumber]: { [userId]: { answer, isCorrect, responseTimeMs, points, dbQuestionId } }
          scores: {
            [chal.challengerId]: 0,
            [chal.targetId]: 0
          },
          status: 'PREPARING',
          readyPlayers: new Set(),
          disconnectTimers: {}
        };

        activeMatches.set(matchId, matchState);

        // Fetch names for match start
        const { data: p1Prof } = await supabase.from('employee_profiles').select('name').eq('user_id', chal.challengerId).single();
        const { data: p2Prof } = await supabase.from('employee_profiles').select('name').eq('user_id', chal.targetId).single();

        io.to(roomName).emit('arena:match_created', {
          matchId,
          roomName,
          mode: 'HUMAN',
          player1: { id: chal.challengerId, name: p1Prof?.name || 'Player 1' },
          player2: { id: chal.targetId, name: p2Prof?.name || 'Player 2' },
          totalQuestions: 5
        });

        // Trigger synchronized countdown
        startMatchCountdown(matchState);

      } catch (createErr) {
        console.error('Error in match preparation:', createErr);
        p1.status = 'ARENA_AVAILABLE';
        p2.status = 'ARENA_AVAILABLE';
        p1.currentMatchId = null;
        p2.currentMatchId = null;
        if (matchId) {
          await supabase.from('arena_matches').update({ status: 'CANCELLED' }).eq('id', matchId);
        }
        io.to(`user:${chal.challengerId}`).emit('arena:error', { message: 'Could not initialize match questions. Please try again.' });
        io.to(`user:${chal.targetId}`).emit('arena:error', { message: 'Could not initialize match questions. Please try again.' });
      }
    });

    // 4b. Start AI Match & Question Preparation
    socket.on('arena:start_ai_match', async (data) => {
      if (!currentUserId || !activePlayers.has(currentUserId)) return;
      const player = activePlayers.get(currentUserId);

      if (player.status === 'IN_MATCH' && player.currentMatchId && activeMatches.has(player.currentMatchId)) {
        syncMatchStateToReconnectedPlayer(socket, currentUserId, activeMatches.get(player.currentMatchId));
        return;
      }

      const rawDiff = data?.difficulty ? String(data.difficulty).toUpperCase() : 'MEDIUM';
      const difficulty = AI_DIFFICULTY_PROFILES[rawDiff] ? rawDiff : 'MEDIUM';

      player.status = 'IN_MATCH';
      searchQueue.delete(currentUserId);

      let matchId = null;
      try {
        // Create AI match in DB (player2_id is null for AI)
        const { data: matchRow, error: matchErr } = await supabase
          .from('arena_matches')
          .insert({
            player1_id: currentUserId,
            player2_id: null,
            mode: 'AI',
            status: 'IN_PROGRESS',
            started_at: new Date().toISOString()
          })
          .select('id')
          .single();

        if (matchErr || !matchRow) {
          throw matchErr || new Error('Could not create AI match in database');
        }

        matchId = matchRow.id;
        const roomName = `match_${matchId}`;
        player.currentMatchId = matchId;
        socket.join(roomName);

        // Pre-generate and store all 5 questions ONCE before battle starts
        const questions = await getOrGenerateMatchQuestions(matchId, player.designationName || 'Statistical Officer');

        const { data: userProfile } = await supabase
          .from('employee_profiles')
          .select('name')
          .eq('user_id', currentUserId)
          .single();

        const playerName = userProfile?.name || 'Officer';

        // Initialize in-memory Match State
        const matchState = {
          matchId,
          roomName,
          mode: 'AI',
          difficulty,
          player1Id: currentUserId,
          player2Id: 'ai_bot',
          designationName: player.designationName,
          questions: questions,
          currentQuestionIndex: 0,
          roundStartTime: null,
          roundTimer: null,
          roundTransitionTimer: null,
          aiAnswerTimer: null,
          answers: {},
          scores: {
            [currentUserId]: 0,
            'ai_bot': 0
          },
          status: 'PREPARING',
          readyPlayers: new Set(['ai_bot']),
          disconnectTimers: {}
        };

        activeMatches.set(matchId, matchState);

        socket.emit('arena:match_created', {
          matchId,
          roomName,
          mode: 'AI',
          difficulty,
          player1: { id: currentUserId, name: playerName },
          player2: { id: 'ai_bot', name: 'Arena AI', avatar: '🤖', isAI: true, difficulty },
          totalQuestions: 5
        });

        // Trigger synchronized countdown
        startMatchCountdown(matchState);

      } catch (createErr) {
        console.error('Error in AI match preparation:', createErr);
        player.status = 'ARENA_AVAILABLE';
        player.currentMatchId = null;
        if (matchId) {
          await supabase.from('arena_matches').update({ status: 'CANCELLED' }).eq('id', matchId);
        }
        socket.emit('arena:error', { message: 'Could not initialize AI match questions. Please try again.' });
      }
    });

    // Handle Player Ready
    socket.on('arena:player_ready', ({ matchId }) => {
      if (!matchId || !currentUserId) return;
      const match = activeMatches.get(matchId);
      if (!match) return;

      match.readyPlayers.add(currentUserId);
      if (match.readyPlayers.size >= 2 && match.status === 'PREPARING') {
        startMatchCountdown(match);
      }
    });

    // 5. Match Synchronized Countdown & Start
    const startMatchCountdown = (match) => {
      if (match.status === 'COUNTDOWN' || match.status === 'QUESTION_ACTIVE') return;
      match.status = 'COUNTDOWN';
      let countdown = 3;

      io.to(match.roomName).emit('arena:match_started', { countdown });

      const countInterval = setInterval(() => {
        countdown -= 1;
        if (countdown > 0) {
          io.to(match.roomName).emit('arena:match_started', { countdown });
        } else {
          clearInterval(countInterval);
          // Start Question 1
          startQuestionRound(match, 0);
        }
      }, 1000);
    };

    // 6. Start Question Round
    const startQuestionRound = (match, questionIndex) => {
      if (questionIndex >= match.questions.length) {
        endMatch(match);
        return;
      }

      match.currentQuestionIndex = questionIndex;
      match.status = 'QUESTION_ACTIVE';
      match.roundStartTime = Date.now();

      const q = match.questions[questionIndex];
      match.answers[q.question_number] = {};

      // Send question payload to players (WITHOUT correct_answer)
      io.to(match.roomName).emit('arena:question_started', {
        matchId: match.matchId,
        questionIndex,
        questionNumber: q.question_number,
        totalQuestions: match.questions.length,
        question: q.question,
        options: q.options,
        durationSeconds: ROUND_DURATION_MS / 1000,
        startTime: match.roundStartTime
      });

      // 15-second round timer
      if (match.roundTimer) clearTimeout(match.roundTimer);
      match.roundTimer = setTimeout(() => {
        endQuestionRound(match);
      }, ROUND_DURATION_MS);

      // AI Opponent simulation (SEPARATE from question generation, zero Groq calls)
      if (match.mode === 'AI' || match.player2Id === 'ai_bot') {
        if (match.aiAnswerTimer) clearTimeout(match.aiAnswerTimer);
        const aiResult = simulateAiAnswer(q, match.difficulty || 'MEDIUM');
        match.aiAnswerTimer = setTimeout(() => {
          if (match.status !== 'QUESTION_ACTIVE' || match.currentQuestionIndex !== questionIndex) return;

          const roundAnswers = match.answers[q.question_number] || {};
          if (roundAnswers['ai_bot']) return;

          roundAnswers['ai_bot'] = {
            answer: aiResult.option,
            isCorrect: aiResult.isCorrect,
            responseTimeMs: aiResult.delayMs,
            points: aiResult.points,
            dbQuestionId: q.id
          };
          match.answers[q.question_number] = roundAnswers;
          match.scores['ai_bot'] = (match.scores['ai_bot'] || 0) + aiResult.points;

          // If human already answered, finish round immediately
          if (roundAnswers[match.player1Id]) {
            if (match.roundTimer) clearTimeout(match.roundTimer);
            endQuestionRound(match);
          }
        }, aiResult.delayMs);
      }
    };

    // 7. Handle Answer Submission
    socket.on('arena:submit_answer', async (data) => {
      const { matchId, questionNumber, selectedOption } = data;
      if (!currentUserId || !matchId) return;

      const match = activeMatches.get(matchId);
      if (!match || match.status !== 'QUESTION_ACTIVE') return;

      // Verify user is in this match
      if (currentUserId !== match.player1Id && currentUserId !== match.player2Id) return;

      const currentQ = match.questions[match.currentQuestionIndex];
      if (!currentQ || currentQ.question_number !== questionNumber) return;

      const roundAnswers = match.answers[questionNumber] || {};
      
      // Enforce single submission: ignore duplicate
      if (roundAnswers[currentUserId]) {
        return;
      }

      const responseTimeMs = Date.now() - match.roundStartTime;
      // Allow 500ms network latency buffer over 15s
      if (responseTimeMs > ROUND_DURATION_MS + 500) {
        return;
      }

      const isCorrect = String(selectedOption).trim() === String(currentQ.correct_answer).trim();
      const points = calculateBattleScore(isCorrect, responseTimeMs);

      // Record answer
      roundAnswers[currentUserId] = {
        answer: selectedOption,
        isCorrect,
        responseTimeMs,
        points,
        dbQuestionId: currentQ.id
      };
      match.answers[questionNumber] = roundAnswers;
      match.scores[currentUserId] = (match.scores[currentUserId] || 0) + points;

      // Acknowledge submission to player
      socket.emit('arena:answer_submitted', {
        questionNumber,
        received: true
      });

      // Save answer to database asynchronously
      if (currentQ.id) {
        supabase
          .from('arena_answers')
          .insert({
            match_id: match.matchId,
            question_id: currentQ.id,
            player_id: currentUserId,
            answer: String(selectedOption),
            is_correct: isCorrect,
            response_time: responseTimeMs,
            points: points
          })
          .then(({ error }) => {
            if (error) console.error('Error saving arena answer to DB:', error);
          });
      }

      // If BOTH players have answered, immediately finish the question round
      if (roundAnswers[match.player1Id] && roundAnswers[match.player2Id]) {
        if (match.roundTimer) clearTimeout(match.roundTimer);
        if (match.aiAnswerTimer) clearTimeout(match.aiAnswerTimer);
        endQuestionRound(match);
      }
    });

    // 8. Answer Reveal & Question Ended
    const endQuestionRound = async (match) => {
      if (match.status !== 'QUESTION_ACTIVE') return;
      if (match.roundTimer) clearTimeout(match.roundTimer);
      if (match.aiAnswerTimer) clearTimeout(match.aiAnswerTimer);

      match.status = 'ANSWER_REVEAL';
      const currentQ = match.questions[match.currentQuestionIndex];
      const qNum = currentQ.question_number;
      const roundAnswers = match.answers[qNum] || {};

      // Handle unanswered players
      const handleUnanswered = async (playerId) => {
        if (!roundAnswers[playerId]) {
          roundAnswers[playerId] = {
            answer: null,
            isCorrect: false,
            responseTimeMs: ROUND_DURATION_MS,
            points: 0,
            dbQuestionId: currentQ.id
          };
          if (currentQ.id && !String(playerId).startsWith('ai_')) {
            await supabase.from('arena_answers').insert({
              match_id: match.matchId,
              question_id: currentQ.id,
              player_id: playerId,
              answer: null,
              is_correct: false,
              response_time: ROUND_DURATION_MS,
              points: 0
            });
          }
        }
      };

      await handleUnanswered(match.player1Id);
      await handleUnanswered(match.player2Id);

      const p1Ans = roundAnswers[match.player1Id];
      const p2Ans = roundAnswers[match.player2Id];

      // Emit round conclusion with correct answer and scores
      io.to(match.roomName).emit('arena:question_ended', {
        matchId: match.matchId,
        questionNumber: qNum,
        correctAnswer: currentQ.correct_answer,
        player1: {
          id: match.player1Id,
          answer: p1Ans?.answer,
          isCorrect: p1Ans?.isCorrect,
          pointsEarned: p1Ans?.points || 0,
          totalScore: match.scores[match.player1Id]
        },
        player2: {
          id: match.player2Id,
          answer: p2Ans?.answer,
          isCorrect: p2Ans?.isCorrect,
          pointsEarned: p2Ans?.points || 0,
          totalScore: match.scores[match.player2Id]
        }
      });

      // Transition to next question or end match
      const nextIndex = match.currentQuestionIndex + 1;
      match.roundTransitionTimer = setTimeout(() => {
        if (nextIndex < match.questions.length) {
          startQuestionRound(match, nextIndex);
        } else {
          endMatch(match);
        }
      }, ROUND_TRANSITION_MS);
    };

    // 9. Match Completion
    const endMatch = async (match) => {
      if (match.status === 'COMPLETED') return;
      match.status = 'COMPLETED';

      // Ensure idempotency against database
      if (match.matchId) {
         const { data: dbMatch } = await supabase.from('arena_matches').select('status').eq('id', match.matchId).maybeSingle();
         if (dbMatch && dbMatch.status === 'COMPLETED') return;
      }

      if (match.roundTimer) clearTimeout(match.roundTimer);
      if (match.roundTransitionTimer) clearTimeout(match.roundTransitionTimer);
      if (match.aiAnswerTimer) clearTimeout(match.aiAnswerTimer);

      const p1Score = match.scores[match.player1Id] || 0;
      const p2Score = match.scores[match.player2Id] || 0;

      let result = 'DRAW';
      let winnerId = null;

      if (p1Score > p2Score) {
        result = 'PLAYER1_WIN';
        winnerId = match.player1Id;
      } else if (p2Score > p1Score) {
        result = 'PLAYER2_WIN';
        winnerId = match.player2Id;
      }

      const dbWinnerId = (winnerId && !String(winnerId).startsWith('ai_')) ? winnerId : null;

      // Persist final match results to database
      try {
        await supabase
          .from('arena_matches')
          .update({
            player1_score: p1Score,
            player2_score: p2Score,
            result: result,
            winner_id: dbWinnerId,
            status: 'COMPLETED',
            ended_at: new Date().toISOString()
          })
          .eq('id', match.matchId);
      } catch (saveErr) {
        console.error('Error updating final match results:', saveErr);
      }

      // Compile 5-question performance breakdown
      const breakdown = match.questions.map((q) => {
        const qNum = q.question_number;
        const qAns = match.answers[qNum] || {};
        const p1Ans = qAns[match.player1Id];
        const p2Ans = qAns[match.player2Id];
        return {
          questionNumber: qNum,
          question: q.question,
          correctAnswer: q.correct_answer,
          player1: {
            answer: p1Ans?.answer || null,
            isCorrect: Boolean(p1Ans?.isCorrect),
            points: p1Ans?.points || 0
          },
          player2: {
            answer: p2Ans?.answer || null,
            isCorrect: Boolean(p2Ans?.isCorrect),
            points: p2Ans?.points || 0
          }
        };
      });


      // --- Post-Match Progression Logic ---
      const processPlayerResult = async (playerId, opponentId, isWin, isDraw, isAI) => {
        if (!playerId || String(playerId).startsWith('ai_')) return null;

        let { data: profile } = await supabase
          .from('arena_profiles')
          .select('*')
          .eq('user_id', playerId)
          .maybeSingle();

        if (!profile) {
           await supabase.from('arena_profiles').insert({
             user_id: playerId,
             arena_rating: 1200,
             arena_points: 0,
             wins: 0, losses: 0, draws: 0,
             current_streak: 0, best_streak: 0,
             total_matches: 0, is_available: true
           }).catch(() => {});
           
           const { data: newProf } = await supabase
             .from('arena_profiles')
             .select('*')
             .eq('user_id', playerId)
             .maybeSingle();
           
           if (!newProf) return null;
           profile = newProf;
        }

        let pointsChange = 0;
        let newStreak = profile.current_streak || 0;
        let newWins = profile.wins || 0;
        let newLosses = profile.losses || 0;
        let newDraws = profile.draws || 0;
        let newTotal = (profile.total_matches || 0) + 1;

        if (isAI) {
           if (isWin) pointsChange = 10;
           else if (!isDraw) pointsChange = -10;
        } else {
           if (isWin) {
             pointsChange = 50;
             newStreak += 1;
           } else if (!isDraw) {
             pointsChange = -30;
             newStreak = 0;
           }
        }
        
        if (isWin) newWins += 1;
        else if (isDraw) newDraws += 1;
        else newLosses += 1;

        let bestStreak = Math.max(profile.best_streak || 0, newStreak);
        let newPoints = Math.max(0, (profile.arena_points || 0) + pointsChange);
        let newRating = profile.arena_rating || 1200;

        if (!isAI) {
          // Fetch opponent rating
          const { data: oppProfile } = await supabase
            .from('arena_profiles')
            .select('arena_rating')
            .eq('user_id', opponentId)
            .maybeSingle();
          
          const oppRating = oppProfile?.arena_rating || 1200;
          const score = isWin ? 1 : (isDraw ? 0.5 : 0);
          
          const expected = 1 / (1 + Math.pow(10, (oppRating - newRating) / 400));
          newRating = Math.round(newRating + 32 * (score - expected));
          newRating = Math.max(0, newRating);
        }

        const updates = {
          arena_points: newPoints,
          arena_rating: newRating,
          wins: newWins,
          losses: newLosses,
          draws: newDraws,
          total_matches: newTotal,
          current_streak: newStreak,
          best_streak: bestStreak
        };

        await supabase
          .from('arena_profiles')
          .update(updates)
          .eq('user_id', playerId);

        // Badge Check
        let unlockedBadges = [];
        if (!isAI) {
          unlockedBadges = await checkAndAwardBadges(supabase, playerId, {
            wins: newWins,
            currentStreak: newStreak,
            bestStreak: bestStreak
          });
        }

        return {
          pointsChange,
          newPoints,
          newRating,
          currentStreak: newStreak,
          wins: newWins,
          losses: newLosses,
          draws: newDraws,
          unlockedBadges
        };
      };

      const isAI = match.mode === 'AI' || String(match.player1Id).startsWith('ai_') || String(match.player2Id).startsWith('ai_');
      let p1Stats = null;
      let p2Stats = null;
      
      try {
        p1Stats = await processPlayerResult(
          match.player1Id, 
          match.player2Id, 
          result === 'PLAYER1_WIN', 
          result === 'DRAW', 
          isAI
        );
        p2Stats = await processPlayerResult(
          match.player2Id, 
          match.player1Id, 
          result === 'PLAYER2_WIN', 
          result === 'DRAW', 
          isAI
        );
      } catch (e) {
        console.error('Error updating player stats:', e);
      }

      const matchPayload = {
        matchId: match.matchId,
        player1Score: p1Score,
        player2Score: p2Score,
        result,
        winnerId,
        breakdown,
        player1Stats: p1Stats,
        player2Stats: p2Stats
      };

      // Emit match completion events
      io.to(match.roomName).emit('arena:match_ended', matchPayload);
      io.to(match.roomName).emit('arena:result', matchPayload);

      // Reset players to available
      const p1 = activePlayers.get(match.player1Id);
      if (p1) {
        p1.status = 'ARENA_AVAILABLE';
        p1.currentMatchId = null;
      }
      const p2 = activePlayers.get(match.player2Id);
      if (p2) {
        p2.status = 'ARENA_AVAILABLE';
        p2.currentMatchId = null;
      }

      // Clean up after 1 minute
      setTimeout(() => {
        activeMatches.delete(match.matchId);
      }, 60000);
    };

    // 10. Reject Challenge
    socket.on('arena:reject_challenge', (data) => {
      const { challengeId } = data;
      const chal = pendingChallenges.get(challengeId);
      if (!chal) return;

      clearTimeout(chal.timeoutId);
      pendingChallenges.delete(challengeId);

      const p1 = activePlayers.get(chal.challengerId);
      const p2 = activePlayers.get(chal.targetId);
      
      // Target rejected -> Target becomes available
      if (p2) p2.status = 'ARENA_AVAILABLE';

      // Challenger seamlessly resumes searching
      if (p1) {
        p1.status = 'SEARCHING';
        searchQueue.add(chal.challengerId);
        attemptMatchmaking(chal.challengerId);
      }

      io.to(`user:${chal.challengerId}`).emit('arena:challenge_rejected', { 
        message: 'Opponent declined the challenge. Resuming matchmaking queue...' 
      });
      io.to(`user:${chal.targetId}`).emit('arena:challenge_rejected', { 
        message: 'You declined the challenge.' 
      });
    });

    // 11. Cancel Challenge by Challenger
    socket.on('arena:cancel_challenge', (data) => {
      const { challengeId } = data;
      const chal = pendingChallenges.get(challengeId);
      if (!chal) return;

      if (chal.challengerId === currentUserId) {
        clearTimeout(chal.timeoutId);
        pendingChallenges.delete(challengeId);

        const p1 = activePlayers.get(chal.challengerId);
        const p2 = activePlayers.get(chal.targetId);
        if (p1) p1.status = 'ARENA_AVAILABLE';
        if (p2) p2.status = 'ARENA_AVAILABLE';

        io.to(`user:${chal.challengerId}`).emit('arena:challenge_cancelled', { message: 'Challenge cancelled' });
        io.to(`user:${chal.targetId}`).emit('arena:challenge_cancelled', { message: 'Challenger cancelled the request' });
      }
    });

    // 12. Cancel Search
    socket.on('arena:cancel_search', () => {
      if (!currentUserId || !activePlayers.has(currentUserId)) return;
      const p = activePlayers.get(currentUserId);
      
      if (p.status === 'CHALLENGE_PENDING') {
        // Find if this user is a challenger
        for (const [cId, chal] of pendingChallenges.entries()) {
          if (chal.challengerId === currentUserId) {
            clearTimeout(chal.timeoutId);
            pendingChallenges.delete(cId);
            const target = activePlayers.get(chal.targetId);
            if (target) target.status = 'ARENA_AVAILABLE';
            io.to(`user:${chal.targetId}`).emit('arena:challenge_cancelled', { message: 'Challenger cancelled the request' });
          }
        }
      }

      p.status = 'ARENA_AVAILABLE';
      searchQueue.delete(currentUserId);

      // Update presence in Supabase
      supabase
        .from('arena_profiles')
        .update({
          is_available: false,
          last_seen_at: new Date().toISOString()
        })
        .eq('user_id', currentUserId)
        .then(() => {});
    });

    // 12. Disconnect Handling & Grace Period
    socket.on('disconnect', () => {
      if (!currentUserId) return;

      searchQueue.delete(currentUserId);
      const player = activePlayers.get(currentUserId);

      if (player && player.status === 'IN_MATCH' && player.currentMatchId) {
        const match = activeMatches.get(player.currentMatchId);
        if (match && match.status !== 'COMPLETED') {
          // Notify opponent about disconnection
          io.to(match.roomName).emit('arena:player_disconnected', {
            userId: currentUserId,
            gracePeriodSeconds: RECONNECT_GRACE_PERIOD_MS / 1000
          });

          // Set reconnection grace period timer
          match.disconnectTimers[currentUserId] = setTimeout(() => {
            if (match.status !== 'COMPLETED') {
              // Conclude match due to opponent abandonment
              const opponentId = (currentUserId === match.player1Id) ? match.player2Id : match.player1Id;
              match.scores[opponentId] = (match.scores[opponentId] || 0) + 100;
              endMatch(match);
            }
          }, RECONNECT_GRACE_PERIOD_MS);
        }
      } else {
        activePlayers.delete(currentUserId);
      }
    });
  });

  // Helper function to sync match state on reconnection
  function syncMatchStateToReconnectedPlayer(socket, userId, match) {
    if (!match) return;

    const currentQ = match.questions[match.currentQuestionIndex];
    const elapsedTime = Date.now() - match.roundStartTime;
    const remainingTimeMs = Math.max(0, ROUND_DURATION_MS - elapsedTime);

    socket.emit('arena:sync_state', {
      matchId: match.matchId,
      status: match.status,
      mode: match.mode,
      difficulty: match.difficulty,
      questionIndex: match.currentQuestionIndex,
      questionNumber: currentQ?.question_number,
      totalQuestions: match.questions.length,
      question: currentQ?.question,
      options: currentQ?.options,
      remainingSeconds: Math.ceil(remainingTimeMs / 1000),
      scores: match.scores,
      hasSubmittedAnswer: Boolean(match.answers[currentQ?.question_number]?.[userId]),
      opponent: match.mode === 'AI' ? {
        id: 'ai_bot',
        name: 'Arena AI',
        avatar: '🤖',
        isAI: true,
        difficulty: match.difficulty
      } : undefined
    });
  }

  return io;
}

initArenaSocket.AI_DIFFICULTY_PROFILES = AI_DIFFICULTY_PROFILES;
initArenaSocket.simulateAiAnswer = simulateAiAnswer;

// Distance helper (Haversine)
function getDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

module.exports = initArenaSocket;
