import './style.css';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// ===== Effects =====

// Particle VFX: spark / explosion pool (THREE.Points + additive blending)
class Sparks {
  constructor(scene, max = 1500) {
    this.max = max;
    this.i = 0;
    this.pos = new Float32Array(max * 3);
    this.col = new Float32Array(max * 3);
    this.base = new Float32Array(max * 3);
    this.vel = new Float32Array(max * 3);
    this.life = new Float32Array(max);

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(this.col, 3));

    this.points = new THREE.Points(
      geometry,
      new THREE.PointsMaterial({
        size: 0.24,
        vertexColors: true,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      }),
    );
    this.points.frustumCulled = false;
    scene.add(this.points);
  }

  emit(position, count, color, speed = 5) {
    const tint = new THREE.Color(color);

    for (let k = 0; k < count; k++) {
      const index = this.i;
      this.i = (index + 1) % this.max;
      const offset = index * 3;

      this.pos[offset] = position.x;
      this.pos[offset + 1] = position.y;
      this.pos[offset + 2] = position.z;

      const velocity = new THREE.Vector3()
        .randomDirection()
        .multiplyScalar(speed * (0.4 + Math.random() * 0.6));

      this.vel[offset] = velocity.x;
      this.vel[offset + 1] = Math.abs(velocity.y) + speed * 0.3;
      this.vel[offset + 2] = velocity.z;

      this.base[offset] = tint.r;
      this.base[offset + 1] = tint.g;
      this.base[offset + 2] = tint.b;
      this.life[index] = 0.5 + Math.random() * 0.7;
    }
  }

  update(dt) {
    for (let i = 0; i < this.max; i++) {
      const offset = i * 3;

      if (this.life[i] > 0) {
        this.life[i] -= dt;
        this.vel[offset + 1] -= 14 * dt;

        for (let axis = 0; axis < 3; axis++) {
          this.pos[offset + axis] += this.vel[offset + axis] * dt;
        }

        if (this.pos[offset + 1] < 0.05) {
          this.pos[offset + 1] = 0.05;
          this.vel[offset + 1] *= -0.4;
        }

        const fade = Math.min(1, Math.max(this.life[i], 0) * 2);
        for (let axis = 0; axis < 3; axis++) {
          this.col[offset + axis] = this.base[offset + axis] * fade;
        }
      } else {
        this.col[offset] = 0;
        this.col[offset + 1] = 0;
        this.col[offset + 2] = 0;
      }
    }

    this.points.geometry.attributes.position.needsUpdate = true;
    this.points.geometry.attributes.color.needsUpdate = true;
  }
}

// ===== HUD =====
// HUD & overlay (Anggota 3)
const $ = (s) => document.querySelector(s);
const overlay = $('#overlay');
let action = () => {};
$('#overlay button').addEventListener('click', () => action());

const ui = {
  onAction(fn) { action = fn; },
  count(n) { $('#count b').textContent = n; },
  phase(t) { $('#phase').textContent = t; },
  boss(f) {
    $('#bossWrap').style.display = f == null ? 'none' : 'block';
    if (f != null) $('#bossBar').style.width = Math.max(0, f * 100) + '%';
  },
  show(title, text, btn) {
    $('#overlay h1').textContent = title;
    $('#overlay p').textContent = text;
    $('#overlay button').textContent = btn;
    overlay.style.display = 'flex';
  },
  hide() { overlay.style.display = 'none'; },
};

// ===== Scene and factory =====

// Scene, camera, lighting, environment, factory (Anggota 1 + 3)
const TRACK = { half: 7, length: 260 };
const factoryMetal = (color, r = 0.4, m = 0.9) => new THREE.MeshStandardMaterial({ color, roughness: r, metalness: m });

function canvasTex(w, h, draw, rep) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'));
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(...rep); t.anisotropy = 8; return t;
}

