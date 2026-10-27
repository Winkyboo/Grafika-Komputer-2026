import '../../canvas-fullscreen.js';
import * as THREE from "three";

import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { HDRLoader } from "three/addons/loaders/HDRLoader.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";

import "./style.css";

/* ------------------------------------------------------------------ */
/* Konfigurasi                                                         */
/* ------------------------------------------------------------------ */

// BASE_URL membuat path asset tetap benar saat di-deploy ke subfolder portal.
const BASE = import.meta.env.BASE_URL;
const MODEL_URL = `${BASE}models/model.glb`;
const HDRI_URL = `${BASE}environment/environment.hdr`;
const FIREPLACE_HDRI_URL = `${BASE}environment/fireplace_4k.hdr`;

// Eksperimen 9: ubah ke false untuk melihat raycast tanpa descendant.
const RECURSIVE_RAYCAST = true;

// Tinggi model GLB setelah dinormalisasi (unit world).
const MODEL_TARGET_HEIGHT = 2.4;
const MODEL_POSITION_X = 2.4;

const HOVER_SCALE = 1.06;
const SELECTED_SCALE = 1.12;
const HOVER_GLOW = 0.25;
const SELECTED_GLOW = 0.5;
const SELECTION_SPIN_SPEED = 0.8;

const INITIAL_CAMERA = {
  position: new THREE.Vector3(5, 3.5, 7),
  target: new THREE.Vector3(0, 1, 0),
  fov: 60
};

// Tinggi area pandang OrthographicCamera pada zoom = 1.
const ORTHO_VIEW_HEIGHT = 10;

// Semua angka tampilan studio ada di sini supaya mudah disetel.
const LOOK = {
  exposure: 1.0,
  environmentIntensity: 0.55,
  backgroundBlurriness: 0.06,
  backgroundIntensity: 0.6,
  // Lampu di HDRI bernilai ratusan sampai ribuan; bloom tidak punya batas atas,
  // jadi nilai itu dipotong sebelum masuk ke composer.
  backgroundMaxBrightness: 2.4,
  environmentMaxBrightness: 12,
  bloomStrength: 0.6,
  bloomRadius: 0.55,
  bloomThreshold: 1.0
};

/* ------------------------------------------------------------------ */
/* DOM dan HUD                                                         */
/* ------------------------------------------------------------------ */

const $ = (id) => document.getElementById(id);
const setText = (id, value) => {
  $(id).textContent = value;
};

const viewport = $("viewport");

/* ------------------------------------------------------------------ */
/* Scene, kamera, renderer                                             */
/* ------------------------------------------------------------------ */

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x050816);

const sizes = {
  width: Math.max(viewport.clientWidth, 1),
  height: Math.max(viewport.clientHeight, 1)
};

const perspectiveCamera = new THREE.PerspectiveCamera(
  INITIAL_CAMERA.fov,
  sizes.width / sizes.height,
  0.1,
  100
);
perspectiveCamera.position.copy(INITIAL_CAMERA.position);
scene.add(perspectiveCamera);

const orthographicCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 100);
orthographicCamera.position.copy(INITIAL_CAMERA.position);
scene.add(orthographicCamera);

function updateOrthographicFrustum() {
  const halfHeight = ORTHO_VIEW_HEIGHT / 2;
  const halfWidth = halfHeight * (sizes.width / sizes.height);

  orthographicCamera.left = -halfWidth;
  orthographicCamera.right = halfWidth;
  orthographicCamera.top = halfHeight;
  orthographicCamera.bottom = -halfHeight;
  orthographicCamera.updateProjectionMatrix();
}

updateOrthographicFrustum();

// Kamera yang sedang aktif. Raycaster dan renderer selalu memakai variabel ini.
let camera = perspectiveCamera;

// Antialiasing dilakukan di render target composer (MSAA), bukan di canvas.
const renderer = new THREE.WebGLRenderer({ antialias: false });
renderer.setSize(sizes.width, sizes.height, false);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = LOOK.exposure;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;

// Composer memanggil render() beberapa kali per frame; reset manual agar
// jumlah triangle di HUD mencerminkan satu frame penuh.
renderer.info.autoReset = false;

viewport.prepend(renderer.domElement);

/* ------------------------------------------------------------------ */
/* OrbitControls: batas navigasi dan pergantian kamera                  */
/* ------------------------------------------------------------------ */

let controls = null;

function createControls(activeCamera, target) {
  if (controls) {
    controls.dispose();
  }

  controls = new OrbitControls(activeCamera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.target.copy(target);

  controls.minDistance = 3;
  controls.maxDistance = 25;
  controls.minZoom = 0.5;
  controls.maxZoom = 3;
  controls.maxPolarAngle = Math.PI / 2 - 0.05;

  controls.update();
}

createControls(camera, INITIAL_CAMERA.target);

/* ------------------------------------------------------------------ */
/* Post-processing: RenderPass -> UnrealBloomPass -> OutputPass         */
/* ------------------------------------------------------------------ */

// Tone mapping dan konversi warna dilakukan OutputPass, jadi bloom bekerja
// pada nilai HDR (sebelum tone mapping).
const composer = new EffectComposer(
  renderer,
  new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: 4 })
);
const renderPass = new RenderPass(scene, camera);
const bloomPass = new UnrealBloomPass(
  new THREE.Vector2(1, 1),
  LOOK.bloomStrength,
  LOOK.bloomRadius,
  LOOK.bloomThreshold
);

composer.addPass(renderPass);
composer.addPass(bloomPass);
composer.addPass(new OutputPass());

function setCameraLabel() {
  setText("cameraInfo", camera === perspectiveCamera ? "Perspective" : "Orthographic");
}

function setFovUi(fov) {
  $("fovControl").value = String(fov);
  setText("fovValue", `${Math.round(fov)}°`);
}

