// WebGL Primitive Playground. Semua interaksi dan rendering tetap memakai JS + WebGL.
const canvas = document.getElementById("glCanvas");
const gl = canvas.getContext("webgl2");
if (!gl) throw new Error("WebGL2 tidak tersedia.");

const ui = {
  type: document.getElementById("primitiveType"), mode: document.getElementById("drawMode"),
  speed: document.getElementById("speed"), speedValue: document.getElementById("speedValue"),
  pause: document.getElementById("pauseButton"), reset: document.getElementById("resetButton"),
  clear: document.getElementById("clearButton"), grid: document.getElementById("gridToggle"),
  fps: document.getElementById("fpsValue"), count: document.getElementById("countValue"),
  modeHud: document.getElementById("modeValue"), mouse: document.getElementById("mouseValue"),
};

gl.viewport(0, 0, canvas.width, canvas.height);
gl.clearColor(0.02, 0.04, 0.09, 1);

const vertexSource = `#version 300 es
in vec2 a_position; in vec3 a_color;
out vec3 v_color;
void main() { gl_Position = vec4(a_position, 0.0, 1.0); gl_PointSize = 10.0; v_color = a_color; }`;
const fragmentSource = `#version 300 es
precision highp float;
in vec3 v_color; out vec4 outColor;
void main() { outColor = vec4(v_color, 1.0); }`;

function makeShader(type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source); gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader));
  return shader;
}
function makeProgram() {
  const program = gl.createProgram();
  gl.attachShader(program, makeShader(gl.VERTEX_SHADER, vertexSource));
  gl.attachShader(program, makeShader(gl.FRAGMENT_SHADER, fragmentSource));
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
  return program;
}

const program = makeProgram();
const positionBuffer = gl.createBuffer();
const colorBuffer = gl.createBuffer();
gl.useProgram(program);
const positionLocation = gl.getAttribLocation(program, "a_position");
const colorLocation = gl.getAttribLocation(program, "a_color");

// Template lokal berpusat di (0, 0); posisi akhir diperoleh dengan offset.
function templateFor(type) {
  if (type === "rectangle") return [-.16,-.11, .16,-.11, -.16,.11, -.16,.11, .16,-.11, .16,.11];
  if (type === "line") return [-.17,-.12, -.08,.12, 0,-.02, .09,.13, .17,-.1];
  if (type === "points") {
    const points = [];
    for (let i = 0; i < 18; i += 1) { const a = i / 18 * Math.PI * 2; points.push(Math.cos(a) * .16, Math.sin(a) * .16); }
    return points;
  }
  return [0,.16, -.15,-.12, .15,-.12]; // triangle
}

const palette = {
  red: [1,.25,.32], green: [.28,1,.55], blue: [.28,.55,1], cyan: [.2,.9,1], random: [1,.65,.15],
};
let selectedColor = palette.cyan;
let paused = false;
let spawned = [];
let mouseNdc = [0, 0];
const keys = {};

// Objek ini bergerak otomatis dan memantul pada batas X serta Y canvas/NDC.
const bouncers = [
  { type: "triangle", mode: "TRIANGLES", x: -.62, y: .40, vx: .006, vy: .004, color: palette.cyan },
  { type: "line", mode: "LINE_STRIP", x: .35, y: .43, vx: -.004, vy: .006, color: palette.green },
  { type: "triangle", mode: "TRIANGLES", x: .12, y: -.15, vx: .005, vy: -.004, color: palette.red },
];

// Primitive terpilih digerakkan dengan Arrow/WASD secara state-based.
const controlled = { type: "rectangle", mode: "TRIANGLES", x: -.48, y: -.63, color: selectedColor };

function colorsFor(vertexCount, color) {
  const data = [];
  for (let i = 0; i < vertexCount; i += 1) {
    const factor = .65 + (i % 3) * .18; // variasi kecil menghasilkan gradasi vertex.
    data.push(Math.min(1, color[0] * factor), Math.min(1, color[1] * factor), Math.min(1, color[2] * factor));
  }
  return new Float32Array(data);
}

function modeToGl(mode) {
  return { TRIANGLES: gl.TRIANGLES, LINE_STRIP: gl.LINE_STRIP, POINTS: gl.POINTS }[mode];
}

function drawPrimitive(item) {
  const local = templateFor(item.type);
  const vertices = new Float32Array(local.length);
  for (let i = 0; i < local.length; i += 2) { vertices[i] = local[i] + item.x; vertices[i + 1] = local[i + 1] + item.y; }

  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.DYNAMIC_DRAW);
  gl.enableVertexAttribArray(positionLocation);
  gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, colorsFor(vertices.length / 2, item.color), gl.DYNAMIC_DRAW);
  gl.enableVertexAttribArray(colorLocation);
  gl.vertexAttribPointer(colorLocation, 3, gl.FLOAT, false, 0, 0);
  gl.drawArrays(modeToGl(item.mode), 0, vertices.length / 2);
}