function createWorld() {
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setSize(innerWidth, innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  document.body.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0b0f14);
  scene.fog = new THREE.Fog(0x0b0f14, 25, 120);
  // Environment map untuk refleksi factoryMetal (procedural; ganti dengan .hdr via RGBELoader bila mau)
  scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.6;

  const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 300);
  addEventListener('resize', () => {
    camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
  });

  // Lighting: hemisphere + directional (shadow) + 2 dynamic point lights
  scene.add(new THREE.HemisphereLight(0x8fb4ff, 0x20150f, 0.7));
  const sun = new THREE.DirectionalLight(0xfff1dd, 2.4);
  sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -0.0005;
  Object.assign(sun.shadow.camera, { left: -16, right: 16, top: 16, bottom: -16, near: 1, far: 60 });
  scene.add(sun, sun.target);
  const cyan = new THREE.PointLight(0x33d6ff, 120, 18, 2);
  const hazard = new THREE.PointLight(0xff4a1a, 110, 20, 2);
  scene.add(cyan, hazard);

  // Floor (grid plate) + conveyor belts
  const L = TRACK.length, H = TRACK.half;
  const floorTex = canvasTex(256, 256, (g) => {
    g.fillStyle = '#2b323a'; g.fillRect(0, 0, 256, 256);
    g.strokeStyle = '#4a5560'; g.lineWidth = 6; g.strokeRect(0, 0, 256, 256);
    g.strokeStyle = '#3a444e'; g.lineWidth = 2; g.beginPath(); g.moveTo(128, 0); g.lineTo(128, 256); g.moveTo(0, 128); g.lineTo(256, 128); g.stroke();
  }, [4, 40]);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(H * 2, 300), new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.5, metalness: 0.8 }));
  floor.rotation.x = -Math.PI / 2; floor.position.z = -130; floor.receiveShadow = true; scene.add(floor);

  const beltTex = canvasTex(64, 64, (g) => {
    g.fillStyle = '#15181c'; g.fillRect(0, 0, 64, 64); g.strokeStyle = '#d9a400'; g.lineWidth = 8;
    g.beginPath(); g.moveTo(0, 48); g.lineTo(32, 16); g.lineTo(64, 48); g.stroke();
  }, [1, 60]);
  for (const s of [-1, 1]) {
    const belt = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 300), new THREE.MeshStandardMaterial({ map: beltTex, roughness: 0.7, metalness: 0.5 }));
    belt.rotation.x = -Math.PI / 2; belt.position.set(s * (H + 1.2), 0.02, -130); belt.receiveShadow = true; scene.add(belt);
  }

  // Walls, pipes, roof beams
  for (const s of [-1, 1]) {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(1, 8, 300), factoryMetal(0x30363e, 0.6, 0.8));
    wall.position.set(s * 10.5, 4, -130); wall.receiveShadow = true; scene.add(wall);
    for (const y of [3, 4.7]) {
      const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 300, 16), factoryMetal(0x7a8794, 0.3, 1));
      pipe.rotation.x = Math.PI / 2; pipe.position.set(s * 9.6, y, -130); pipe.castShadow = true; scene.add(pipe);
    }
  }
  for (let z = 10; z > -280; z -= 20) {
    const b = new THREE.Mesh(new THREE.BoxGeometry(22, 0.6, 0.8), factoryMetal(0x242a31, 0.6, 0.8));
    b.position.set(0, 10.5, z); scene.add(b);
  }

  // Animated machinery: rotating gears + hazard beacons
  const machines = [];
  const gearMat = factoryMetal(0x8a96a3, 0.35, 1);
  for (const [z, s] of [[-20, -1], [-90, 1], [-150, -1], [-200, 1]]) {
    const gear = new THREE.Group();
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(2, 2, 0.5, 24).rotateZ(Math.PI / 2), gearMat);
    gear.add(hub);
    for (let k = 0; k < 10; k++) {
      const a = (k / 10) * Math.PI * 2;
      const tooth = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.6, 0.5), gearMat);
      tooth.position.set(0, Math.cos(a) * 2.2, Math.sin(a) * 2.2); tooth.rotation.x = a; gear.add(tooth);
    }
    gear.traverse((o) => { o.castShadow = true; });
    gear.position.set(s * 9.4, 4, z); scene.add(gear);
    machines.push((dt) => { gear.rotation.x += dt * 0.8 * -s; });
  }
  const lampMat = new THREE.MeshStandardMaterial({ color: 0x331100, emissive: 0xff7a1a, emissiveIntensity: 3 });
  for (let z = -10; z > -260; z -= 35) for (const s of [-1, 1]) {
    const g = new THREE.Group();
    g.add(new THREE.Mesh(new THREE.SphereGeometry(0.4, 12, 8), lampMat));
    const bar = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.15, 3), lampMat); bar.position.z = 1.6; g.add(bar);
    g.position.set(s * 9, 6.2, z); scene.add(g);
    machines.push((dt) => { g.rotation.y += dt * 3; });
  }

  let fz = 0;
  return {
    renderer, scene, camera, machines, beltTex,
    follow(z) { fz = z; sun.position.set(8, 18, z + 6); sun.target.position.set(0, 0, z); cyan.position.set(0, 5, z + 2); },
    update(t, dt) {
      machines.forEach((m) => m(dt, t));
      beltTex.offset.y -= dt * 0.6;
      hazard.position.set(Math.sin(t * 1.6) * 6, 4, fz - 5 + Math.cos(t * 1.6) * 3);
      hazard.intensity = 90 + Math.sin(t * 12) * 30;
    },
  };
}