function switchCamera() {
  const from = camera;
  const to = from === perspectiveCamera ? orthographicCamera : perspectiveCamera;
  const target = controls.target.clone();

  // Posisi dan target dipertahankan; kontrol lama dibuang agar tidak ada
  // dua OrbitControls yang menangkap event pada canvas yang sama.
  to.position.copy(from.position);

  if (to === orthographicCamera) {
    // Samakan ukuran objek di layar: tinggi pandang perspective pada jarak
    // target diterjemahkan menjadi nilai zoom orthographic.
    const distance = from.position.distanceTo(target);
    const visibleHeight =
      2 * distance * Math.tan(THREE.MathUtils.degToRad(perspectiveCamera.fov / 2));

    to.zoom = THREE.MathUtils.clamp(
      ORTHO_VIEW_HEIGHT / visibleHeight,
      controls.minZoom,
      controls.maxZoom
    );
    to.updateProjectionMatrix();
  }

  camera = to;
  renderPass.camera = camera;
  createControls(camera, target);
  setCameraLabel();
}

function resetCamera() {
  perspectiveCamera.fov = INITIAL_CAMERA.fov;
  perspectiveCamera.zoom = 1;
  perspectiveCamera.position.copy(INITIAL_CAMERA.position);
  perspectiveCamera.updateProjectionMatrix();

  orthographicCamera.zoom = 1;
  orthographicCamera.updateProjectionMatrix();

  camera = perspectiveCamera;
  renderPass.camera = camera;
  createControls(camera, INITIAL_CAMERA.target);

  setCameraLabel();
  setFovUi(INITIAL_CAMERA.fov);
}

/* ------------------------------------------------------------------ */
/* Lighting                                                            */
/* ------------------------------------------------------------------ */

// Environment HDRI sudah memberi cahaya dasar, jadi lampu langsung dibuat tipis.
const ambientLight = new THREE.AmbientLight(0xffffff, 0.12);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xfff0d8, 1.8);
directionalLight.position.set(4, 7, 4);
directionalLight.castShadow = true;

// Frustum shadow bawaan hanya +-5 unit, sedangkan scene ini melebar sampai
// galeri dan tata surya di belakang. Tanpa ini bayangannya terpotong.
directionalLight.shadow.mapSize.set(2048, 2048);
directionalLight.shadow.camera.left = -12;
directionalLight.shadow.camera.right = 12;
directionalLight.shadow.camera.top = 12;
directionalLight.shadow.camera.bottom = -12;
directionalLight.shadow.camera.near = 0.5;
directionalLight.shadow.camera.far = 30;
directionalLight.shadow.bias = -0.0005;
directionalLight.shadow.normalBias = 0.03;

scene.add(directionalLight);

/* ------------------------------------------------------------------ */
/* Environment maps                                                     */
/* ------------------------------------------------------------------ */

const pmremGenerator = new THREE.PMREMGenerator(renderer);

