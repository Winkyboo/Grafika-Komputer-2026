import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import "./style.css";

const $ = (id) => document.getElementById(id);

const canvasWrap = $("canvasWrap");

// ======================================================
// MILESTONE 2: Scene + Camera + Renderer
// ======================================================

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0b1020);

// Ukuran mengikuti lebar panel kanvas, dengan rasio tetap 960:600
// seperti kanvas pada praktikum sebelumnya.
const CANVAS_RATIO = 960 / 600;
const sizes = { width: 960, height: 600 };

function measure() {
  sizes.width = Math.max(canvasWrap.clientWidth, 280);
  sizes.height = Math.round(sizes.width / CANVAS_RATIO);
}
measure();

const aspect = () => sizes.width / sizes.height;

const INITIAL_POSITION = new THREE.Vector3(4, 3, 6);
const INITIAL_TARGET = new THREE.Vector3(0, 0.8, 0);
const INITIAL_FOV = 60;
const ORTHO_HEIGHT = 8;

const perspectiveCamera = new THREE.PerspectiveCamera(
  INITIAL_FOV,
  aspect(),
  0.1,
  100
);
perspectiveCamera.position.copy(INITIAL_POSITION);
perspectiveCamera.lookAt(INITIAL_TARGET);

const orthographicCamera = new THREE.OrthographicCamera(
  (-ORTHO_HEIGHT * aspect()) / 2,
  (ORTHO_HEIGHT * aspect()) / 2,
  ORTHO_HEIGHT / 2,
  -ORTHO_HEIGHT / 2,
  0.1,
  100
);
orthographicCamera.position.copy(INITIAL_POSITION);
orthographicCamera.lookAt(INITIAL_TARGET);

scene.add(perspectiveCamera);
scene.add(orthographicCamera);

let activeCamera = perspectiveCamera;

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
// updateStyle false: ukuran tampil diatur CSS (width 100%, height auto).
renderer.setSize(sizes.width, sizes.height, false);
renderer.shadowMap.enabled = true;
canvasWrap.prepend(renderer.domElement);

$("threeVersion").textContent = `Three.js r${THREE.REVISION}`;
$("canvasSize").textContent = `${sizes.width} × ${sizes.height} PX`;

// ======================================================
// OrbitControls
// ======================================================

let controls;

// Dibuat ulang saat kamera berganti atau di-reset supaya sisa damping terbuang.
function createControls(camera, target) {
  if (controls) controls.dispose();

  controls = new OrbitControls(camera, renderer.domElement);
  controls.target.copy(target);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.minDistance = 2;
  controls.maxDistance = 25;
  controls.maxPolarAngle = Math.PI / 2 - 0.02;
  controls.update();
}

createControls(activeCamera, INITIAL_TARGET);

// ======================================================
// MILESTONE 3 dan 4: Cube + Transform
// ======================================================

const cubeGeometry = new THREE.BoxGeometry(1, 1, 1);

const cubeMaterials = [
  new THREE.MeshLambertMaterial({ color: 0x22d3ee }),
  new THREE.MeshBasicMaterial({ color: 0x00aaff }),
  new THREE.MeshNormalMaterial(),
  new THREE.MeshPhongMaterial({ color: 0x22d3ee, shininess: 80 })
];
let cubeMaterialIndex = 0;

const cube = new THREE.Mesh(cubeGeometry, cubeMaterials[cubeMaterialIndex]);
cube.position.set(-1.2, 0.6, 0);
cube.rotation.y = Math.PI / 4;
cube.scale.set(1.2, 1.2, 1.2);
cube.castShadow = true;
scene.add(cube);

console.log("Cube position count:", cubeGeometry.attributes.position.count);

// ======================================================
// MILESTONE 5: Sphere
// ======================================================

const SPHERE_BASE_Y = 0.95;

const sphere = new THREE.Mesh(
  new THREE.SphereGeometry(0.7, 32, 16),
  new THREE.MeshPhongMaterial({ color: 0x4488ff, shininess: 60 })
);
sphere.position.set(1.4, SPHERE_BASE_Y, 0);
sphere.castShadow = true;
scene.add(sphere);

// ======================================================
// MILESTONE 6: Ground
// ======================================================

