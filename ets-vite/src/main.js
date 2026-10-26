import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const $ = (id) => document.getElementById(id);
const END = -230,
  STOP = END + 16,
  MAXI = 300,
  SPEED = 7,
  BOSS_HP = 10000;
const BATTLE_START = -132,
  BATTLE_GUARD_Z = -144,
  BATTLE_WALL_Z = -138.5;
const BATTLE_HP = 60,
  BATTLE_SHOT_TIME = 1 / 3.8,
  BATTLE_GUARD_SWAY = 0.48,
  BATTLE_GUARD_RANGE = 2.9;
const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;

let state = 'menu',
  pausedFrom = 'play',
  n = 10,
  fp = 1,
  t = 0,
  sx = 0,
  sz = 0;
let hurtCd = 0,
  shake = 0,
  shotT = 0,
  pulse = 0,
  bossHp = BOSS_HP;
let battleHp = BATTLE_HP,
  battleCooldown = 0,
  battleAttack = 0,
  battleWarnX = 0,
  battleResolved = false,
  battleStrikeResolved = false,
  battleLunge = 0,
  battleFlash = 0;

// Renderer, scene, camera (Materi 4 dan 6)
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
document.body.prepend(renderer.domElement);

const scene = new THREE.Scene();
{
  // Haze atmosferik memberi ruang produksi kedalaman tanpa latar datar.
  const c = document.createElement('canvas');
  c.width = 4;
  c.height = 256;
  const g = c.getContext('2d');
  const gr = g.createLinearGradient(0, 0, 0, 256);
  gr.addColorStop(0, '#101820');
  gr.addColorStop(0.72, '#27343b');
  gr.addColorStop(1, '#6b4a2c');
  g.fillStyle = gr;
  g.fillRect(0, 0, 4, 256);
  const tx = new THREE.CanvasTexture(c);
  tx.colorSpace = THREE.SRGBColorSpace;
  scene.background = tx;
}
scene.fog = new THREE.Fog(0x18232a, 38, 118);
scene.environment = new THREE.PMREMGenerator(renderer).fromScene(
  new RoomEnvironment(),
  0.04,
).texture;

const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 200);
function resize() {
  renderer.setSize(innerWidth, innerHeight);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
}
addEventListener('resize', resize);
resize();

// Lighting dan shadow (Materi 5 dan 6)
scene.add(new THREE.HemisphereLight(0xc9e2ed, 0x30251a, 0.72));
const sun = new THREE.DirectionalLight(0xffe4bf, 2.0);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
Object.assign(sun.shadow.camera, { left: -14, right: 14, top: 14, bottom: -14, near: 1, far: 50 });
scene.add(sun, sun.target);

const metal = new THREE.MeshStandardMaterial({ color: 0x68747a, metalness: 0.82, roughness: 0.32 });
const structure = new THREE.MeshStandardMaterial({
  color: 0x29343a,
  metalness: 0.58,
  roughness: 0.55,
});
const wallMaterial = new THREE.MeshStandardMaterial({
  color: 0x3b4548,
  metalness: 0.28,
  roughness: 0.82,
});
const darkMetal = new THREE.MeshStandardMaterial({
  color: 0x151e23,
  metalness: 0.72,
  roughness: 0.4,
});
const warmLight = new THREE.MeshBasicMaterial({ color: 0xffb85a });
const coolLight = new THREE.MeshBasicMaterial({ color: 0x82d9e5 });

// Lantai baja berpanel dengan tekstur aus yang lembut, bukan grid bercahaya.
function concreteTex() {
  const c = document.createElement('canvas');
  c.width = c.height = 512;
  const g = c.getContext('2d');
  g.fillStyle = '#343d40';
  g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 5200; i++) {
    const v = 36 + Math.random() * 35;
    g.fillStyle = `rgba(${v},${v + 5},${v + 7},${Math.random() * 0.14})`;
    g.fillRect(Math.random() * 512, Math.random() * 512, 1 + Math.random() * 5, 1);
  }
  g.strokeStyle = '#a6ada933';
  g.lineWidth = 2;
  [4, 252, 508].forEach((y) => {
    g.beginPath();
    g.moveTo(0, y);
    g.lineTo(512, y);
    g.stroke();
  });
  g.fillStyle = '#171f2388';
  [12, 500].forEach((y) => g.fillRect(0, y, 512, 5));
  const tx = new THREE.CanvasTexture(c);
  tx.wrapS = tx.wrapT = THREE.RepeatWrapping;
  tx.repeat.set(1, 16);
  tx.colorSpace = THREE.SRGBColorSpace;
  tx.anisotropy = 8;
  return tx;
}
const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(11.4, 250),
  new THREE.MeshStandardMaterial({ map: concreteTex(), roughness: 0.82, metalness: 0.18 }),
);
floor.rotation.x = -Math.PI / 2;
floor.position.set(0, -0.08, -115);
floor.receiveShadow = true;
scene.add(floor);

// Modular runway seams and flush service rails add scale to the floor.
const seam = new THREE.InstancedMesh(new THREE.BoxGeometry(10.8, 0.025, 0.065), darkMetal, 32);
const rail = new THREE.InstancedMesh(new THREE.BoxGeometry(0.075, 0.045, 250), metal, 2);
const dash = new THREE.InstancedMesh(new THREE.BoxGeometry(0.12, 0.035, 250), warmLight, 2);
const dummy = new THREE.Object3D();
for (let i = 0; i < 32; i++) {
  dummy.position.set(0, 0.005, -3 - i * 7.8);
  dummy.updateMatrix();
  seam.setMatrixAt(i, dummy.matrix);
}
for (let i = 0; i < 2; i++) {
  const side = i ? 1 : -1;
  dummy.position.set(side * 3.65, 0.025, -115);
  dummy.updateMatrix();
  rail.setMatrixAt(i, dummy.matrix);
  dummy.position.set(side * 5.15, 0.018, -115);
  dummy.updateMatrix();
  dash.setMatrixAt(i, dummy.matrix);
}
scene.add(seam, rail, dash);