function createProceduralEnvironment(kind) {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 512;

  const context = canvas.getContext("2d");

  if (kind === "gym") {
    const wall = context.createLinearGradient(0, 0, 0, 512);
    wall.addColorStop(0, "#101b30");
    wall.addColorStop(0.42, "#233a54");
    wall.addColorStop(0.62, "#26394b");
    wall.addColorStop(1, "#172536");
    context.fillStyle = wall;
    context.fillRect(0, 0, 1024, 512);

    // Roof trusses and steel beams of an indoor sports hall.
    context.strokeStyle = "rgba(155, 190, 215, 0.28)";
    context.lineWidth = 5;
    for (let x = -256; x <= 1280; x += 128) {
      context.beginPath();
      context.moveTo(x, 0);
      context.lineTo(x + 180, 170);
      context.stroke();
      context.beginPath();
      context.moveTo(x + 180, 170);
      context.lineTo(x + 256, 0);
      context.stroke();
    }
    context.strokeStyle = "rgba(190, 215, 230, 0.25)";
    context.lineWidth = 3;
    [70, 115, 160].forEach(y => {
      context.beginPath();
      context.moveTo(0, y);
      context.lineTo(1024, y);
      context.stroke();
    });

    // Ceiling lamps, repeated around the panorama.
    for (let x = 32; x < 1024; x += 128) {
      const glow = context.createRadialGradient(x, 190, 2, x, 190, 38);
      glow.addColorStop(0, "rgba(255,255,235,0.95)");
      glow.addColorStop(0.18, "rgba(255,245,190,0.55)");
      glow.addColorStop(1, "rgba(255,235,170,0)");
      context.fillStyle = glow;
      context.fillRect(x - 40, 150, 80, 80);
      context.fillStyle = "#fff4c4";
      context.fillRect(x - 12, 184, 24, 7);
    }

    // Bleachers and colored seating tiers.
    context.fillStyle = "#25364a";
    context.fillRect(0, 218, 1024, 105);
    ["#34475b", "#405168", "#8b3447", "#354c65", "#26394d"].forEach((color, index) => {
      context.fillStyle = color;
      context.fillRect(0, 228 + index * 15, 1024, 10);
    });
    context.fillStyle = "#f2b84b";
    context.fillRect(0, 306, 1024, 6);
    context.fillStyle = "#102033";
    context.fillRect(0, 312, 1024, 17);

    // Scoreboard banners around the arena.
    for (let x = 35; x < 1024; x += 256) {
      context.fillStyle = "#102744";
      context.fillRect(x, 260, 150, 33);
      context.strokeStyle = "#5bd9e8";
      context.lineWidth = 2;
      context.strokeRect(x + 1, 261, 148, 31);
      context.fillStyle = "#eaf6ff";
      context.font = "bold 12px Arial";
      context.textAlign = "center";
      context.fillText("GOR  •  BADMINTON  •  BASKET", x + 75, 281);
    }

    // Hardwood sports floor with badminton and basketball court markings.
    const floor = context.createLinearGradient(0, 325, 0, 512);
    floor.addColorStop(0, "#b5814f");
    floor.addColorStop(0.5, "#d3a36b");
    floor.addColorStop(1, "#815339");
    context.fillStyle = floor;
    context.fillRect(0, 329, 1024, 183);
    context.fillStyle = "rgba(20, 35, 48, 0.16)";
    for (let y = 345; y < 512; y += 18) context.fillRect(0, y, 1024, 2);

    context.strokeStyle = "rgba(255,255,245,0.9)";
    context.lineWidth = 3;
    // Perspective court boundaries and badminton court lanes.
    context.beginPath();
    context.moveTo(0, 332);
    context.lineTo(512, 490);
    context.lineTo(1024, 332);
    context.moveTo(150, 332);
    context.lineTo(150, 512);
    context.moveTo(350, 332);
    context.lineTo(350, 512);
    context.moveTo(674, 332);
    context.lineTo(674, 512);
    context.moveTo(874, 332);
    context.lineTo(874, 512);
    context.moveTo(0, 410);
    context.lineTo(1024, 410);
    context.stroke();
    context.strokeStyle = "#e85d45";
    context.lineWidth = 5;
    context.strokeRect(370, 342, 284, 157);
    context.beginPath();
    context.moveTo(512, 342);
    context.lineTo(512, 499);
    context.stroke();

    // A badminton net and basketball hoops make the venue readable at a glance.
    context.strokeStyle = "rgba(245,250,255,0.8)";
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(315, 365);
    context.lineTo(710, 365);
    context.stroke();
    for (const x of [315, 710]) {
      context.beginPath();
      context.moveTo(x, 340);
      context.lineTo(x, 388);
      context.stroke();
    }
    for (const x of [88, 936]) {
      context.strokeStyle = "#e8edf4";
      context.lineWidth = 5;
      context.beginPath();
      context.moveTo(x, 259);
      context.lineTo(x, 310);
      context.lineTo(x + (x < 500 ? 30 : -30), 310);
      context.stroke();
      context.strokeStyle = "#ff745c";
      context.lineWidth = 4;
      context.beginPath();
      context.ellipse(x + (x < 500 ? 34 : -34), 311, 14, 4, 0, 0, Math.PI * 2);
      context.stroke();
    }
  } else {
    // Neutral procedural studio panorama with softboxes and a reflective floor.
    const studio = context.createLinearGradient(0, 0, 0, 512);
    studio.addColorStop(0, "#101827");
    studio.addColorStop(0.45, "#344254");
    studio.addColorStop(0.67, "#202a38");
    studio.addColorStop(1, "#10151d");
    context.fillStyle = studio;
    context.fillRect(0, 0, 1024, 512);

    context.fillStyle = "rgba(190,215,235,0.2)";
    context.fillRect(0, 226, 1024, 3);
    for (const x of [130, 390, 650, 910]) {
      context.save();
      context.translate(x, 130);
      context.rotate(-0.15);
      context.shadowColor = "rgba(210,235,255,0.65)";
      context.shadowBlur = 28;
      context.fillStyle = "rgba(225,239,250,0.85)";
      context.fillRect(-54, -12, 108, 24);
      context.restore();
    }
    const floor = context.createLinearGradient(0, 300, 0, 512);
    floor.addColorStop(0, "#293646");
    floor.addColorStop(1, "#10151d");
    context.fillStyle = floor;
    context.fillRect(0, 230, 1024, 282);
    context.strokeStyle = "rgba(190,215,235,0.13)";
    context.lineWidth = 2;
    for (let x = -400; x <= 1400; x += 100) {
      context.beginPath();
      context.moveTo(512, 230);
      context.lineTo(x, 512);
      context.stroke();
    }
    for (let y = 285; y < 512; y += 42) {
      context.beginPath();
      context.moveTo(0, y);
      context.lineTo(1024, y);
      context.stroke();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.mapping = THREE.EquirectangularReflectionMapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

const proceduralStudio = createProceduralEnvironment("studio");

// RoomEnvironment is also a fallback if the external studio HDRI is unavailable.
let environmentMap = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
const environmentPresets = {
  studio: {
    label: "Studio Small 09 (HDR)",
    background: proceduralStudio,
    environment: environmentMap
  },
  procedural: {
    label: "Procedural Studio",
    background: proceduralStudio,
    environment: proceduralStudio
  },
  fireplace: {
    label: "Fireplace HDRI",
    background: proceduralStudio,
    environment: environmentMap
  }
};

let activeEnvironment = "studio";

let environmentOn = true;

scene.environmentIntensity = LOOK.environmentIntensity;
scene.backgroundBlurriness = LOOK.backgroundBlurriness;
scene.backgroundIntensity = LOOK.backgroundIntensity;

function applyEnvironment() {
  const preset = environmentPresets[activeEnvironment];
  scene.background = preset.background;
  scene.environment = environmentOn ? preset.environment : null;
  setText("environmentInfo", `${preset.label} · ${environmentOn ? "ON" : "OFF"}`);
  $("environmentPreset").value = activeEnvironment;
  $("environmentButton").classList.toggle("active-control", environmentOn);
}

function setEnvironmentPreset(name) {
  if (!environmentPresets[name]) return;
  activeEnvironment = name;
  applyEnvironment();
}

function toggleEnvironment() {
  environmentOn = !environmentOn;
  applyEnvironment();
}

// Salinan HDRI dengan kecerahan dibatasi (half-float positif berurutan sama
// dengan urutan bit-nya, jadi cukup dibandingkan sebagai integer).
function limitHdrBrightness(texture, maxValue) {
  const { data, width, height } = texture.image;

  if (!(data instanceof Uint16Array)) {
    return texture;
  }

  const limit = THREE.DataUtils.toHalfFloat(maxValue);
  const limited = new Uint16Array(data);

  for (let i = 0; i < limited.length; i += 4) {
    for (let channel = 0; channel < 3; channel += 1) {
      if (limited[i + channel] < 0x8000 && limited[i + channel] > limit) {
        limited[i + channel] = limit;
      }
    }
  }

  const copy = texture.clone();

  copy.source = new THREE.TextureSource({ data: limited, width, height });
  copy.needsUpdate = true;

  return copy;
}

new HDRLoader().load(
  HDRI_URL,

  hdri => {
    hdri.mapping = THREE.EquirectangularReflectionMapping;

    environmentMap = limitHdrBrightness(hdri, LOOK.environmentMaxBrightness);
    environmentPresets.studio.environment = environmentMap;
    environmentPresets.studio.background = limitHdrBrightness(
      hdri,
      LOOK.backgroundMaxBrightness
    );

    if (activeEnvironment === "studio") applyEnvironment();
  },

  undefined,

  error => {
    console.warn(
      "HDRI gagal dimuat, memakai RoomEnvironment. Periksa public/environment/environment.hdr",
      error
    );
  }
);

new HDRLoader().load(
  FIREPLACE_HDRI_URL,
  hdri => {
    hdri.mapping = THREE.EquirectangularReflectionMapping;
    environmentPresets.fireplace.background = limitHdrBrightness(
      hdri,
      LOOK.backgroundMaxBrightness
    );
    environmentPresets.fireplace.environment = limitHdrBrightness(
      hdri,
      LOOK.environmentMaxBrightness
    );

    if (activeEnvironment === "fireplace") applyEnvironment();
  },
  undefined,
  error => {
    console.warn(
      "Fireplace HDRI gagal dimuat. Periksa public/environment/fireplace_4k.hdr",
      error
    );
  }
);

/* ------------------------------------------------------------------ */
/* Helper material dan state interaksi                                  */
/* ------------------------------------------------------------------ */

function standardMaterial(color, roughness, metalness, extra = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness,
    metalness,
    ...extra
  });
}

const interactiveObjects = [];

let hoveredObject = null;
let selectedObject = null;

function registerSelectable(object, label) {
  object.userData.selectable = true;
  object.userData.label = label;
  object.userData.baseScale = object.scale.clone();

  interactiveObjects.push(object);
}

// Raycast mengenai child Mesh; fungsi ini naik ke root yang ditandai selectable.
function findSelectableRoot(object) {
  let current = object;

  while (current) {
    if (current.userData.selectable) {
      return current;
    }

    current = current.parent;
  }

  return null;
}

// Mesh milik satu selectable root, tanpa mesh milik root selectable lain
// di dalamnya (misalnya Moon di dalam Earth).
function forEachOwnMesh(root, callback) {
  root.traverse(node => {
    if (node.isMesh && findSelectableRoot(node) === root) {
      callback(node);
    }
  });
}

const baseEmissive = new WeakMap();
const highlightColor = new THREE.Color(0x38bdf8);
const highlightOffset = new THREE.Color();

// Emissive = warna emissive asli + highlight. Strength 0 selalu mengembalikan
// tampilan asli material. Dibagi emissiveIntensity agar kekuatan highlight
// sama untuk material redup maupun terang (Sun, bulb).
function setGlow(root, strength) {
  forEachOwnMesh(root, mesh => {
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];

    for (const material of materials) {
      if (!material.emissive) {
        continue;
      }

      if (!baseEmissive.has(material)) {
        baseEmissive.set(material, material.emissive.clone());
      }

      highlightOffset
        .copy(highlightColor)
        .multiplyScalar(strength / Math.max(material.emissiveIntensity, 1));

      material.emissive.copy(baseEmissive.get(material)).add(highlightOffset);
    }
  });
}