const groundGeometry = new THREE.PlaneGeometry(10, 10);
groundGeometry.rotateX(-Math.PI / 2);

const ground = new THREE.Mesh(
  groundGeometry,
  new THREE.MeshLambertMaterial({ color: 0x334155 })
);
ground.receiveShadow = true;
scene.add(ground);

// ======================================================
// Challenge A: cylinder, cone, torus
// ======================================================

const cylinder = new THREE.Mesh(
  new THREE.CylinderGeometry(0.5, 0.5, 1.2, 32),
  new THREE.MeshLambertMaterial({ color: 0xf97316 })
);
cylinder.position.set(-3, 0.6, -2.2);
cylinder.castShadow = true;
scene.add(cylinder);

const cone = new THREE.Mesh(
  new THREE.ConeGeometry(0.6, 1.3, 32),
  new THREE.MeshPhongMaterial({ color: 0x22c55e, shininess: 40 })
);
cone.position.set(0, 0.65, -2.5);
cone.castShadow = true;
scene.add(cone);

const torus = new THREE.Mesh(
  new THREE.TorusGeometry(0.45, 0.18, 16, 48),
  new THREE.MeshPhongMaterial({ color: 0xec4899, shininess: 90 })
);
torus.position.set(3, 0.7, -2.2);
torus.castShadow = true;
scene.add(torus);

// ======================================================
// Challenge B: material gallery (tersembunyi sampai diaktifkan)
// ======================================================

const gallery = new THREE.Group();
const galleryGeometry = new THREE.SphereGeometry(0.4, 24, 12);
const galleryMaterials = [
  new THREE.MeshBasicMaterial({ color: 0x00aaff }),
  new THREE.MeshNormalMaterial(),
  new THREE.MeshLambertMaterial({ color: 0x22d3ee }),
  new THREE.MeshPhongMaterial({ color: 0x4488ff, shininess: 60 })
];
galleryMaterials.forEach((material, i) => {
  const mesh = new THREE.Mesh(galleryGeometry, material);
  mesh.position.set(-1.8 + i * 1.2, 0.4, 3);
  mesh.castShadow = true;
  gallery.add(mesh);
});
gallery.visible = false;
scene.add(gallery);

// ======================================================
// MILESTONE 7 dan 8: Light + Shadow
// ======================================================

const ambientLight = new THREE.AmbientLight(0xffffff, 0.35);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 2.0);
directionalLight.position.set(3, 5, 2);
directionalLight.castShadow = true;
directionalLight.shadow.mapSize.set(1024, 1024);
directionalLight.shadow.camera.left = -5;
directionalLight.shadow.camera.right = 5;
directionalLight.shadow.camera.top = 5;
directionalLight.shadow.camera.bottom = -5;
directionalLight.shadow.camera.near = 0.5;
directionalLight.shadow.camera.far = 20;
scene.add(directionalLight);

// Penanda posisi cahaya untuk Challenge D.
const lightMarker = new THREE.Mesh(
  new THREE.SphereGeometry(0.12, 16, 8),
  new THREE.MeshBasicMaterial({ color: 0xfacc15 })
);
lightMarker.position.copy(directionalLight.position);
scene.add(lightMarker);

// ======================================================
// MILESTONE 10: Responsive rendering
// ======================================================

function updateOrthographicFrustum() {
  orthographicCamera.left = (-ORTHO_HEIGHT * aspect()) / 2;
  orthographicCamera.right = (ORTHO_HEIGHT * aspect()) / 2;
  orthographicCamera.top = ORTHO_HEIGHT / 2;
  orthographicCamera.bottom = -ORTHO_HEIGHT / 2;
  orthographicCamera.updateProjectionMatrix();
}

function handleResize() {
  measure();

  perspectiveCamera.aspect = aspect();
  perspectiveCamera.updateProjectionMatrix();
  updateOrthographicFrustum();

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(sizes.width, sizes.height, false);

  $("canvasSize").textContent = `${sizes.width} × ${sizes.height} PX`;
}

window.addEventListener("resize", handleResize);

// Lebar panel bisa berubah tanpa resize window (misalnya saat layout berpindah kolom).
new ResizeObserver(() => {
  if (canvasWrap.clientWidth !== sizes.width) handleResize();
}).observe(canvasWrap);

