// main.js
import {
  Mat3
} from "./matrix3.js";

// =========================================================
// 1. WebGL2 Context Setup
// =========================================================

const canvas =
  document.getElementById(
    "glCanvas"
  );

const gl =
  canvas.getContext(
    "webgl2"
  );

if (!gl) {
  throw new Error(
    "WebGL2 tidak tersedia."
  );
}

gl.viewport(
  0,
  0,
  canvas.width,
  canvas.height
);

// =========================================================
// 2. Shader Sources
// =========================================================

const vertexShaderSource = `#version 300 es

in vec2 a_position;

uniform mat3 u_matrix;

void main() {
  vec3 p =
    u_matrix *
    vec3(
      a_position,
      1.0
    );

  gl_Position =
    vec4(
      p.xy,
      0.0,
      1.0
    );
}
`;

const fragmentShaderSource = `#version 300 es

precision highp float;

uniform vec4 u_color;

out vec4 outColor;

void main() {
  outColor =
    u_color;
}
`;

// =========================================================
// 3. Shader / Program Helpers
// =========================================================

function createShader(
  gl,
  type,
  source
) {
  const shader =
    gl.createShader(type);

  gl.shaderSource(
    shader,
    source
  );

  gl.compileShader(
    shader
  );

  const success =
    gl.getShaderParameter(
      shader,
      gl.COMPILE_STATUS
    );

  if (!success) {
    const info =
      gl.getShaderInfoLog(
        shader
      );

    gl.deleteShader(
      shader
    );

    throw new Error(
      "Shader compile error:\n" +
      info
    );
  }

  return shader;
}

function createProgram(
  gl,
  vertexShader,
  fragmentShader
) {
  const program =
    gl.createProgram();

  gl.attachShader(
    program,
    vertexShader
  );

  gl.attachShader(
    program,
    fragmentShader
  );

  gl.linkProgram(
    program
  );

  const success =
    gl.getProgramParameter(
      program,
      gl.LINK_STATUS
    );

  if (!success) {
    const info =
      gl.getProgramInfoLog(
        program
      );

    gl.deleteProgram(
      program
    );

    throw new Error(
      "Program link error:\n" +
      info
    );
  }

  return program;
}

const vertexShader =
  createShader(
    gl,
    gl.VERTEX_SHADER,
    vertexShaderSource
  );

const fragmentShader =
  createShader(
    gl,
    gl.FRAGMENT_SHADER,
    fragmentShaderSource
  );

const program =
  createProgram(
    gl,
    vertexShader,
    fragmentShader
  );

gl.useProgram(
  program
);

// =========================================================
// 4. Geometry (Local Space) — Triangle
// =========================================================

const vertices =
  new Float32Array([
    -0.18, -0.15,
     0.18, -0.15,
     0.00,  0.22
  ]);

// =========================================================
// 5. Attribute & Uniform Locations
// =========================================================

const positionLocation =
  gl.getAttribLocation(
    program,
    "a_position"
  );

const matrixLocation =
  gl.getUniformLocation(
    program,
    "u_matrix"
  );

const colorLocation =
  gl.getUniformLocation(
    program,
    "u_color"
  );

// =========================================================
// 6. VAO + Buffer untuk Triangle
// =========================================================

const triangleVAO =
  gl.createVertexArray();

gl.bindVertexArray(
  triangleVAO
);

const positionBuffer =
  gl.createBuffer();

gl.bindBuffer(
  gl.ARRAY_BUFFER,
  positionBuffer
);

gl.bufferData(
  gl.ARRAY_BUFFER,
  vertices,
  gl.STATIC_DRAW
);

gl.enableVertexAttribArray(
  positionLocation
);

gl.vertexAttribPointer(
  positionLocation,
  2,
  gl.FLOAT,
  false,
  0,
  0
);

gl.bindVertexArray(
  null
);

// =========================================================
// 7. VAO + Buffer untuk Axis (world reference)
// =========================================================

const axisVertices =
  new Float32Array([
    -1.0, 0.0,
     1.0, 0.0,

     0.0, -1.0,
     0.0,  1.0
  ]);

const axisVAO =
  gl.createVertexArray();

gl.bindVertexArray(
  axisVAO
);

const axisBuffer =
  gl.createBuffer();

gl.bindBuffer(
  gl.ARRAY_BUFFER,
  axisBuffer
);

gl.bufferData(
  gl.ARRAY_BUFFER,
  axisVertices,
  gl.STATIC_DRAW
);

gl.enableVertexAttribArray(
  positionLocation
);

gl.vertexAttribPointer(
  positionLocation,
  2,
  gl.FLOAT,
  false,
  0,
  0
);

gl.bindVertexArray(
  null
);

const axisColor =
  new Float32Array([
    0.30,
    0.40,
    0.50,
    0.60
  ]);