function applyVisualState(object) {
  if (!object || !object.userData.baseScale) {
    return;
  }

  const isSelected = object === selectedObject;
  const isHovered = object === hoveredObject;

  let scaleFactor = 1;
  let glow = 0;

  if (isSelected) {
    scaleFactor = SELECTED_SCALE;
    glow = SELECTED_GLOW;
  } else if (isHovered) {
    scaleFactor = HOVER_SCALE;
    glow = HOVER_GLOW;
  }

  object.scale.copy(object.userData.baseScale).multiplyScalar(scaleFactor);
  setGlow(object, glow);
}

/* ------------------------------------------------------------------ */
/* Ground: panggung bundar                                             */
/* ------------------------------------------------------------------ */

const groundGeometry = new THREE.CircleGeometry(10, 128);
groundGeometry.rotateX(-Math.PI / 2);

// Specular dibuat rendah: tanpa itu pantulan lampu studio pada sudut landai
// membuat seluruh lantai putih.
const ground = new THREE.Mesh(
  groundGeometry,
  new THREE.MeshPhysicalMaterial({
    color: 0x233349,
    roughness: 0.85,
    metalness: 0,
    specularIntensity: 0.12
  })
);
ground.name = "Ground";
ground.receiveShadow = true;
scene.add(ground);

/* ------------------------------------------------------------------ */
/* Scene graph: Group, parent-child, local vs world                     */
/* ------------------------------------------------------------------ */

const hierarchyGroup = new THREE.Group();
hierarchyGroup.name = "Hierarchy Demo";
hierarchyGroup.position.x = -2.5;
hierarchyGroup.rotation.y = Math.PI / 6;
scene.add(hierarchyGroup);

const pillar = new THREE.Mesh(
  new THREE.CylinderGeometry(0.15, 0.15, 0.5, 24),
  standardMaterial(0x94a3b8, 0.4, 0.8)
);
pillar.name = "Pillar";
pillar.position.y = 0.25;
pillar.castShadow = true;
hierarchyGroup.add(pillar);