// ======================================================
// State aplikasi dan sinkronisasi UI
// ======================================================

let animationEnabled = true;
let lightAnimationEnabled = false;

const SHADOW_SIZES = [512, 1024, 2048];
let shadowSizeIndex = 1;

const ui = {
  cameraButton: $("cameraButton"),
  resetButton: $("resetButton"),
  pauseButton: $("pauseButton"),
  lightButton: $("lightButton"),
  galleryButton: $("galleryButton"),
  fov: $("fovControl"),
  fovValue: $("fovValue"),
  cubeMaterial: $("cubeMaterial"),
  sphereSegments: $("sphereSegments"),
  directional: $("directionalControl"),
  directionalValue: $("directionalValue"),
  ambient: $("ambientControl"),
  ambientValue: $("ambientValue"),
  shadowSize: $("shadowSize"),
  shadowRenderer: $("shadowRenderer"),
  shadowLight: $("shadowLight"),
  shadowCube: $("shadowCube"),
  shadowGround: $("shadowGround")
};

const hud = {
  camera: $("hudCamera"),
  position: $("hudPosition"),
  fov: $("hudFov"),
  objects: $("hudObjects"),
  triangles: $("hudTriangles"),
  fps: $("hudFps"),
  material: $("hudMaterial"),
  vertex: $("hudVertex"),
  animation: $("hudAnimation"),
  light: $("hudLight"),
  shadow: $("hudShadow"),
  gallery: $("hudGallery")
};

function refreshButtons() {
  ui.pauseButton.textContent = animationEnabled
    ? "Jeda Animasi (Space)"
    : "Lanjutkan Animasi (Space)";
  ui.lightButton.classList.toggle("active-control", lightAnimationEnabled);
  ui.galleryButton.classList.toggle("active-control", gallery.visible);
  ui.cameraButton.classList.toggle(
    "active-control",
    activeCamera === orthographicCamera
  );
}

function toggleAnimation() {
  animationEnabled = !animationEnabled;
  refreshButtons();
}

function toggleLightOrbit() {
  lightAnimationEnabled = !lightAnimationEnabled;
  refreshButtons();
}

function toggleGallery() {
  gallery.visible = !gallery.visible;
  refreshButtons();
}

function setCubeMaterial(index) {
  cubeMaterialIndex = index;
  cube.material = cubeMaterials[cubeMaterialIndex];
  ui.cubeMaterial.value = String(cubeMaterialIndex);
}

function setShadowSize(index) {
  shadowSizeIndex = index;
  const size = SHADOW_SIZES[shadowSizeIndex];
  directionalLight.shadow.mapSize.set(size, size);

  // Shadow map lama dibuang agar Three.js membuat ulang dengan ukuran baru.
  if (directionalLight.shadow.map) {
    directionalLight.shadow.map.dispose();
    directionalLight.shadow.map = null;
  }
  ui.shadowSize.value = String(size);
}

function applyShadowFlags() {
  renderer.shadowMap.enabled = ui.shadowRenderer.checked;
  directionalLight.castShadow = ui.shadowLight.checked;
  cube.castShadow = ui.shadowCube.checked;
  ground.receiveShadow = ui.shadowGround.checked;

  // Perubahan shadow di runtime membutuhkan shader dikompilasi ulang.
  scene.traverse((object) => {
    if (object.material) object.material.needsUpdate = true;
  });
}

function setSphereSegments(widthSegments, heightSegments) {
  sphere.geometry.dispose();
  sphere.geometry = new THREE.SphereGeometry(
    0.7,
    widthSegments,
    heightSegments
  );
  console.log(
    `Sphere ${widthSegments}x${heightSegments} vertex count:`,
    sphere.geometry.attributes.position.count
  );
}

function switchCamera() {
  const nextCamera =
    activeCamera === perspectiveCamera
      ? orthographicCamera
      : perspectiveCamera;

  const target = controls.target.clone();
  nextCamera.position.copy(activeCamera.position);
  activeCamera = nextCamera;
  createControls(activeCamera, target);
  refreshButtons();
}

