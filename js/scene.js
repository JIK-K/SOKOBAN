/* ══════════════════════════════════════════════
   scene.js
   Three.js 씬 빌드 담당
   조명 / 타일 / 초록블록 / 빨간공 / 파티클
   ══════════════════════════════════════════════ */

class SceneBuilder {
  constructor(scene, rows, cols, whites, blues) {
    this.scene  = scene;
    this.rows   = rows;
    this.cols   = cols;
    this.whites = whites; // Set<"r,c">
    this.blues  = blues;  // Set<"r,c">

    // 씬에 추가된 오브젝트 참조 (외부에서 접근)
    this.accentLight1 = null;
    this.accentLight2 = null;
    this.particles    = null;
    this.greenMeshes  = [];   // [{ group, row, col }]
    this.redMesh      = null;
    this.redRing      = null;
  }

  /* ── 전체 씬 클리어 후 재빌드 ── */
  build(greenPositions, redPos) {
    // 씬 초기화
    while (this.scene.children.length) this.scene.remove(this.scene.children[0]);
    this.greenMeshes = [];
    this.redMesh = null;
    this.redRing = null;

    this._addLights();
    this._addGridDeco();
    this._addTiles();
    this._addGreenBlocks(greenPositions);
    this._addRedBall(redPos);
    this._addParticleField();
  }

  /* ─────────────── LIGHTS ─────────────── */
  _addLights() {
    const C = PB.COLOR;
    const L = PB.LIGHT;

    this.scene.add(new THREE.AmbientLight(L.AMBIENT_COLOR, L.AMBIENT_INT));

    const dir = new THREE.DirectionalLight(0xffffff, L.DIR_INT);
    dir.position.set(10, 20, 10);
    dir.castShadow = true;
    dir.shadow.mapSize.set(2048, 2048);
    dir.shadow.camera.near   = 0.5;
    dir.shadow.camera.far    = 80;
    dir.shadow.camera.left   = dir.shadow.camera.bottom = -30;
    dir.shadow.camera.right  = dir.shadow.camera.top    =  30;
    dir.shadow.bias = -0.001;
    this.scene.add(dir);

    const p1 = new THREE.PointLight(L.ACCENT1_COLOR, L.ACCENT1_INT, L.ACCENT1_DIST);
    p1.position.set(-3, 6, -3);
    this.scene.add(p1);
    this.accentLight1 = p1;

    const p2 = new THREE.PointLight(L.ACCENT2_COLOR, L.ACCENT2_INT, L.ACCENT2_DIST);
    p2.position.set(this.cols + 2, 5, this.rows + 2);
    this.scene.add(p2);
    this.accentLight2 = p2;
  }

  /* ─────────────── GRID DECO ─────────────── */
  _addGridDeco() {
    const geo = new THREE.PlaneGeometry(this.cols * 2 + 6, this.rows * 2 + 6, 20, 20);
    const mat = new THREE.MeshBasicMaterial({
      color: PB.COLOR.ACCENT, wireframe: true, transparent: true, opacity: 0.04,
    });
    const grid = new THREE.Mesh(geo, mat);
    grid.rotation.x = -Math.PI / 2;
    grid.position.set((this.cols - 1) / 2, -0.55, (this.rows - 1) / 2);
    this.scene.add(grid);
  }