const body = new THREE.Mesh(
  new THREE.BoxGeometry(1.6, 0.6, 1.0),
  standardMaterial(0x0ea5e9, 0.45, 0.15)
);
body.name = "Body";
body.position.y = 0.8;
body.castShadow = true;
hierarchyGroup.add(body);

// Bohlam di atas body: emissive + PointLight sebagai child group, sehingga
// cahayanya ikut bergerak bersama hierarchy.
const marker = new THREE.Mesh(
  new THREE.SphereGeometry(0.18, 24, 16),
  standardMaterial(0xffd166, 0.35, 0.1, {
    emissive: 0xffd166,
    emissiveIntensity: 2.6
  })
);
marker.name = "Marker";
marker.position.y = 1.28;
marker.castShadow = true;
marker.add(new THREE.PointLight(0xffd27a, 2.2, 6, 2));
hierarchyGroup.add(marker);

// Child dari body: transform world-nya adalah hasil komposisi
// group -> body -> child.
const child = new THREE.Mesh(
  new THREE.BoxGeometry(0.45, 0.45, 0.45),
  standardMaterial(0xf59e0b, 0.3, 0.1)
);
child.name = "Child Object";
child.position.set(1.0, 0, 0);
child.rotation.z = Math.PI / 4;
child.castShadow = true;
body.add(child);

registerSelectable(hierarchyGroup, "Hierarchy Group");

const worldPosition = new THREE.Vector3();

function logChildTransforms() {
  child.getWorldPosition(worldPosition);

  console.log("Child local:", child.position.clone());
  console.log("Child world:", worldPosition.clone());
}

logChildTransforms();

/* ------------------------------------------------------------------ */
/* PBR: sphere utama dan Material Gallery                               */
/* ------------------------------------------------------------------ */

const pbrMaterial = standardMaterial(0x22c55e, 0.25, 0.1);

const pbrSphere = new THREE.Mesh(new THREE.SphereGeometry(0.7, 48, 24), pbrMaterial);
pbrSphere.name = "PBR Sphere";
pbrSphere.position.set(0, 0.8, 0);
pbrSphere.castShadow = true;
scene.add(pbrSphere);

registerSelectable(pbrSphere, "PBR Sphere");

// Kolom: roughness naik ke kanan. Baris: metalness naik ke arah kamera.
const galleryRoughness = [0.1, 0.5, 0.9];
const galleryMetalness = [0, 0.5, 1];
const galleryGeometry = new THREE.SphereGeometry(0.4, 32, 16);

galleryMetalness.forEach((metalness, row) => {
  galleryRoughness.forEach((roughness, column) => {
    const sphere = new THREE.Mesh(
      galleryGeometry,
      standardMaterial(0xe2b259, roughness, metalness)
    );

    const label = `Gallery R${roughness} M${metalness}`;

    sphere.name = label;
    sphere.position.set(3.3 + column * 1.2, 0.4, -5.6 + row * 1.2);
    sphere.castShadow = true;
    sphere.receiveShadow = true;
    scene.add(sphere);

    registerSelectable(sphere, label);
  });
});

/* ------------------------------------------------------------------ */
/* Hierarchical Solar System                                            */
/* ------------------------------------------------------------------ */

// Sun -> Earth Orbit -> Earth -> Moon Orbit -> Moon.
// Setiap orbit adalah Group yang berputar di pusat induknya, jadi tidak ada
// posisi world yang dihitung manual.
const sun = new THREE.Mesh(
  new THREE.SphereGeometry(0.5, 32, 16),
  standardMaterial(0xfbbf24, 0.5, 0.0, {
    emissive: 0xffa21f,
    emissiveIntensity: 3.2
  })
);
sun.name = "Sun";
sun.position.set(-4.5, 1.6, -5);

// Sun tidak boleh menghalangi cahayanya sendiri, jadi tidak cast/receive shadow.
sun.castShadow = false;
sun.receiveShadow = false;

const sunLight = new THREE.PointLight(0xffb347, 9, 14, 2);
sunLight.castShadow = true;
sunLight.shadow.mapSize.set(1024, 1024);
sunLight.shadow.bias = -0.002;
sun.add(sunLight);

scene.add(sun);

const earthOrbit = new THREE.Group();
earthOrbit.name = "Earth Orbit";
sun.add(earthOrbit);

const earth = new THREE.Mesh(
  new THREE.SphereGeometry(0.2, 24, 16),
  standardMaterial(0x3b82f6, 0.5, 0.05)
);
earth.name = "Earth";
earth.position.x = 1.7;
earth.castShadow = true;
earthOrbit.add(earth);

const moonOrbit = new THREE.Group();
moonOrbit.name = "Moon Orbit";
earth.add(moonOrbit);

const moon = new THREE.Mesh(
  new THREE.SphereGeometry(0.07, 16, 12),
  standardMaterial(0xcbd5e1, 0.9, 0.0)
);
moon.name = "Moon";
moon.position.x = 0.45;
moon.castShadow = true;
moonOrbit.add(moon);

registerSelectable(sun, "Sun");
registerSelectable(earth, "Earth");
registerSelectable(moon, "Moon");

/* ------------------------------------------------------------------ */
/* GLB: shadow, hierarchy, fit ke ground                                */
/* ------------------------------------------------------------------ */

const loader = new GLTFLoader();

let importedModel = null;

function prepareImportedModel(model) {
  model.traverse(node => {
    if (!node.isMesh) {
      return;
    }

    node.castShadow = true;
    node.receiveShadow = true;

    // Asset GLB sering berbagi satu material antar mesh. Dikloning agar
    // efek glow hover/select tidak mengubah material asli secara destruktif.
    node.material = Array.isArray(node.material)
      ? node.material.map(material => material.clone())
      : node.material.clone();
  });
}

