/* ── PushBlox Game Engine ── */

class PushBlox {
  constructor({ rows, cols, whitePositions, bluePositions, greenPositions, redStart, stageId }) {
    this.rows = rows;
    this.cols = cols;
    this.initialState = { whitePositions, bluePositions, greenPositions, redStart };
    this.stageId = stageId;
    this.moves = 0;
    this.startTime = null;
    this.timerInterval = null;
    this.swipeStartX = null;
    this.swipeStartY = null;

    this.gridEl = document.getElementById('gridGame');
    this.movesEl = document.getElementById('movesCount');
    this.timeEl = document.getElementById('timeCount');

    this.build(whitePositions, bluePositions, greenPositions, redStart);
    this.bindKeys();
    this.bindDpad();
    this.bindSwipe();
    this.startTimer();
    this.loadBest();
  }

  /* ── Build DOM ── */
  build(whites, blues, greens, redStart) {
    this.gridEl.innerHTML = '';
    this.gridEl.style.gridTemplateColumns = `repeat(${this.cols}, 1fr)`;
    this.gridEl.style.gridTemplateRows    = `repeat(${this.rows}, 1fr)`;

    // Compute cell size based on viewport
    const maxW = Math.min(window.innerWidth - 64, 640);
    const cellW = Math.floor(maxW / this.cols);
    const cellH = Math.floor((window.innerHeight * 0.45) / this.rows);
    const cellSize = Math.min(cellW, cellH, 54);

    this.gridEl.style.width  = `${cellSize * this.cols}px`;
    this.gridEl.style.height = `${cellSize * this.rows}px`;

    for (let i = 0; i < this.rows * this.cols; i++) {
      const cell = document.createElement('div');
      cell.classList.add('cell');
      this.gridEl.appendChild(cell);
    }

    whites.forEach(([r, c]) => this.cellAt(r, c).classList.add('white'));
    blues.forEach(([r, c])  => this.cellAt(r, c).classList.add('blue'));

    greens.forEach(([r, c]) => {
      const el = document.createElement('div');
      el.classList.add('custom-content');
      this.cellAt(r, c).appendChild(el);
    });

    const red = document.createElement('div');
    red.classList.add('red-ball');
    this.cellAt(redStart[0], redStart[1]).appendChild(red);
  }

  cellAt(r, c) {
    return this.gridEl.children[(r - 1) * this.cols + (c - 1)];
  }

  idx(r, c)   { return (r - 1) * this.cols + (c - 1); }
  cell(index) { return this.gridEl.children[index]; }

  /* ── Move logic ── */
  move(dir) {
    const red = this.gridEl.querySelector('.red-ball');
    const parent = red.parentElement;
    const cur = Array.from(this.gridEl.children).indexOf(parent);
    const cols = this.cols;
    const total = this.rows * this.cols;

    const delta = { up: -cols, down: cols, left: -1, right: 1 }[dir];
    const next = cur + delta;

    // Boundary checks
    if (next < 0 || next >= total) return;
    if (dir === 'left'  && cur % cols === 0)       return;
    if (dir === 'right' && (cur + 1) % cols === 0) return;

    const target = this.cell(next);
    if (target.classList.contains('white')) return;

    if (target.querySelector('.custom-content')) {
      const push = next + delta;
      if (push < 0 || push >= total) return;
      if (dir === 'left'  && next % cols === 0)       return;
      if (dir === 'right' && (next + 1) % cols === 0) return;

      const pushCell = this.cell(push);
      if (pushCell.classList.contains('white')) return;
      if (pushCell.querySelector('.custom-content')) return;

      pushCell.appendChild(target.querySelector('.custom-content'));
      target.appendChild(red);
    } else {
      target.appendChild(red);
    }

    this.moves++;
    if (this.movesEl) this.movesEl.textContent = this.moves;
    this.animateMove(red);
    this.checkClear();
  }

  animateMove(el) {
    el.style.transform = 'translate(-50%, -50%) scale(0.85)';
    setTimeout(() => { el.style.transform = 'translate(-50%, -50%) scale(1)'; }, 120);
  }

  /* ── Clear check ── */
  checkClear() {
    const blues = this.gridEl.querySelectorAll('.blue');
    const filled = [...blues].filter(b => b.querySelector('.custom-content')).length;
    if (filled === blues.length) {
      clearInterval(this.timerInterval);
      this.saveBest();
      setTimeout(() => this.showClear(), 300);
    }
  }

  showClear() {
    const overlay = document.getElementById('clearOverlay');
    if (!overlay) return;
    document.getElementById('clearMoves').textContent = this.moves;
    const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
    document.getElementById('clearTime').textContent = this.formatTime(elapsed);
    overlay.classList.add('show');
    this.launchConfetti();
  }

