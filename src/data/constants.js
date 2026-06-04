// 게임 전역 상수
export const GAME = {
  WIDTH: 480,
  HEIGHT: 640,
};

export const PLAYER = {
  SPEED: 200,
  JUMP_VELOCITY: -520,
  SPRITE_SIZE: 32,
};

export const PLATFORM = {
  WIDTH: 100,
  HEIGHT: 16,
  MIN_GAP: 80,   // 플랫폼 간 최소 Y 간격
  MAX_GAP: 130,  // 플랫폼 간 최대 Y 간격
  COUNT: 10,     // 화면에 유지할 플랫폼 수
};

export const SCORE = {
  PER_PLATFORM: 10,   // 플랫폼 오를 때마다 점수
  LEVEL_THRESHOLD: 5, // 레벨당 플랫폼 수
};

export const ITEMS = {
  SPAWN_CHANCE: 0.2,  // 플랫폼당 아이템 스폰 확률
  JUMP_BOOST_DURATION: 5000,   // ms
  SPEED_BOOST_DURATION: 4000,  // ms
  SHIELD_DURATION: 6000,       // ms
};