function fitModelToGround(model) {
  const size = new THREE.Box3().setFromObject(model).getSize(new THREE.Vector3());

  if (size.y > 0) {
    model.scale.setScalar(MODEL_TARGET_HEIGHT / size.y);
  }

  model.position.set(MODEL_POSITION_X, 0, 0);
  model.rotation.y = 0.35;
  model.updateMatrixWorld(true);

  const fitted = new THREE.Box3().setFromObject(model);

  model.position.y -= fitted.min.y;
}

function inspectModelHierarchy(root) {
  const meshes = [];
  let objectCount = 0;
  let maxDepth = 0;

  root.traverse(node => {
    objectCount += 1;

    if (node.isMesh) {
      meshes.push(node.name || node.type);
    }

    let depth = 0;
    let current = node;

    while (current && current !== root) {
      depth += 1;
      current = current.parent;
    }

    maxDepth = Math.max(maxDepth, depth);
  });

  console.groupCollapsed("GLB hierarchy");
  console.log("Root:", root.name);
  console.log("Jumlah object:", objectCount);
  console.log("Jumlah mesh:", meshes.length, meshes.slice(0, 8));
  console.log("Kedalaman hierarchy:", maxDepth, maxDepth > 1 ? "(bertingkat)" : "(datar)");
  console.groupEnd();
}

/* ------------------------------------------------------------------ */
/* Animation: AnimationMixer, banyak clip, crossfade                    */
/* ------------------------------------------------------------------ */

let mixer = null;
let activeAction = null;
let baseActionName = null;

const actions = new Map();

function findClipName(keywords) {
  const names = [...actions.keys()];

  for (const keyword of keywords) {
    const match = names.find(name => name.toLowerCase().includes(keyword));

    if (match) {
      return match;
    }
  }

  return null;
}

function updateClipButtons() {
  document.querySelectorAll("[data-clip]").forEach(button => {
    const name = findClipName([button.dataset.clip]);

    button.classList.toggle(
      "active-control",
      Boolean(name) && actions.get(name) === activeAction
    );
  });
}

// once = true: gerakan sekali jalan, lalu kembali ke loop terakhir.
function fadeToAction(name, duration = 0.4, once = false) {
  const next = actions.get(name);

  if (!next) {
    return;
  }

  if (next === activeAction && !once) {
    return;
  }

  const previous = activeAction;

  if (previous && previous !== next) {
    previous.fadeOut(duration);
  }

  next.reset();
  next.enabled = true;
  next.setEffectiveTimeScale(1);
  next.setEffectiveWeight(1);
  next.setLoop(once ? THREE.LoopOnce : THREE.LoopRepeat, once ? 1 : Infinity);
  next.clampWhenFinished = once;
  next.fadeIn(duration).play();

  activeAction = next;
  setText("animationInfo", name);

  if (!once) {
    baseActionName = name;
  }

  updateClipButtons();
}

function playLoopClip(keyword, fallbackIndex) {
  if (!mixer) {
    return;
  }

  const name = findClipName([keyword]) ?? [...actions.keys()][fallbackIndex];

  if (name) {
    fadeToAction(name, 0.4);
  }
}

function playClickAnimation() {
  if (!mixer) {
    return;
  }

  const name = findClipName(["wave", "thumbsup", "jump", "yes"]);

  if (name) {
    fadeToAction(name, 0.2, true);
  }
}

function setupAnimations(gltf) {
  console.groupCollapsed("GLB animation clips");
  console.log("Jumlah clip:", gltf.animations.length);
  console.log("Nama clip:", gltf.animations.map(clip => clip.name));
  console.groupEnd();

  if (gltf.animations.length === 0) {
    setText("animationInfo", "no clip");
    return;
  }

  mixer = new THREE.AnimationMixer(importedModel);

  gltf.animations.forEach((clip, index) => {
    actions.set(clip.name || `Clip ${index}`, mixer.clipAction(clip));
  });

  // Hanya aksi yang masih aktif yang boleh memicu kembali ke loop dasar;
  // aksi yang sudah di-fade out tidak ikut.
  mixer.addEventListener("finished", event => {
    if (event.action === activeAction && baseActionName) {
      fadeToAction(baseActionName, 0.4);
    }
  });

  fadeToAction(findClipName(["idle"]) ?? [...actions.keys()][0], 0);
}

/* ------------------------------------------------------------------ */
/* Memuat GLB (asynchronous)                                            */
/* ------------------------------------------------------------------ */

function setLoadState(message, done = false) {
  setText("loadingInfo", message);
  setText("loadingOverlay", done ? "" : "Memuat model GLB…");
  $("loadingOverlay").classList.toggle("hidden", done);
}

setLoadState("loading model...");

loader.load(
  MODEL_URL,

  gltf => {
    importedModel = gltf.scene;
    importedModel.name = "Imported GLB";

    prepareImportedModel(importedModel);
    fitModelToGround(importedModel);
    scene.add(importedModel);

    // Didaftarkan setelah scale final agar baseScale sudah benar.
    registerSelectable(importedModel, "Imported GLB");

    inspectModelHierarchy(importedModel);
    setupAnimations(gltf);

    setLoadState("model loaded", true);
  },

  progress => {
    if (progress.total > 0) {
      const percent = (progress.loaded / progress.total) * 100;

      setText("loadingInfo", `${percent.toFixed(0)}%`);
    }
  },

  error => {
    console.error("GLTF loading error:", error);
    console.warn("Pastikan file ada di public/models/model.glb");

    setText("loadingInfo", "load failed");
    setText("loadingOverlay", "Model GLB gagal dimuat. Periksa public/models/model.glb.");
  }
);

