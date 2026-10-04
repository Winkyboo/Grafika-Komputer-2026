import { Mat4, normalMatrix } from './math3d.js';

// --- Inisialisasi WebGL ---
const canvas = document.querySelector('#glCanvas');
const gl = canvas?.getContext('webgl2', { antialias: true });
if (!gl) throw new Error('WebGL2 tidak tersedia di browser ini.');

// --- Shader Sources ---
const vertexSource = `#version 300 es
in vec3 a_position;
in vec3 a_normal;
in vec2 a_texCoord;

uniform mat4 u_model, u_view, u_projection;
uniform mat3 u_normalMatrix;
uniform float u_uvScale;

out vec3 v_worldPosition;
out vec3 v_normal;
out vec2 v_texCoord;

void main() {
  v_worldPosition = world.xyz;
  v_normal = u_normalMatrix * a_normal;
  v_texCoord = a_texCoord * u_uvScale;
  gl_Position = u_projection * u_view * u_model * vec4(a_position, 1.0);
}`;

const fragmentSource = `#version 300 es
precision highp float;

in vec3 v_worldPosition;
in vec3 v_normal;
in vec2 v_texCoord;

uniform vec3 u_lightPosition, u_lightColor, u_cameraPosition;
uniform float u_ambientStrength, u_shininess;
uniform sampler2D u_texture;
uniform bool u_flatShading, u_ambientOn, u_diffuseOn, u_specularOn, u_textureOn;

out vec4 outColor;

void main() {
  vec3 N = normalize(v_normal);
  vec3 L = normalize(u_lightPosition - v_worldPosition);
  vec3 V = normalize(u_cameraPosition - v_worldPosition);

  float diff = max(dot(N, L), 0.0);
  float spec = diff > 0.0 ? pow(max(dot(reflect(-L, N), V), 0.0), u_shininess) : 0.0;
  vec3 tex = u_textureOn ? texture(u_texture, v_texCoord).rgb : vec3(1.0);

  vec3 ambient = u_ambientOn ? u_ambientStrength * tex : vec3(0.0);
  vec3 diffuse = u_diffuseOn ? diff * u_lightColor * tex : vec3(0.0);
  vec3 specular = u_specularOn ? spec * u_lightColor : vec3(0.0);

  outColor = vec4(ambient + diffuse + specular, 1.0);
}`;

function shader(type, source) {
  const item = gl.createShader(type);
  gl.shaderSource(item, source);
  gl.compileShader(item);
  if (!gl.getShaderParameter(item, gl.COMPILE_STATUS)) {
    const message = gl.getShaderInfoLog(item);
    gl.deleteShader(item);
    throw new Error(`Shader gagal dikompilasi: ${message}`);
  }
  return item;
}

const program = gl.createProgram();
gl.attachShader(program, shader(gl.VERTEX_SHADER, vertexSource));
gl.attachShader(program, shader(gl.FRAGMENT_SHADER, fragmentSource));
gl.linkProgram(program);
if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
  throw new Error(`Program shader gagal: ${gl.getProgramInfoLog(program)}`);
}
gl.useProgram(program);

// --- Geometry Helpers & Generators ---
const faceData = [
  { n: [0, 0, 1], p: [[-0.5, -0.5, 0.5], [0.5, -0.5, 0.5], [0.5, 0.5, 0.5], [-0.5, 0.5, 0.5]] },
  { n: [0, 0, -1], p: [[0.5, -0.5, -0.5], [-0.5, -0.5, -0.5], [-0.5, 0.5, -0.5], [0.5, 0.5, -0.5]] },
  { n: [-1, 0, 0], p: [[-0.5, -0.5, -0.5], [-0.5, -0.5, 0.5], [-0.5, 0.5, 0.5], [-0.5, 0.5, -0.5]] },
  { n: [1, 0, 0], p: [[0.5, -0.5, 0.5], [0.5, -0.5, -0.5], [0.5, 0.5, -0.5], [0.5, 0.5, 0.5]] },
  { n: [0, 1, 0], p: [[-0.5, 0.5, 0.5], [0.5, 0.5, 0.5], [0.5, 0.5, -0.5], [-0.5, 0.5, -0.5]] },
  { n: [0, -1, 0], p: [[-0.5, -0.5, -0.5], [0.5, -0.5, -0.5], [0.5, -0.5, 0.5], [-0.5, -0.5, 0.5]] }
];

