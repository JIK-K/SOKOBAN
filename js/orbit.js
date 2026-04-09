/* ══════════════════════════════════════════════
   orbit.js (Zoom 기능 추가 버전)
   ══════════════════════════════════════════════ */

class OrbitController {
  constructor(camera, domElement, target, cfg) {
    this.camera = camera;
    this.el = domElement;
    this.cfg = cfg;

    this.target = new THREE.Vector3(target.cx, 0, target.cz);

    this._computeSpherical();

    this._dragging = false;
    this._lastX = 0;
    this._lastY = 0;

    this._velTheta = 0;
    this._velPhi = 0;
    this._velR = 0; // 거리에 대한 관성 추가

    this._initR = this._r;
    this._initTheta = this._theta;
    this._initPhi = this._phi;

    this._bind();
  }

  _computeSpherical() {
    const d = this.camera.position.clone().sub(this.target);
    this._r = d.length();
    this._phi = Math.acos(Math.max(-1, Math.min(1, d.y / this._r)));
    this._theta = Math.atan2(d.z, d.x);
  }

  _applySpherical() {
    const { _r, _theta, _phi } = this;
    this.camera.position.set(
      this.target.x + _r * Math.sin(_phi) * Math.cos(_theta),
      this.target.y + _r * Math.cos(_phi),
      this.target.z + _r * Math.sin(_phi) * Math.sin(_theta),
    );
    this.camera.lookAt(this.target);
  }

  _bind() {
    const el = this.el;

    /* 마우스 드래그 이벤트 (기본 유지) */
    el.addEventListener("mousedown", (e) => {
      if (e.button !== 0) return;
      this._dragging = true;
      this._lastX = e.clientX;
      this._lastY = e.clientY;
      el.style.cursor = "grabbing";
      e.preventDefault();
    });

    window.addEventListener("mousemove", (e) => {
      if (!this._dragging) return;
      this._rotate(e.clientX - this._lastX, e.clientY - this._lastY);
      this._lastX = e.clientX;
      this._lastY = e.clientY;
    });

    window.addEventListener("mouseup", () => {
      this._dragging = false;
      this.el.style.cursor = "grab";
    });

    /* ── 마우스 휠 줌 (추가됨) ── */
    el.addEventListener(
      "wheel",
      (e) => {
        // deltaY가 양수면 축소(멀어짐), 음수면 확대(가까워짐)
        const zoomSensitivity = this.cfg.ZOOM_SENSITIVITY || 0.001;
        const dR = e.deltaY * zoomSensitivity * this._r;

        this._zoom(dR);
        e.preventDefault();
      },
      { passive: false },
    );

    /* 터치 이벤트 */
    let initialPinchDistance = null;

    el.addEventListener(
      "touchstart",
      (e) => {
        if (e.touches.length === 1) {
          // 단일 터치: 회전 시작
          this._dragging = true;
          this._lastX = e.touches[0].clientX;
          this._lastY = e.touches[0].clientY;
        } else if (e.touches.length === 2) {
          // 멀티 터치: 핀치 줌 시작 전 거리 계산
          this._dragging = false; // 줌 할 때는 회전 중단
          initialPinchDistance = Math.hypot(
            e.touches[0].clientX - e.touches[1].clientX,
            e.touches[0].clientY - e.touches[1].clientY,
          );
        }
        if (e.cancelable) e.preventDefault();
      },
      { passive: false },
    );

    window.addEventListener(
      "touchmove",
      (e) => {
        if (e.touches.length === 1 && this._dragging) {
          // 단일 터치 이동: 회전 처리
          const dx = e.touches[0].clientX - this._lastX;
          const dy = e.touches[0].clientY - this._lastY;
          this._rotate(dx, dy);
          this._lastX = e.touches[0].clientX;
          this._lastY = e.touches[0].clientY;
        } else if (e.touches.length === 2 && initialPinchDistance !== null) {
          // 멀티 터치 이동: 핀치 줌 처리
          const currentDistance = Math.hypot(
            e.touches[0].clientX - e.touches[1].clientX,
            e.touches[0].clientY - e.touches[1].clientY,
          );

          // 두 손가락 사이의 거리 변화량 계산
          const delta = initialPinchDistance - currentDistance;
          const zoomSensitivity = (this.cfg.ZOOM_SENSITIVITY || 0.001) * 2; // 터치는 감도를 조절할 수 있습니다
          const dR = delta * zoomSensitivity * this._r;

          this._zoom(dR);
          initialPinchDistance = currentDistance; // 현재 거리를 다음 기준으로 갱신
        }
        if (e.cancelable) e.preventDefault();
      },
      { passive: false },
    );

    window.addEventListener("touchend", () => {
      this._dragging = false;
      initialPinchDistance = null;
    });

    el.style.cursor = "grab";
  }

  /* ── 줌 적용 (추가됨) ── */
  _zoom(dR) {
    this._velR = dR; // 관성을 위해 속도 저장

    // r값 업데이트 및 제한 (MIN_DIST, MAX_DIST 설정값 사용)
    const minDist = this.cfg.MIN_DIST || 2;
    const maxDist = this.cfg.MAX_DIST || 50;

    this._r = Math.max(minDist, Math.min(maxDist, this._r + dR));
    this._applySpherical();
  }

  _rotate(dx, dy) {
    const dTheta = dx * this.cfg.SENSITIVITY_X;
    const dPhi = dy * this.cfg.SENSITIVITY_Y;

    this._velTheta = dTheta;
    this._velPhi = dPhi;

    this._theta += dTheta;
    this._phi = Math.max(
      this.cfg.MIN_POLAR,
      Math.min(this.cfg.MAX_POLAR, this._phi + dPhi),
    );
    this._applySpherical();
  }

  update() {
    if (this._dragging) return;

    const damp = this.cfg.DAMPING;
    // 회전 관성 + 줌 관성 업데이트
    if (
      Math.abs(this._velTheta) > 0.00001 ||
      Math.abs(this._velPhi) > 0.00001 ||
      Math.abs(this._velR) > 0.00001
    ) {
      this._theta += this._velTheta;
      this._phi = Math.max(
        this.cfg.MIN_POLAR,
        Math.min(this.cfg.MAX_POLAR, this._phi + this._velPhi),
      );

      // 줌 관성 적용
      const minDist = this.cfg.MIN_DIST || 2;
      const maxDist = this.cfg.MAX_DIST || 50;
      this._r = Math.max(minDist, Math.min(maxDist, this._r + this._velR));

      this._velTheta *= damp;
      this._velPhi *= damp;
      this._velR *= damp;

      this._applySpherical();
    }
  }

  resetView() {
    const startTheta = this._theta;
    const startPhi = this._phi;
    const startR = this._r;
    const tgtTheta = this._initTheta;
    const tgtPhi = this._initPhi;
    const tgtR = this._initR;
    const dur = this.cfg.RESET_DURATION;
    const t0 = performance.now();

    this._velTheta = 0;
    this._velPhi = 0;
    this._velR = 0;

    const tick = (now) => {
      const p = Math.min((now - t0) / dur, 1);
      const e = p < 0.5 ? 2 * p * p : -1 + (4 - 2 * p) * p;
      this._theta = startTheta + (tgtTheta - startTheta) * e;
      this._phi = startPhi + (tgtPhi - startPhi) * e;
      this._r = startR + (tgtR - startR) * e; // 거리도 부드럽게 리셋
      this._applySpherical();
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  get isDragging() {
    return this._dragging;
  }
}
