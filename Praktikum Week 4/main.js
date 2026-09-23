// main.js
// Rotating 3D Cube Camera Playground
// EF234504 - Grafika Komputer, Pertemuan 4

import { Mat4 } from "./math3d.js";

// ---------------------------------------------------------------
// 1. WebGL2 Context
// ---------------------------------------------------------------
const canvas = document.getElementById("glCanvas");
const gl = canvas.getContext("webgl2");

if (!gl) {
  throw new Error("WebGL2 tidak tersedia.");
}

gl.viewport(0, 0, canvas.width, canvas.height);

// ---------------------------------------------------------------
// 2. Cube Geometry (36 vertex, tanpa index buffer)
// ---------------------------------------------------------------
const cubePositions = new Float32Array([
  // Front
  -0.5, -0.5, 0.5,
  0.5, -0.5, 0.5,
  0.5, 0.5, 0.5,

  -0.5, -0.5, 0.5,
  0.5, 0.5, 0.5,
  -0.5, 0.5, 0.5,

  // Back
  0.5, -0.5, -0.5,
  -0.5, -0.5, -0.5,
  -0.5, 0.5, -0.5,

  0.5, -0.5, -0.5,
  -0.5, 0.5, -0.5,
  0.5, 0.5, -0.5,

  // Left
  -0.5, -0.5, -0.5,
  -0.5, -0.5, 0.5,
  -0.5, 0.5, 0.5,

  -0.5, -0.5, -0.5,
  -0.5, 0.5, 0.5,
  -0.5, 0.5, -0.5,

  // Right
  0.5, -0.5, 0.5,
  0.5, -0.5, -0.5,
  0.5, 0.5, -0.5,

  0.5, -0.5, 0.5,
  0.5, 0.5, -0.5,
  0.5, 0.5, 0.5,

  // Top
  -0.5, 0.5, 0.5,
  0.5, 0.5, 0.5,
  0.5, 0.5, -0.5,

  -0.5, 0.5, 0.5,
  0.5, 0.5, -0.5,
  -0.5, 0.5, -0.5,

  // Bottom
  -0.5, -0.5, -0.5,
  0.5, -0.5, -0.5,
  0.5, -0.5, 0.5,

  -0.5, -0.5, -0.5,
  0.5, -0.5, 0.5,
  -0.5, -0.5, 0.5
]);

function faceColor(r, g, b) {
  const out = [];
  for (let i = 0; i < 6; i++) out.push(r, g, b);
  return out;
}

const cubeColors = new Float32Array([
  ...faceColor(0.0, 0.8, 1.0), // Front - cyan
  ...faceColor(0.2, 0.3, 1.0), // Back - blue
  ...faceColor(1.0, 0.5, 0.1), // Left - orange
  ...faceColor(0.2, 1.0, 0.4), // Right - green
  ...faceColor(1.0, 0.2, 0.8), // Top - magenta
  ...faceColor(1.0, 0.9, 0.1)  // Bottom - yellow
]);

// A second and third cube, offset in depth, used for Challenge E
// (Multiple Cube Depth Test) so the depth-test toggle has more to show.
const extraCubes = [
  { position: [-1.6, 0.0, -1.5], rotationSpeedX: 15, rotationSpeedY: -30 },
  { position: [1.6, 0.0, 1.2], rotationSpeedX: -20, rotationSpeedY: 25 }
];
const extraCubeState = extraCubes.map(() => ({ rotationX: 0, rotationY: 0 }));

// ---------------------------------------------------------------
// 3. Shaders
// ---------------------------------------------------------------
const vertexShaderSource = `#version 300 es

in vec3 a_position;
in vec3 a_color;

uniform mat4 u_model;
uniform mat4 u_view;
uniform mat4 u_projection;

out vec3 v_color;

void main() {
  gl_Position = u_projection * u_view * u_model * vec4(a_position, 1.0);
  v_color = a_color;
}
`;

const fragmentShaderSource = `#version 300 es
precision highp float;

in vec3 v_color;
out vec4 outColor;

void main() {
  outColor = vec4(v_color, 1.0);
}
`;

function createShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
  if (!success) {
    const info = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error("Shader compile error:\n" + info);
  }

  return shader;
}

function createProgram(gl, vertexShader, fragmentShader) {
  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  const success = gl.getProgramParameter(program, gl.LINK_STATUS);
  if (!success) {
    const info = gl.getProgramInfoLog(program);
    gl.deleteProgram(program);
    throw new Error("Program link error:\n" + info);
  }

  return program;
}

const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
const program = createProgram(gl, vertexShader, fragmentShader);

// ---------------------------------------------------------------
// 4. Buffers & Attributes
// ---------------------------------------------------------------
const positionBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
gl.bufferData(gl.ARRAY_BUFFER, cubePositions, gl.STATIC_DRAW);

const colorBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
gl.bufferData(gl.ARRAY_BUFFER, cubeColors, gl.STATIC_DRAW);

