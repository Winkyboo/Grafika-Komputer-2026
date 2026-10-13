import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import './style.css';

const $ = (id) => document.getElementById(id);
const viewport = $('viewport');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x020917);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
viewport.prepend(renderer.domElement);

const pmrem = new THREE.PMREMGenerator(renderer);
const environmentMap = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
scene.environment = environmentMap;

const initialTarget = new THREE.Vector3(0, 0.55, 0);
const perspective = new THREE.PerspectiveCamera(52, 1, 0.1, 100);
perspective.position.set(4.4, 2.8, 6.8);
perspective.lookAt(initialTarget);
const orthographic = new THREE.OrthographicCamera(-5, 5, 3.125, -3.125, 0.1, 100);
orthographic.position.copy(perspective.position);
orthographic.lookAt(initialTarget);
let camera = perspective;
let controls;
function createControls(activeCamera, target) {
  controls?.dispose();
  controls = new OrbitControls(activeCamera, renderer.domElement);
  controls.target.copy(target);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.minDistance = 3;
  controls.maxDistance = 25;
  controls.minZoom = 0.55;
  controls.maxZoom = 3;
  controls.maxPolarAngle = Math.PI / 2 - 0.03;
  controls.rotateSpeed = 1;
  controls.zoomSpeed = 1;
  controls.update();
}
createControls(camera, initialTarget);

const ambient = new THREE.AmbientLight(0xffffff, 1.25);
scene.add(ambient);
const keyLight = new THREE.DirectionalLight(0xfff0d0, 3.2);
keyLight.position.set(-3, 7, 4);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(2048, 2048);
keyLight.shadow.camera.left = -9;
keyLight.shadow.camera.right = 9;
keyLight.shadow.camera.top = 9;
keyLight.shadow.camera.bottom = -9;
keyLight.shadow.bias = -0.0002;
scene.add(keyLight);
const fillLight = new THREE.DirectionalLight(0x72d9ff, 1.1);
fillLight.position.set(5, 4, -5);
scene.add(fillLight);

const groundMaterial = new THREE.MeshStandardMaterial({ color: 0x263d54, roughness: 0.88, metalness: 0.02 });
const ground = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), groundMaterial);
ground.name = 'Ground';
ground.rotation.x = -Math.PI / 2;
ground.position.y = -0.035;
ground.receiveShadow = true;
scene.add(ground);

const interactiveObjects = [];
const selectableSet = new Set();
function makeMaterial(color, roughness = 0.35, metalness = 0.2) {
  return new THREE.MeshStandardMaterial({ color, roughness, metalness, emissive: 0x000000 });
}
function addMesh(parent, geometry, material, name, position, selectableRoot = null) {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = name;
  mesh.position.set(...position);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  if (selectableRoot) mesh.userData.selectableRoot = selectableRoot;
  parent.add(mesh);
  return mesh;
}
function registerSelectable(root) {
  root.userData.selectableRoot = root;
  interactiveObjects.push(root);
  selectableSet.add(root);
  return root;
}

// Milestone 2–3 and Challenge D: a THREE.Group hierarchy with demonstrable local/world transforms.
const hierarchyGroup = new THREE.Group();
hierarchyGroup.name = 'Hierarchy Demo Group';
hierarchyGroup.position.set(-2.25, 0, -0.15);
hierarchyGroup.rotation.y = Math.PI / 7;
hierarchyGroup.scale.setScalar(1.05);
scene.add(hierarchyGroup);
const parentBody = addMesh(hierarchyGroup, new THREE.BoxGeometry(1.05, 1.05, 1.05), makeMaterial(0x27c5d8, 0.42, 0.18), 'Parent Body', [0, 0.55, 0]);
parentBody.userData.selectableRoot = hierarchyGroup;
const childMesh = addMesh(parentBody, new THREE.BoxGeometry(0.38, 0.38, 0.38), makeMaterial(0xf6a93b, 0.28, 0.18), 'Child Object', [0.72, 0.36, 0]);
childMesh.userData.selectableRoot = hierarchyGroup;
const groupAccent = addMesh(hierarchyGroup, new THREE.SphereGeometry(0.22, 24, 16), makeMaterial(0xffd166, 0.2, 0.55), 'Group Accent', [-0.18, 1.28, 0]);
groupAccent.userData.selectableRoot = hierarchyGroup;
registerSelectable(hierarchyGroup);
hierarchyGroup.updateMatrixWorld(true);
const childWorld = new THREE.Vector3();
childMesh.getWorldPosition(childWorld);
console.info('[Scene Graph] Child local position:', childMesh.position.toArray(), '| world position:', childWorld.toArray());

