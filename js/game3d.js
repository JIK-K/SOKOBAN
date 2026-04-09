/* ══════════════════════════════════════════════
   game3d.js  —  SOKOBAN3D 메인 게임 클래스
   의존: constants.js / scene.js / orbit.js / input.js
   ══════════════════════════════════════════════ */
class SOKOBAN3D {
  constructor({
    rows,
    cols,
    whitePositions,
    bluePositions,
    greenPositions,
    redStart,
    stageId,
  }) {
    this.rows = rows;
    this.cols = cols;
    this.whites = new Set(whitePositions.map(([r, c]) => `${r},${c}`));
    this.blues = new Set(bluePositions.map(([r, c]) => `${r},${c}`));
    this._initGreens = greenPositions.map((p) => [...p]);
    this._initRed = [...redStart];
    this.stageId = stageId;
    this.moves = 0;
    this.startTime = Date.now();
    this.timerHandle = null;
    this.isAnimating = false;
    this.greenPositions = greenPositions.map((p) => [...p]);
    this.redPos = [...redStart];
    this._movesEl = document.getElementById("movesCount");
    this._timeEl = document.getElementById("timeCount");
    this._bestEl = document.getElementById("bestCount");
    this._setup();
  }

  _setup() {
    this._initRenderer();
    this._initScene();
    this._initOrbit();
    this._initInput();
    this._startTimer();
    this._loadBest();
    this._loop();
  }

  /* ── 렌더러·카메라 ── */
  _initRenderer() {
    const canvas = document.getElementById("gameCanvas");
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(PB.COLOR.BG);
    this.scene.fog = new THREE.FogExp2(PB.COLOR.FOG, 0.018);

    const { FOV, NEAR, FAR } = PB.CAM;
    this.camera = new THREE.PerspectiveCamera(FOV, 1, NEAR, FAR);
    this._setDefaultCameraPos();
    this._resize();

    window.addEventListener("resize", () => {
      this._resize();
      this.camera.aspect = this._aspect();
      this.camera.updateProjectionMatrix();
    });
  }

  _aspect() {
    const w = document.getElementById("canvasWrap");
    return w.clientWidth / w.clientHeight;
  }

  _resize() {
    const wrap = document.getElementById("canvasWrap");
    const w = wrap.clientWidth,
      h = wrap.clientHeight;
    this.renderer.setSize(w, h, false);
    const c = document.getElementById("gameCanvas");
    c.style.width = w + "px";
    c.style.height = h + "px";
    if (this.camera) {
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
    }
  }

  _setDefaultCameraPos() {
    const cx = (this.cols - 1) / 2,
      cz = (this.rows - 1) / 2;
    const dist = Math.max(this.cols, this.rows) * PB.CAM.DIST_SCALE;
    this.camera.position.set(
      cx + dist * PB.CAM.X_OFFSET,
      dist * PB.CAM.Y_OFFSET,
      cz + dist * PB.CAM.Z_OFFSET,
    );
    this.camera.lookAt(cx, 0, cz);
  }

  /* ── SceneBuilder ── */
  _initScene() {
    this.sb = new SceneBuilder(
      this.scene,
      this.rows,
      this.cols,
      this.whites,
      this.blues,
    );
    this.sb.build(this.greenPositions, this.redPos);
  }

  /* ── OrbitController ── */
  _initOrbit() {
    const cx = (this.cols - 1) / 2,
      cz = (this.rows - 1) / 2;
    this.orbit = new OrbitController(
      this.camera,
      document.getElementById("gameCanvas"),
      { cx, cz },
      PB.ORBIT,
    );
  }

  /* ── InputHandler ── */
  _initInput() {
    this.input = new InputHandler(
      (dir) => this.move(dir),
      () => this.reset(),
      () => this.orbit.resetView(),
    );
  }

  /* ══════════ 게임 로직 ══════════ */
  move(dir) {
    if (this.isAnimating) return;
    const [dr, dc] = {
      up: [-1, 0],
      down: [1, 0],
      left: [0, -1],
      right: [0, 1],
    }[dir];
    const [nr, nc] = [this.redPos[0] + dr, this.redPos[1] + dc];

    if (!this._inBounds(nr, nc)) return;
    if (this.whites.has(`${nr},${nc}`)) return;

    const gi = this.greenPositions.findIndex(
      ([gr, gc]) => gr === nr && gc === nc,
    );
    if (gi !== -1) {
      const [pr, pc] = [nr + dr, nc + dc];
      if (!this._inBounds(pr, pc)) return;
      if (this.whites.has(`${pr},${pc}`)) return;
      if (this.greenPositions.some(([gr, gc]) => gr === pr && gc === pc))
        return;

      this.greenPositions[gi] = [pr, pc];
      const gMesh = this.sb.greenMeshes[gi];
      this._animArc(
        gMesh.group,
        pc - 1,
        pr - 1,
        PB.ANIM.PUSH_DURATION,
        PB.ANIM.ARC_HEIGHT_GRN,
        () => {
          gMesh.row = pr;
          gMesh.col = pc;
          this._onGreenLand(gi);
        },
      );
    }

    this.redPos = [nr, nc];
    this.moves++;
    if (this._movesEl) this._movesEl.textContent = this.moves;

    this.isAnimating = true;
    this._animArc(
      this.sb.redMesh,
      nc - 1,
      nr - 1,
      PB.ANIM.MOVE_DURATION,
      PB.ANIM.ARC_HEIGHT_RED,
      () => {
        this.sb.redRing?.position.set(nc - 1, 0.12, nr - 1);
        this.isAnimating = false;
        this._checkClear();
      },
    );
    this._flashBall();
  }