function addFaceNormals(geometry) {
  geometry.flatNormals = [];
  for (let i = 0; i < geometry.positions.length; i += 9) {
    const p0 = geometry.positions.slice(i, i + 3);
    const p1 = geometry.positions.slice(i + 3, i + 6);
    const p2 = geometry.positions.slice(i + 6, i + 9);

    const a = p1.map((v, j) => v - p0[j]);
    const b = p2.map((v, j) => v - p0[j]);

    let n = [
      a[1] * b[2] - a[2] * b[1],
      a[2] * b[0] - a[0] * b[2],
      a[0] * b[1] - a[1] * b[0]
    ];
    const length = Math.hypot(...n) || 1;
    n = n.map(v => v / length);

    const smooth = geometry.normals.slice(i, i + 3);
    if (n[0] * smooth[0] + n[1] * smooth[1] + n[2] * smooth[2] < 0) {
      n = n.map(v => -v);
    }

    for (let vertex = 0; vertex < 3; vertex++) {
      geometry.flatNormals.push(...n);
    }
  }
  return geometry;
}

function cubeGeometry() {
  const geometry = { positions: [], normals: [], uvs: [] };
  const corners = [0, 1, 2, 0, 2, 3];
  const faceUV = [[0, 0], [1, 0], [1, 1], [0, 1]];

  for (const face of faceData) {
    for (const idx of corners) {
      const p = face.p[idx];
      const length = Math.hypot(...p);
      geometry.positions.push(...p);
      geometry.normals.push(p[0] / length, p[1] / length, p[2] / length);
      geometry.uvs.push(...faceUV[idx]);
    }
  }
  return addFaceNormals(geometry);
}

function surfaceGeometry(type) {
  const geometry = { positions: [], normals: [], uvs: [] };
  const normalize = v => {
    const length = Math.hypot(...v) || 1;
    return v.map(n => n / length);
  };
  const sub = (a, b) => a.map((n, i) => n - b[i]);
  const cross = (a, b) => [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0]
  ];

  const point = (u, v) => {
    if (type === 'sphere') {
      const lon = u * Math.PI * 2;
      const lat = (v - 0.5) * Math.PI;
      const r = 0.72;
      return [
        r * Math.cos(lat) * Math.cos(lon),
        r * Math.sin(lat),
        r * Math.cos(lat) * Math.sin(lon)
      ];
    }
    if (type === 'torus') {
      const a = u * Math.PI * 2;
      const b = v * Math.PI * 2;
      const R = 0.52;
      const r = 0.2;
      return [
        (R + r * Math.cos(b)) * Math.cos(a),
        (R + r * Math.cos(b)) * Math.sin(a),
        r * Math.sin(b)
      ];
    }

    const t = u * Math.PI * 2, p = 2, q = 3, R = 0.48, radial = 0.19, tube = 0.13;
    const curve = a => {
      const ripple = radial * Math.cos(q * a);
      return [
        (R + ripple) * Math.cos(p * a),
        (R + ripple) * Math.sin(p * a),
        radial * Math.sin(q * a)
      ];
    };
    const center = curve(t);
    const tangent = normalize(sub(curve(t + 0.001), curve(t - 0.001)));
    const reference = Math.abs(tangent[2]) > 0.92 ? [0, 1, 0] : [0, 0, 1];
    const frame = normalize(cross(tangent, reference));
    const side = normalize(cross(tangent, frame));
    const angle = v * Math.PI * 2;

    return center.map((n, i) => n + tube * (Math.cos(angle) * frame[i] + Math.sin(angle) * side[i]));
  };

  const normal = (u, v, pos) => {
    if (type === 'sphere') return normalize(pos);
    if (type === 'torus') {
      const a = u * Math.PI * 2;
      const b = v * Math.PI * 2;
      return normalize([Math.cos(b) * Math.cos(a), Math.cos(b) * Math.sin(a), Math.sin(b)]);
    }

    const t = u * Math.PI * 2, p = 2, q = 3, R = 0.48, radial = 0.19, tube = 0.13;
    const curve = a => {
      const ripple = radial * Math.cos(q * a);
      return [
        (R + ripple) * Math.cos(p * a),
        (R + ripple) * Math.sin(p * a),
        radial * Math.sin(q * a)
      ];
    };
    const tangent = normalize(sub(curve(t + 0.001), curve(t - 0.001)));
    const reference = Math.abs(tangent[2]) > 0.92 ? [0, 1, 0] : [0, 0, 1];
    const frame = normalize(cross(tangent, reference));
    const side = normalize(cross(tangent, frame));
    const angle = v * Math.PI * 2;

    return normalize([
      Math.cos(angle) * frame[0] + Math.sin(angle) * side[0],
      Math.cos(angle) * frame[1] + Math.sin(angle) * side[1],
      Math.cos(angle) * frame[2] + Math.sin(angle) * side[2]
    ]);
  };

  const uSegments = type === 'torusKnot' ? 180 : 48;
  const vSegments = type === 'sphere' ? 32 : 20;

  for (let y = 0; y < vSegments; y++) {
    for (let x = 0; x < uSegments; x++) {
      const u0 = x / uSegments, u1 = (x + 1) / uSegments;
      const v0 = y / vSegments, v1 = (y + 1) / vSegments;
      const corners = [[u0, v0], [u1, v0], [u1, v1], [u0, v1]];
      const indices = [0, 1, 2, 0, 2, 3];

      for (const index of indices) {
        const [u, v] = corners[index];
        const pos = point(u, v);
        geometry.positions.push(...pos);
        geometry.normals.push(...normal(u, v, pos));
        geometry.uvs.push(u, v);
      }
    }
  }
  return addFaceNormals(geometry);
}