// =========================================================
// 8. Math Helper
// =========================================================

function degToRad(
  degree
) {
  return (
    degree *
    Math.PI /
    180
  );
}

// =========================================================
// 9. Transform Composition Helpers
// =========================================================

// Urutan default praktikum ini: Scale -> Rotate -> Translate
// (P' = T * R * S * P)
function createTRSMatrix(
  transform
) {
  const t =
    Mat3.translation(
      transform.x,
      transform.y
    );

  const r =
    Mat3.rotation(
      degToRad(
        transform.rotation
      )
    );

  const s =
    Mat3.scaling(
      transform.scaleX,
      transform.scaleY
    );

  let matrix =
    Mat3.identity();

  matrix =
    Mat3.multiply(
      matrix,
      s
    );

  matrix =
    Mat3.multiply(
      matrix,
      r
    );

  matrix =
    Mat3.multiply(
      matrix,
      t
    );

  return matrix;
}

// Helper pembanding untuk Eksperimen Wajib #4:
// Translate -> Rotate (tanpa scale).
// Dipakai untuk menunjukkan bahwa object yang sudah dipindah
// dari origin akan "mengorbit" saat dirotasi setelah translate,
// berbeda hasilnya dibanding Scale -> Rotate -> Translate.
function createRTMatrix(
  transform
) {
  const t =
    Mat3.translation(
      transform.x,
      transform.y
    );

  const r =
    Mat3.rotation(
      degToRad(
        transform.rotation
      )
    );

  let matrix =
    Mat3.identity();

  matrix =
    Mat3.multiply(
      matrix,
      t
    );

  matrix =
    Mat3.multiply(
      matrix,
      r
    );

  return matrix;
}

// =========================================================
// 10. Object A — dikontrol manual via keyboard
// =========================================================

const objectA = {
  x: -0.35,
  y: 0.0,

  rotation: 0.0,

  scaleX: 1.0,
  scaleY: 1.0
};

const colorA =
  new Float32Array([
    0.10,
    0.75,
    1.00,
    1.00
  ]);

function resetObjectA() {
  objectA.x =
    -0.35;

  objectA.y =
    0.0;

  objectA.rotation =
    0.0;

  objectA.scaleX =
    1.0;

  objectA.scaleY =
    1.0;
}

// =========================================================
// 11. Object B — animasi otomatis
// =========================================================

const colorB =
  new Float32Array([
    1.00,
    0.55,
    0.10,
    1.00
  ]);

function createObjectBMatrix(
  seconds
) {
  const rotation =
    seconds * 70.0;

  const scale =
    1.0 +
    Math.sin(
      seconds * 2.0
    ) * 0.25;

  const transformB = {
    x: 0.42,
    y: 0.0,

    rotation,

    scaleX: scale,
    scaleY: scale
  };

  return createTRSMatrix(
    transformB
  );
}

// =========================================================
// 12. Keyboard Input
// =========================================================

const keys = {};

window.addEventListener(
  "keydown",
  (event) => {
    keys[
      event.key.toLowerCase()
    ] = true;

    if (
      event.key.startsWith(
        "Arrow"
      )
    ) {
      event.preventDefault();
    }

    // Aksi diskrit (event-based): Reset
    if (
      event.key.toLowerCase()
        === "r"
      &&
      !event.repeat
    ) {
      resetObjectA();
    }
  }
);

window.addEventListener(
  "keyup",
  (event) => {
    keys[
      event.key.toLowerCase()
    ] = false;
  }
);

// =========================================================
// 13. Update Functions (state-based, continuous)
// =========================================================

const moveSpeed =
  0.65;

function updateTranslation(
  dt
) {
  if (
    keys["arrowleft"]
  ) {
    objectA.x -=
      moveSpeed * dt;
  }

  if (
    keys["arrowright"]
  ) {
    objectA.x +=
      moveSpeed * dt;
  }

  if (
    keys["arrowup"]
  ) {
    objectA.y +=
      moveSpeed * dt;
  }

  if (
    keys["arrowdown"]
  ) {
    objectA.y -=
      moveSpeed * dt;
  }
}

const rotationSpeed =
  100.0;

function updateRotation(
  dt
) {
  if (
    keys["q"]
  ) {
    objectA.rotation -=
      rotationSpeed * dt;
  }

  if (
    keys["e"]
  ) {
    objectA.rotation +=
      rotationSpeed * dt;
  }
}

const scaleSpeed =
  0.8;

function updateUniformScale(
  dt
) {
  if (
    keys["+"] ||
    keys["="]
  ) {
    objectA.scaleX +=
      scaleSpeed * dt;

    objectA.scaleY +=
      scaleSpeed * dt;
  }

  if (
    keys["-"] ||
    keys["_"]
  ) {
    objectA.scaleX -=
      scaleSpeed * dt;

    objectA.scaleY -=
      scaleSpeed * dt;
  }
}

