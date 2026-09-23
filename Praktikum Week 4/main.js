import { Mat4 } from "./math3d.js";

// ---------------------------------------------------------------
// 1. Cube Geometry (36 vertex, tanpa index buffer)
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
// These are only drawn on the main canvas, not in the split-view panes.
const extraCubes = [
  { position: [-1.6, 0.0, -1.5], rotationSpeedX: 15, rotationSpeedY: -30 },
  { position: [1.6, 0.0, 1.2], rotationSpeedX: -20, rotationSpeedY: 25 }
];
const extraCubeState = extraCubes.map(() => ({ rotationX: 0, rotationY: 0 }));

// ---------------------------------------------------------------
// 2. Shaders
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

// ---------------------------------------------------------------
// 3. Reusable "scene" factory
//
// Each <canvas> needs its own WebGL2 context, program, buffers, and
// VAO — GL resources are never shared across contexts. This factory
// sets all of that up so the main canvas and the two Challenge D
// split-view canvases can each get their own scene from one place,
// instead of duplicating setup code three times.
// ---------------------------------------------------------------
function createScene(canvas) {
  const gl = canvas.getContext("webgl2");

  if (!gl) {
    throw new Error("WebGL2 tidak tersedia.");
  }

  const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
  const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
  const program = createProgram(gl, vertexShader, fragmentShader);

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

  return {
    canvas,
    gl,
    program,
    vao,
    modelLocation,
    viewLocation,
    projectionLocation
  };
}

function drawCubeIn(scene, model, view, projection) {
  const { gl } = scene;
  gl.useProgram(scene.program);
  gl.bindVertexArray(scene.vao);

  gl.uniformMatrix4fv(scene.modelLocation, false, model);
  gl.uniformMatrix4fv(scene.viewLocation, false, view);
  gl.uniformMatrix4fv(scene.projectionLocation, false, projection);
  gl.drawArrays(gl.TRIANGLES, 0, 36);

  gl.bindVertexArray(null);
}

function clearScene(scene, depthEnabledForScene) {
  const { gl, canvas } = scene;

  if (depthEnabledForScene) {
    gl.enable(gl.DEPTH_TEST);
  } else {
    gl.disable(gl.DEPTH_TEST);
  }

  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0.03, 0.05, 0.1, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
}

// ---------------------------------------------------------------
// 4. Scenes: main canvas + Challenge D split-view canvases
// ---------------------------------------------------------------
const mainCanvas = document.getElementById("glCanvas");
const mainScene = createScene(mainCanvas);

const splitSection = document.getElementById("splitSection");
const leftCanvas = document.getElementById("glCanvasLeft");
const rightCanvas = document.getElementById("glCanvasRight");
const leftScene = createScene(leftCanvas);
const rightScene = createScene(rightCanvas);

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

// Challenge D - Projection Comparison Split Mode
let splitModeEnabled = false;

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

function perspectiveFor(canvas) {
  const aspect = canvas.width / canvas.height;
  return Mat4.perspective(
    degToRad(projectionState.fov),
    aspect,
    projectionState.near,
    projectionState.far
  );
}

function orthographicFor(canvas) {
  const aspect = canvas.width / canvas.height;
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

function createProjectionMatrix() {
  return projectionState.mode === "perspective"
    ? perspectiveFor(mainCanvas)
    : orthographicFor(mainCanvas);
}

// ---------------------------------------------------------------
// 7. Input handling
// ---------------------------------------------------------------
const keys = {};

const fovPresets = { "1": 35, "2": 60, "3": 90 };

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

  // Challenge D: Split projection view toggle (event-based)
  if (key === "v" && !event.repeat) {
    splitModeEnabled = !splitModeEnabled;
    splitSection.classList.toggle("hidden", !splitModeEnabled);
  }

  // Challenge F: FOV presets (event-based)
  if (fovPresets[event.key] && !event.repeat) {
    projectionState.fov = fovPresets[event.key];
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

  splitModeEnabled = false;
  splitSection.classList.add("hidden");
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
const splitInfo = document.getElementById("splitInfo");

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
  splitInfo.textContent = splitModeEnabled ? "ON" : "OFF";
}

// ---------------------------------------------------------------
// 10. Render loop
// ---------------------------------------------------------------
let lastTime = 0;

function render(time) {
  let dt = (time - lastTime) * 0.001;
  lastTime = time;
  dt = Math.min(dt, 0.05);

  updateCube(dt);
  updateCamera(dt);
  updateFOV(dt);

  const view = Mat4.lookAt(camera.position, camera.target, camera.up);
  const model = createModelMatrix(cube.rotationX, cube.rotationY);

  // --- Main canvas ---
  clearScene(mainScene, depthEnabled);
  const mainProjection = createProjectionMatrix();
  drawCubeIn(mainScene, model, view, mainProjection);

  // Challenge E - Multiple Cube Depth Test: two extra cubes at
  // different depths, spinning at their own rate.
  extraCubes.forEach((c, i) => {
    const state = extraCubeState[i];
    const extraModel = createModelMatrix(state.rotationX, state.rotationY, c.position);
    drawCubeIn(mainScene, extraModel, view, mainProjection);
  });

  // --- Challenge D: split-view canvases, same model + camera state ---
  if (splitModeEnabled) {
    clearScene(leftScene, depthEnabled);
    drawCubeIn(leftScene, model, view, perspectiveFor(leftCanvas));

    clearScene(rightScene, depthEnabled);
    drawCubeIn(rightScene, model, view, orthographicFor(rightCanvas));
  }

  updateHUD();
  requestAnimationFrame(render);
}

requestAnimationFrame(render);