// --- Buffer Setup ---
let geometry = cubeGeometry();
let vertexCount = geometry.positions.length / 3;

const positionBuffer = gl.createBuffer();
const normalBuffer = gl.createBuffer();
const uvBuffer = gl.createBuffer();

function bindAttribute(name, buffer, size) {
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  const location = gl.getAttribLocation(program, name);
  gl.enableVertexAttribArray(location);
  gl.vertexAttribPointer(location, size, gl.FLOAT, false, 0, 0);
}

bindAttribute('a_position', positionBuffer, 3);
bindAttribute('a_normal', normalBuffer, 3);
bindAttribute('a_texCoord', uvBuffer, 2);

function uploadGeometry(next, flatMode = false) {
  geometry = next;
  vertexCount = geometry.positions.length / 3;

  const buffers = [
    [positionBuffer, geometry.positions],
    [normalBuffer, flatMode ? geometry.flatNormals : geometry.normals],
    [uvBuffer, geometry.uvs]
  ];

  for (const [buffer, data] of buffers) {
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);
  }
}
uploadGeometry(geometry);

// --- Texture Functions ---
function makeCheckerTexture(mode = 'checker') {
  const size = 128, cells = 8;
  const data = new Uint8Array(size * size * 4);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const check = (Math.floor(x / (size / cells)) + Math.floor(y / (size / cells))) % 2;
      const mix = x / size;
      const color = mode === 'stripes'
        ? (Math.floor(x / 12) % 2 ? [255, 126, 93] : [87, 217, 232])
        : mode === 'gradient'
          ? [Math.round(87 + 150 * mix), Math.round(217 - 70 * mix), Math.round(232 - 90 * mix)]
          : check
            ? [242, 105, 145]
            : [37, 191, 210];

      const k = (y * size + x) * 4;
      data.set([...color, 255], k);
    }
  }

  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, size, size, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
  gl.generateMipmap(gl.TEXTURE_2D);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
  return tex;
}

function installImageTexture(image) {
  const next = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, next);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
  gl.generateMipmap(gl.TEXTURE_2D);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
  gl.deleteTexture(texture);
  texture = next;
}