const positionLocation = gl.getAttribLocation(program, "a_position");
const colorLocation = gl.getAttribLocation(program, "a_color");

const modelLocation = gl.getUniformLocation(program, "u_model");
const viewLocation = gl.getUniformLocation(program, "u_view");
const projectionLocation = gl.getUniformLocation(program, "u_projection");

const vao = gl.createVertexArray();
gl.bindVertexArray(vao);

gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
gl.enableVertexAttribArray(positionLocation);
gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);

gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
gl.enableVertexAttribArray(colorLocation);
gl.vertexAttribPointer(colorLocation, 3, gl.FLOAT, false, 0, 0);

gl.bindVertexArray(null);

// ---------------------------------------------------------------
// 5. State
// ---------------------------------------------------------------
function degToRad(degree) {
  return (degree * Math.PI) / 180;
}

const cube = {
  rotationX: 20,
  rotationY: 30
};

const camera = {
  position: [0.0, 1.5, 4.0],
  target: [0.0, 0.0, 0.0],
  up: [0.0, 1.0, 0.0]
};

const projectionState = {
  mode: "perspective",
  fov: 60,
  near: 0.1,
  far: 100.0
};

const clipPresets = [
  { near: 0.1, far: 100 },
  { near: 1.0, far: 20 },
  { near: 2.5, far: 8 }
];
let clipPresetIndex = 0;

let depthEnabled = true;

// Challenge A - Orbit Camera
const orbitState = {
  enabled: false,
  angle: 0,
  radius: 4.0,
  speed: 0.6 // radians per second
};

// ---------------------------------------------------------------
// 6. Model / Projection builders
// ---------------------------------------------------------------
function createModelMatrix(rotationX, rotationY, translation = [0, 0, 0]) {
  const rx = Mat4.rotationX(degToRad(rotationX));
  const ry = Mat4.rotationY(degToRad(rotationY));
  const t = Mat4.translation(translation[0], translation[1], translation[2]);

  let model = Mat4.identity();
  model = Mat4.multiply(model, rx);
  model = Mat4.multiply(model, ry);
  model = Mat4.multiply(model, t);

  return model;
}

function createProjectionMatrix() {
  const aspect = canvas.width / canvas.height;

  if (projectionState.mode === "perspective") {
    return Mat4.perspective(
      degToRad(projectionState.fov),
      aspect,
      projectionState.near,
      projectionState.far
    );
  }

  const size = 2.0;
  return Mat4.orthographic(
    -size * aspect,
    size * aspect,
    -size,
    size,
    projectionState.near,
    projectionState.far
  );
}

// ---------------------------------------------------------------
// 7. Input handling
// ---------------------------------------------------------------
const keys = {};

window.addEventListener("keydown", (event) => {
  const key = event.key.toLowerCase();
  keys[key] = true;

  if (
    event.key.startsWith("Arrow") ||
    event.key === "PageUp" ||
    event.key === "PageDown"
  ) {
    event.preventDefault();
  }

  // Event-based: Projection toggle
  if (key === "p" && !event.repeat) {
    projectionState.mode =
      projectionState.mode === "perspective" ? "orthographic" : "perspective";
  }

  // Event-based: Near/Far preset
  if (key === "n" && !event.repeat) {
    nextClipPreset();
  }

  // Event-based: Depth Test toggle
  if (key === "d" && !event.repeat) {
    depthEnabled = !depthEnabled;
  }

  // Event-based: Reset
  if (key === "r" && !event.repeat) {
    resetScene();
  }

  // Challenge A: Orbit Camera toggle (event-based)
  if (key === "o" && !event.repeat) {
    orbitState.enabled = !orbitState.enabled;
  }
});

window.addEventListener("keyup", (event) => {
  keys[event.key.toLowerCase()] = false;
});

function nextClipPreset() {
  clipPresetIndex = (clipPresetIndex + 1) % clipPresets.length;
  const preset = clipPresets[clipPresetIndex];
  projectionState.near = preset.near;
  projectionState.far = preset.far;
}

function resetScene() {
  camera.position[0] = 0.0;
  camera.position[1] = 1.5;
  camera.position[2] = 4.0;

  camera.target[0] = 0.0;
  camera.target[1] = 0.0;
  camera.target[2] = 0.0;

  projectionState.mode = "perspective";
  projectionState.fov = 60;
  projectionState.near = 0.1;
  projectionState.far = 100.0;
  clipPresetIndex = 0;

  depthEnabled = true;
  orbitState.enabled = false;
  orbitState.angle = 0;
}

// ---------------------------------------------------------------
// 8. Per-frame updates
// ---------------------------------------------------------------
const cameraSpeed = 2.0;
const fovSpeed = 35.0;
const targetSpeed = 1.5;