  /* ─────────────── TILES ─────────────── */
  _addTiles() {
    const { SIZE, WALL_H, FLOOR_H, GAP } = PB.TILE;
    const C = PB.COLOR;

    const matFloor = new THREE.MeshStandardMaterial({ color: C.FLOOR,     roughness: 0.8, metalness: 0.2 });
    const matWall  = new THREE.MeshStandardMaterial({ color: C.WALL,      roughness: 0.5, metalness: 0.3 });
    const matBlue  = new THREE.MeshStandardMaterial({
      color: C.BLUE_TILE, roughness: 0.3, metalness: 0.6,
      emissive: C.BLUE_EMIT, emissiveIntensity: 0.25,
    });

    for (let r = 1; r <= this.rows; r++) {
      for (let c = 1; c <= this.cols; c++) {
        const key = `${r},${c}`;
        const x = c - 1, z = r - 1;

        if (this.whites.has(key)) {
          // 벽 블록
          const mesh = new THREE.Mesh(
            new THREE.BoxGeometry(SIZE - GAP, WALL_H, SIZE - GAP), matWall
          );
          mesh.position.set(x, WALL_H / 2, z);
          mesh.castShadow = mesh.receiveShadow = true;
          this.scene.add(mesh);

          // 상단 발광 엣지
          const edge = new THREE.Mesh(
            new THREE.BoxGeometry(SIZE - GAP, 0.02, SIZE - GAP),
            new THREE.MeshStandardMaterial({ color: C.WALL, emissive: C.WALL_EDGE, emissiveIntensity: 0.3 })
          );
          edge.position.set(x, WALL_H + 0.01, z);
          this.scene.add(edge);

        } else if (this.blues.has(key)) {
          // 파란 목표 타일
          const mesh = new THREE.Mesh(
            new THREE.BoxGeometry(SIZE - GAP, FLOOR_H, SIZE - GAP), matBlue
          );
          mesh.position.set(x, FLOOR_H / 2 - 0.01, z);
          mesh.receiveShadow = true;
          this.scene.add(mesh);

          // 점선 프레임
          const frame = new THREE.LineSegments(
            new THREE.EdgesGeometry(new THREE.BoxGeometry(SIZE * 0.7, 0.05, SIZE * 0.7)),
            new THREE.LineBasicMaterial({ color: C.BLUE_FRAME, transparent: true, opacity: 0.8 })
          );
          frame.position.set(x, FLOOR_H + 0.03, z);
          this.scene.add(frame);
          this._pulseFrame(frame);

        } else {
          // 일반 바닥 타일
          const mesh = new THREE.Mesh(
            new THREE.BoxGeometry(SIZE - GAP, FLOOR_H, SIZE - GAP), matFloor
          );
          mesh.position.set(x, FLOOR_H / 2 - 0.04, z);
          mesh.receiveShadow = true;
          this.scene.add(mesh);
        }
      }
    }
  }

  _pulseFrame(frame) {
    let t = Math.random() * Math.PI * 2;
    const tick = () => {
      if (!frame.parent) return;
      t += 0.03;
      frame.material.opacity = 0.4 + Math.sin(t) * 0.4;
      requestAnimationFrame(tick);
    };
    tick();
  }