function updateNonUniformScale(
  dt
) {
  if (keys["z"]) {
    objectA.scaleX -=
      scaleSpeed * dt;
  }

  if (keys["x"]) {
    objectA.scaleX +=
      scaleSpeed * dt;
  }

  if (keys["c"]) {
    objectA.scaleY -=
      scaleSpeed * dt;
  }

  if (keys["v"]) {
    objectA.scaleY +=
      scaleSpeed * dt;
  }
}

function clampObjectA() {
  objectA.x =
    Math.max(
      -0.8,
      Math.min(
        0.8,
        objectA.x
      )
    );

  objectA.y =
    Math.max(
      -0.75,
      Math.min(
        0.75,
        objectA.y
      )
    );

  objectA.scaleX =
    Math.max(
      0.2,
      Math.min(
        2.5,
        objectA.scaleX
      )
    );

  objectA.scaleY =
    Math.max(
      0.2,
      Math.min(
        2.5,
        objectA.scaleY
      )
    );
}

function update(
  dt
) {
  updateTranslation(
    dt
  );

  updateRotation(
    dt
  );

  updateUniformScale(
    dt
  );

  updateNonUniformScale(
    dt
  );

  clampObjectA();
}

// =========================================================
// 14. HUD
// =========================================================

const positionInfo =
  document.getElementById(
    "positionInfo"
  );

const rotationInfo =
  document.getElementById(
    "rotationInfo"
  );

const scaleInfo =
  document.getElementById(
    "scaleInfo"
  );

function updateHUD() {
  positionInfo.textContent =
    `(${objectA.x.toFixed(2)}, ` +
    `${objectA.y.toFixed(2)})`;

  rotationInfo.textContent =
    `${objectA.rotation.toFixed(1)}°`;

  scaleInfo.textContent =
    `(${objectA.scaleX.toFixed(2)}, ` +
    `${objectA.scaleY.toFixed(2)})`;
}

// =========================================================
// 15. Draw Helpers
// =========================================================

function drawObject(
  matrix,
  color
) {
  gl.bindVertexArray(
    triangleVAO
  );

  gl.uniformMatrix3fv(
    matrixLocation,
    false,
    matrix
  );

  gl.uniform4fv(
    colorLocation,
    color
  );

  gl.drawArrays(
    gl.TRIANGLES,
    0,
    3
  );
}

function drawAxis() {
  gl.bindVertexArray(
    axisVAO
  );

  gl.uniformMatrix3fv(
    matrixLocation,
    false,
    Mat3.identity()
  );

  gl.uniform4fv(
    colorLocation,
    axisColor
  );

  gl.drawArrays(
    gl.LINES,
    0,
    4
  );
}

// =========================================================
// 16. Scene Rendering
// =========================================================

function drawScene(
  seconds
) {
  gl.viewport(
    0,
    0,
    canvas.width,
    canvas.height
  );

  gl.clearColor(
    0.03,
    0.05,
    0.10,
    1.0
  );

  gl.clear(
    gl.COLOR_BUFFER_BIT
  );

  gl.useProgram(
    program
  );

  // World reference (origin, X/Y axis)
  drawAxis();

  const matrixA =
    createTRSMatrix(
      objectA
    );

  const matrixB =
    createObjectBMatrix(
      seconds
    );

  drawObject(
    matrixA,
    colorA
  );

  drawObject(
    matrixB,
    colorB
  );
}

// =========================================================
// 17. Render Loop (dengan Delta Time)
// =========================================================

let lastTime = 0;

function render(
  time
) {
  const seconds =
    time * 0.001;

  let dt =
    (time - lastTime) *
    0.001;

  lastTime =
    time;

  dt =
    Math.min(
      dt,
      0.05
    );

  update(
    dt
  );

  updateHUD();

  drawScene(
    seconds
  );

  requestAnimationFrame(
    render
  );
}

requestAnimationFrame(
  render
);

// =========================================================
// 18. Catatan untuk Eksperimen Wajib #4 (Transform Order)
// =========================================================
//
// Untuk membandingkan urutan transform secara langsung, panggil
// kedua fungsi berikut dengan parameter transform yang sama, lalu
// bandingkan hasil matrix / posisi visualnya:
//
//   const matrixCaseA = createTRSMatrix(objectA);  // Scale -> Rotate -> Translate
//   const matrixCaseB = createRTMatrix(objectA);   // Translate -> Rotate (tanpa scale)
//
// Coba set objectA.x = 0.4, objectA.rotation = 90, lalu bandingkan
// posisi triangle pada kedua matrix tersebut untuk melihat efek
// "orbit" ketika rotate diterapkan setelah translate.