// ===== Gameplay =====

// Gameplay: swarm, gate, obstacle, mini battle, reactor boss (Anggota 1 + 2)
// The supplied robot has ~173k triangles, so cap visible GLB instances for performance.
const MAX_VIS = 32, START = 10, SPEED = 9, LATERAL = 11;
const BATTLE_Z = -140, BATTLE_ENEMIES = 12, BATTLE_HP = 60;
const BOSS_Z = -212, BOSS_HP = 600, PULSE_EVERY = 2.5, PULSE_LOSS = 0.25;
const PHASE_LABELS = {
  run: 'FACTORY RUN — PILIH GATE',
  battle: 'MINI BATTLE',
  boss: 'HANCURKAN REACTOR!',
};

const GATES = [
  { z: -30, opts: [{ label: 'x2', op: 'mul', v: 2 }, { label: '+5', op: 'add', v: 5 }] },
  { z: -80, opts: [{ label: '+15', op: 'add', v: 15 }, { label: 'x3', op: 'mul', v: 3 }] },
  { z: -175, opts: [{ label: '-10', op: 'add', v: -10 }, { label: 'x2', op: 'mul', v: 2 }] },
];
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const robotMetal = (c, r = 0.35) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: 1 });
const isGoodGateChoice = (option) => (option.op === 'mul' ? option.v > 1 : option.v > 0);

