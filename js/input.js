/* ══════════════════════════════════════════════
   input.js
   키보드 / D패드 / 모바일 스와이프 입력 처리
   localStorage 최고기록·클리어 저장/로드
   ══════════════════════════════════════════════ */

class InputHandler {
  /**
   * @param {function(string)} onMove   - 'up'|'down'|'left'|'right'
   * @param {function}         onReset
   * @param {function}         onResetView  - 시점 리셋 (orbit)
   */
  constructor(onMove, onReset, onResetView) {
    this._onMove      = onMove;
    this._onReset     = onReset;
    this._onResetView = onResetView;

    this._swipeStartX = null;
    this._swipeStartY = null;
    this._swipeIsOrbit = false;  // 터치 시작이 드래그용인지 여부 (orbit.js가 처리)

    this._bindKeyboard();
    this._bindDpad();
    this._bindSwipe();
  }

  /* ── 키보드 ── */
  _bindKeyboard() {
    const MAP = {
      ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right',
      w: 'up', s: 'down', a: 'left', d: 'right',
    };
    document.addEventListener('keydown', e => {
      if (MAP[e.key]) { e.preventDefault(); this._onMove(MAP[e.key]); return; }
      if (e.key === 'r' || e.key === 'R') { this._onReset(); return; }
      if (e.key === 'v' || e.key === 'V') { this._onResetView?.(); return; }
    });
  }

  /* ── D패드 버튼 ── */
  _bindDpad() {
    document.querySelectorAll('.dpad-btn').forEach(btn => {
      btn.addEventListener('click', () => this._onMove(btn.dataset.dir));
    });
  }

  /* ── 캔버스 스와이프 (게임 이동) ──
     orbit.js가 mousedown/mousemove를 먼저 처리하므로
     touchstart/touchend 짧은 스와이프만 게임 이동으로 사용 */
  _bindSwipe() {
    const canvas = document.getElementById('gameCanvas');

    canvas.addEventListener('touchstart', e => {
      if (e.touches.length > 1) return;
      this._swipeStartX = e.touches[0].clientX;
      this._swipeStartY = e.touches[0].clientY;
    }, { passive: true });

    canvas.addEventListener('touchend', e => {
      if (this._swipeStartX === null) return;
      const dx = e.changedTouches[0].clientX - this._swipeStartX;
      const dy = e.changedTouches[0].clientY - this._swipeStartY;
      const adx = Math.abs(dx), ady = Math.abs(dy);
      const dist = Math.max(adx, ady);

      // 너무 짧으면 무시
      if (dist < 25) { this._swipeStartX = null; return; }

      if (adx > ady) this._onMove(dx > 0 ? 'right' : 'left');
      else           this._onMove(dy > 0 ? 'down'  : 'up');

      this._swipeStartX = null;
    }, { passive: true });
  }
}

/* ══════════════════════════════════════════════
   StorageManager
   localStorage 기반 기록 저장/로드
   ══════════════════════════════════════════════ */

class StorageManager {
  constructor(stageId) {
    this.stageId  = stageId;
    this._bestKey = `SOKOBAN_best_${stageId}`;
    this._clearKey = 'SOKOBAN_cleared';
  }

  saveBest(moves, elapsedSec) {
    const prev = this.loadBest();
    if (!prev || moves < prev.moves) {
      localStorage.setItem(this._bestKey, JSON.stringify({ moves, time: elapsedSec }));
    }
    // 클리어 목록에 추가
    const cleared = this.loadCleared();
    if (!cleared.includes(this.stageId)) {
      cleared.push(this.stageId);
      localStorage.setItem(this._clearKey, JSON.stringify(cleared));
    }
  }

  loadBest() {
    return JSON.parse(localStorage.getItem(this._bestKey) || 'null');
  }

  loadCleared() {
    return JSON.parse(localStorage.getItem(this._clearKey) || '[]');
  }

  /** index.html 뱃지 갱신용 (정적으로 호출) */
  static applyBadges() {
    const cleared = JSON.parse(localStorage.getItem('SOKOBAN_cleared') || '[]');
    cleared.forEach(id => {
      const el = document.querySelector(`.cleared-badge[data-stage="${id}"]`);
      if (el) el.textContent = '✅';
    });
  }
}