function loadImageTexture(source, onSuccess, onFailure) {
  const image = new Image();
  image.onload = () => {
    installImageTexture(image);
    onSuccess?.();
  };
  image.onerror = () => onFailure?.();
  image.src = source;
}

gl.activeTexture(gl.TEXTURE0);
let texture = makeCheckerTexture();

// --- Uniforms & Initial Setup ---
const uniforms = {};
const uniformList = [
  'u_model', 'u_view', 'u_projection', 'u_normalMatrix',
  'u_lightPosition', 'u_lightColor', 'u_cameraPosition',
  'u_ambientStrength', 'u_shininess', 'u_texture', 'u_uvScale',
  'u_flatShading', 'u_ambientOn', 'u_diffuseOn', 'u_specularOn', 'u_textureOn'
];
for (const name of uniformList) {
  uniforms[name] = gl.getUniformLocation(program, name);
}

gl.uniform1i(uniforms.u_texture, 0);
gl.uniform3f(uniforms.u_lightColor, 1, 0.94, 0.82);
gl.enable(gl.DEPTH_TEST);
gl.disable(gl.CULL_FACE);

// --- State & HUD ---
const state = {
  angleX: -0.36,
  angleY: 0.58,
  light: [1.8, 1.5, 2.3],
  flat: false,
  textureOn: true,
  filterMode: 'linear',
  wrap: 0,
  uvScale: 1,
  shininess: 32,
  ambient: 0.18,
  ambientOn: true,
  diffuseOn: true,
  specularOn: true,
  nonUniform: false,
  scale: [1, 1, 1],
  cameraPosition: [0, 0, 3.2],
  cameraOrbit: false,
  lightOrbit: false,
  rotation: true,
  textureSource: 'checker',
  objectType: 'cube'
};

const $ = s => document.querySelector(s);
const hud = {
  shading: $('#shadingInfo'),
  filter: $('#filterInfo'),
  wrap: $('#wrapInfo'),
  uv: $('#uvInfo'),
  shininess: $('#shininessInfo'),
  light: $('#lightInfo'),
  ambient: $('#ambientInfo')
};

function updateHUD() {
  if (hud.shading) hud.shading.textContent = state.flat ? 'Flat' : 'Smooth';
  if (hud.filter) hud.filter.textContent = state.filterMode.toUpperCase();
  if (hud.wrap) hud.wrap.textContent = ['REPEAT', 'CLAMP_TO_EDGE', 'MIRRORED_REPEAT'][state.wrap];
  if (hud.uv) hud.uv.textContent = `${state.uvScale.toFixed(1)}×`;
  if (hud.shininess) hud.shininess.textContent = String(state.shininess);
  if (hud.light) hud.light.textContent = state.light.map(v => v.toFixed(1)).join(', ');
  if (hud.ambient) hud.ambient.textContent = state.ambient.toFixed(2);

  const set = (id, value) => {
    const el = $(`#${id}`);
    if (el) el.value = String(value);
  };
  set('ambientControl', state.ambient);
  set('shininessControl', state.shininess);
  set('lightX', state.light[0]);
  set('lightY', state.light[1]);
  set('lightZ', state.light[2]);
  set('scaleX', state.scale[0]);
  set('scaleY', state.scale[1]);
  set('scaleZ', state.scale[2]);

  const textValues = [
    ['ambientValue', state.ambient.toFixed(2)],
    ['shininessValue', state.shininess],
    ['lightXValue', state.light[0].toFixed(1)],
    ['lightYValue', state.light[1].toFixed(1)],
    ['lightZValue', state.light[2].toFixed(1)]
  ];
  for (const [id, value] of textValues) {
    const el = $(`#${id}`);
    if (el) el.textContent = value;
  }

  const setActive = (id, value) => {
    const el = $(`#${id}`);
    if (el) el.checked = value;
  };
  setActive('ambientToggle', state.ambientOn);
  setActive('diffuseToggle', state.diffuseOn);
  setActive('specularToggle', state.specularOn);

  const setSelect = (id, value) => {
    const el = $(`#${id}`);
    if (el) el.value = value;
  };
  setSelect('filterSelect', state.filterMode);
  setSelect('wrapSelect', ['repeat', 'clamp', 'mirror'][state.wrap]);

  const textureButton = $('#filterToggle');
  if (textureButton) {
    textureButton.textContent = `Texture: ${state.textureOn ? 'ON' : 'OFF'} (T)`;
    textureButton.classList.toggle('active-control', state.textureOn);
  }

  const lightButton = $('#lightOrbitToggle');
  const cameraButton = $('#cameraOrbitToggle');
  const rotationButton = $('#rotationToggle');

  if (lightButton) {
    lightButton.textContent = `Light Orbit: ${state.lightOrbit ? 'AUTO' : 'MANUAL'}`;
    lightButton.classList.toggle('active-control', state.lightOrbit);
  }
  if (cameraButton) {
    cameraButton.classList.toggle('active-control', state.cameraOrbit);
  }
  if (rotationButton) {
    rotationButton.textContent = state.rotation ? 'Stop Object Rotation (P)' : 'Resume Object Rotation (P)';
  }
}

