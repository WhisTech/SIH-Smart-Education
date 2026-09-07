-- Migration: 013_skill_arena_schema.sql
-- Creates the database foundation for the Skill Arena feature

-- 1. arena_profiles
CREATE TABLE public.arena_profiles (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    arena_points INTEGER NOT NULL DEFAULT 0,
    arena_rating INTEGER NOT NULL DEFAULT 1200,
    wins INTEGER NOT NULL DEFAULT 0,
    losses INTEGER NOT NULL DEFAULT 0,
    draws INTEGER NOT NULL DEFAULT 0,
    current_streak INTEGER NOT NULL DEFAULT 0,
    best_streak INTEGER NOT NULL DEFAULT 0,
    total_matches INTEGER NOT NULL DEFAULT 0,
    is_available BOOLEAN NOT NULL DEFAULT false,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    last_seen_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX idx_arena_profiles_matchmaking ON public.arena_profiles(is_available, last_seen_at);
CREATE INDEX idx_arena_profiles_leaderboard ON public.arena_profiles(arena_points DESC, wins DESC, best_streak DESC);

-- 2. arena_matches
CREATE TYPE arena_match_mode AS ENUM ('HUMAN', 'AI');
CREATE TYPE arena_match_status AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');
CREATE TYPE arena_match_result AS ENUM ('PLAYER1_WIN', 'PLAYER2_WIN', 'DRAW');

CREATE TABLE public.arena_matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player1_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    player2_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    mode arena_match_mode NOT NULL DEFAULT 'HUMAN',
    status arena_match_status NOT NULL DEFAULT 'PENDING',
    winner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    player1_score INTEGER NOT NULL DEFAULT 0,
    player2_score INTEGER NOT NULL DEFAULT 0,
    result arena_match_result,
    started_at TIMESTAMP WITH TIME ZONE,
    ended_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX idx_arena_matches_player1 ON public.arena_matches(player1_id);
CREATE INDEX idx_arena_matches_player2 ON public.arena_matches(player2_id);

-- 3. arena_questions
CREATE TABLE public.arena_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID NOT NULL REFERENCES public.arena_matches(id) ON DELETE CASCADE,
    question_number INTEGER NOT NULL CHECK (question_number > 0 AND question_number <= 5),
    question TEXT NOT NULL,
    options JSONB NOT NULL,
    correct_answer TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (match_id, question_number)
);

-- 4. arena_answers
CREATE TABLE public.arena_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    match_id UUID NOT NULL REFERENCES public.arena_matches(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES public.arena_questions(id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    answer TEXT,
    is_correct BOOLEAN NOT NULL DEFAULT false,
    response_time INTEGER,
    points INTEGER NOT NULL DEFAULT 0,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (player_id, question_id)
);

-- 5. arena_badges
CREATE TABLE public.arena_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    description TEXT NOT NULL,
    icon TEXT NOT NULL,
    criteria_type TEXT NOT NULL,
    criteria_value INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. user_arena_badges
CREATE TABLE public.user_arena_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    badge_id UUID NOT NULL REFERENCES public.arena_badges(id) ON DELETE CASCADE,
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (user_id, badge_id)
);

-- Triggers
CREATE OR REPLACE FUNCTION update_arena_profile_modtime()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_arena_profiles_modtime
BEFORE UPDATE ON public.arena_profiles
FOR EACH ROW
EXECUTE FUNCTION update_arena_profile_modtime();

-- RLS
ALTER TABLE public.arena_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.arena_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.arena_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.arena_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.arena_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_arena_badges ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION check_arena_profile_update()
RETURNS TRIGGER AS $$
BEGIN
  -- If updated by an authenticated user (client API), prevent stats changes
  IF (current_setting('request.jwt.claims', true)::jsonb->>'role') = 'authenticated' THEN
    IF NEW.arena_points IS DISTINCT FROM OLD.arena_points OR
       NEW.arena_rating IS DISTINCT FROM OLD.arena_rating OR
       NEW.wins IS DISTINCT FROM OLD.wins OR
       NEW.losses IS DISTINCT FROM OLD.losses OR
       NEW.draws IS DISTINCT FROM OLD.draws OR
       NEW.current_streak IS DISTINCT FROM OLD.current_streak OR
       NEW.best_streak IS DISTINCT FROM OLD.best_streak OR
       NEW.total_matches IS DISTINCT FROM OLD.total_matches THEN
      RAISE EXCEPTION 'Users cannot update Arena gamification stats directly';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_arena_profile_stats_readonly
BEFORE UPDATE ON public.arena_profiles
FOR EACH ROW
EXECUTE FUNCTION check_arena_profile_update();

CREATE POLICY "Allow public read access to arena_profiles"
ON public.arena_profiles FOR SELECT TO public USING (true);

CREATE POLICY "Users can insert their own arena profile"
ON public.arena_profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own presence"
ON public.arena_profiles FOR UPDATE TO authenticated 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Public read for arena_matches"
ON public.arena_matches FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can read questions for their matches"
ON public.arena_questions FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.arena_matches m 
        WHERE m.id = arena_questions.match_id AND (m.player1_id = auth.uid() OR m.player2_id = auth.uid())
    )
);

CREATE POLICY "Users can read answers for their matches"
ON public.arena_answers FOR SELECT TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.arena_matches m 
        WHERE m.id = arena_answers.match_id AND (m.player1_id = auth.uid() OR m.player2_id = auth.uid())
    )
);

CREATE POLICY "Public read for arena_badges"
ON public.arena_badges FOR SELECT TO public USING (true);

CREATE POLICY "Public read for user_arena_badges"
ON public.user_arena_badges FOR SELECT TO public USING (true);

-- Insert Badges
INSERT INTO public.arena_badges (name, description, icon, criteria_type, criteria_value) VALUES
('First Blood', 'Unlock after first Human vs Human victory.', '⚔️', 'wins', 1),
('5 Wins', 'Unlock after 5 Human vs Human victories.', '🏆', 'wins', 5),
('10 Win Streak', 'Unlock after achieving a 10-match consecutive Human vs Human win streak.', '🔥', 'streak', 10),
('Arena Champion', 'Unlock for finishing #1 on the Arena Leaderboard.', '👑', 'rank', 1);