// Enclosed production hall: concrete side walls, overhead trusses and service bays.
[-1, 1].forEach((side) => {
  const wall = new THREE.Mesh(new THREE.BoxGeometry(0.65, 9.4, 250), wallMaterial);
  wall.position.set(side * 6.2, 4.7, -115);
  wall.receiveShadow = true;
  scene.add(wall);
});
const ceiling = new THREE.Mesh(new THREE.BoxGeometry(13.6, 0.42, 250), darkMetal);
ceiling.position.set(0, 9.68, -115);
scene.add(ceiling);
const wallPanels = new THREE.InstancedMesh(new THREE.BoxGeometry(0.28, 7.5, 5.4), wallMaterial, 92);
const pilasters = new THREE.InstancedMesh(new THREE.BoxGeometry(0.38, 8.5, 0.55), darkMetal, 42);
const pilasterCaps = new THREE.InstancedMesh(new THREE.BoxGeometry(0.48, 0.14, 0.7), metal, 42);
const beams = new THREE.InstancedMesh(new THREE.BoxGeometry(13.2, 0.32, 0.42), metal, 16);
const lamps = new THREE.InstancedMesh(new THREE.BoxGeometry(1.15, 0.12, 0.34), coolLight, 24);
const ceilingSeams = new THREE.InstancedMesh(
  new THREE.BoxGeometry(13.4, 0.045, 0.07),
  structure,
  48,
);
for (let i = 0; i < 46; i++) {
  const z = -4 - i * 5.35;
  for (const side of [-1, 1]) {
    dummy.position.set(side * 5.82, 4.1, z);
    dummy.updateMatrix();
    wallPanels.setMatrixAt(i * 2 + (side > 0 ? 1 : 0), dummy.matrix);
  }
}
for (let i = 0; i < 21; i++) {
  const z = -5 - i * 11.7;
  for (const side of [-1, 1]) {
    const index = i * 2 + (side > 0 ? 1 : 0);
    dummy.position.set(side * 5.62, 4.25, z);
    dummy.updateMatrix();
    pilasters.setMatrixAt(index, dummy.matrix);
    dummy.position.set(side * 5.62, 8.45, z);
    dummy.updateMatrix();
    pilasterCaps.setMatrixAt(index, dummy.matrix);
  }
}
for (let i = 0; i < 16; i++) {
  const z = -8 - i * 15.2;
  dummy.position.set(0, 9.15, z);
  dummy.updateMatrix();
  beams.setMatrixAt(i, dummy.matrix);
}
for (let i = 0; i < 48; i++) {
  dummy.position.set(0, 9.46, -2 - i * 5.2);
  dummy.updateMatrix();
  ceilingSeams.setMatrixAt(i, dummy.matrix);
}
for (let i = 0; i < 12; i++) {
  const z = -10 - i * 20;
  for (const side of [-1, 1]) {
    dummy.position.set(side * 4.25, 8.9, z);
    dummy.updateMatrix();
    lamps.setMatrixAt(i * 2 + (side > 0 ? 1 : 0), dummy.matrix);
  }
}
scene.add(wallPanels, pilasters, pilasterCaps, beams, lamps, ceilingSeams);
// Utility runs and warm work lights make the hall read as a working plant.
const conduitGeo = new THREE.CylinderGeometry(0.09, 0.09, 250, 8);
[-1, 1].forEach((side) => {
  const conduit = new THREE.Mesh(conduitGeo, metal);
  conduit.rotation.x = Math.PI / 2;
  conduit.position.set(side * 4.95, 8.55, -115);
  scene.add(conduit);
});
for (let i = 0; i < 6; i++) {
  const workLight = new THREE.PointLight(i % 2 ? 0xffc078 : 0x8bcfe0, 32, 24, 2);
  workLight.position.set(i % 2 ? -2.8 : 2.8, 7.6, -18 - i * 38);
  scene.add(workLight);
}

// Entry bulkhead establishes the foundry identity before the first gate.
const entryFrame = new THREE.Group();
const entryLegs = [-1, 1].map((side) => {
  const leg = new THREE.Mesh(new THREE.BoxGeometry(0.42, 6.5, 0.65), metal);
  leg.position.set(side * 5.35, 3.25, -9);
  return leg;
});
const entryHeader = new THREE.Mesh(new THREE.BoxGeometry(10.9, 0.48, 0.7), darkMetal);
entryHeader.position.set(0, 6.55, -9);
const signCanvas = document.createElement('canvas');
signCanvas.width = 512;
signCanvas.height = 128;
const signCtx = signCanvas.getContext('2d');
signCtx.fillStyle = '#11191d';
signCtx.fillRect(0, 0, 512, 128);
signCtx.fillStyle = '#e8a54e';
signCtx.fillRect(20, 18, 4, 92);
signCtx.fillStyle = '#f1e0bd';
signCtx.font = '700 40px system-ui';
signCtx.letterSpacing = '6px';
signCtx.fillText('CORE FOUNDRY', 48, 62);
signCtx.fillStyle = '#96a7aa';
signCtx.font = '600 17px system-ui';
signCtx.letterSpacing = '4px';
signCtx.fillText('REACTOR PRODUCTION  /  SECTOR 07', 50, 94);
const signTexture = new THREE.CanvasTexture(signCanvas);
signTexture.colorSpace = THREE.SRGBColorSpace;
const sign = new THREE.Mesh(
  new THREE.PlaneGeometry(4.4, 1.1),
  new THREE.MeshBasicMaterial({ map: signTexture }),
);
sign.position.set(0, 6.55, -8.62);
const entryLamp = new THREE.Mesh(new THREE.BoxGeometry(4.5, 0.035, 0.04), warmLight);
entryLamp.position.set(0, 5.96, -8.6);
entryFrame.add(...entryLegs, entryHeader, sign, entryLamp);
scene.add(entryFrame);

// Repeating furnace bays break up the long walls and give the hall a visual destination.
const furnaceFrame = new THREE.MeshStandardMaterial({
  color: 0x343b3d,
  metalness: 0.8,
  roughness: 0.38,
});
const furnaceGlass = new THREE.MeshStandardMaterial({
  color: 0x7c2b12,
  emissive: 0xff541b,
  emissiveIntensity: 1.15,
  roughness: 0.28,
});
const furnaceGrill = new THREE.MeshStandardMaterial({
  color: 0x15191a,
  metalness: 0.86,
  roughness: 0.3,
});
const furnaceLights = [];
for (let i = 0; i < 6; i++) {
  const side = i % 2 ? 1 : -1;
  const z = -30 - i * 34;
  const bay = new THREE.Group();
  const housing = new THREE.Mesh(new THREE.BoxGeometry(0.34, 3.8, 5.7), furnaceFrame);
  housing.position.set(side * 5.69, 4.35, z);
  const glass = new THREE.Mesh(new THREE.BoxGeometry(0.055, 2.55, 3.95), furnaceGlass);
  glass.position.set(side * 5.49, 4.35, z);
  bay.add(housing, glass);
  for (let bar = 0; bar < 9; bar++) {
    const grill = new THREE.Mesh(new THREE.BoxGeometry(0.075, 2.75, 0.105), furnaceGrill);
    grill.position.set(side * 5.44, 4.35, z - 1.85 + bar * 0.46);
    bay.add(grill);
  }
  for (const y of [2.95, 5.75]) {
    const lip = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.12, 4.2), metal);
    lip.position.set(side * 5.42, y, z);
    bay.add(lip);
  }
  const beacon = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.12, 0.5), warmLight);
  beacon.position.set(side * 5.4, 6.05, z - 1.9);
  bay.add(beacon);
  scene.add(bay);
  const furnaceGlow = new THREE.PointLight(0xff642e, 72, 15, 2);
  furnaceGlow.position.set(side * 5.1, 4.1, z);
  scene.add(furnaceGlow);
  furnaceLights.push(furnaceGlow);
}

// Overhead rail crane with suspended carriages creates a stronger industrial silhouette.
const craneRails = new THREE.InstancedMesh(new THREE.BoxGeometry(0.28, 0.3, 250), darkMetal, 2);
for (let i = 0; i < 2; i++) {
  dummy.position.set(i ? 4.55 : -4.55, 7.35, -115);
  dummy.updateMatrix();
  craneRails.setMatrixAt(i, dummy.matrix);
}
const craneBridges = new THREE.InstancedMesh(new THREE.BoxGeometry(9.45, 0.38, 0.65), metal, 3);
for (let i = 0; i < 3; i++) {
  dummy.position.set(0, 7.35, -42 - i * 72);
  dummy.updateMatrix();
  craneBridges.setMatrixAt(i, dummy.matrix);
}
scene.add(craneRails, craneBridges);
[-42, -114, -186].forEach((z) => {
  const trolley = new THREE.Group();
  const carriage = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.48, 1.1), darkMetal);
  carriage.position.y = 6.95;
  const hookCable = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 1.25, 8), metal);
  hookCable.position.y = 6.1;
  const hook = new THREE.Mesh(
    new THREE.TorusGeometry(0.22, 0.055, 8, 18, Math.PI * 1.4),
    new THREE.MeshStandardMaterial({ color: 0xe09a3b, metalness: 0.8, roughness: 0.25 }),
  );
  hook.rotation.z = Math.PI;
  hook.position.y = 5.45;
  const warningLamp = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.08, 0.08), warmLight);
  warningLamp.position.set(0, 6.96, 0.58);
  trolley.add(carriage, hookCable, hook, warningLamp);
  trolley.position.z = z;
  scene.add(trolley);
});

