import { supabase } from './supabase.js';

/**
 * Auth 서비스
 * - 회원가입, 로그인, 로그아웃, 현재 유저 조회
 */
export const authService = {

  // 현재 로그인된 유저 반환 (없으면 null)
  async getUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  },

  // 세션 변화 구독 (씬에서 사용)
  onAuthChange(callback) {
    return supabase.auth.onAuthStateChange((_event, session) => {
      callback(session?.user ?? null);
    });
  },

  // 회원가입 + 프로필 생성
  async signUp(email, password, username) {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;

    // 프로필 테이블에 유저네임 저장
    if (data.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({ id: data.user.id, username });
      if (profileError) throw profileError;
    }

    return data.user;
  },

  // 로그인
  async signIn(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data.user;
  },

  // 로그아웃
  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  // 유저네임 조회
  async getUsername(userId) {
    const { data, error } = await supabase
      .from('profiles')
      .select('username')
      .eq('id', userId)
      .single();
    if (error) return null;
    return data?.username;
  },
};