// --- Render Loop & Resize ---
function resize() {
  const dpr = Math.min(devicePixelRatio || 1, 2);
  const w = Math.round(canvas.clientWidth * dpr);
  const h = Math.round(canvas.clientHeight * dpr);
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
  gl.viewport(0, 0, canvas.width, canvas.height);
}

let previousFrame = 0;
let spin = 0;
const cameraKeys = new Set();

function updateCamera(dt) {
  if (state.cameraOrbit) return;
  const speed = 2.2 * dt;
  if (cameraKeys.has('j')) state.cameraPosition[0] -= speed;
  if (cameraKeys.has('l')) state.cameraPosition[0] += speed;
  if (cameraKeys.has('i')) state.cameraPosition[1] += speed;
  if (cameraKeys.has('k')) state.cameraPosition[1] -= speed;
  if (cameraKeys.has('q')) state.cameraPosition[2] = Math.max(1.35, state.cameraPosition[2] - speed);
  if (cameraKeys.has('e')) state.cameraPosition[2] = Math.min(8, state.cameraPosition[2] + speed);
}

function render(time) {
  resize();
  gl.clearColor(0.018, 0.035, 0.075, 1);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  const dt = previousFrame ? Math.min((time - previousFrame) / 1000, 0.05) : 0;
  updateCamera(dt);
  if (state.rotation) spin += dt * 0.22;
  previousFrame = time;

  const model = Mat4.multiply(Mat4.rotationY(state.angleY + spin), Mat4.rotationX(state.angleX));
  const modelScaled = Mat4.multiply(model, Mat4.scale(...state.scale));

  const orbitRadius = Math.hypot(state.cameraPosition[0], state.cameraPosition[2]);
  const camera = state.cameraOrbit
    ? [Math.sin(time * 0.00035) * orbitRadius, state.cameraPosition[1], Math.cos(time * 0.00035) * orbitRadius]
    : state.cameraPosition;

  if (state.lightOrbit) {
    state.light[0] = Math.cos(time * 0.0006) * 2.6;
    state.light[2] = Math.sin(time * 0.0006) * 2.6;
  }

  gl.uniformMatrix4fv(uniforms.u_model, false, modelScaled);
  gl.uniformMatrix4fv(uniforms.u_view, false, Mat4.lookAt(camera, [0, 0, 0], [0, 1, 0]));
  gl.uniformMatrix4fv(uniforms.u_projection, false, Mat4.perspective(Math.PI / 4, canvas.width / canvas.height, 0.1, 100));
  gl.uniformMatrix3fv(uniforms.u_normalMatrix, false, normalMatrix(modelScaled));

  gl.uniform3fv(uniforms.u_lightPosition, state.light);
  gl.uniform3fv(uniforms.u_cameraPosition, camera);
  gl.uniform1f(uniforms.u_ambientStrength, state.ambient);
  gl.uniform1f(uniforms.u_shininess, state.shininess);
  gl.uniform1f(uniforms.u_uvScale, state.uvScale);
  gl.uniform1i(uniforms.u_flatShading, state.flat);
  gl.uniform1i(uniforms.u_ambientOn, state.ambientOn);
  gl.uniform1i(uniforms.u_diffuseOn, state.diffuseOn);
  gl.uniform1i(uniforms.u_specularOn, state.specularOn);
  gl.uniform1i(uniforms.u_textureOn, state.textureOn);

  if (state.lightOrbit) updateHUD();

  gl.bindTexture(gl.TEXTURE_2D, texture);
  const minFilter = state.filterMode === 'nearest'
    ? gl.NEAREST
    : state.filterMode === 'nearest_mipmap_nearest'
      ? gl.NEAREST_MIPMAP_NEAREST
      : state.filterMode === 'linear_mipmap_linear'
        ? gl.LINEAR_MIPMAP_LINEAR
        : gl.LINEAR;

  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, minFilter);
  gl.texParameteri(
    gl.TEXTURE_2D,
    gl.TEXTURE_MAG_FILTER,
    state.filterMode === 'nearest' || state.filterMode === 'nearest_mipmap_nearest' ? gl.NEAREST : gl.LINEAR
  );

  const wrap = [gl.REPEAT, gl.CLAMP_TO_EDGE, gl.MIRRORED_REPEAT][state.wrap];
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrap);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrap);

  gl.drawArrays(gl.TRIANGLES, 0, vertexCount);
  requestAnimationFrame(render);
}

