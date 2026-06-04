-- ============================================================
-- 계단 오르기 게임 - Supabase 스키마
-- Supabase SQL Editor에서 실행하세요
-- ============================================================

-- 1. 유저 프로필 (Supabase Auth와 연동)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. 리더보드 (최고 점수)
CREATE TABLE IF NOT EXISTS leaderboard (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  username TEXT NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 최고 점수만 유지하는 인덱스
CREATE INDEX IF NOT EXISTS leaderboard_score_idx ON leaderboard(score DESC);

-- 3. 게임 저장 (레벨/진행도)
CREATE TABLE IF NOT EXISTS game_saves (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  best_score INTEGER DEFAULT 0,
  best_level INTEGER DEFAULT 1,
  total_games INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- RLS (Row Level Security) 정책
-- ============================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_saves ENABLE ROW LEVEL SECURITY;

-- profiles: 본인만 수정 가능, 전체 읽기 가능
CREATE POLICY "profiles_public_read" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_own_insert" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_own_update" ON profiles FOR UPDATE USING (auth.uid() = id);

-- leaderboard: 전체 읽기, 본인 삽입만 가능
CREATE POLICY "leaderboard_public_read" ON leaderboard FOR SELECT USING (true);
CREATE POLICY "leaderboard_own_insert" ON leaderboard FOR INSERT WITH CHECK (auth.uid() = user_id);

-- game_saves: 본인만 읽기/쓰기
CREATE POLICY "saves_own_all" ON game_saves USING (auth.uid() = user_id);

-- ============================================================
-- 함수: 신규 유저 자동으로 game_saves 생성
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user_save()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO game_saves (user_id) VALUES (NEW.id)
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_profile_created
  AFTER INSERT ON profiles
  FOR EACH ROW EXECUTE FUNCTION handle_new_user_save();
