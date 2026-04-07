/* ══════════════════════════════════════════════
   constants.js
   게임 전체에서 공유하는 상수·팔레트·설정값
   ══════════════════════════════════════════════ */

const PB = {
  /* ── 색상 (Three.js hex) ── */
  COLOR: {
    BG: 0x0a0a0f,
    FLOOR: 0x111118,
    WALL: 0xd0d0e0,
    WALL_EDGE: 0xccccdd,
    BLUE_TILE: 0x0a1a44,
    BLUE_EMIT: 0x1a6cff,
    BLUE_FRAME: 0x1a6cff,
    GREEN: 0x00c853,
    GREEN_LIT: 0x00f5a0,
    RED: 0xff3366,
    ACCENT: 0x00f5a0,
    ACCENT2: 0x00d4ff,
    FOG: 0x0a0a0f,
    PARTICLE: 0x00f5a0,
    CONFETTI: [0x00f5a0, 0x00d4ff, 0xff3366, 0xffeb3b, 0xe040fb],
  },

  /* ── 타일 치수 ── */
  TILE: {
    SIZE: 1.0,
    WALL_H: 0.5,
    FLOOR_H: 0.1,
    GAP: 0.05,
  },

  /* ── 오브젝트 치수 ── */
  OBJ: {
    GREEN_W: 0.72,
    GREEN_H: 0.55,
    RED_R: 0.38,
    RED_Y: 0.52,
    GREEN_Y: 0.4,
  },

  /* ── 조명 ── */
  LIGHT: {
    AMBIENT_COLOR: 0x223344,
    AMBIENT_INT: 0.8,
    DIR_INT: 1.2,
    ACCENT1_COLOR: 0x00f5a0,
    ACCENT1_INT: 2.5,
    ACCENT1_DIST: 25,
    ACCENT2_COLOR: 0x1a6cff,
    ACCENT2_INT: 2.0,
    ACCENT2_DIST: 20,
  },

  /* ── 카메라 ── */
  CAM: {
    FOV: 45,
    NEAR: 0.1,
    FAR: 200,
    DIST_SCALE: 0.8, // max(cols,rows) * this = camera distance
    X_OFFSET: 0.3,
    Y_OFFSET: 0.9,
    Z_OFFSET: 0.9,
  },

  /* ── 오비트 컨트롤 ── */
  ORBIT: {
    MIN_POLAR: 0.15, // 라디안 — 최소 수직각 (너무 위로 못 감)
    MAX_POLAR: Math.PI / 2.1, // 최대 수직각 (바닥 아래로 못 감)
    DAMPING: 0.08, // 관성 감쇠 (0=즉시 멈춤, 1=안 멈춤)
    SENSITIVITY_X: 0.005, // 마우스 수평 감도
    SENSITIVITY_Y: 0.004, // 마우스 수직 감도
    RESET_DURATION: 400, // 시점 리셋 애니메이션 ms
  },

  /* ── 애니메이션 ── */
  ANIM: {
    MOVE_DURATION: 0.18, // 빨간 공 이동 시간(초)
    PUSH_DURATION: 0.4, // 초록 블록 밀기 시간(초)
    ARC_HEIGHT_RED: 0.15, // 이동 중 공 튀어오르는 높이
    ARC_HEIGHT_GRN: 0.3,
    BOUNCE_EMIT: 0.8, // 이동 시 emissive 플래시
    BOUNCE_MS: 150,
  },

  /* ── 파티클 ── */
  PARTICLE: {
    FIELD_COUNT: 120,
    FIELD_SPREAD: 3, // cols/rows * this
    SPAWN_COUNT: 18,
    SPAWN_FRAMES: 50,
    CONFETTI_COUNT: 60,
    CONFETTI_FRAMES: 180,
  },
};