  _inBounds(r, c) {
    return r >= 1 && r <= this.rows && c >= 1 && c <= this.cols;
  }

  _onGreenLand(idx) {
    const [gr, gc] = this.greenPositions[idx];
    if (!this.blues.has(`${gr},${gc}`)) return;
    const mesh = this.sb.greenMeshes[idx].group.children[0];
    mesh.material.emissiveIntensity = 0.7;
    mesh.material.color.set(PB.COLOR.GREEN_LIT);
    this.sb.spawnGlowParticles(this.scene, gc - 1, gr - 1);
  }

  _checkClear() {
    if (!this.greenPositions.every(([gr, gc]) => this.blues.has(`${gr},${gc}`)))
      return;
    clearInterval(this.timerHandle);
    this._saveBest();
    setTimeout(() => this._showClear(), 600);
  }

  _showClear() {
    const overlay = document.getElementById("clearOverlay");
    if (!overlay) return;
    document.getElementById("clearMoves").textContent = this.moves;
    const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
    document.getElementById("clearTime").textContent = this._fmt(elapsed);
    overlay.classList.add("show");
    this.sb.spawnConfetti(this.scene, (this.cols - 1) / 2, (this.rows - 1) / 2);
  }

  /* ══════════ 리셋 ══════════ */
  reset() {
    clearInterval(this.timerHandle);
    this.moves = 0;
    this.startTime = Date.now();
    this.isAnimating = false;
    this.greenPositions = this._initGreens.map((p) => [...p]);
    this.redPos = [...this._initRed];
    if (this._movesEl) this._movesEl.textContent = "0";
    if (this._timeEl) this._timeEl.textContent = "0:00";
    document.getElementById("clearOverlay")?.classList.remove("show");
    this.sb.build(this.greenPositions, this.redPos);
    this._startTimer();
  }

  /* ══════════ 애니메이션 헬퍼 ══════════ */
  _animArc(obj, tx, tz, duration, arcH, cb) {
    const sx = obj.position.x,
      sz = obj.position.z,
      baseY = obj.position.y;
    const t0 = performance.now(),
      ms = duration * 1000;
    const tick = (now) => {
      const t = Math.min((now - t0) / ms, 1);
      const e = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      obj.position.x = sx + (tx - sx) * e;
      obj.position.z = sz + (tz - sz) * e;
      obj.position.y = baseY + Math.sin(t * Math.PI) * arcH;
      if (t < 1) requestAnimationFrame(tick);
      else {
        obj.position.y = baseY;
        cb?.();
      }
    };
    requestAnimationFrame(tick);
  }

  _flashBall() {
    const mat = this.sb.redMesh?.material;
    if (!mat) return;
    const orig = mat.emissiveIntensity;
    mat.emissiveIntensity = PB.ANIM.BOUNCE_EMIT;
    setTimeout(() => {
      mat.emissiveIntensity = orig;
    }, PB.ANIM.BOUNCE_MS);
  }

  /* ══════════ 타이머·기록 ══════════ */
  _startTimer() {
    this.timerHandle = setInterval(() => {
      if (this._timeEl)
        this._timeEl.textContent = this._fmt(
          Math.floor((Date.now() - this.startTime) / 1000),
        );
    }, 1000);
  }

  _saveBest() {
    new StorageManager(this.stageId).saveBest(
      this.moves,
      Math.floor((Date.now() - this.startTime) / 1000),
    );
  }

  _loadBest() {
    const best = new StorageManager(this.stageId).loadBest();
    if (this._bestEl) this._bestEl.textContent = best ? best.moves : "--";
  }

  _fmt(s) {
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  }

  /* ══════════ 렌더 루프 ══════════ */
  _loop() {
    const tick = (t) => {
      requestAnimationFrame(tick);
      this.orbit.update();

      if (this.sb.particles) this.sb.particles.rotation.y = t * 0.00005;
      if (this.sb.accentLight1)
        this.sb.accentLight1.intensity =
          PB.LIGHT.ACCENT1_INT + Math.sin(t * 0.002) * 0.6;
      if (this.sb.accentLight2)
        this.sb.accentLight2.intensity =
          PB.LIGHT.ACCENT2_INT + Math.cos(t * 0.0015) * 0.5;

      if (this.sb.redMesh && !this.isAnimating) {
        this.sb.redMesh.position.y = PB.OBJ.RED_Y + Math.sin(t * 0.003) * 0.04;
        this.sb.redMesh.rotation.y = t * 0.001;
        if (this.sb.redRing)
          this.sb.redRing.material.opacity = 0.2 + Math.sin(t * 0.004) * 0.15;
      }

      this.sb.greenMeshes?.forEach((g, i) => {
        if (g.group)
          g.group.position.y =
            PB.OBJ.GREEN_Y + Math.sin(t * 0.002 + i * 0.8) * 0.03;
      });

      this.renderer.render(this.scene, this.camera);
    };
    requestAnimationFrame(tick);
  }
}