// Milestone 4 and Challenge E: live PBR sphere plus 3×3 roughness/metalness gallery.
const pbrMaterial = makeMaterial(0xffbd45, 0.35, 0.65);
const pbrSphere = addMesh(scene, new THREE.SphereGeometry(0.52, 48, 32), pbrMaterial, 'PBR Sphere', [1.65, 0.55, 0.15]);
registerSelectable(pbrSphere);
const gallery = new THREE.Group();
gallery.name = 'PBR Material Gallery';
gallery.visible = false;
scene.add(gallery);
const galleryRoughness = [0.1, 0.5, 0.9];
const galleryMetalness = [0, 0.5, 1];
galleryMetalness.forEach((metalness, row) => galleryRoughness.forEach((roughness, col) => {
  const material = makeMaterial([0xff5b9c, 0x36d5e8, 0x8f91ff][col], roughness, metalness);
  const sphere = addMesh(gallery, new THREE.SphereGeometry(0.23, 32, 20), material, `PBR Gallery r${roughness} m${metalness}`, [-0.55 + col * 0.58, 0.3 + row * 0.56, -2.15]);
  sphere.userData.selectableRoot = sphere;
  registerSelectable(sphere);
}));

// Small material comparison samples keep the scene legible while making PBR values visible.
const sampleMaterial = makeMaterial(0x57d9e8, 0.12, 0.75);
const sampleSphere = addMesh(scene, new THREE.SphereGeometry(0.17, 24, 16), sampleMaterial, 'Metal Sample', [2.8, 0.2, -0.8]);
registerSelectable(sampleSphere);

// Challenge D: hierarchical solar system. Earth and Moon orbit through their parent pivots.
const solarSystem = new THREE.Group();
solarSystem.name = 'Hierarchical Solar System';
solarSystem.position.set(0, 0.48, -0.45);
solarSystem.visible = false;
scene.add(solarSystem);
const sun = addMesh(solarSystem, new THREE.SphereGeometry(0.34, 32, 20), new THREE.MeshStandardMaterial({ color: 0xffb72e, emissive: 0x6b3100, roughness: 0.3 }), 'Sun', [0, 0, 0]);
sun.userData.selectableRoot = solarSystem;
const earthOrbit = new THREE.Group(); earthOrbit.name = 'Earth Orbit'; solarSystem.add(earthOrbit);
const earth = addMesh(earthOrbit, new THREE.SphereGeometry(0.16, 24, 16), makeMaterial(0x328cff, 0.38, 0.2), 'Earth', [0.82, 0, 0]);
earth.userData.selectableRoot = solarSystem;
const moonOrbit = new THREE.Group(); moonOrbit.name = 'Moon Orbit'; moonOrbit.position.x = 0.82; earth.add(moonOrbit);
const moon = addMesh(moonOrbit, new THREE.SphereGeometry(0.075, 20, 12), makeMaterial(0xd9e2eb, 0.68, 0.05), 'Moon', [0.28, 0, 0]);
moon.userData.selectableRoot = solarSystem;
registerSelectable(solarSystem);

let importedModel = null;
let mixer = null;
let actions = [];
let activeAction = null;
let clipNames = [];
const originalEmissive = new Map();
const duckRoot = new THREE.Group();
duckRoot.name = 'Imported Duck GLB';
duckRoot.position.set(0.05, 0, 0.1);
scene.add(duckRoot);
registerSelectable(duckRoot);

function cloneMaterialForFeedback(material) {
  const clone = material.clone();
  if (clone.emissive) originalEmissive.set(clone, clone.emissive.clone());
  return clone;
}
function prepareImportedModel(root) {
  root.name = 'Imported Duck GLB';
  root.traverse((object) => {
    if (!object.isMesh) return;
    object.castShadow = true;
    object.receiveShadow = true;
    object.userData.selectableRoot = duckRoot;
    if (Array.isArray(object.material)) object.material = object.material.map(cloneMaterialForFeedback);
    else object.material = cloneMaterialForFeedback(object.material);
  });
  root.scale.setScalar(1.08);
  root.position.set(0, 0.02, 0);
  duckRoot.add(root);
  importedModel = root;
  return root;
}