// Fine dust catches the furnace light without obscuring the play space.
const dustGeo = new THREE.BufferGeometry();
const dustPositions = new Float32Array(120 * 3);
for (let i = 0; i < 120; i++) {
  dustPositions[i * 3] = (Math.random() - 0.5) * 9;
  dustPositions[i * 3 + 1] = 0.4 + Math.random() * 6.5;
  dustPositions[i * 3 + 2] = -Math.random() * 235;
}
dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
const dust = new THREE.Points(
  dustGeo,
  new THREE.PointsMaterial({
    color: 0xf2bb79,
    size: 0.045,
    transparent: true,
    opacity: 0.42,
    depthWrite: false,
    sizeAttenuation: true,
  }),
);
scene.add(dust);

// Pooled instanced particles keep hit, pickup and weapon effects inexpensive.
const PARTICLE_COUNT = 280;
const particleMesh = new THREE.InstancedMesh(
  new THREE.OctahedronGeometry(0.055, 0),
  new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.9,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  }),
  PARTICLE_COUNT,
);
particleMesh.frustumCulled = false;
const particlePool = Array.from({ length: PARTICLE_COUNT }, () => ({
  position: new THREE.Vector3(),
  velocity: new THREE.Vector3(),
  color: new THREE.Color(),
  life: 0,
  maxLife: 1,
  size: 0.05,
  gravity: 1.5,
  drag: 0.98,
}));
const particleDummy = new THREE.Object3D();
let particleCursor = 0,
  trailTimer = 0;
function emitParticles(position, color, count = 16, speed = 2.5, lift = 0.25, gravity = 2.2) {
  for (let i = 0; i < count; i++) {
    const index = particleCursor++ % PARTICLE_COUNT;
    const p = particlePool[index];
    p.position.copy(position);
    p.velocity
      .set(Math.random() - 0.5, Math.random() + lift, Math.random() - 0.5)
      .normalize()
      .multiplyScalar(speed * (0.45 + Math.random() * 0.85));
    p.color.setHex(color);
    p.maxLife = p.life = 0.28 + Math.random() * 0.5;
    p.size = 0.025 + Math.random() * 0.06;
    p.gravity = gravity;
    p.drag = 0.965 + Math.random() * 0.025;
    particleMesh.setColorAt(index, p.color);
  }
}
scene.add(particleMesh);

// Swarm: satu InstancedMesh untuk ratusan robot
// Model robot: beberapa bagian digabung jadi satu geometry dengan vertex color,
// sehingga 300 robot tetap digambar dalam satu draw call
function part(geo, x, y, z, hex) {
  geo.translate(x, y, z);
  const c = new THREE.Color(hex),
    arr = new Float32Array(geo.attributes.position.count * 3);
  for (let i = 0; i < arr.length; i += 3) {
    arr[i] = c.r;
    arr[i + 1] = c.g;
    arr[i + 2] = c.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(arr, 3));
  return geo;
}
const robotGeo = mergeGeometries([
  part(new THREE.BoxGeometry(0.14, 0.22, 0.16), -0.12, 0.11, 0, 0x2b3a4a),
  part(new THREE.BoxGeometry(0.14, 0.22, 0.16), 0.12, 0.11, 0, 0x2b3a4a),
  part(new THREE.BoxGeometry(0.5, 0.38, 0.36), 0, 0.4, 0, 0x3fd3f5),
  part(new THREE.BoxGeometry(0.3, 0.12, 0.1), 0, 0.42, -0.2, 0xffb000),
  part(new THREE.BoxGeometry(0.1, 0.3, 0.12), -0.31, 0.4, 0, 0x2b3a4a),
  part(new THREE.BoxGeometry(0.1, 0.3, 0.12), 0.31, 0.4, 0, 0x2b3a4a),
  part(new THREE.BoxGeometry(0.36, 0.26, 0.32), 0, 0.74, 0, 0xcfe9f2),
  part(new THREE.CylinderGeometry(0.02, 0.02, 0.2, 6), 0, 0.98, 0, 0x8899aa),
  part(new THREE.SphereGeometry(0.05, 8, 6), 0, 1.1, 0, 0xffb000),
]);
const bodies = new THREE.InstancedMesh(
  robotGeo,
  new THREE.MeshStandardMaterial({ vertexColors: true, metalness: 0.6, roughness: 0.35 }),
  MAXI,
);

// Muat model dari public sekali, lalu gabungkan geometri agar swarm tetap memakai instancing.
new GLTFLoader().load(
  '/models/mini-robot.glb',
  (gltf) => {
    const root = gltf.scene;
    root.updateMatrixWorld(true);
    const parts = [],
      materials = [];
    root.traverse((node) => {
      if (!node.isMesh || !node.geometry) return;
      const sourceMaterials = Array.isArray(node.material) ? node.material : [node.material];
      const sourceGeometry = node.geometry.clone();
      sourceGeometry.applyMatrix4(node.matrixWorld);
      if (sourceGeometry.groups.length && sourceMaterials.length > 1) {
        sourceGeometry.groups.forEach((group) => {
          const geo = sourceGeometry.clone();
          geo.clearGroups();
          geo.addGroup(
            group.start,
            group.count,
            materials.push(sourceMaterials[group.materialIndex]) - 1,
          );
          parts.push(geo);
        });
      } else {
        const materialIndex = materials.push(sourceMaterials[0]) - 1;
        sourceGeometry.clearGroups();
        sourceGeometry.addGroup(
          0,
          sourceGeometry.index
            ? sourceGeometry.index.count
            : sourceGeometry.attributes.position.count,
          materialIndex,
        );
        parts.push(sourceGeometry);
      }
    });
    if (!parts.length) return;
    const modelGeo = mergeGeometries(parts, true);
    if (!modelGeo) return;
    modelGeo.computeBoundingBox();
    const bounds = modelGeo.boundingBox;
    const scale = 1.2 / Math.max(bounds.max.y - bounds.min.y, 0.001);
    modelGeo.applyMatrix4(
      new THREE.Matrix4().makeTranslation(
        -(bounds.min.x + bounds.max.x) / 2,
        -bounds.min.y,
        -(bounds.min.z + bounds.max.z) / 2,
      ),
    );
    modelGeo.scale(scale, scale, scale);
    bodies.geometry = modelGeo;
    bodies.material = materials;
  },
  undefined,
  (error) => console.warn('Model robot tidak dapat dimuat:', error),
);

// Berapa bagian swarm yang berada di sisi kiri jalur (x < 0)
function leftShare() {
  const k = Math.min(n, MAXI),
    sc = swarmR() / (0.3 * Math.sqrt(k + 0.5));
  let l = 0;
  for (let i = 0; i < k; i++)
    if (sx + Math.cos(i * 2.39996) * 0.3 * Math.sqrt(i + 0.5) * sc < 0) l++;
  return k ? l / k : 0.5;
}

// Notifikasi singkat di tengah layar (elemen #toast di index.html)
const toastEl = $('toast');
function toast(txt, good) {
  toastEl.textContent = txt;
  toastEl.className = '';
  void toastEl.offsetWidth;
  toastEl.className = good ? 'good' : 'bad';
}
const eyes = new THREE.InstancedMesh(
  new THREE.BoxGeometry(0.3, 0.1, 0.1),
  new THREE.MeshStandardMaterial({ color: 0x331100, emissive: 0xff7a1a, emissiveIntensity: 2 }),
  MAXI,
);
bodies.castShadow = true;
bodies.frustumCulled = eyes.frustumCulled = false;
scene.add(bodies, eyes);
const swarmR = () => Math.min(3.4, 0.3 * Math.sqrt(Math.min(n, MAXI) + 0.5));