function resetView() {
  perspectiveCamera.position.copy(INITIAL_POSITION);
  perspectiveCamera.fov = INITIAL_FOV;
  perspectiveCamera.zoom = 1;
  perspectiveCamera.updateProjectionMatrix();

  orthographicCamera.position.copy(INITIAL_POSITION);
  orthographicCamera.zoom = 1;
  updateOrthographicFrustum();

  activeCamera = perspectiveCamera;
  createControls(activeCamera, INITIAL_TARGET);

  ui.fov.value = String(INITIAL_FOV);
  ui.fovValue.textContent = `${INITIAL_FOV}°`;
  refreshButtons();
}

// ---- Event dari panel kontrol ----

ui.cameraButton.addEventListener("click", switchCamera);
ui.resetButton.addEventListener("click", resetView);
ui.pauseButton.addEventListener("click", toggleAnimation);
ui.lightButton.addEventListener("click", toggleLightOrbit);
ui.galleryButton.addEventListener("click", toggleGallery);

ui.fov.addEventListener("input", () => {
  perspectiveCamera.fov = Number(ui.fov.value);
  perspectiveCamera.updateProjectionMatrix();
  ui.fovValue.textContent = `${ui.fov.value}°`;
});

ui.cubeMaterial.addEventListener("change", () =>
  setCubeMaterial(Number(ui.cubeMaterial.value))
);

ui.sphereSegments.addEventListener("change", () => {
  const [w, h] = ui.sphereSegments.value.split(",").map(Number);
  setSphereSegments(w, h);
});

ui.directional.addEventListener("input", () => {
  directionalLight.intensity = Number(ui.directional.value);
  ui.directionalValue.textContent = Number(ui.directional.value).toFixed(1);
});

ui.ambient.addEventListener("input", () => {
  ambientLight.intensity = Number(ui.ambient.value);
  ui.ambientValue.textContent = Number(ui.ambient.value).toFixed(2);
});

ui.shadowSize.addEventListener("change", () =>
  setShadowSize(SHADOW_SIZES.indexOf(Number(ui.shadowSize.value)))
);

[ui.shadowRenderer, ui.shadowLight, ui.shadowCube, ui.shadowGround].forEach(
  (checkbox) => checkbox.addEventListener("change", applyShadowFlags)
);

// ======================================================
// Challenge G dan H: keyboard
// ======================================================

// State-based: dibaca setiap frame untuk gerakan kontinu.
const keys = new Set();

const handledKeys = [
  "Space",
  "ArrowUp",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight"
];

window.addEventListener("keydown", (event) => {
  const target = event.target;

  // Biarkan slider, menu, dan checkbox memakai tombolnya sendiri.
  if (
    target instanceof HTMLInputElement ||
    target instanceof HTMLSelectElement ||
    target instanceof HTMLTextAreaElement
  ) {
    return;
  }
  // Space dan Enter pada tombol yang sedang fokus sudah memicu klik.
  if (
    target instanceof HTMLButtonElement &&
    (event.code === "Space" || event.code === "Enter")
  ) {
    return;
  }

  if (handledKeys.includes(event.code)) event.preventDefault();

  keys.add(event.code);

  // Event-based: toggle hanya sekali per penekanan.
  if (event.repeat) return;

  switch (event.code) {
    case "Space":
      toggleAnimation();
      break;
    case "KeyP":
      switchCamera();
      break;
    case "KeyR":
      resetView();
      break;
    case "KeyL":
      toggleLightOrbit();
      break;
    case "KeyG":
      toggleGallery();
      break;
    case "KeyM":
      setCubeMaterial((cubeMaterialIndex + 1) % cubeMaterials.length);
      break;
    case "KeyB":
      setShadowSize((shadowSizeIndex + 1) % SHADOW_SIZES.length);
      break;
  }
});

window.addEventListener("keyup", (event) => keys.delete(event.code));
window.addEventListener("blur", () => keys.clear());

const CUBE_MOVE_SPEED = 3;
const CUBE_TURN_SPEED = 2;
const GROUND_LIMIT = 4.5;