function labelTex(text, good) {
  const c = document.createElement('canvas'); c.width = 256; c.height = 128;
  const g = c.getContext('2d'); g.font = 'bold 96px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillStyle = good ? '#b6ffd6' : '#ffc0c8'; g.fillText(text, 128, 70);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

class Game {
  constructor(world) {
    this.w = world; this.scene = world.scene; this.keys = new Set();
    this.sparks = new Sparks(this.scene); this.d = new THREE.Object3D(); this.t = 0;
    this.raycaster = new THREE.Raycaster(); this.pointer = new THREE.Vector2();
    this.buildSwarm(); this.buildGates(); this.buildObstacles(); this.buildBattle(); this.buildReactor();
    this.reset(); this.state = 'menu';
    ui.show('ROBOT SWARM FACTORY', 'Pimpin swarm robot melewati factory.\nPilih gate kiri/kanan, hindari crusher & gergaji,\nkalahkan drone penjaga, lalu hancurkan REACTOR!\n\nA/D atau ← → atau gerakkan mouse', 'MULAI');
  }

  // ---------- builders ----------
  buildSwarm() {
    this.robotParts = [];
    const body = robotMetal(0xa8b2bf, 0.28);
    const eye = new THREE.MeshStandardMaterial({ color: 0x001018, emissive: 0x22e6ff, emissiveIntensity: 3 });
    this.bodies = new THREE.InstancedMesh(new THREE.BoxGeometry(0.5, 0.6, 0.5), body, MAX_VIS);
    this.eyes = new THREE.InstancedMesh(new THREE.BoxGeometry(0.34, 0.09, 0.05), eye, MAX_VIS);
    for (const m of [this.bodies, this.eyes]) {
      m.instanceMatrix.setUsage(THREE.DynamicDrawUsage); m.castShadow = true; m.frustumCulled = false; this.scene.add(m);
    }
    // Keep the procedural swarm as a fallback while the GLB loads.
    new GLTFLoader().load('/models/mini-robot.glb', (gltf) => {
      this.useRobotModel(gltf.scene);
    }, undefined, (error) => {
      console.warn('Robot GLB could not be loaded; using procedural robots.', error);
    });
  }

  useRobotModel(root) {
    root.updateMatrixWorld(true);
    const bounds = new THREE.Box3().setFromObject(root);
    const size = bounds.getSize(new THREE.Vector3());
    if (bounds.isEmpty() || size.y < 1e-5) return;

    // Normalize the downloaded model to roughly the same height as the old bots.
    const center = bounds.getCenter(new THREE.Vector3());
    const scale = 0.9 / size.y;
    const normalize = new THREE.Matrix4().compose(
      new THREE.Vector3(-center.x * scale, -bounds.min.y * scale, -center.z * scale),
      new THREE.Quaternion(),
      new THREE.Vector3(scale, scale, scale),
    );
    const rootInverse = root.matrixWorld.clone().invert();
    root.traverse((mesh) => {
      if (!mesh.isMesh || mesh.isSkinnedMesh) return;
      const instance = new THREE.InstancedMesh(mesh.geometry, mesh.material, MAX_VIS);
      instance.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      instance.castShadow = true;
      instance.receiveShadow = true;
      instance.frustumCulled = false;
      this.scene.add(instance);
      this.robotParts.push({
        mesh: instance,
        local: normalize.clone().multiply(rootInverse).multiply(mesh.matrixWorld),
      });
    });

    if (!this.robotParts.length) return;
    this.bodies.visible = false;
    this.eyes.visible = false;
    console.info(`Robot GLB loaded: ${this.robotParts.length} instanced mesh part(s).`);
  }

  buildGates() {
    this.gates = [];

    for (const def of GATES) {
      const gate = {
        z: def.z,
        opts: def.opts,
        meshes: [],
        mats: [],
        passed: false,
        flash: 0,
        choiceIndex: null,
      };

      def.opts.forEach((option, index) => {
        const good = isGoodGateChoice(option);
        const color = good ? 0x22ff88 : 0xff3344;
        const material = new THREE.MeshStandardMaterial({
          color: 0x111111,
          emissive: color,
          emissiveIntensity: 2,
          metalness: 0.8,
          roughness: 0.3,
        });

        const group = new THREE.Group();
        const xOffset = index === 0 ? -3.5 : 3.5;

        for (const x of [-3, 3]) {
          const pole = new THREE.Mesh(new THREE.BoxGeometry(0.4, 5, 0.4), material);
          pole.position.set(x, 2.5, 0);
          pole.castShadow = true;
          group.add(pole);
        }

        const top = new THREE.Mesh(new THREE.BoxGeometry(6.4, 0.4, 0.4), material);
        top.position.y = 5;
        group.add(top);

        const pane = new THREE.Mesh(
          new THREE.PlaneGeometry(5.6, 4.6),
          new THREE.MeshBasicMaterial({
            color,
            transparent: true,
            opacity: 0.18,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            side: THREE.DoubleSide,
          }),
        );
        pane.position.y = 2.6;
        group.add(pane);

        const label = new THREE.Mesh(
          new THREE.PlaneGeometry(4, 2),
          new THREE.MeshBasicMaterial({ map: labelTex(option.label, good), transparent: true, depthWrite: false }),
        );
        label.position.set(0, 3, 0.1);
        group.add(label);

        group.position.set(xOffset, 0, def.z);
        group.traverse((part) => {
          part.userData.gateOwner = gate;
          part.userData.gateOption = index;
        });

        this.scene.add(group);
        gate.mats.push(material);
        gate.meshes.push(group);
      });

      this.gates.push(gate);
    }
  }

  buildObstacles() {
    const hz = new THREE.MeshStandardMaterial({ color: 0x222222, emissive: 0xffaa00, emissiveIntensity: 0.6, metalness: 0.9, roughness: 0.4 });
    this.crushers = [-55, -120].map((z) => {
      const c = { z, plates: [] };
      for (const side of [-1, 1]) {
        const plate = new THREE.Mesh(new THREE.BoxGeometry(7, 0.9, 3), hz);
        const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 5, 12), robotMetal(0x6a7480));
        plate.castShadow = rod.castShadow = true; this.scene.add(plate, rod);
        plate.position.set(side * 3.5, 4.5, z); c.plates.push({ side, plate, rod, hit: false });
      }
      const beam = new THREE.Mesh(new THREE.BoxGeometry(16, 0.8, 1), robotMetal(0x3b434c, 0.5)); beam.position.set(0, 9.2, z); this.scene.add(beam);
      return c;
    });
    this.saws = [[-100, 0], [-108, Math.PI]].map(([z, ph]) => {
      const m = new THREE.Group();
      m.add(new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.4, 0.2, 32).rotateZ(Math.PI / 2), robotMetal(0xc0c8d0, 0.2)));
      m.add(new THREE.Mesh(new THREE.TorusGeometry(1.4, 0.08, 8, 32).rotateY(Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x300, emissive: 0xff3322, emissiveIntensity: 3 })));
      m.traverse((o) => { o.castShadow = true; }); m.position.set(0, 1.4, z); this.scene.add(m);
      return { m, z, ph, cd: 0 };
    });
  }

  buildBattle() {
    const mat = new THREE.MeshStandardMaterial({ color: 0x331111, emissive: 0xff2a2a, emissiveIntensity: 2.5, metalness: 0.9, roughness: 0.3 });
    this.enemies = [];
    for (let i = 0; i < BATTLE_ENEMIES; i++) {
      const m = new THREE.Mesh(new THREE.OctahedronGeometry(0.6), mat); m.castShadow = true;
      m.userData.base = new THREE.Vector3(((i % 4) - 1.5) * 2.2, 1.8 + Math.floor(i / 4) * 0.9, BATTLE_Z - 22 - Math.floor(i / 4) * 2);
      this.scene.add(m); this.enemies.push(m);
    }
    this.laserGeo = new THREE.BufferGeometry().setAttribute('position', new THREE.BufferAttribute(new Float32Array(BATTLE_ENEMIES * 6), 3));
    this.lasers = new THREE.LineSegments(this.laserGeo, new THREE.LineBasicMaterial({ color: 0xff4444, transparent: true, blending: THREE.AdditiveBlending }));
    this.lasers.frustumCulled = false; this.lasers.visible = false; this.scene.add(this.lasers);
  }

  buildReactor() {
    this.reactorPos = new THREE.Vector3(0, 0, -235);
    const g = (this.reactor = new THREE.Group()); g.position.copy(this.reactorPos);
    const base = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 4.8, 1.2, 32), robotMetal(0x59626d, 0.4)); base.position.y = 0.6;
    this.coreMat = new THREE.MeshStandardMaterial({ color: 0x331100, emissive: 0xff4a00, emissiveIntensity: 2, metalness: 0.6, roughness: 0.3 });
    this.core = new THREE.Mesh(new THREE.CylinderGeometry(2, 2.3, 8, 32), this.coreMat); this.core.position.y = 5;
    this.rings = [0, 1, 2].map((k) => {
      const r = new THREE.Mesh(new THREE.TorusGeometry(3.4 + k * 0.5, 0.2, 12, 48), robotMetal(0xb9c2cc, 0.25));
      r.position.y = 3 + k * 2; r.rotation.x = Math.PI / 2; r.castShadow = true; g.add(r); return r;
    });
    this.reactorLight = new THREE.PointLight(0xff5a1a, 200, 40, 2); this.reactorLight.position.y = 5;
    g.add(base, this.core, this.reactorLight); base.castShadow = this.core.castShadow = true; this.scene.add(g);
    this.pulseRings = [];
  }

  // ---------- state ----------
  reset() {
    Object.assign(this, { count: START, x: 0, z: 8, targetX: 0, phase: 'run', battleDone: false, enemyHP: BATTLE_HP, lossAcc: 0, bossHP: BOSS_HP, pulseT: 0, hitFlash: 0 });
    this.gates.forEach((g) => { g.passed = false; g.flash = 0; g.choiceIndex = null; });
    this.enemies.forEach((e) => (e.visible = true)); this.lasers.visible = false;
    this.core.parent !== this.reactor && this.reactor.add(this.core); this.core.visible = true; this.rings.forEach((r) => (r.visible = true));
    this.pulseRings.forEach((p) => this.scene.remove(p.m)); this.pulseRings = [];
    ui.boss(null);
  }
  start() { this.reset(); this.state = 'play'; ui.hide(); }
  end(win) {
    this.state = win ? 'win' : 'lose';
    ui.show(win ? 'REACTOR DESTROYED!' : 'SWARM LOST', win ? `Sisa robot: ${this.count}. Factory aman!` : 'Semua robot hancur. Coba pilih gate yang lebih baik!', 'MAIN LAGI (R)');
  }
  lose(k, at) {
    k = Math.min(k, this.count); if (k <= 0) return;
    this.count -= k; this.sparks.emit(at, Math.min(60, 8 + k * 3), 0xffaa33, 6);
    if (this.count <= 0 && this.state === 'play') this.end(false);
  }
  swarmPos(y = 0.6) { return { x: this.x, y, z: this.z }; }
  overlapFrac(side) { const r = this.r, lo = this.x - r, hi = this.x + r; const o = side < 0 ? clamp(0 - lo, 0, 2 * r) : clamp(hi - 0, 0, 2 * r); return o / (2 * r); }

  passGate(gate) {
    gate.passed = true;
    gate.flash = 1;

    const option = gate.opts[gate.choiceIndex ?? (this.x < 0 ? 0 : 1)];
    this.count = Math.max(0, Math.floor(option.op === 'mul' ? this.count * option.v : this.count + option.v));

    const good = isGoodGateChoice(option);
    this.sparks.emit({ x: this.x, y: 2, z: gate.z }, 80, good ? 0x22ff88 : 0xff3344, 8);

    if (this.count <= 0) this.end(false);
  }

  chooseGateAt(event) {
    if (this.state !== 'play') return false;
    const rect = this.w.renderer.domElement.getBoundingClientRect();
    this.pointer.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1);
    this.raycaster.setFromCamera(this.pointer, this.w.camera);
    const targets = this.gates.filter((g) => !g.passed).flatMap((g) => g.meshes);
    const hit = this.raycaster.intersectObjects(targets, true).find((entry) => entry.object.userData.gateOwner);
    if (!hit) return false;
    const { gateOwner, gateOption } = hit.object.userData;
    gateOwner.choiceIndex = gateOption;
    gateOwner.flash = 0.7;
    this.targetX = gateOwner.meshes[gateOption].position.x;
    return true;
  }

  // ---------- update ----------
  update(dt) {
    this.t += dt; const t = this.t;
    const n = Math.min(this.count, MAX_VIS);
    this.spacing = Math.min(0.42, 4.5 / Math.sqrt(Math.max(n, 1))); this.r = this.spacing * Math.sqrt(n) + 0.3;
    this.animateObstacles(t);
    if (this.state === 'play') this.step(dt);
    this.animateReactor(t, dt);
    this.drawSwarm(t, n);
    this.sparks.update(dt);
    this.gates.forEach((g) => { g.flash = Math.max(0, g.flash - dt * 2); g.mats.forEach((m) => (m.emissiveIntensity = 2 + g.flash * 5)); });
    this.enemies.forEach((e, i) => { if (e.visible) { const b = e.userData.base; e.position.set(b.x, b.y + Math.sin(t * 3 + i) * 0.3, b.z); e.rotation.y += dt * 2; } });
    // camera follow
    const boss = this.phase === 'boss', cam = this.w.camera;
    const tp = new THREE.Vector3(this.x * 0.5, boss ? 12 : 9, this.z + (boss ? 16 : 12));
    cam.position.lerp(tp, Math.min(1, dt * 4)); cam.lookAt(this.x * 0.3, 0, this.z - 10);
    this.w.follow(this.z); ui.count(this.count);
  }

  step(dt) {
    const k = this.keys, dir = (k.has('KeyD') || k.has('ArrowRight') ? 1 : 0) - (k.has('KeyA') || k.has('ArrowLeft') ? 1 : 0);
    if (dir) this.targetX += dir * LATERAL * dt;
    this.targetX = clamp(this.targetX, -5.8, 5.8); this.x += (this.targetX - this.x) * Math.min(1, dt * 8);
    const prev = this.z;
    if (this.phase === 'run') {
      this.z -= SPEED * dt;
      if (!this.battleDone && this.z <= BATTLE_Z) { this.z = BATTLE_Z; this.phase = 'battle'; this.lasers.visible = true; }
      else if (this.battleDone && this.z <= BOSS_Z) { this.z = BOSS_Z; this.phase = 'boss'; ui.boss(1); }
    }
    for (const g of this.gates) if (!g.passed && prev > g.z && this.z <= g.z) this.passGate(g);
    ui.phase(PHASE_LABELS[this.phase]);
    if (this.phase === 'battle') this.stepBattle(dt);
    if (this.phase === 'boss') this.stepBoss(dt);
  }

  animateObstacles(t) {
    const play = this.state === 'play';
    for (const c of this.crushers) for (const [k, p] of c.plates.entries()) {
      const ph = (t / 2.4 + k * 0.5) % 1;
      const s = ph < 0.5 ? 0 : ph < 0.6 ? (ph - 0.5) / 0.1 : ph < 0.8 ? 1 : 1 - (ph - 0.8) / 0.2;
      p.plate.position.y = 4.5 - 4 * s; p.rod.position.set(p.side * 3.5, p.plate.position.y + 2.7, c.z);
      if (s < 0.3) p.hit = false;
      if (play && this.phase === 'run' && s > 0.85 && !p.hit && Math.abs(this.z - c.z) < 1.5 + this.r * 0.6) {
        p.hit = true; const f = this.overlapFrac(p.side);
        if (f > 0.02) this.lose(Math.max(2, Math.ceil(this.count * 0.35 * f)), { x: this.x, y: 0.5, z: c.z });
      }
    }
    for (const s of this.saws) {
      s.m.position.x = Math.sin(t * 1.3 + s.ph) * 5.3; s.m.rotation.x += 0.4; s.cd = Math.max(0, s.cd - 1 / 60);
      const dx = this.x - s.m.position.x, dz = this.z - s.z;
      if (play && this.phase === 'run' && s.cd <= 0 && dx * dx + dz * dz < (1.4 + this.r) ** 2) {
        s.cd = 0.7; this.lose(Math.max(2, Math.ceil(this.count * 0.12)), s.m.position);
      }
    }
  }

  stepBattle(dt) {
    const unit = BATTLE_HP / BATTLE_ENEMIES;
    this.enemyHP -= this.count * 0.6 * dt;
    const alive = Math.max(0, Math.ceil(this.enemyHP / unit));
    const pos = this.laserGeo.attributes.position.array;
    this.enemies.forEach((e, i) => {
      if (e.visible && i >= alive) { e.visible = false; this.sparks.emit(e.position, 40, 0xff5533, 9); }
      if (e.visible) pos.set([e.position.x, e.position.y, e.position.z, this.x + (Math.random() - 0.5) * this.r, 0.6, this.z - this.r * 0.5], i * 6);
      else pos.fill(0, i * 6, i * 6 + 6);
    });
    this.laserGeo.attributes.position.needsUpdate = true;
    this.lossAcc += alive * 1.4 * dt; const k = Math.floor(this.lossAcc);
    if (k > 0) { this.lossAcc -= k; this.lose(k, { x: this.x, y: 0.6, z: this.z - 1 }); }
    if (this.enemyHP <= 0 && this.state === 'play') { this.battleDone = true; this.phase = 'run'; this.lasers.visible = false; }
  }

  stepBoss(dt) {
    this.bossHP -= this.count * 0.8 * dt; this.hitFlash = 1;
    ui.boss(this.bossHP / BOSS_HP);
    if (Math.random() < 0.5) this.sparks.emit({ x: this.x + (Math.random() - 0.5) * this.r * 2, y: 3 + Math.random() * 4, z: BOSS_Z - 18 }, 6, 0xffcc44, 5);
    this.pulseT += dt;
    if (this.pulseT >= PULSE_EVERY) {
      this.pulseT = 0;
      const m = new THREE.Mesh(new THREE.TorusGeometry(1, 0.15, 8, 48), new THREE.MeshBasicMaterial({ color: 0xff6622, transparent: true, blending: THREE.AdditiveBlending }));
      m.rotation.x = Math.PI / 2; m.position.set(0, 0.8, this.reactorPos.z); this.scene.add(m); this.pulseRings.push({ m, t: 0 });
    }
    if (this.bossHP <= 0) {
      this.bossHP = 0; ui.boss(0);
      this.core.visible = false; this.rings.forEach((r) => (r.visible = false));
      for (const c of [0xffaa22, 0xff3300, 0xffffff, 0x22e6ff]) this.sparks.emit({ x: 0, y: 5, z: this.reactorPos.z }, 350, c, 16);
      this.reactorLight.intensity = 0; this.end(true);
    }
  }

  animateReactor(t, dt) {
    this.hitFlash = Math.max(0, this.hitFlash - dt * 4);
    if (this.core.visible) {
      const rage = 1 + (1 - this.bossHP / BOSS_HP) * 2;
      this.coreMat.emissiveIntensity = 2 + Math.sin(t * 4 * rage) * 0.6 + this.hitFlash * 3;
      this.reactorLight.intensity = 180 + Math.sin(t * 5 * rage) * 60 + this.hitFlash * 150;
      this.rings.forEach((r, i) => { r.rotation.z += dt * (1 + i) * rage * (i % 2 ? -1 : 1); r.rotation.x = Math.PI / 2 + Math.sin(t + i) * 0.4; });
    }
    for (const p of this.pulseRings) {
      p.t += dt; const s = 1 + p.t * 22; p.m.scale.setScalar(s); p.m.material.opacity = Math.max(0, 1 - p.t);
      if (!p.done && p.t >= 0.8 && this.state === 'play') { p.done = true; this.lose(Math.max(3, Math.ceil(this.count * PULSE_LOSS)), this.swarmPos()); }
    }
    this.pulseRings = this.pulseRings.filter((p) => p.t < 1 || (this.scene.remove(p.m), false));
  }

  drawSwarm(t, n) {
    const d = this.d;
    for (let i = 0; i < n; i++) {
      const a = i * 2.39996, rad = this.spacing * Math.sqrt(i);
      const x = this.x + Math.cos(a) * rad, z = this.z + Math.sin(a) * rad, y = 0.4 + Math.abs(Math.sin(t * 9 + i * 1.7)) * 0.12;
      d.position.set(x, y, z); d.updateMatrix();
      if (this.robotParts.length) {
        for (const part of this.robotParts) part.mesh.setMatrixAt(i, d.matrix.clone().multiply(part.local));
      } else {
        this.bodies.setMatrixAt(i, d.matrix);
        d.position.set(x, y + 0.08, z - 0.26); d.updateMatrix(); this.eyes.setMatrixAt(i, d.matrix);
      }
    }
    if (this.robotParts.length) {
      for (const part of this.robotParts) { part.mesh.count = n; part.mesh.instanceMatrix.needsUpdate = true; }
    } else {
      this.bodies.count = this.eyes.count = n;
      this.bodies.instanceMatrix.needsUpdate = this.eyes.instanceMatrix.needsUpdate = true;
    }
  }
}

// ===== App bootstrap =====

const world = createWorld();
const game = new Game(world);
ui.onAction(() => game.start());

addEventListener('keydown', (e) => {
  game.keys.add(e.code);
  if ((e.code === 'KeyR' || e.code === 'Space' || e.code === 'Enter') && game.state !== 'play') game.start();
});
addEventListener('keyup', (e) => game.keys.delete(e.code));
addEventListener('pointermove', (e) => { game.targetX = (e.clientX / innerWidth - 0.5) * 2 * 5.8; });
world.renderer.domElement.addEventListener('pointerdown', (e) => game.chooseGateAt(e));

const clock = new THREE.Clock();
world.renderer.setAnimationLoop(() => {
  const dt = Math.min(clock.getDelta(), 0.05);
  game.update(dt);
  world.update(clock.elapsedTime, dt);
  world.renderer.render(world.scene, world.camera);
});