/* ------------------------------------------------------------------ */
/* Raycasting, hover, click, selection                                  */
/* ------------------------------------------------------------------ */

const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

function updatePointer(event) {
  const rect = renderer.domElement.getBoundingClientRect();

  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
}

function pickSelectable(event) {
  updatePointer(event);
  raycaster.setFromCamera(pointer, camera);

  const hits = raycaster.intersectObjects(interactiveObjects, RECURSIVE_RAYCAST);

  for (const hit of hits) {
    const root = findSelectableRoot(hit.object);

    if (root) {
      return { root, hit };
    }
  }

  return { root: null, hit: null };
}

function setHovered(next) {
  if (next === hoveredObject) {
    return;
  }

  const previous = hoveredObject;

  hoveredObject = next;

  applyVisualState(previous);
  applyVisualState(next);

  setText("hoverInfo", next ? next.userData.label : "-");

  // String kosong mengembalikan cursor ke aturan CSS (grab).
  renderer.domElement.style.cursor = next ? "pointer" : "";
}

let selectedMaterialLabel = "-";

function describeMaterials(root) {
  const types = new Set();
  let meshCount = 0;

  forEachOwnMesh(root, mesh => {
    meshCount += 1;

    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];

    materials.forEach(material => types.add(material.type));
  });

  if (types.size === 0) {
    return "-";
  }

  const suffix = root.isMesh ? "" : ` (${meshCount} mesh)`;

  return `${[...types].join(", ")}${suffix}`;
}

const infoWorldPosition = new THREE.Vector3();

function formatVector(x, y, z) {
  return `${x.toFixed(2)}, ${y.toFixed(2)}, ${z.toFixed(2)}`;
}

// Panel informasi object terpilih.
function updateSelectionPanel() {
  if (!selectedObject) {
    setText("selectionTitle", "Belum ada objek dipilih");
    setText("selectionPosition", "-");
    setText("selectionRotation", "-");
    setText("selectionScale", "-");
    setText("selectionMaterial", "-");
    return;
  }

  const { rotation } = selectedObject;
  const baseScale = selectedObject.userData.baseScale;

  selectedObject.getWorldPosition(infoWorldPosition);

  setText("selectionTitle", selectedObject.userData.label);
  setText(
    "selectionPosition",
    formatVector(infoWorldPosition.x, infoWorldPosition.y, infoWorldPosition.z)
  );
  setText(
    "selectionRotation",
    `${formatVector(
      THREE.MathUtils.radToDeg(rotation.x),
      THREE.MathUtils.radToDeg(rotation.y),
      THREE.MathUtils.radToDeg(rotation.z)
    )} deg`
  );
  setText("selectionScale", formatVector(baseScale.x, baseScale.y, baseScale.z));
  setText("selectionMaterial", selectedMaterialLabel);
}

function setSelected(next) {
  const previous = selectedObject;

  selectedObject = next;

  applyVisualState(previous);
  applyVisualState(next);

  setText("selectedInfo", next ? next.userData.label : "-");
  selectedMaterialLabel = next ? describeMaterials(next) : "-";

  if (next === hierarchyGroup) {
    logChildTransforms();
  }

  updateSelectionPanel();
}

/* Membedakan click dan drag.
   Drag untuk orbit/pan juga memicu event click; selection hanya boleh
   berjalan untuk klik tanpa drag. Listener gerakan dipasang pada window
   dengan capture karena OrbitControls menangkap pointer. */

let selectionGesture = null;
let suppressSelection = false;

renderer.domElement.addEventListener("pointerdown", event => {
  suppressSelection = event.button !== 0 || selectionGesture !== null;
  selectionGesture = { id: event.pointerId, x: event.clientX, y: event.clientY };
});

window.addEventListener(
  "pointermove",
  event => {
    if (!selectionGesture || event.pointerId !== selectionGesture.id) {
      return;
    }

    if (
      Math.hypot(
        event.clientX - selectionGesture.x,
        event.clientY - selectionGesture.y
      ) > 5
    ) {
      suppressSelection = true;
    }
  },
  true
);

window.addEventListener("pointerup", event => {
  if (event.pointerId === selectionGesture?.id) {
    selectionGesture = null;
  }
});

window.addEventListener("pointercancel", () => {
  selectionGesture = null;
  suppressSelection = true;
});

renderer.domElement.addEventListener("pointermove", event => {
  if (selectionGesture) {
    return;
  }

  setHovered(pickSelectable(event).root);
});

renderer.domElement.addEventListener("pointerleave", () => {
  if (!selectionGesture) {
    setHovered(null);
  }
});

renderer.domElement.addEventListener("click", event => {
  if (suppressSelection || event.button !== 0) {
    return;
  }

  const { root, hit } = pickSelectable(event);

  if (hit) {
    console.log("Ray hit:", hit.object.name || hit.object.type, "->", root.userData.label);
  }

  setSelected(root);

  // Klik pada model GLB menjalankan gerakan sekali jalan.
  if (root && root === importedModel) {
    playClickAnimation();
  }
});

/* ------------------------------------------------------------------ */
/* Kontrol panel dan keyboard                                           */
/* ------------------------------------------------------------------ */

function toggleBloom() {
  bloomPass.enabled = !bloomPass.enabled;

  setText("bloomInfo", bloomPass.enabled ? "ON" : "OFF");
  $("bloomButton").classList.toggle("active-control", bloomPass.enabled);
}

function bindSlider(id, outputId, format, onChange) {
  $(id).addEventListener("input", event => {
    const value = Number(event.target.value);

    onChange(value);
    setText(outputId, format(value));
  });
}

bindSlider("fovControl", "fovValue", value => `${Math.round(value)}°`, value => {
  perspectiveCamera.fov = value;
  perspectiveCamera.updateProjectionMatrix();
});