function reset() {
  Object.assign(state, {
    angleX: -0.36,
    angleY: 0.58,
    light: [1.8, 1.5, 2.3],
    flat: false,
    textureOn: true,
    filterMode: 'linear',
    wrap: 0,
    uvScale: 1,
    shininess: 32,
    ambient: 0.18,
    ambientOn: true,
    diffuseOn: true,
    specularOn: true,
    scale: [1, 1, 1],
    cameraPosition: [0, 0, 3.2],
    cameraOrbit: false,
    lightOrbit: false,
    rotation: true,
    textureSource: 'checker',
    objectType: 'cube'
  });
  cameraKeys.clear();
  spin = 0;
  previousFrame = 0;
  uploadGeometry(cubeGeometry());
  gl.deleteTexture(texture);
  texture = makeCheckerTexture('checker');
  $('#textureSource').value = 'checker';
  $('#imageTextureFile').value = '';
  $('#objectType').value = 'cube';
  updateHUD();
}

// --- Event Listeners ---
window.addEventListener('keydown', e => {
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) {
    e.preventDefault();
  }
  const step = 0.18;
  switch (e.key.toLowerCase()) {
    case 'arrowleft': state.light[0] -= step; break;
    case 'arrowright': state.light[0] += step; break;
    case 'arrowup': state.light[1] += step; break;
    case 'arrowdown': state.light[1] -= step; break;
    case 'w': state.light[2] += step; break;
    case 's': state.light[2] -= step; break;
    case 'f': state.flat = !state.flat; break;
    case 't': state.textureOn = !state.textureOn; break;
    case 'g': state.wrap = (state.wrap + 1) % 3; break;
    case ']': state.uvScale = Math.min(8, state.uvScale + 0.5); break;
    case '[': state.uvScale = Math.max(0.5, state.uvScale - 0.5); break;
    case '+':
    case '=': state.shininess = Math.min(128, state.shininess + 8); break;
    case '-': state.shininess = Math.max(4, state.shininess - 8); break;
    case 'a': state.ambient = Math.min(1, state.ambient + 0.05); break;
    case 'z': state.ambient = Math.max(0, state.ambient - 0.05); break;
    case '1': state.ambientOn = !state.ambientOn; break;
    case '2': state.diffuseOn = !state.diffuseOn; break;
    case '3': state.specularOn = !state.specularOn; break;
    case 'n': state.scale = state.scale.every(v => v === 1) ? [1.35, 0.78, 1] : [1, 1, 1]; break;
    case 'r': reset(); return;
    default: return;
  }
  updateHUD();
});

const listen = (selector, event, fn) => $(selector)?.addEventListener(event, fn);

listen('#ambientControl', 'input', e => {
  state.ambient = Number(e.target.value);
  updateHUD();
});