  /* ── Reset ── */
  reset() {
    clearInterval(this.timerInterval);
    this.moves = 0;
    if (this.movesEl) this.movesEl.textContent = '0';
    if (this.timeEl)  this.timeEl.textContent  = '0:00';
    const { whitePositions, bluePositions, greenPositions, redStart } = this.initialState;
    this.build(whitePositions, bluePositions, greenPositions, redStart);
    this.startTimer();

    const overlay = document.getElementById('clearOverlay');
    if (overlay) overlay.classList.remove('show');
  }

  /* ── Timer ── */
  startTimer() {
    this.startTime = Date.now();
    this.timerInterval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
      if (this.timeEl) this.timeEl.textContent = this.formatTime(elapsed);
    }, 1000);
  }

  formatTime(s) {
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  }

  /* ── Best score (localStorage) ── */
  saveBest() {
    const key = `pushblox_best_${this.stageId}`;
    const prev = JSON.parse(localStorage.getItem(key) || 'null');
    const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
    if (!prev || this.moves < prev.moves) {
      localStorage.setItem(key, JSON.stringify({ moves: this.moves, time: elapsed }));
    }
    // Mark cleared
    const cleared = JSON.parse(localStorage.getItem('pushblox_cleared') || '[]');
    if (!cleared.includes(this.stageId)) {
      cleared.push(this.stageId);
      localStorage.setItem('pushblox_cleared', JSON.stringify(cleared));
    }
  }

  loadBest() {
    const key = `pushblox_best_${this.stageId}`;
    const best = JSON.parse(localStorage.getItem(key) || 'null');
    const bestEl = document.getElementById('bestCount');
    if (bestEl) bestEl.textContent = best ? best.moves : '--';
  }

  /* ── Keyboard ── */
  bindKeys() {
    document.addEventListener('keydown', (e) => {
      const map = { ArrowUp:'up', ArrowDown:'down', ArrowLeft:'left', ArrowRight:'right',
                    w:'up', s:'down', a:'left', d:'right' };
      if (map[e.key]) { e.preventDefault(); this.move(map[e.key]); }
      if (e.key === 'r' || e.key === 'R') this.reset();
    });
  }

  /* ── D-pad buttons ── */
  bindDpad() {
    document.querySelectorAll('.dpad-btn').forEach(btn => {
      btn.addEventListener('click', () => this.move(btn.dataset.dir));
    });
  }

  /* ── Touch swipe ── */
  bindSwipe() {
    const el = this.gridEl;
    el.addEventListener('touchstart', (e) => {
      this.swipeStartX = e.touches[0].clientX;
      this.swipeStartY = e.touches[0].clientY;
    }, { passive: true });

    el.addEventListener('touchend', (e) => {
      if (this.swipeStartX === null) return;
      const dx = e.changedTouches[0].clientX - this.swipeStartX;
      const dy = e.changedTouches[0].clientY - this.swipeStartY;
      const adx = Math.abs(dx), ady = Math.abs(dy);
      if (Math.max(adx, ady) < 20) return;
      if (adx > ady) this.move(dx > 0 ? 'right' : 'left');
      else           this.move(dy > 0 ? 'down'  : 'up');
      this.swipeStartX = null;
    }, { passive: true });
  }

  /* ── Confetti (Canvas API) ── */
  launchConfetti() {
    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:200;';
    document.body.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = Array.from({ length: 120 }, () => ({
      x: Math.random() * canvas.width,
      y: -20,
      r: Math.random() * 6 + 3,
      color: ['#00f5a0','#00d4ff','#ff3366','#ffeb3b','#e040fb'][Math.floor(Math.random() * 5)],
      vx: (Math.random() - 0.5) * 4,
      vy: Math.random() * 3 + 2,
      rot: Math.random() * 360,
      rotV: (Math.random() - 0.5) * 8,
    }));

    let frame = 0;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy; p.rot += p.rotV; p.vy += 0.05;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot * Math.PI / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.r, -p.r / 2, p.r * 2, p.r);
        ctx.restore();
      });
      frame++;
      if (frame < 180) requestAnimationFrame(animate);
      else canvas.remove();
    };
    requestAnimationFrame(animate);
  }
}

/* ── Index page: load cleared badges ── */
function loadClearedBadges() {
  const cleared = JSON.parse(localStorage.getItem('pushblox_cleared') || '[]');
  cleared.forEach(id => {
    const badge = document.querySelector(`.cleared-badge[data-stage="${id}"]`);
    if (badge) badge.textContent = '✅';
  });
}