function updSwarm() {
  const k = Math.min(n, MAXI);
  bodies.count = eyes.count = k;
  const sc = swarmR() / (0.3 * Math.sqrt(k + 0.5));
  for (let i = 0; i < k; i++) {
    const r = 0.3 * Math.sqrt(i + 0.5) * sc,
      a = i * 2.39996;
    const x = sx + Math.cos(a) * r,
      z = sz + Math.sin(a) * r;
    const y = Math.abs(Math.sin(t * 9 + i)) * 0.1;
    dummy.scale.setScalar(0.85);
    dummy.position.set(x, y, z);
    dummy.updateMatrix();
    bodies.setMatrixAt(i, dummy.matrix);
    dummy.position.set(x, y + 0.65, z - 0.15);
    dummy.updateMatrix();
    eyes.setMatrixAt(i, dummy.matrix);
  }
  bodies.instanceMatrix.needsUpdate = eyes.instanceMatrix.needsUpdate = true;
}

// Gate pengali (Group sebagai parent, panel dan label sebagai child)
const OPS = {
  '+': (a, v) => a + v,
  '-': (a, v) => Math.max(0, a - v),
  '\u00d7': (a, v) => a * v,
  '\u00f7': (a, v) => Math.ceil(a / v),
};
function label(txt) {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 128;
  const g = c.getContext('2d');
  g.fillStyle = '#fff';
  g.font = 'bold 96px system-ui';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(txt, 128, 70);
  const tx = new THREE.CanvasTexture(c);
  tx.colorSpace = THREE.SRGBColorSpace;
  return new THREE.Mesh(
    new THREE.PlaneGeometry(3, 1.5),
    new THREE.MeshBasicMaterial({ map: tx, transparent: true }),
  );
}
const gates = [],
  hazards = [],
  pickups = [];
function addGate(z, L, R) {
  const g = new THREE.Group();
  g.position.z = z;
  const panels = []; // [RAYCASTER] simpan panel untuk feedback emissive saat tap
  [L, R].forEach(([op, v], i) => {
    const col = op === '+' || op === '×' ? 0x2bd98a : 0xe84a4a,
      x = i ? 2.5 : -2.5;
    const p = new THREE.Mesh(
      new THREE.BoxGeometry(4.6, 3.4, 0.12),
      new THREE.MeshStandardMaterial({
        color: col,
        transparent: true,
        opacity: 0.22,
        emissive: col,
        emissiveIntensity: 0.18,
        metalness: 0.2,
        roughness: 0.38,
      }),
    );
    p.position.set(x, 1.7, 0);
    panels.push(p); // [RAYCASTER]
    const frameMat = new THREE.MeshStandardMaterial({
      color: 0x718087,
      metalness: 0.82,
      roughness: 0.3,
    });
    const glowMat = new THREE.MeshBasicMaterial({ color: col });
    const posts = [-2.28, 2.28].map((dx) => {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.12, 3.55, 0.2), frameMat);
      post.position.set(x + dx, 1.78, 0.04);
      return post;
    });
    const cap = new THREE.Mesh(new THREE.BoxGeometry(4.75, 0.14, 0.22), frameMat);
    cap.position.set(x, 3.48, 0.04);
    const sill = new THREE.Mesh(new THREE.BoxGeometry(4.75, 0.12, 0.22), frameMat);
    sill.position.set(x, 0.02, 0.04);
    const indicator = new THREE.Mesh(new THREE.BoxGeometry(3.8, 0.035, 0.035), glowMat);
    indicator.position.set(x, 3.39, 0.18);
    const l = label(op + v);
    l.position.set(x, 2.18, 0.13);
    g.add(p, cap, sill, indicator, ...posts, l);
  });
  const bar = new THREE.Mesh(new THREE.BoxGeometry(10, 0.3, 0.3), metal);
  bar.position.y = 3.5;
  g.add(bar);
  // [RAYCASTER] Hitbox invisible agar gate mudah di-tap walau panelnya tipis
  const hitbox = new THREE.Mesh(
    new THREE.PlaneGeometry(9.4, 3.8),
    new THREE.MeshBasicMaterial({ visible: false, depthWrite: false }),
  );
  hitbox.position.set(0, 1.9, 0.3);
  g.add(hitbox);
  scene.add(g);
  gates.push({ z, used: false, sides: [L, R], hitbox, panels }); // [RAYCASTER]
}

// Obstacle: gergaji berputar dan press yang bergeser
// Garis kuning-hitam di lantai menandai zona bahaya
const stripeTex = (() => {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  g.fillStyle = '#ffb000';
  g.fillRect(0, 0, 64, 64);
  g.fillStyle = '#1a1a1a';
  for (let i = -64; i < 128; i += 32) {
    g.beginPath();
    g.moveTo(i, 64);
    g.lineTo(i + 16, 64);
    g.lineTo(i + 80, 0);
    g.lineTo(i + 64, 0);
    g.fill();
  }
  const tx = new THREE.CanvasTexture(c);
  tx.wrapS = tx.wrapT = THREE.RepeatWrapping;
  tx.repeat.set(10, 1);
  tx.colorSpace = THREE.SRGBColorSpace;
  return tx;
})();
const marked = new Set();
function addHaz(o, x, z, hw, anim) {
  o.position.set(x, o.position.y, z);
  scene.add(o);
  hazards.push({ o, z, hw, anim });
  if (!marked.has(z)) {
    marked.add(z);
    const strip = new THREE.Mesh(
      new THREE.PlaneGeometry(10, 1.2),
      new THREE.MeshBasicMaterial({ map: stripeTex }),
    );
    strip.rotation.x = -Math.PI / 2;
    strip.position.set(0, 0.02, z);
    scene.add(strip);
  }
}
function addSaw(x, z) {
  const piv = new THREE.Group();
  piv.position.y = 1.1;
  const disk = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.1, 0.25, 24), metal);
  disk.rotation.x = Math.PI / 2;
  disk.castShadow = true;
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(1.1, 0.08, 8, 32),
    new THREE.MeshStandardMaterial({ color: 0x300000, emissive: 0xff3b2e, emissiveIntensity: 1.5 }),
  );
  piv.add(disk, ring);
  const toothM = new THREE.MeshStandardMaterial({
    color: 0x300000,
    emissive: 0xff3b2e,
    emissiveIntensity: 1.2,
  });
  const toothG = new THREE.BoxGeometry(0.5, 0.22, 0.2);
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const tooth = new THREE.Mesh(toothG, toothM);
    tooth.position.set(Math.cos(a) * 1.2, Math.sin(a) * 1.2, 0);
    tooth.rotation.z = a;
    piv.add(tooth);
  }
  addHaz(piv, x, z, 1.3, (o) => (o.rotation.z = t * 8));
}
function addPress(z) {
  const m = new THREE.Group();
  const housing = new THREE.Mesh(
    new THREE.BoxGeometry(3.1, 1.5, 1.35),
    new THREE.MeshStandardMaterial({ color: 0x626b6e, metalness: 0.72, roughness: 0.37 }),
  );
  housing.position.y = 1.25;
  const crown = new THREE.Mesh(new THREE.BoxGeometry(2.7, 0.42, 1.5), darkMetal);
  crown.position.y = 2.2;
  const ram = new THREE.Mesh(new THREE.CylinderGeometry(0.23, 0.23, 0.78, 12), metal);
  ram.position.set(0, 1.95, 0);
  const platen = new THREE.Mesh(
    new THREE.BoxGeometry(2.65, 0.3, 1.6),
    new THREE.MeshStandardMaterial({ color: 0x879194, metalness: 0.86, roughness: 0.28 }),
  );
  platen.position.y = 0.4;
  const warning = new THREE.Mesh(
    new THREE.BoxGeometry(2.72, 0.12, 1.53),
    new THREE.MeshStandardMaterial({ color: 0xc6903c, metalness: 0.55, roughness: 0.42 }),
  );
  warning.position.y = 2.02;
  const status = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.09, 0.05), warmLight);
  status.position.set(0, 1.25, 0.7);
  m.add(housing, crown, ram, platen, warning, status);
  m.position.y = 0;
  m.traverse((part) => {
    if (part.isMesh) part.castShadow = true;
  });
  addHaz(m, 0, z, 1.5, (o) => (o.position.x = Math.sin(t * 1.6 + z) * 2));
}
function addUpgrade(x, z) {
  const m = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.55),
    new THREE.MeshStandardMaterial({
      color: 0x332200,
      emissive: 0xffb000,
      emissiveIntensity: 1.6,
      metalness: 0.5,
      roughness: 0.3,
    }),
  );
  m.position.set(x, 1.2, z);
  scene.add(m);
  pickups.push({ m, x, z, got: false });
}

