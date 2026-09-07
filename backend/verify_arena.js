const http = require('http');
const io = require('socket.io-client');
require('dotenv').config();

// Patch require('@supabase/supabase-js')
const Module = require('module');
const originalRequire = Module.prototype.require;
Module.prototype.require = function(request) {
  if (request === '@supabase/supabase-js') {
    const supabaseJs = originalRequire.apply(this, arguments);
    const originalCreateClient = supabaseJs.createClient;
    supabaseJs.createClient = function() {
      const client = originalCreateClient.apply(this, arguments);
      const originalGetUser = client.auth.getUser.bind(client.auth);
      client.auth.getUser = async (token) => {
        if (token === 'token_user_1') return { data: { user: { id: '12fdbc7f-0fc0-4b65-9799-fe42342d16a9' } }, error: null };
        if (token === 'token_user_2') return { data: { user: { id: '33cf56a7-e0ea-4460-b22f-f4100f6966d9' } }, error: null };
        return originalGetUser(token);
      };
      return client;
    };
    return supabaseJs;
  }
  return originalRequire.apply(this, arguments);
};

const initArenaSocket = require('./arenaSocket');
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY);

const server = http.createServer();
initArenaSocket(server, process.env.SUPABASE_URL, process.env.SUPABASE_SECRET_KEY);

server.listen(5005, async () => {
  console.log('Test Server running on 5005');
  
  // Set initial state for users
  await supabase.from('arena_profiles').update({ wins: 0, losses: 0, arena_points: 10 }).eq('user_id', '12fdbc7f-0fc0-4b65-9799-fe42342d16a9');
  await supabase.from('arena_profiles').update({ wins: 0, losses: 0, arena_points: 10 }).eq('user_id', '33cf56a7-e0ea-4460-b22f-f4100f6966d9');

  const client1 = io('http://localhost:5005');
  const client2 = io('http://localhost:5005');

  let activeMatchId = null;

  client1.on('connect', () => {
    client1.emit('arena:auth', { token: 'token_user_1' });
  });

  client2.on('connect', () => {
    client2.emit('arena:auth', { token: 'token_user_2' });
  });

  client1.on('arena:auth_success', () => {
    client1.emit('arena:search', { lat: 0, lng: 0 });
  });

  client2.on('arena:auth_success', () => {
    setTimeout(() => {
      client2.emit('arena:search', { lat: 0, lng: 0 });
    }, 1000);
  });

  client1.on('arena:challenge_received', (data) => {
    client1.emit('arena:accept_challenge', { challengeId: data.challengeId });
  });
  
  client2.on('arena:challenge_received', (data) => {
    client2.emit('arena:accept_challenge', { challengeId: data.challengeId });
  });

  const submitAnswers = (matchId, qNum, c1Ans, c2Ans) => {
    if (c1Ans) client1.emit('arena:submit_answer', { matchId, questionNumber: qNum, selectedOption: c1Ans });
    if (c2Ans) client2.emit('arena:submit_answer', { matchId, questionNumber: qNum, selectedOption: c2Ans });
  };

  client1.on('arena:question_started', async (data) => {
    console.log('Question', data.questionNumber, 'started');
    const { data: q } = await supabase.from('arena_questions').select('correct_answer, options').eq('match_id', data.matchId).eq('question_number', data.questionNumber).single();
    
    setTimeout(() => {
      // Client 1 answers correctly, Client 2 answers incorrectly (or correctly later).
      // Let's make client 1 win all 5.
      const wrongOpt = q.options.find(o => o !== q.correct_answer) || q.options[0];
      submitAnswers(data.matchId, data.questionNumber, q.correct_answer, wrongOpt); 
    }, 1000);
  });

  client1.on('arena:match_created', (data) => {
    activeMatchId = data.matchId;
    client1.emit('arena:player_ready', { matchId: data.matchId });
    client2.emit('arena:player_ready', { matchId: data.matchId });
  });

  client1.on('arena:match_ended', async (data) => {
    console.log('Match Ended!', data.result);
    
    // Check DB
    const { data: m } = await supabase.from('arena_matches').select('*').eq('id', activeMatchId).single();
    console.log('DB Match Status:', m.status);

    const { data: p1 } = await supabase.from('arena_profiles').select('*').eq('user_id', '12fdbc7f-0fc0-4b65-9799-fe42342d16a9').single();
    const { data: p2 } = await supabase.from('arena_profiles').select('*').eq('user_id', '33cf56a7-e0ea-4460-b22f-f4100f6966d9').single();
    
    console.log('P1 Stats:', { points: p1.arena_points, wins: p1.wins, losses: p1.losses, streak: p1.current_streak });
    console.log('P2 Stats:', { points: p2.arena_points, wins: p2.wins, losses: p2.losses, streak: p2.current_streak });
    
    process.exit(0);
  });
});