bindSlider("roughnessControl", "roughnessValue", value => value.toFixed(2), value => {
  pbrMaterial.roughness = value;
});

bindSlider("metalnessControl", "metalnessValue", value => value.toFixed(2), value => {
  pbrMaterial.metalness = value;
});

bindSlider("environmentControl", "environmentValue", value => value.toFixed(2), value => {
  scene.environmentIntensity = value;
});

$("environmentPreset").addEventListener("change", event => {
  setEnvironmentPreset(event.target.value);
});

bindSlider("bloomControl", "bloomValue", value => value.toFixed(2), value => {
  bloomPass.strength = value;
});

$("cameraButton").addEventListener("click", switchCamera);
$("resetButton").addEventListener("click", resetCamera);
$("environmentButton").addEventListener("click", toggleEnvironment);
$("bloomButton").addEventListener("click", toggleBloom);

document.querySelectorAll("[data-clip]").forEach(button => {
  button.addEventListener("click", () => {
    playLoopClip(button.dataset.clip, Number(button.dataset.fallback));
  });
});

window.addEventListener("keydown", event => {
  if (event.repeat || event.ctrlKey || event.metaKey || event.altKey) {
    return;
  }

  // Slider dan menu memakai keyboard sendiri.
  if (
    event.target instanceof HTMLInputElement ||
    event.target instanceof HTMLSelectElement ||
    event.target instanceof HTMLTextAreaElement
  ) {
    return;
  }

  switch (event.code) {
    case "Digit1":
      playLoopClip("idle", 0);
      break;

    case "Digit2":
      playLoopClip("walk", 1);
      break;

    case "Digit3":
      playLoopClip("run", 2);
      break;

    case "KeyE":
      toggleEnvironment();
      break;

    case "KeyB":
      toggleBloom();
      break;

    case "KeyC":
      switchCamera();
      break;

    case "KeyR":
      resetCamera();
      break;

    default:
      break;
  }
});

/* ------------------------------------------------------------------ */
/* Responsive rendering                                                */
/* ------------------------------------------------------------------ */

function resize() {
  sizes.width = Math.max(viewport.clientWidth, 1);
  sizes.height = Math.max(viewport.clientHeight, 1);

  perspectiveCamera.aspect = sizes.width / sizes.height;
  perspectiveCamera.updateProjectionMatrix();

  updateOrthographicFrustum();

  renderer.setSize(sizes.width, sizes.height, false);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  composer.setPixelRatio(renderer.getPixelRatio());
  composer.setSize(sizes.width, sizes.height);

  setText("canvasSize", `${sizes.width} × ${sizes.height} PX`);
}

new ResizeObserver(resize).observe(viewport);
resize();

/* ------------------------------------------------------------------ */
/* Animation loop                                                      */
/* ------------------------------------------------------------------ */

const timer = new THREE.Timer();

let frameCount = 0;
let hudElapsed = 0;

function updateHud(frameSeconds) {
  setText("fpsInfo", String(Math.round(frameCount / frameSeconds)));
  setText("triangleInfo", renderer.info.render.triangles.toLocaleString("en-US"));
  setText(
    "positionInfo",
    formatVector(camera.position.x, camera.position.y, camera.position.z)
  );

  let meshes = 0;
  let lights = 0;

  scene.traverseVisible(node => {
    if (node.isMesh) {
      meshes += 1;
    }

    if (node.isLight) {
      lights += 1;
    }
  });

  setText("objectInfo", String(meshes));
  setText("lightInfo", String(lights));
}

function animate() {
  requestAnimationFrame(animate);

  timer.update();

  const rawDelta = timer.getDelta();

  // Delta dibatasi agar tab yang lama tidak aktif tidak membuat animasi melompat.
  const delta = Math.min(rawDelta, 0.05);

  if (mixer) {
    mixer.update(delta);
  }

  hierarchyGroup.rotation.y += 0.25 * delta;
  child.rotation.x += 1.2 * delta;

  earthOrbit.rotation.y += 0.6 * delta;
  earth.rotation.y += 1.5 * delta;
  moonOrbit.rotation.y += 2.2 * delta;

  // Object terpilih berputar perlahan; deselect menghentikannya.
  if (selectedObject) {
    selectedObject.rotation.y += SELECTION_SPIN_SPEED * delta;
    updateSelectionPanel();
  }

  controls.update();

  renderer.info.reset();
  composer.render();

  frameCount += 1;
  hudElapsed += rawDelta;

  if (hudElapsed >= 0.5) {
    updateHud(hudElapsed);

    frameCount = 0;
    hudElapsed = 0;
  }
}

applyEnvironment();
setCameraLabel();
setText("bloomInfo", "ON");
$("bloomButton").classList.add("active-control");

animate();

/* ------------------------------------------------------------------ */
/* Hook uji (hanya saat npm run dev, tidak ikut build produksi)         */
/* ------------------------------------------------------------------ */

if (import.meta.env.DEV) {
  window.__praktikum7 = {
    THREE,
    scene,
    composer,
    bloomPass,
    pbrMaterial,
    get camera() {
      return camera;
    },
    get controls() {
      return controls;
    },
    get selected() {
      return selectedObject;
    },
    get hovered() {
      return hoveredObject;
    },
    advanceMixer(seconds) {
      mixer?.update(seconds);
    },
    get activeClip() {
      return [...actions].find(([, action]) => action === activeAction)?.[0] ?? null;
    },
    screenOf(name) {
      const object = scene.getObjectByName(name);
      const rect = renderer.domElement.getBoundingClientRect();
      const point = object.getWorldPosition(new THREE.Vector3()).project(camera);

      return {
        x: rect.left + ((point.x + 1) / 2) * rect.width,
        y: rect.top + ((1 - point.y) / 2) * rect.height
      };
    }
  };
}