function setLoadState(message, ready = false, error = false) {
  $('loadBadge').innerHTML = `<i></i> ${ready ? 'GLB LOADED · READY' : error ? 'GLB LOAD ERROR' : 'GLB LOADING'}`;
  $('loadBadge').classList.toggle('error', error);
  $('assetStatus').textContent = message;
  $('loadingOverlay').textContent = message;
  $('loadingOverlay').classList.toggle('hidden', ready);
}

function setupAnimations(clips, root) {
  mixer = new THREE.AnimationMixer(root);
  clipNames = clips.map((clip) => clip.name || `Clip ${clips.indexOf(clip) + 1}`);
  actions = clips.map((clip) => mixer.clipAction(clip));
  if (actions.length) playClip(0, false);
  $('clipInfo').textContent = `${clips.length} clips`;
  console.info('[GLB] Animation clips:', clips.map((clip) => clip.name), 'meshes:', countMeshes(root));
}
function playClip(index, fade = true) {
  if (!actions.length) return;
  const next = actions[index % actions.length];
  if (next === activeAction) return;
  if (activeAction && fade) activeAction.fadeOut(0.2);
  next.reset().fadeIn(fade ? 0.2 : 0).play();
  activeAction = next;
  $('clipInfo').textContent = clipNames[index % clipNames.length];
  document.querySelectorAll('[data-clip]').forEach((button) => button.classList.toggle('active-control', Number(button.dataset.clip) === index));
}
function countMeshes(root) {
  let count = 0;
  root.traverse((object) => { if (object.isMesh) count += 1; });
  return count;
}

new GLTFLoader().load('/models/model.glb', (gltf) => {
  const model = prepareImportedModel(gltf.scene);
  console.info('[GLB] Root:', model.name, '| descendant mesh count:', countMeshes(model));
  setupAnimations(gltf.animations, model);
  setLoadState(`GLB loaded: ${countMeshes(model)} mesh parts · ${gltf.animations.length} animation clips`, true);
}, (progress) => {
  if (progress.total) setLoadState(`Memuat model GLB… ${Math.round(progress.loaded / progress.total * 100)}%`);
}, (error) => {
  console.error('GLB load failed:', error);
  $('clipInfo').textContent = 'Error';
  setLoadState('Model GLB gagal dimuat. Periksa public/models/model.glb.', false, true);
});

