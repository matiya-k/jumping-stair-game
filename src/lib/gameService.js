import { supabase } from './supabase.js';

/**
 * 게임 데이터 서비스
 * - 리더보드 저장/조회
 * - 게임 저장 (최고점수, 레벨)
 */
export const gameService = {

  // ─── 리더보드 ──────────────────────────────────────────────

  // 상위 N개 점수 조회
  async getLeaderboard(limit = 10) {
    const { data, error } = await supabase
      .from('leaderboard')
      .select('username, score, level, created_at')
      .order('score', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data;
  },

  // 점수 저장 (매 게임 종료 시)
  async submitScore(userId, username, score, level) {
    const { error } = await supabase
      .from('leaderboard')
      .insert({ user_id: userId, username, score, level });
    if (error) throw error;
  },

  // 내 최고 점수 조회
  async getMyBestScore(userId) {
    const { data, error } = await supabase
      .from('leaderboard')
      .select('score, level')
      .eq('user_id', userId)
      .order('score', { ascending: false })
      .limit(1)
      .single();
    if (error) return null;
    return data;
  },

  // ─── 게임 저장 ────────────────────────────────────────────

  // 게임 저장 데이터 불러오기
  async loadSave(userId) {
    const { data, error } = await supabase
      .from('game_saves')
      .select('best_score, best_level, total_games')
      .eq('user_id', userId)
      .single();
    if (error) return null;
    return data;
  },

  // 게임 종료 시 저장 업데이트
  async updateSave(userId, score, level) {
    // 현재 저장 데이터 조회 후 최고점만 갱신
    const current = await this.loadSave(userId);

    const update = {
      total_games: (current?.total_games || 0) + 1,
      updated_at: new Date().toISOString(),
    };

    if (!current || score > (current.best_score || 0)) {
      update.best_score = score;
      update.best_level = level;
    }

    const { error } = await supabase
      .from('game_saves')
      .upsert({ user_id: userId, ...update });
    if (error) throw error;
  },

  // ─── 내 순위 조회 ─────────────────────────────────────────

  async getMyRank(score) {
    const { count, error } = await supabase
      .from('leaderboard')
      .select('*', { count: 'exact', head: true })
      .gt('score', score);
    if (error) return null;
    return (count || 0) + 1; // 내 순위 = 나보다 높은 사람 수 + 1
  },
};