listen('#shininessControl', 'input', e => {
  state.shininess = Number(e.target.value);
  updateHUD();
});

for (const [axis, id] of [[0, '#lightX'], [1, '#lightY'], [2, '#lightZ']]) {
  listen(id, 'input', e => {
    state.light[axis] = Number(e.target.value);
    updateHUD();
  });
}

for (const [axis, id] of [[0, '#scaleX'], [1, '#scaleY'], [2, '#scaleZ']]) {
  listen(id, 'input', e => {
    state.scale[axis] = Number(e.target.value);
    updateHUD();
  });
}

listen('#shadingToggle', 'click', () => {
  state.flat = !state.flat;
  updateHUD();
});
listen('#filterToggle', 'click', () => {
  state.textureOn = !state.textureOn;
  updateHUD();
});
listen('#lightOrbitToggle', 'click', () => {
  state.lightOrbit = !state.lightOrbit;
  updateHUD();
});
listen('#cameraOrbitToggle', 'click', () => {
  state.cameraOrbit = !state.cameraOrbit;
  updateHUD();
});
listen('#rotationToggle', 'click', () => {
  state.rotation = !state.rotation;
  updateHUD();
});
listen('#resetButton', 'click', reset);

listen('#textureSource', 'change', e => {
  const choice = e.target.value;
  if (choice === 'upload') {
    $('#imageTextureFile').click();
    return;
  }
  if (choice === 'image') {
    loadImageTexture(
      './assets/texture.png',
      () => { state.textureSource = 'image'; },
      () => { $('#textureSource').value = state.textureSource; }
    );
    return;
  }
  state.textureSource = choice;
  gl.deleteTexture(texture);
  texture = makeCheckerTexture(state.textureSource);
});

listen('#imageTextureFile', 'change', e => {
  const file = e.target.files?.[0];
  if (!file) return;
  const url = URL.createObjectURL(file);
  loadImageTexture(
    url,
    () => {
      state.textureSource = 'upload';
      URL.revokeObjectURL(url);
    },
    () => {
      URL.revokeObjectURL(url);
      $('#textureSource').value = state.textureSource;
    }
  );
});

listen('#imageTextureFile', 'cancel', () => {
  $('#textureSource').value = state.textureSource;
});

listen('#filterSelect', 'change', e => {
  state.filterMode = e.target.value;
  updateHUD();
});

listen('#wrapSelect', 'change', e => {
  state.wrap = ['repeat', 'clamp', 'mirror'].indexOf(e.target.value);
  updateHUD();
});

listen('#ambientToggle', 'change', e => {
  state.ambientOn = e.target.checked;
  updateHUD();
});

listen('#diffuseToggle', 'change', e => {
  state.diffuseOn = e.target.checked;
  updateHUD();
});

listen('#specularToggle', 'change', e => {
  state.specularOn = e.target.checked;
  updateHUD();
});

listen('#objectType', 'change', e => {
  state.objectType = e.target.value;
  uploadGeometry(
    state.objectType === 'cube' ? cubeGeometry() : surfaceGeometry(state.objectType),
    state.flat
  );
});

listen('#shadingToggle', 'click', () => uploadGeometry(geometry, state.flat));

window.addEventListener('keydown', e => {
  if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return;
  if (e.key.toLowerCase() === 'f') uploadGeometry(geometry, state.flat);
});

window.addEventListener('keydown', e => {
  if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return;
  const key = e.key.toLowerCase();
  if (['i', 'j', 'k', 'l', 'q', 'e'].includes(key)) {
    cameraKeys.add(key);
    return;
  }
  if (key === 'o') {
    state.cameraOrbit = !state.cameraOrbit;
    updateHUD();
  } else if (key === 'p') {
    state.rotation = !state.rotation;
    updateHUD();
  }
});

window.addEventListener('keyup', e => cameraKeys.delete(e.key.toLowerCase()));
window.addEventListener('blur', () => cameraKeys.clear());
window.addEventListener('keydown', e => {
  if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) {
    e.stopImmediatePropagation();
  }
}, true);

// --- Boot ---
updateHUD();
requestAnimationFrame(render);