// Susunan level: gate, obstacle, upgrade
[
  ['g', -20, ['+', 8], ['-', 5]],
  ['s', -2.5, -34],
  ['s', 2.5, -34],
  ['g', -48, ['\u00d7', 2], ['\u00f7', 2]],
  ['u', -2, -58],
  ['p', -70],
  ['g', -84, ['-', 20], ['\u00d7', 3]],
  ['s', -3, -98],
  ['s', 3, -98],
  ['u', 2, -108],
  ['p', -118],
  ['p', -128],
  ['g', -154, ['+', 30], ['\u00d7', 2]],
  ['s', -2, -164],
  ['s', 2, -164],
  ['u', 0, -172],
  ['g', -180, ['\u00d7', 2], ['+', 50]],
  ['p', -192],
  ['s', 0, -200],
].forEach(([k, a, b, c]) => {
  if (k === 'g') addGate(a, b, c);
  else if (k === 's') addSaw(a, b);
  else if (k === 'u') addUpgrade(a, b);
  else addPress(a);
});

// Reactor boss (scene graph: base, core, ring berputar, light)
const reactor = new THREE.Group();
reactor.position.z = END;
const base = new THREE.Mesh(new THREE.CylinderGeometry(3.4, 4, 1.2, 32), metal);
base.position.y = 0.6;
const core = new THREE.Mesh(
  new THREE.IcosahedronGeometry(2, 1),
  new THREE.MeshStandardMaterial({
    color: 0x331000,
    emissive: 0xff5a1a,
    emissiveIntensity: 2,
    roughness: 0.3,
  }),
);
core.position.y = 4;
const rings = [0, 1].map((i) => {
  const r = new THREE.Mesh(new THREE.TorusGeometry(3 + i * 0.7, 0.12, 12, 48), metal);
  r.position.y = 4;
  return r;
});
const glow = new THREE.PointLight(0xff6a1a, 300, 45, 2);
glow.position.y = 4;
const torso = new THREE.Mesh(new THREE.BoxGeometry(5, 4, 3), metal);
torso.position.set(0, 2.6, -2.2);
const arms = [-1, 1].map((s) => {
  const a = new THREE.Mesh(new THREE.BoxGeometry(1.6, 3.4, 1.8), metal);
  a.position.set(s * 3.8, 3, -1.2);
  return a;
});
reactor.add(base, torso, ...arms, core, ...rings, glow);
reactor.scale.setScalar(1.5);
scene.add(reactor);

// Mini battle robot penjaga di checkpoint tengah lintasan.
const guard = new THREE.Group();
const guardBody = new THREE.Mesh(
  new THREE.BoxGeometry(1.7, 1.8, 1.1),
  new THREE.MeshStandardMaterial({
    color: 0x273a48,
    metalness: 0.72,
    roughness: 0.28,
    emissive: 0x07151c,
  }),
);
guardBody.position.y = 1.55;
const guardHead = new THREE.Mesh(
  new THREE.BoxGeometry(1.1, 0.8, 0.85),
  new THREE.MeshStandardMaterial({ color: 0x536873, metalness: 0.65, roughness: 0.3 }),
);
guardHead.position.set(0, 2.85, -0.05);
const guardEye = new THREE.Mesh(
  new THREE.BoxGeometry(0.72, 0.14, 0.08),
  new THREE.MeshBasicMaterial({ color: 0xff513e }),
);
guardEye.position.set(0, 2.85, 0.42);
const guardArms = [-1, 1].map((side) => {
  const arm = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.55, 0.65), metal);
  arm.position.set(side * 1.15, 1.55, 0);
  return arm;
});
guard.add(guardBody, guardHead, guardEye, ...guardArms);
guard.position.set(0, 0, BATTLE_GUARD_Z);
guard.visible = false;
guard.traverse((part) => {
  if (part.isMesh) part.castShadow = true;
});
scene.add(guard);
// Cover di antara swarm dan penjaga membentuk jalur tembak tengah dan samping.
const battleCover = new THREE.Group();
const coverMetal = new THREE.MeshStandardMaterial({
  color: 0x35434a,
  metalness: 0.78,
  roughness: 0.32,
});
const coverWarning = new THREE.MeshStandardMaterial({
  color: 0xb77c2c,
  emissive: 0x4d2508,
  metalness: 0.55,
  roughness: 0.4,
});
[-1, 1].forEach((side) => {
  const block = new THREE.Mesh(new THREE.BoxGeometry(1.2, 2.6, 0.7), coverMetal);
  block.position.set(side * 1.28, 1.3, BATTLE_WALL_Z);
  block.castShadow = block.receiveShadow = true;
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(1.18, 0.16, 0.72), coverWarning);
  stripe.position.set(side * 1.28, 2.08, BATTLE_WALL_Z);
  battleCover.add(block, stripe);
});
const gapLight = new THREE.Mesh(
  new THREE.BoxGeometry(0.95, 0.055, 0.08),
  new THREE.MeshBasicMaterial({ color: 0x68e4ff }),
);
gapLight.position.set(0, 0.055, BATTLE_WALL_Z + 0.45);
battleCover.add(gapLight);
const sideLaneLights = [-1, 1].map((side) => {
  const lane = new THREE.Mesh(
    new THREE.BoxGeometry(0.75, 0.035, 4.2),
    new THREE.MeshBasicMaterial({ color: 0x68e4ff, transparent: true, opacity: 0.45 }),
  );
  lane.position.set(side * 2.55, 0.025, BATTLE_WALL_Z + 0.3);
  return lane;
});
battleCover.add(...sideLaneLights);
const aimReticle = new THREE.Mesh(
  new THREE.TorusGeometry(0.2, 0.035, 8, 20),
  new THREE.MeshBasicMaterial({ color: 0x68e4ff }),
);
aimReticle.position.set(0, 1, BATTLE_WALL_Z + 0.42);
aimReticle.visible = true;
battleCover.add(aimReticle);
battleCover.visible = false;
scene.add(battleCover);
const leadReticle = new THREE.Mesh(
  new THREE.TorusGeometry(0.28, 0.045, 8, 24),
  new THREE.MeshBasicMaterial({ color: 0xffcf68 }),
);
leadReticle.visible = false;
scene.add(leadReticle);
const fightShotGeo = new THREE.SphereGeometry(0.11, 10, 8);
const fightShotCore = new THREE.MeshBasicMaterial({ color: 0xbafaff });
const fightShotTail = new THREE.MeshBasicMaterial({
  color: 0x24dfff,
  transparent: true,
  opacity: 0.78,
});
const fightShots = Array.from({ length: 18 }, () => {
  const bolt = new THREE.Group();
  const core = new THREE.Mesh(fightShotGeo, fightShotCore);
  const tail = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.07, 0.62, 8), fightShotTail);
  tail.rotation.x = Math.PI / 2;
  tail.position.z = 0.33;
  bolt.add(core, tail);
  bolt.visible = false;
  scene.add(bolt);
  return { m: bolt, p: 1, a: new THREE.Vector3(), blocked: false, targetX: 0 };
});
let fightShotIndex = 0;
function fireBattleShot() {
  const shot = fightShots[fightShotIndex++ % fightShots.length];
  // Peluru melaju lurus dari pusat formasi: posisi pemain menentukan akurasi.
  shot.a.set(sx, 0.8, sz - 0.3);
  shot.p = 0;
  shot.blocked = false;
  shot.targetX = Math.sin((t + BATTLE_SHOT_TIME) * BATTLE_GUARD_SWAY) * BATTLE_GUARD_RANGE;
  shot.m.visible = true;
}