// Milestone 7–9: screen pointer → NDC → recursive raycast → independent hover/selection state.
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
let hoveredObject = null;
let selectedObject = null;
let selectionGesture = null;
let suppressSelection = false;
function setPointer(event) {
  const rect = renderer.domElement.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
}
function selectableRootFrom(object) {
  let current = object;
  while (current && !selectableSet.has(current)) current = current.parent;
  return current || null;
}
function hitTest(event) {
  setPointer(event);
  raycaster.setFromCamera(pointer, camera);
  const hits = raycaster.intersectObjects(interactiveObjects, true);
  return hits.length ? selectableRootFrom(hits[0].object) : null;
}
function feedbackMaterials(root) {
  const materials = [];
  root.traverse((object) => {
    if (!object.isMesh) return;
    const list = Array.isArray(object.material) ? object.material : [object.material];
    materials.push(...list);
  });
  return materials;
}
function applyFeedback() {
  for (const root of selectableSet) {
    const selected = root === selectedObject;
    const hovered = root === hoveredObject;
    root.scale.copy(root.userData.baseScale || (root.userData.baseScale = root.scale.clone()));
    root.scale.multiplyScalar(selected ? 1.12 : hovered ? 1.06 : 1);
    feedbackMaterials(root).forEach((material) => {
      if (!material.emissive) return;
      const base = originalEmissive.get(material) || new THREE.Color(0);
      material.emissive.copy(base);
      if (selected) material.emissive.lerp(new THREE.Color(0x22d3ee), 0.52);
      else if (hovered) material.emissive.lerp(new THREE.Color(0xff69b4), 0.36);
    });
  }
  $('hoverInfo').textContent = hoveredObject?.name || '-';
  $('selectedInfo').textContent = selectedObject?.name || '-';
  const cursorTarget = hoveredObject || selectedObject;
  renderer.domElement.style.cursor = cursorTarget ? 'pointer' : 'grab';
}
function materialName(root) {
  let material = null;
  root.traverse((object) => { if (!material && object.isMesh) material = Array.isArray(object.material) ? object.material[0] : object.material; });
  return material?.type || 'Group';
}
function updateSelectionPanel() {
  if (!selectedObject) {
    $('selectionTitle').textContent = 'Belum ada objek dipilih';
    $('selectionPosition').textContent = '-'; $('selectionRotation').textContent = '-'; $('selectionScale').textContent = '-'; $('selectionMaterial').textContent = '-';
    return;
  }
  selectedObject.updateWorldMatrix(true, true);
  const world = selectedObject.getWorldPosition(new THREE.Vector3());
  $('selectionTitle').textContent = selectedObject.name || selectedObject.type;
  $('selectionPosition').textContent = world.toArray().map((n) => n.toFixed(2)).join(', ');
  $('selectionRotation').textContent = [selectedObject.rotation.x, selectedObject.rotation.y, selectedObject.rotation.z].map((n) => `${THREE.MathUtils.radToDeg(n).toFixed(0)}°`).join(', ');
  $('selectionScale').textContent = selectedObject.scale.toArray().map((n) => n.toFixed(2)).join(', ');
  $('selectionMaterial').textContent = materialName(selectedObject);
}
renderer.domElement.addEventListener('pointerdown', (event) => {
  suppressSelection = event.button !== 0 || selectionGesture !== null;
  selectionGesture = { id: event.pointerId, x: event.clientX, y: event.clientY };
});
window.addEventListener('pointermove', (event) => {
  if (!selectionGesture || event.pointerId !== selectionGesture.id) return;
  if (Math.hypot(event.clientX - selectionGesture.x, event.clientY - selectionGesture.y) > 5) suppressSelection = true;
}, true);
window.addEventListener('pointerup', (event) => {
  if (event.pointerId === selectionGesture?.id) selectionGesture = null;
});
window.addEventListener('pointercancel', () => { selectionGesture = null; suppressSelection = true; });
renderer.domElement.addEventListener('pointermove', (event) => {
  if (selectionGesture) return;
  const next = hitTest(event);
  if (next === hoveredObject) return;
  hoveredObject = next;
  applyFeedback();
});
renderer.domElement.addEventListener('pointerleave', () => { hoveredObject = null; applyFeedback(); });
renderer.domElement.addEventListener('click', (event) => {
  if (suppressSelection || event.button !== 0) { suppressSelection = false; return; }
  const hit = hitTest(event);
  selectedObject = hit === selectedObject ? null : hit;
  if (selectedObject === duckRoot && actions.length) playClip((actions.indexOf(activeAction) + 1) % actions.length);
  applyFeedback();
  updateSelectionPanel();
  if (selectedObject) console.info('[Raycast] Selected:', selectedObject.name, '| pointer NDC:', pointer.toArray());
});

function updateOrthoFrustum() {
  const width = viewport.clientWidth;
  const height = viewport.clientHeight;
  const aspect = width / Math.max(height, 1);
  const viewHeight = 6.25;
  orthographic.left = -viewHeight * aspect / 2;
  orthographic.right = viewHeight * aspect / 2;
  orthographic.top = viewHeight / 2;
  orthographic.bottom = -viewHeight / 2;
  orthographic.updateProjectionMatrix();
}
function resize() {
  const width = Math.max(viewport.clientWidth, 1);
  const height = Math.max(viewport.clientHeight, 1);
  renderer.setSize(width, height, false);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  perspective.aspect = width / height;
  perspective.updateProjectionMatrix();
  updateOrthoFrustum();
}
new ResizeObserver(resize).observe(viewport);
window.addEventListener('resize', resize);
resize();

function switchCamera(mode) {
  const position = camera.position.clone();
  const target = controls.target.clone();
  camera = mode === 'orthographic' ? orthographic : perspective;
  camera.position.copy(position);
  createControls(camera, target);
  applyControlSettings();
}
function applyControlSettings() {
  controls.enabled = $('controlsEnabled').checked;
  controls.enablePan = $('panEnabled').checked;
  controls.enableDamping = $('dampingEnabled').checked;
  controls.dampingFactor = Number($('damping').value);
  controls.rotateSpeed = Number($('rotateSpeed').value);
  controls.zoomSpeed = Number($('zoomSpeed').value);
  controls.minDistance = 3;
  controls.maxDistance = 25;
  controls.minZoom = 0.55;
  controls.maxZoom = 3;
  controls.maxPolarAngle = Math.PI / 2 - 0.03;
}