  /* ─────────────── GREEN BLOCKS ─────────────── */
  _addGreenBlocks(greenPositions) {
    const { GREEN_W, GREEN_H } = PB.OBJ;
    const geo = new THREE.BoxGeometry(GREEN_W, GREEN_H, GREEN_W);
    const edgesGeo = new THREE.EdgesGeometry(geo);

    greenPositions.forEach(([r, c]) => {
      const group = new THREE.Group();

      const mesh = new THREE.Mesh(
        geo,
        new THREE.MeshStandardMaterial({
          color: PB.COLOR.GREEN, roughness: 0.3, metalness: 0.4,
          emissive: PB.COLOR.GREEN, emissiveIntensity: 0.15,
        })
      );
      mesh.castShadow = mesh.receiveShadow = true;

      const edges = new THREE.LineSegments(
        edgesGeo,
        new THREE.LineBasicMaterial({ color: PB.COLOR.GREEN_LIT, transparent: true, opacity: 0.6 })
      );

      // 상단 하이라이트 캡
      const cap = new THREE.Mesh(
        new THREE.PlaneGeometry(GREEN_W * 0.85, GREEN_W * 0.85),
        new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.12, side: THREE.DoubleSide })
      );
      cap.rotation.x = -Math.PI / 2;
      cap.position.y = GREEN_H / 2 + 0.001;

      group.add(mesh, edges, cap);
      group.position.set(c - 1, PB.OBJ.GREEN_Y, r - 1);
      this.scene.add(group);
      this.greenMeshes.push({ group, row: r, col: c });
    });
  }

  /* ─────────────── RED BALL ─────────────── */
  _addRedBall([r, c]) {
    const { RED_R, RED_Y } = PB.OBJ;

    this.redMesh = new THREE.Mesh(
      new THREE.SphereGeometry(RED_R, 32, 32),
      new THREE.MeshStandardMaterial({
        color: PB.COLOR.RED, roughness: 0.2, metalness: 0.5,
        emissive: PB.COLOR.RED, emissiveIntensity: 0.3,
      })
    );
    this.redMesh.position.set(c - 1, RED_Y, r - 1);
    this.redMesh.castShadow = true;
    this.scene.add(this.redMesh);

    // 하단 글로우 링
    this.redRing = new THREE.Mesh(
      new THREE.RingGeometry(0.3, 0.45, 32),
      new THREE.MeshBasicMaterial({ color: PB.COLOR.RED, transparent: true, opacity: 0.35, side: THREE.DoubleSide })
    );
    this.redRing.rotation.x = -Math.PI / 2;
    this.redRing.position.set(c - 1, 0.12, r - 1);
    this.scene.add(this.redRing);
  }

  /* ─────────────── PARTICLES ─────────────── */
  _addParticleField() {
    const { FIELD_COUNT, FIELD_SPREAD } = PB.PARTICLE;
    const pos = new Float32Array(FIELD_COUNT * 3);
    for (let i = 0; i < FIELD_COUNT; i++) {
      pos[i*3]   = (Math.random() - 0.5) * this.cols  * FIELD_SPREAD;
      pos[i*3+1] = Math.random() * 8;
      pos[i*3+2] = (Math.random() - 0.5) * this.rows * FIELD_SPREAD;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    this.particles = new THREE.Points(
      geo,
      new THREE.PointsMaterial({ color: PB.COLOR.PARTICLE, size: 0.04, transparent: true, opacity: 0.5 })
    );
    this.scene.add(this.particles);
  }

  /* ─────────────── SPAWN GLOW ─────────────── */
  spawnGlowParticles(scene, x, z) {
    const { SPAWN_COUNT, SPAWN_FRAMES } = PB.PARTICLE;
    const pos = new Float32Array(SPAWN_COUNT * 3);
    const vel = [];
    for (let i = 0; i < SPAWN_COUNT; i++) {
      pos[i*3] = x; pos[i*3+1] = 0.5; pos[i*3+2] = z;
      vel.push({ x:(Math.random()-0.5)*0.08, y:Math.random()*0.06+0.02, z:(Math.random()-0.5)*0.08 });
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({ color: PB.COLOR.ACCENT, size: 0.1, transparent: true, opacity: 1 });
    const pts = new THREE.Points(geo, mat);
    scene.add(pts);

    let frame = 0;
    const tick = () => {
      frame++;
      const arr = pts.geometry.attributes.position.array;
      for (let i = 0; i < SPAWN_COUNT; i++) {
        arr[i*3]   += vel[i].x;
        arr[i*3+1] += vel[i].y;
        arr[i*3+2] += vel[i].z;
        vel[i].y   -= 0.002;
      }
      pts.geometry.attributes.position.needsUpdate = true;
      mat.opacity = Math.max(0, 1 - frame / SPAWN_FRAMES);
      if (frame < SPAWN_FRAMES) requestAnimationFrame(tick);
      else scene.remove(pts);
    };
    tick();
  }

  /* ─────────────── CONFETTI ─────────────── */
  spawnConfetti(scene, cx, cz) {
    const { CONFETTI_COUNT, CONFETTI_FRAMES } = PB.PARTICLE;
    const meshes = [];
    for (let i = 0; i < CONFETTI_COUNT; i++) {
      const color = PB.COLOR.CONFETTI[Math.floor(Math.random() * PB.COLOR.CONFETTI.length)];
      const m = new THREE.Mesh(
        new THREE.BoxGeometry(0.1, 0.1, 0.02),
        new THREE.MeshBasicMaterial({ color })
      );
      m.position.set(cx + (Math.random()-0.5)*4, 4, cz + (Math.random()-0.5)*4);
      m.userData.vel  = { x:(Math.random()-0.5)*0.1, y:Math.random()*0.08+0.04, z:(Math.random()-0.5)*0.1 };
      m.userData.rotV = { x:Math.random()*0.15, y:Math.random()*0.15, z:Math.random()*0.15 };
      scene.add(m);
      meshes.push(m);
    }
    let f = 0;
    const tick = () => {
      f++;
      meshes.forEach(m => {
        m.position.x += m.userData.vel.x;
        m.position.y += m.userData.vel.y;
        m.position.z += m.userData.vel.z;
        m.userData.vel.y  -= 0.003;
        m.rotation.x += m.userData.rotV.x;
        m.rotation.y += m.userData.rotV.y;
        m.rotation.z += m.userData.rotV.z;
      });
      if (f < CONFETTI_FRAMES) requestAnimationFrame(tick);
      else meshes.forEach(m => scene.remove(m));
    };
    tick();
  }
}