function updateCubeInput(delta) {
  let dx = 0;
  let dz = 0;
  if (keys.has("ArrowLeft")) dx -= 1;
  if (keys.has("ArrowRight")) dx += 1;
  if (keys.has("ArrowUp")) dz -= 1;
  if (keys.has("ArrowDown")) dz += 1;

  cube.position.x = THREE.MathUtils.clamp(
    cube.position.x + dx * CUBE_MOVE_SPEED * delta,
    -GROUND_LIMIT,
    GROUND_LIMIT
  );
  cube.position.z = THREE.MathUtils.clamp(
    cube.position.z + dz * CUBE_MOVE_SPEED * delta,
    -GROUND_LIMIT,
    GROUND_LIMIT
  );

  if (keys.has("KeyQ")) cube.rotation.y += CUBE_TURN_SPEED * delta;
  if (keys.has("KeyE")) cube.rotation.y -= CUBE_TURN_SPEED * delta;
}

// ======================================================
// Challenge F: HUD
// ======================================================

let fps = 0;
let fpsFrames = 0;
let fpsTime = 0;
let hudTime = 0;

function updateHUD() {
  const p = activeCamera.position;
  const isPerspective = activeCamera === perspectiveCamera;

  hud.camera.textContent = isPerspective ? "Perspective" : "Orthographic";
  hud.position.textContent =
    `${p.x.toFixed(1)}, ${p.y.toFixed(1)}, ${p.z.toFixed(1)}`;
  hud.fov.textContent = isPerspective
    ? `${perspectiveCamera.fov.toFixed(0)}°`
    : "n/a";
  hud.objects.textContent = String(scene.children.length);
  hud.triangles.textContent = String(renderer.info.render.triangles);
  hud.fps.textContent = String(fps);
  hud.material.textContent = cube.material.type.replace("Mesh", "").replace("Material", "");
  hud.vertex.textContent = String(sphere.geometry.attributes.position.count);
  hud.animation.textContent = animationEnabled ? "Jalan" : "Jeda";
  hud.light.textContent = lightAnimationEnabled ? "Bergerak" : "Diam";
  hud.shadow.textContent = renderer.shadowMap.enabled
    ? String(SHADOW_SIZES[shadowSizeIndex])
    : "Off";
  hud.gallery.textContent = gallery.visible ? "Tampil" : "Tersembunyi";
}

// ======================================================
// MILESTONE 9: Animation loop dengan delta time
// ======================================================

const clock = new THREE.Clock();
let elapsed = 0;
let lightTime = 0;

function animate() {
  requestAnimationFrame(animate);

  const rawDelta = clock.getDelta();
  const delta = Math.min(rawDelta, 0.05);

  if (animationEnabled) {
    elapsed += delta;

    cube.rotation.x += 0.35 * delta;
    cube.rotation.y += 0.8 * delta;

    sphere.rotation.y += 0.5 * delta;
    sphere.position.y = SPHERE_BASE_Y + Math.sin(elapsed * 2) * 0.15;

    cylinder.rotation.y += 0.6 * delta;
    cone.rotation.y -= 0.6 * delta;
    torus.rotation.y += 1.0 * delta;
  }

  if (lightAnimationEnabled) {
    lightTime += delta;
    directionalLight.position.x = Math.cos(lightTime) * 4;
    directionalLight.position.z = Math.sin(lightTime) * 4;
    lightMarker.position.copy(directionalLight.position);
  }

  updateCubeInput(delta);

  // Di luar blok animationEnabled agar kamera tetap bisa dinavigasi saat animasi dijeda.
  controls.update();

  fpsFrames += 1;
  fpsTime += rawDelta;
  if (fpsTime >= 0.5) {
    fps = Math.round(fpsFrames / fpsTime);
    fpsFrames = 0;
    fpsTime = 0;
  }

  hudTime += rawDelta;
  if (hudTime >= 0.2) {
    updateHUD();
    hudTime = 0;
  }

  renderer.render(scene, activeCamera);
}

// ======================================================
// Ringkasan tabel test case
// ======================================================

(function summarizeTests() {
  const total = document.querySelectorAll(".status-pass, .status-pending").length;
  const passed = document.querySelectorAll(".status-pass").length;
  $("testSummary").textContent =
    passed === total
      ? `Status Pengujian: Lulus Uji (${passed}/${total}).`
      : `Status Pengujian: ${passed}/${total} skenario lulus.`;
})();

refreshButtons();
updateHUD();
animate();