// Peluru dari swarm menuju core
const bulletG = new THREE.SphereGeometry(0.12, 8, 8),
  bulletM = new THREE.MeshBasicMaterial({ color: 0x7ff0ff });
const bullets = Array.from({ length: 40 }, () => {
  const m = new THREE.Mesh(bulletG, bulletM);
  m.visible = false;
  scene.add(m);
  return { m, p: 1, a: new THREE.Vector3() };
});
const coreTarget = new THREE.Vector3(0, 6, END);

// Serangan boss: zona merah berkedip di lantai, lalu kepalan menghantam
const zone = new THREE.Mesh(
  new THREE.PlaneGeometry(1, 1),
  new THREE.MeshBasicMaterial({
    color: 0xff2a2a,
    transparent: true,
    opacity: 0,
    depthWrite: false,
  }),
);
zone.rotation.x = -Math.PI / 2;
zone.position.y = 0.04;
const fist = new THREE.Mesh(
  new THREE.BoxGeometry(3, 2.4, 3),
  new THREE.MeshStandardMaterial({
    color: 0xb23a3a,
    metalness: 0.7,
    roughness: 0.35,
    emissive: 0x551010,
  }),
);
fist.visible = false;
scene.add(zone, fist);
let atk = null,
  atkT = 0;
let bi = 0;
function fire() {
  const b = bullets[bi++ % bullets.length],
    R = swarmR();
  b.a.set(sx + (Math.random() - 0.5) * 2 * R, 0.7, sz);
  b.p = 0;
  b.m.visible = true;
}

// ============================================================
// [RAYCASTER] Interaksi berbasis sinar (memenuhi requirement 6)
//   - Tap gate  : preview operasi + panel menyala + partikel
//   - Tap musuh : tembak saat fase duel (alternatif mobile tanpa SPACE)
//   - Tap lantai: geser swarm horizontal ke titik tap
// ============================================================
const raycaster = new THREE.Raycaster();
const ndc = new THREE.Vector2();
const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const floorHit = new THREE.Vector3();

function setRayFromPointer(e) {
  ndc.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
  raycaster.setFromCamera(ndc, camera);
}

function activeGateHits() {
  const active = gates.filter((g) => !g.used).map((g) => g.hitbox);
  return raycaster.intersectObjects(active, false);
}

function handleTap(e) {
  if (state !== 'play' && state !== 'battle' && state !== 'boss') return;
  setRayFromPointer(e);

  // (1) Tap gate → preview operasi + feedback visual
  if (state === 'play') {
    const hits = activeGateHits();
    if (hits.length) {
      const g = gates.find((x) => x.hitbox === hits[0].object);
      if (g) {
        toast(`Gate ${g.sides[0][0]}${g.sides[0][1]} / ${g.sides[1][0]}${g.sides[1][1]}`, true);
        emitParticles(hits[0].point, 0x68e4ff, 14, 2.0, 0.5, 1.6);
        g.panels.forEach((p) => (p.material.emissiveIntensity = 0.95));
        setTimeout(() => g.panels.forEach((p) => (p.material.emissiveIntensity = 0.18)), 350);
      }
      return;
    }
  }

  // (2) Tap penjaga saat duel → tembak
  if (state === 'battle' && battleCooldown <= 0) {
    const hits = raycaster.intersectObjects(guard.children, true);
    if (hits.length) {
      battleCooldown = 0.28;
      fireBattleShot();
      emitParticles(new THREE.Vector3(sx, 0.8, sz - 0.3), 0x68e4ff, 5, 1.1, 0.1, 0.8);
      return;
    }
  }

  // (3) Tap lantai → geser swarm horizontal
  if (raycaster.ray.intersectPlane(groundPlane, floorHit)) {
    const lim = 4.6 - Math.min(swarmR(), 3.4);
    sx = THREE.MathUtils.clamp(floorHit.x, -lim, lim);
    emitParticles(new THREE.Vector3(sx, 0.15, sz), 0x68e4ff, 8, 1.5, 0.3, 1.2);
  }
}

// Input: keyboard dan drag (mouse atau sentuh)
const keys = {};
let dragX = null;
let tapStart = null; // [RAYCASTER] deteksi tap vs drag
addEventListener('keydown', (e) => {
  if ((e.code === 'KeyP' || e.code === 'Escape') && !e.repeat) {
    e.preventDefault();
    togglePause();
    return;
  }
  keys[e.code] = true;
});
addEventListener('keyup', (e) => (keys[e.code] = false));
renderer.domElement.addEventListener('pointerdown', (e) => {
  dragX = e.clientX;
  tapStart = { x: e.clientX, y: e.clientY, t: performance.now() };
});
addEventListener('pointerup', (e) => {
  dragX = null;
  if (!tapStart) return;
  const dx = e.clientX - tapStart.x;
  const dy = e.clientY - tapStart.y;
  const dur = performance.now() - tapStart.t;
  tapStart = null;
  // Klik/tap cepat (<8 px & <350 ms) → Raycaster; geser → tetap di pointermove
  if (Math.hypot(dx, dy) < 8 && dur < 350) handleTap(e);
});
addEventListener('pointermove', (e) => {
  if (dragX !== null && (state === 'play' || state === 'boss' || state === 'battle')) {
    sx += (e.clientX - dragX) * 0.025;
    dragX = e.clientX;
  }
  // [RAYCASTER] hover cursor sebagai feedback bahwa gate dapat di-tap
  if (state === 'play' && dragX === null) {
    setRayFromPointer(e);
    const overGate = activeGateHits().length > 0;
    document.body.style.cursor = overGate ? 'pointer' : '';
  } else if (state !== 'play') {
    document.body.style.cursor = '';
  }
});

function reset() {
  n = 10;
  fp = 1;
  sx = 0;
  sz = 0;
  hurtCd = 0;
  pulse = 0;
  shotT = 0;
  bossHp = BOSS_HP;
  atk = null;
  atkT = 0;
  zone.material.opacity = 0;
  fist.visible = false;
  battleHp = BATTLE_HP;
  battleCooldown = 0;
  battleAttack = 0;
  battleResolved = false;
  battleStrikeResolved = false;
  battleLunge = 0;
  battleFlash = 0;
  guard.visible = false;
  battleCover.visible = false;
  leadReticle.visible = false;
  gates.forEach((g) => (g.used = false));
  pickups.forEach((p) => {
    p.got = false;
    p.m.visible = true;
  });
  bullets.forEach((b) => (b.m.visible = false));
  fightShots.forEach((shot) => (shot.m.visible = false));
  state = 'play';
  $('msg').style.display = 'none';
  $('bossBox').style.display = 'none';
  $('battleBox').style.display = 'none';
  $('pauseBtn').style.display = 'block';
  $('pauseOverlay').style.display = 'none';
}
function end(win) {
  state = win ? 'win' : 'lose';
  atk = null;
  zone.material.opacity = 0;
  fist.visible = false;
  $('title').textContent = win ? 'Reactor hancur' : 'Swarm habis';
  $('sub').textContent = win
    ? `Pabrik aman. Sisa robot: ${n}.`
    : 'Coba lagi dan pilih gate yang lebih menguntungkan.';
  $('btn').textContent = 'Main lagi';
  $('msg').style.display = 'flex';
  $('pauseBtn').style.display = 'none';
}
$('btn').onclick = reset;