function toggleGallery() { gallery.visible = !gallery.visible; }
function toggleEnvironment() {
  scene.environment = scene.environment ? null : environmentMap;
  const enabled = Boolean(scene.environment);
  $('environmentInfo').textContent = enabled ? 'ON' : 'OFF';
  $('environmentButton').classList.toggle('active-control', enabled);
}
function resetView() {
  $('cameraMode').value = 'perspective';
  $('fov').value = '52'; $('fovValue').textContent = '52°';
  perspective.fov = 52; perspective.updateProjectionMatrix();
  camera = perspective;
  camera.position.set(4.4, 2.8, 6.8);
  createControls(camera, initialTarget);
  applyControlSettings();
  hierarchyGroup.position.set(-2.25, 0, -0.15);
  hierarchyGroup.rotation.set(0, Math.PI / 7, 0);
  hierarchyGroup.scale.setScalar(1.05);
  earthOrbit.rotation.set(0, 0, 0); moonOrbit.rotation.set(0, 0, 0);
  if (selectedObject) selectedObject.rotation.y = 0;
  selectedObject = null; hoveredObject = null;
  applyFeedback(); updateSelectionPanel();
}
$('cameraMode').addEventListener('change', (event) => switchCamera(event.target.value));
$('fov').addEventListener('input', (event) => {
  perspective.fov = Number(event.target.value); perspective.updateProjectionMatrix();
  $('fovValue').textContent = `${event.target.value}°`;
});
$('roughness').addEventListener('input', (event) => { pbrMaterial.roughness = Number(event.target.value); $('roughnessValue').textContent = Number(event.target.value).toFixed(2); });
$('metalness').addEventListener('input', (event) => { pbrMaterial.metalness = Number(event.target.value); $('metalnessValue').textContent = Number(event.target.value).toFixed(2); });
$('orbitSpeed').addEventListener('input', (event) => { controls.autoRotate = Number(event.target.value) > 0; controls.autoRotateSpeed = Number(event.target.value) * 2; $('orbitSpeedValue').textContent = Number(event.target.value).toFixed(2); });
['controlsEnabled', 'panEnabled', 'dampingEnabled', 'damping', 'rotateSpeed', 'zoomSpeed'].forEach((id) => $(id).addEventListener('input', () => {
  applyControlSettings();
  if (id === 'damping') $('dampingValue').textContent = Number($('damping').value).toFixed(2);
  if (id === 'rotateSpeed') $('rotateValue').textContent = Number($('rotateSpeed').value).toFixed(2);
  if (id === 'zoomSpeed') $('zoomValue').textContent = Number($('zoomSpeed').value).toFixed(2);
}));
$('environmentButton').addEventListener('click', toggleEnvironment);
$('resetButton').addEventListener('click', resetView);
$('solarButton').addEventListener('click', () => { solarSystem.visible = !solarSystem.visible; });
$('galleryButton').addEventListener('click', toggleGallery);
document.querySelectorAll('[data-clip]').forEach((button) => button.addEventListener('click', () => playClip(Number(button.dataset.clip))));
window.addEventListener('keydown', (event) => {
  if (event.target instanceof HTMLInputElement || event.target instanceof HTMLSelectElement) return;
  if (event.code === 'KeyE') toggleEnvironment();
  if (event.code === 'KeyR') resetView();
  if (event.code === 'KeyS') solarSystem.visible = !solarSystem.visible;
  if (event.code === 'KeyG') toggleGallery();
  if (event.code === 'Digit1') playClip(0);
  if (event.code === 'Digit2') playClip(1);
  if (event.code === 'Digit3') playClip(2);
});

const clock = new THREE.Clock();
let frameCount = 0;
let fpsElapsed = 0;
let fps = 0;
function animate() {
  requestAnimationFrame(animate);
  const rawDelta = clock.getDelta();
  const delta = Math.min(rawDelta, 0.05);
  if (mixer) mixer.update(delta);
  if (hierarchyGroup) hierarchyGroup.rotation.y += delta * 0.12;
  earthOrbit.rotation.y += delta * 0.55;
  moonOrbit.rotation.y += delta * 1.5;
  if (selectedObject) selectedObject.rotation.y += delta * 0.35;
  controls.update();
  renderer.render(scene, camera);
  frameCount += 1; fpsElapsed += rawDelta;
  if (fpsElapsed >= 0.5) {
    fps = Math.round(frameCount / fpsElapsed);
    $('fpsInfo').textContent = String(fps);
    $('objectInfo').textContent = String(scene.children.length);
    frameCount = 0; fpsElapsed = 0;
  }
}
applyControlSettings();
$('environmentButton').classList.add('active-control');
animate();