function drawGrid() {
  if (!ui.grid.checked) return;
  const grid = [];
  for (let i = -1; i <= 1.001; i += .2) grid.push(i,-1, i,1, -1,i, 1,i);
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(grid), gl.DYNAMIC_DRAW);
  gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, colorsFor(grid.length / 2, [.08,.22,.34]), gl.DYNAMIC_DRAW);
  gl.vertexAttribPointer(colorLocation, 3, gl.FLOAT, false, 0, 0);
  gl.drawArrays(gl.LINES, 0, grid.length / 2);
}

function update() {
  if (paused) return;
  const scale = Number(ui.speed.value);
  for (const item of bouncers) {
    item.x += item.vx * scale; item.y += item.vy * scale;
    // Radius template ~0.17: pantul pada empat batas NDC.
    if (item.x > .83 || item.x < -.83) { item.vx *= -1; item.x = Math.max(-.83, Math.min(.83, item.x)); }
    if (item.y > .83 || item.y < -.83) { item.vy *= -1; item.y = Math.max(-.83, Math.min(.83, item.y)); }
  }
  const move = .016;
  if (keys.ArrowLeft || keys.a) controlled.x -= move;
  if (keys.ArrowRight || keys.d) controlled.x += move;
  if (keys.ArrowUp || keys.w) controlled.y += move;
  if (keys.ArrowDown || keys.s) controlled.y -= move;
  controlled.x = Math.max(-.83, Math.min(.83, controlled.x));
  controlled.y = Math.max(-.83, Math.min(.83, controlled.y));
}

function drawScene() {
  drawGrid();
  bouncers.forEach(drawPrimitive);
  drawPrimitive(controlled);
  spawned.forEach(drawPrimitive);
}

let lastFpsTime = performance.now(), frames = 0;
function render(now) {
  update();
  gl.clear(gl.COLOR_BUFFER_BIT);
  drawScene();
  frames += 1;
  if (now - lastFpsTime > 500) { ui.fps.textContent = Math.round(frames * 1000 / (now - lastFpsTime)); frames = 0; lastFpsTime = now; }
  ui.count.textContent = bouncers.length + 1 + spawned.length;
  ui.modeHud.textContent = controlled.mode;
  requestAnimationFrame(render);
}

function reset() {
  controlled.x = -.48; controlled.y = -.63; spawned = []; paused = false;
  ui.pause.textContent = "Pause (P)";
}

ui.type.addEventListener("change", () => { controlled.type = ui.type.value; });
ui.mode.addEventListener("change", () => { controlled.mode = ui.mode.value; });
ui.speed.addEventListener("input", () => { ui.speedValue.textContent = Number(ui.speed.value).toFixed(2); });
ui.pause.addEventListener("click", () => { paused = !paused; ui.pause.textContent = paused ? "Resume (P)" : "Pause (P)"; });
ui.reset.addEventListener("click", reset);
ui.clear.addEventListener("click", () => { spawned = []; });
document.querySelectorAll("[data-color]").forEach((button) => button.addEventListener("click", () => {
  selectedColor = button.dataset.color === "random" ? [Math.random(), Math.random(), Math.random()] : palette[button.dataset.color];
  controlled.color = selectedColor;
}));

window.addEventListener("keydown", (event) => {
  if (["ArrowLeft","ArrowRight","ArrowUp","ArrowDown"].includes(event.key)) event.preventDefault();
  keys[event.key] = true; keys[event.key.toLowerCase()] = true;
  if (event.key.toLowerCase() === "p" && !event.repeat) ui.pause.click();
  if (event.key.toLowerCase() === "r" && !event.repeat) reset();
});
window.addEventListener("keyup", (event) => { keys[event.key] = false; keys[event.key.toLowerCase()] = false; });

canvas.addEventListener("mousemove", (event) => {
  const rect = canvas.getBoundingClientRect();
  mouseNdc = [(event.clientX - rect.left) / rect.width * 2 - 1, 1 - (event.clientY - rect.top) / rect.height * 2];
  ui.mouse.textContent = `(${mouseNdc[0].toFixed(2)}, ${mouseNdc[1].toFixed(2)})`;
});
canvas.addEventListener("click", (event) => {
  if (event.button !== 0) return;
  spawned.push({ type: controlled.type, mode: controlled.mode, x: mouseNdc[0], y: mouseNdc[1], color: [...controlled.color] });
});
canvas.addEventListener("contextmenu", (event) => { event.preventDefault(); spawned.pop(); });

render(performance.now());