function updateCube(dt) {
  cube.rotationX += 25 * dt;
  cube.rotationY += 40 * dt;

  extraCubeState.forEach((state, i) => {
    state.rotationX += extraCubes[i].rotationSpeedX * dt;
    state.rotationY += extraCubes[i].rotationSpeedY * dt;
  });
}

function updateCamera(dt) {
  // State-based camera movement (disabled while orbit mode drives the camera)
  if (!orbitState.enabled) {
    if (keys["arrowleft"]) camera.position[0] -= cameraSpeed * dt;
    if (keys["arrowright"]) camera.position[0] += cameraSpeed * dt;
    if (keys["arrowup"]) camera.position[1] += cameraSpeed * dt;
    if (keys["arrowdown"]) camera.position[1] -= cameraSpeed * dt;
    if (keys["w"]) camera.position[2] -= cameraSpeed * dt;
    if (keys["s"]) camera.position[2] += cameraSpeed * dt;
  } else {
    // Challenge A - Orbit Camera
    orbitState.angle += orbitState.speed * dt;
    camera.position[0] = Math.cos(orbitState.angle) * orbitState.radius;
    camera.position[2] = Math.sin(orbitState.angle) * orbitState.radius;
  }

  // Challenge B - Camera Height Control (PageUp / PageDown)
  if (keys["pageup"]) camera.position[1] += cameraSpeed * dt;
  if (keys["pagedown"]) camera.position[1] -= cameraSpeed * dt;

  // Challenge C - Target Control (I/K = Y, J/L = X)
  if (keys["i"]) camera.target[1] += targetSpeed * dt;
  if (keys["k"]) camera.target[1] -= targetSpeed * dt;
  if (keys["j"]) camera.target[0] -= targetSpeed * dt;
  if (keys["l"]) camera.target[0] += targetSpeed * dt;
}

function updateFOV(dt) {
  if (keys["["]) projectionState.fov -= fovSpeed * dt;
  if (keys["]"]) projectionState.fov += fovSpeed * dt;

  projectionState.fov = Math.max(30, Math.min(100, projectionState.fov));
}

// ---------------------------------------------------------------
// 9. HUD
// ---------------------------------------------------------------
const projectionInfo = document.getElementById("projectionInfo");
const cameraInfo = document.getElementById("cameraInfo");
const targetInfo = document.getElementById("targetInfo");
const fovInfo = document.getElementById("fovInfo");
const clipInfo = document.getElementById("clipInfo");
const depthInfo = document.getElementById("depthInfo");
const orbitInfo = document.getElementById("orbitInfo");

function fmt(v) {
  return v.toFixed(2);
}

function updateHUD() {
  projectionInfo.textContent = projectionState.mode;

  cameraInfo.textContent =
    `(${fmt(camera.position[0])}, ${fmt(camera.position[1])}, ${fmt(camera.position[2])})`;

  targetInfo.textContent =
    `(${fmt(camera.target[0])}, ${fmt(camera.target[1])}, ${fmt(camera.target[2])})`;

  fovInfo.textContent = `${projectionState.fov.toFixed(1)}°`;
  clipInfo.textContent = `${projectionState.near} / ${projectionState.far}`;
  depthInfo.textContent = depthEnabled ? "ON" : "OFF";
  orbitInfo.textContent = orbitState.enabled ? "ON" : "OFF";
}

// ---------------------------------------------------------------
// 10. Draw
// ---------------------------------------------------------------
function drawCube(model, view, projection) {
  gl.uniformMatrix4fv(modelLocation, false, model);
  gl.uniformMatrix4fv(viewLocation, false, view);
  gl.uniformMatrix4fv(projectionLocation, false, projection);
  gl.drawArrays(gl.TRIANGLES, 0, 36);
}

// ---------------------------------------------------------------
// 11. Render loop
// ---------------------------------------------------------------
let lastTime = 0;

function render(time) {
  let dt = (time - lastTime) * 0.001;
  lastTime = time;
  dt = Math.min(dt, 0.05);

  updateCube(dt);
  updateCamera(dt);
  updateFOV(dt);

  if (depthEnabled) {
    gl.enable(gl.DEPTH_TEST);
  } else {
    gl.disable(gl.DEPTH_TEST);
  }

  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0.03, 0.05, 0.1, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  gl.useProgram(program);
  gl.bindVertexArray(vao);

  const view = Mat4.lookAt(camera.position, camera.target, camera.up);
  const projection = createProjectionMatrix();

  // Main cube (Milestones 1-9)
  const model = createModelMatrix(cube.rotationX, cube.rotationY);
  drawCube(model, view, projection);

  // Challenge E - Multiple Cube Depth Test: two extra cubes at
  // different depths, spinning at their own rate.
  extraCubes.forEach((c, i) => {
    const state = extraCubeState[i];
    const extraModel = createModelMatrix(state.rotationX, state.rotationY, c.position);
    drawCube(extraModel, view, projection);
  });

  gl.bindVertexArray(null);

  updateHUD();
  requestAnimationFrame(render);
}

requestAnimationFrame(render);