function togglePause() {
  if (state === 'play' || state === 'boss' || state === 'battle') {
    pausedFrom = state;
    state = 'paused';
    $('pauseOverlay').style.display = 'flex';
  } else if (state === 'paused') {
    state = pausedFrom;
    $('pauseOverlay').style.display = 'none';
  }
}
$('pauseBtn').onclick = togglePause;
$('resumeBtn').onclick = togglePause;
$('restartBtn').onclick = reset;
function backToMenu() {
  reset();
  state = 'menu';
  $('pauseOverlay').style.display = 'none';
  $('pauseBtn').style.display = 'none';
  $('bossBox').style.display = 'none';
  $('battleBox').style.display = 'none';
  $('title').textContent = 'Robot Swarm Factory';
  $('sub').textContent =
    'Pimpin swarm robot melewati lini produksi, lalu hancurkan reactor di ujung pabrik. Geser dengan A/D, tombol panah, atau seret jari.';
  $('legend').style.display = 'grid';
  $('btn').textContent = 'Mulai shift';
  $('msg').style.display = 'flex';
}
$('menuBtn').onclick = backToMenu;

const clock = new THREE.Clock();
renderer.setAnimationLoop(() => {
  const dt = state === 'paused' ? 0 : Math.min(clock.getDelta(), 0.05);
  t += dt;
  furnaceLights.forEach((light, i) => {
    light.intensity = 64 + Math.sin(t * 2.1 + i * 1.7) * 7;
  });
  dust.rotation.y = Math.sin(t * 0.08) * 0.015;
  const R = swarmR();

  if (state === 'play' || state === 'boss' || state === 'battle') {
    const lim = 4.6 - Math.min(R, 3.4);
    sx += ((keys.KeyD || keys.ArrowRight ? 1 : 0) - (keys.KeyA || keys.ArrowLeft ? 1 : 0)) * 9 * dt;
    sx = THREE.MathUtils.clamp(sx, -lim, lim);
    hurtCd -= dt;
  }

  hazards.forEach((h) => h.anim(h.o));
  pickups.forEach((p) => {
    p.m.rotation.y += dt * 2;
    p.m.position.y = 1.2 + Math.sin(t * 3 + p.z) * 0.15;
  });
  rings[0].rotation.x = t * 0.8;
  rings[1].rotation.y = t * 1.1;
  core.rotation.y = t * 0.5;

  if (state === 'play') {
    sz -= SPEED * dt;
    trailTimer -= dt;
    if (trailTimer <= 0) {
      trailTimer = 0.09;
      emitParticles(
        new THREE.Vector3(sx + (Math.random() - 0.5) * R, 0.18, sz + 0.35),
        0x79dcff,
        1,
        0.55,
        0.05,
        0.18,
      );
    }
    gates.forEach((g) => {
      if (!g.used && sz < g.z) {
        g.used = true;
        // Robot yang melewati panel kiri dan kanan diproses sendiri-sendiri
        const before = n,
          L = Math.round(before * leftShare()),
          Rr = before - L;
        const [lo, lv] = g.sides[0],
          [ro, rv] = g.sides[1];
        n = Math.min(99999, (L > 0 ? OPS[lo](L, lv) : 0) + (Rr > 0 ? OPS[ro](Rr, rv) : 0));
        toast((n >= before ? '+' : '') + (n - before) + ' robot', n >= before);
        emitParticles(
          new THREE.Vector3(sx, 0.45, g.z),
          n >= before ? 0x68e4aa : 0xff705d,
          22,
          3.1,
          0.55,
          2.6,
        );
      }
    });
    hazards.forEach((h) => {
      if (
        hurtCd <= 0 &&
        Math.abs(sz - h.z) < 1 + R * 0.7 &&
        Math.abs(sx - h.o.position.x) < h.hw + R * 0.7
      ) {
        n = Math.max(0, n - (3 + Math.ceil(n * 0.15)));
        hurtCd = 0.5;
        shake = 0.3;
        emitParticles(new THREE.Vector3(h.o.position.x, 0.5, h.z), 0xff654f, 30, 3.8, 0.5, 3.2);
      }
    });
    pickups.forEach((p) => {
      if (!p.got && Math.abs(sx - p.x) < R + 0.8 && Math.abs(sz - p.z) < 1.5) {
        p.got = true;
        p.m.visible = false;
        fp += 0.5;
        toast('Firepower +0.5', true);
        emitParticles(new THREE.Vector3(p.x, 1.1, p.z), 0xffc45d, 28, 3.2, 0.9, 1.7);
      }
    });
    if (n <= 0) end(false);
    else if (!battleResolved && sz <= BATTLE_START) {
      sz = BATTLE_START;
      state = 'battle';
      battleHp = BATTLE_HP;
      battleAttack = 0;
      battleCooldown = 0;
      battleStrikeResolved = false;
      battleLunge = 0;
      battleFlash = 0;
      guard.visible = true;
      battleCover.visible = true;
      leadReticle.visible = true;
      $('battleBox').style.display = 'block';
      toast('ROBOT PENJAGA!', false);
    } else if (sz <= STOP) {
      state = 'boss';
      $('bossBox').style.display = 'block';
    }
  } else if (state === 'battle') {
    battleCooldown = Math.max(0, battleCooldown - dt);
    battleAttack -= dt;
    battleLunge = Math.max(0, battleLunge - dt);
    battleFlash = Math.max(0, battleFlash - dt);
    guard.position.x = Math.sin(t * BATTLE_GUARD_SWAY) * BATTLE_GUARD_RANGE;
    guard.position.z =
      BATTLE_GUARD_Z + (battleLunge > 0 ? Math.sin((battleLunge / 0.22) * Math.PI) * 1.4 : 0);
    const windup = battleAttack > 0 && battleAttack < 1.8;
    guardArms[0].rotation.x = windup ? -1.15 : 0;
    guardArms[1].rotation.x = windup ? -1.15 : 0;
    guardArms[0].rotation.z = (windup ? -0.25 : 0) - (battleLunge > 0 ? 0.8 : 0);
    guardArms[1].rotation.z = (windup ? 0.25 : 0) + (battleLunge > 0 ? 0.8 : 0);
    guardBody.material.emissive.setHex(battleFlash > 0 ? 0x8b251c : 0x07151c);
    zone.scale.set(2.7, 5.5, 1);
    zone.position.set(battleWarnX, 0.045, sz - 2.5);
    zone.material.opacity = windup ? 0.16 + 0.16 * Math.sin(t * 18) : 0;
    const aimX = Math.abs(sx),
      inGap = aimX < 0.68 || aimX > 1.88;
    const predictedX = Math.sin((t + BATTLE_SHOT_TIME) * BATTLE_GUARD_SWAY) * BATTLE_GUARD_RANGE;
    const aimed = inGap && Math.abs(sx - predictedX) < 0.78;
    aimReticle.position.x = sx;
    aimReticle.material.color.setHex(!inGap ? 0xffa94f : aimed ? 0x68e4ff : 0xffc15a);
    leadReticle.position.set(predictedX, 1.6, guard.position.z + 0.62);
    $('battleAim').textContent = !inGap
      ? 'TERHALANG'
      : aimed
        ? 'BIDIKAN TEPAT'
        : 'GESER UNTUK MEMBIDIK';
    $('battleAim').style.color = !inGap ? '#ffb65e' : aimed ? '#68e4ff' : '#ffc15a';
    if ((keys.Space || keys.Enter) && battleCooldown <= 0) {
      battleCooldown = 0.28;
      fireBattleShot();
      emitParticles(new THREE.Vector3(sx, 0.8, sz - 0.3), 0x68e4ff, 5, 1.1, 0.1, 0.8);
    }
    if (battleAttack <= 0) {
      battleAttack = 3.2;
      battleStrikeResolved = false;
      battleWarnX = THREE.MathUtils.clamp(sx, -2.35, 2.35);
      guardEye.material.color.setHex(0xff513e);
      const lane = Math.abs(battleWarnX) < 0.55 ? 'tengah' : battleWarnX < 0 ? 'kiri' : 'kanan';
      $('battleHint').textContent = `Bidik ${lane} · hindari zona merah`;
    } else if (battleAttack < 0.45 && !battleStrikeResolved) {
      battleStrikeResolved = true;
      battleLunge = 0.22;
      guardEye.material.color.setHex(0xffc15a);
      zone.material.opacity = 0.72;
      emitParticles(new THREE.Vector3(battleWarnX, 0.35, sz - 2), 0xff513e, 14, 2, 0.25, 1.4);
      if (Math.abs(sx - battleWarnX) < 1.25) {
        const loss = Math.max(1, Math.ceil(n * 0.12));
        n = Math.max(0, n - loss);
        shake = 0.55;
        toast(`-${loss} robot`, false);
      } else toast('Menghindar!', true);
    }
    if (battleHp <= 0) {
      battleResolved = true;
      guard.visible = false;
      battleCover.visible = false;
      zone.material.opacity = 0;
      fightShots.forEach((shot) => {
        shot.m.visible = false;
      });
      $('battleBox').style.display = 'none';
      fp += 0.5;
      toast('Penjaga dikalahkan · Firepower +0.5', true);
      emitParticles(new THREE.Vector3(0, 1.5, BATTLE_GUARD_Z), 0xffc15a, 44, 4, 0.8, 2.2);
      state = 'play';
    } else if (n <= 0) end(false);
  } else if (state === 'boss') {
    bossHp -= n * 2.5 * fp * dt;
    shotT -= dt;
    if (shotT <= 0) {
      shotT = 0.07;
      fire();
    }
    atkT += dt;
    if (!atk && atkT > 1.2) {
      const p = [
        [-2.6, 4.6],
        [2.6, 4.6],
        [0, 3.4],
      ][Math.floor(Math.random() * 3)];
      atk = { x: p[0], w: p[1], t: 0, hit: false };
      zone.scale.set(p[1], 8, 1);
      zone.position.set(p[0], 0.04, STOP - 2);
      fist.position.set(p[0], 9, STOP - 2);
      fist.visible = true;
    }
    if (atk) {
      atk.t += dt;
      if (atk.t < 1.1) {
        zone.material.opacity = 0.25 + 0.2 * Math.sin(atk.t * 14);
        fist.position.y = 9 - atk.t * 3;
      } else if (!atk.hit) {
        atk.hit = true;
        fist.position.y = 1.2;
        zone.material.opacity = 0.7;
        shake = 0.8;
        emitParticles(new THREE.Vector3(atk.x, 0.12, STOP - 2), 0xff9b59, 38, 4.2, 0.35, 4.2);
        if (Math.abs(sx - atk.x) < atk.w / 2 + R * 0.5) {
          const loss = 8 + Math.ceil(n * 0.3);
          n = Math.max(0, n - loss);
          toast('-' + loss + ' robot', false);
        } else toast('Berhasil menghindar', true);
      } else if (atk.t > 1.6) {
        zone.material.opacity = 0;
        fist.visible = false;
        atk = null;
        atkT = 0;
      }
    }
    core.material.emissiveIntensity = 0.4 + (2 * Math.max(bossHp, 0)) / BOSS_HP;
    if (bossHp <= 0) end(true);
    else if (n <= 0) end(false);
  }

  if (state !== 'battle' && state !== 'paused') {
    zone.material.opacity = state === 'boss' ? zone.material.opacity : 0;
    leadReticle.visible = false;
  }
  fightShots.forEach((shot) => {
    if (!shot.m.visible) return;
    shot.p += dt * 3.8;
    const wallProgress = (BATTLE_WALL_Z - shot.a.z) / (BATTLE_GUARD_Z - shot.a.z);
    const z = THREE.MathUtils.lerp(shot.a.z, BATTLE_GUARD_Z, shot.p);
    shot.m.position.set(shot.a.x, shot.a.y + Math.sin(shot.p * Math.PI) * 0.08, z);
    if (!shot.blocked && shot.p >= wallProgress) {
      shot.blocked = true;
      if (Math.abs(shot.a.x) > 0.68 && Math.abs(shot.a.x) < 1.88) {
        shot.m.visible = false;
        emitParticles(new THREE.Vector3(shot.a.x, 0.9, BATTLE_WALL_Z), 0xffa94f, 9, 1.8, 0.3, 1.4);
        return;
      }
    }
    if (shot.p >= 1) {
      shot.m.visible = false;
      const hit = Math.abs(shot.a.x - shot.targetX) < 0.78;
      const impact = new THREE.Vector3(shot.a.x, 1.6, guard.position.z + 0.5);
      if (hit) {
        battleHp = Math.max(0, battleHp - (8 + fp * 3));
        battleFlash = 0.16;
        emitParticles(impact, 0xffbd64, 15, 2.8, 0.5, 1.8);
        toast('Tembakan tepat!', true);
      } else emitParticles(impact, 0x68dfff, 7, 1.8, 0.3, 1.4);
    }
  });

  bullets.forEach((b) => {
    if (!b.m.visible) return;
    b.p += dt * 3;
    if (b.p >= 1) {
      b.m.visible = false;
      emitParticles(coreTarget, 0xffad67, 3, 1.35, 0.5, 0.5);
    } else b.m.position.lerpVectors(b.a, coreTarget, b.p);
  });

  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const p = particlePool[i];
    if (p.life > 0) {
      p.life -= dt;
      p.velocity.y -= p.gravity * dt;
      p.velocity.multiplyScalar(Math.pow(p.drag, dt * 60));
      p.position.addScaledVector(p.velocity, dt);
      const fade = Math.max(0, Math.min(1, (p.life / p.maxLife) * 4));
      particleDummy.position.copy(p.position);
      particleDummy.scale.setScalar(p.size * fade);
    } else {
      particleDummy.position.set(0, -1000, 0);
      particleDummy.scale.setScalar(0);
    }
    particleDummy.updateMatrix();
    particleMesh.setMatrixAt(i, particleDummy.matrix);
  }
  particleMesh.instanceMatrix.needsUpdate = true;
  if (particleMesh.instanceColor) particleMesh.instanceColor.needsUpdate = true;

  updSwarm();
  shake = Math.max(0, shake - dt * 2);
  const s = calm ? 0 : shake;
  camera.position.set(
    sx * 0.6 + (Math.random() - 0.5) * s,
    6.5 + (Math.random() - 0.5) * s,
    sz + 11,
  );
  camera.lookAt(sx * 0.6, 1, sz - 8);
  sun.position.set(sx + 6, 14, sz + 6);
  sun.target.position.set(sx, 0, sz - 4);

  $('n').textContent = n;
  $('fp').textContent = fp.toFixed(1);
  $('battleFill').style.width = `${Math.max(0, (battleHp / BATTLE_HP) * 100)}%`;
  const bossValue = Math.max(0, Math.ceil(bossHp));
  $('bossFill').style.width = `${Math.max(0, (bossHp / BOSS_HP) * 100)}%`;
  $('bossHpText').textContent = `${bossValue}/${BOSS_HP} HP`;
  renderer.render(scene, camera);
});
