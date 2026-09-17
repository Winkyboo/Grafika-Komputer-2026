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

gl.enable(gl.BLEND);
gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

// =========================================================
// 2. Shader Sources
// =========================================================

const vertexShaderSource = `#version 300 es

in vec2 a_position;
in vec4 a_color;
in vec2 a_texcoord;

out vec4 v_color;
out vec2 v_texcoord;

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
    v_color = a_color;
    v_texcoord = a_texcoord;
}
`;

const fragmentShaderSource = `#version 300 es

precision highp float;
in vec4 v_color;
in vec2 v_texcoord;

uniform vec4 u_color;
uniform bool u_use_vertex_color;
uniform bool u_use_texture; // NEW: Texture toggle switch
uniform sampler2D u_texture; // NEW: The actual image data

out vec4 outColor;

void main() {
  if (u_use_texture) {
    // Read the exact pixel color from the Frieren image
    outColor = texture(u_texture, v_texcoord);
  } else {
    // Fallback to our previous color logic
    outColor = u_use_vertex_color ? v_color : u_color;
  }
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

const colorAttribLocation = gl.getAttribLocation(program, "a_color");
const useVertexColorLocation = gl.getUniformLocation(program, "u_use_vertex_color");
const texCoordLocation = gl.getAttribLocation(program, "a_texcoord");
const useTextureLocation = gl.getUniformLocation(program, "u_use_texture");
const textureLocation = gl.getUniformLocation(program, "u_texture");

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

const triangleColors = new Float32Array([
  1.0, 0.0, 0.0, 1.0, 
  0.0, 1.0, 0.0, 1.0,
  0.0, 0.0, 1.0, 1.0  
]);

const colorBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
gl.bufferData(gl.ARRAY_BUFFER, triangleColors, gl.STATIC_DRAW);

gl.enableVertexAttribArray(colorAttribLocation);
gl.vertexAttribPointer(colorAttribLocation, 4, gl.FLOAT, false, 0, 0);

const texCoords = new Float32Array([
  0.0, 1.0, 
  1.0, 1.0, 
  0.5, 0.0  
]);

const texCoordBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
gl.bufferData(gl.ARRAY_BUFFER, texCoords, gl.STATIC_DRAW);

gl.enableVertexAttribArray(texCoordLocation);
gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 0, 0);

gl.bindVertexArray(
  null
);

// =========================================================
// 6.5. VAO + Buffer untuk Quad (Rectangle)
// =========================================================

const quadVertices = new Float32Array([
  -0.2, -0.2, // Triangle 1: Bottom-Left
   0.2, -0.2, // Triangle 1: Bottom-Right
  -0.2,  0.2, // Triangle 1: Top-Left

  -0.2,  0.2, // Triangle 2: Top-Left
   0.2, -0.2, // Triangle 2: Bottom-Right
   0.2,  0.2  // Triangle 2: Top-Right
]);

const quadVAO = gl.createVertexArray();
gl.bindVertexArray(quadVAO);

// Position Buffer
const quadPositionBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, quadPositionBuffer);
gl.bufferData(gl.ARRAY_BUFFER, quadVertices, gl.STATIC_DRAW);
gl.enableVertexAttribArray(positionLocation);
gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

// Texture Coordinate (UV) Buffer
const quadTexCoords = new Float32Array([
  0.0, 1.0, // Bottom-Left
  1.0, 1.0, // Bottom-Right
  0.0, 0.0, // Top-Left

  0.0, 0.0, // Top-Left
  1.0, 1.0, // Bottom-Right
  1.0, 0.0  // Top-Right
]);

const quadTexCoordBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, quadTexCoordBuffer);
gl.bufferData(gl.ARRAY_BUFFER, quadTexCoords, gl.STATIC_DRAW);
gl.enableVertexAttribArray(texCoordLocation);
gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 0, 0);

gl.bindVertexArray(null);

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

  matrix = Mat3.multiply(matrix,t);
  matrix = Mat3.multiply(matrix,r);
  matrix = Mat3.multiply(matrix,s);

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

// Transform Order alternative: Scale -> Translate -> Rotate
function createRTSMatrix(transform) {
  const t = Mat3.translation(transform.x, transform.y);
  const r = Mat3.rotation(degToRad(transform.rotation));
  const s = Mat3.scaling(transform.scaleX, transform.scaleY);

  let matrix = Mat3.identity();
  // Multiplied right-to-left: R * T * S
  matrix = Mat3.multiply(matrix, r);
  matrix = Mat3.multiply(matrix, t);
  matrix = Mat3.multiply(matrix, s);

  return matrix;
}

// =========================================================
// 9.5. Texture Loader Helper
// =========================================================

function loadTexture(gl, url) {
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);

  // Put a single blue pixel in the texture so we can render immediately
  const pixel = new Uint8Array([0, 0, 255, 255]);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, pixel);

  const image = new Image();
  image.crossOrigin = "anonymous"; // Prevents CORS security errors
  image.src = url;
  
  image.onload = () => {
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.generateMipmap(gl.TEXTURE_2D);
  };

  return texture;
}

// Start loading the Frieren image immediately!
const frierenTexture = loadTexture(
  gl, 
  "./FrierenCry.png"
);

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
    0.70,
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

const childObject = {
  x: 0.4, // Offset from the parent
  y: 0.0,
  rotation: 0.0,
  scaleX: 0.5, // Half the size
  scaleY: 0.5
};

const colorChild = new Float32Array([1.0, 1.0, 0.0, 1.0]); // Yellow

// =========================================================
// 10.5. Object Child (Challenge E) & Transform State (Challenge C)
// =========================================================

const objectChild = {
  x: 0.3,          // Relatif terhadap Parent (Object A)
  y: 0.0,
  rotation: 0.0,
  scaleX: 0.5,
  scaleY: 0.5
};

const colorChild = new Float32Array([1.0, 0.3, 0.6, 1.0]);

let useAlternativeOrder = false; // Toggle untuk Challenge C

// =========================================================
// 11. Object B dan Object C — animasi otomatis
// =========================================================

const colorB =
  new Float32Array([
    1.00,
    0.55,
    0.10,
    1.00
  ]);

const colorC = new Float32Array([
  0.20, 1.00, 0.40, 1.00 
]);

function createObjectCMatrix(seconds) {
  // 1. Local Transform (Just scale and local spin)
  const localTransform = {
    x: 0.0, y: 0.0, rotation: seconds * -80.0, scaleX: 1.0, scaleY: 1.0
  };
  const localMatrix = createTRSMatrix(localTransform);

  // 2. Orbit Composition (Rotate around origin, then translate out by 0.5 radius)
  const orbitRotation = Mat3.rotation(seconds * 2.0); // Spin around center
  const orbitRadius = Mat3.translation(0.5, 0.0);     // Push outwards

  // Multiply together: OrbitRotation * OrbitRadius * Local
  let composedMatrix = Mat3.multiply(orbitRotation, orbitRadius);
  composedMatrix = Mat3.multiply(composedMatrix, localMatrix);

  return composedMatrix;
}

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
// 12. Keyboard Input (Challenge A, B, C)
// =========================================================

const keys = {};
let useTRSOrder = true; // Challenge C state

window.addEventListener("keydown", (event) => {
  keys[event.key.toLowerCase()] = true;

  if (event.key.startsWith("Arrow")) {
    event.preventDefault();
  }

  // Diskrit actions (no repeat)
  if (!event.repeat) {
    const key = event.key.toLowerCase();
    
    // Challenge A: Reset
    if (key === "r") {
      resetObjectA();
    }
    
    // Challenge B: Presets
    if (key === "1") {
      objectA.x = -0.4; objectA.y = 0.2; objectA.rotation = 0;
      objectA.scaleX = 1.0; objectA.scaleY = 1.0;
    }
    if (key === "2") {
      objectA.x = 0.0; objectA.y = 0.0; objectA.rotation = 45;
      objectA.scaleX = 1.5; objectA.scaleY = 1.5;
    }
    if (key === "3") {
      objectA.x = 0.3; objectA.y = -0.2; objectA.rotation = 90;
      objectA.scaleX = 1.8; objectA.scaleY = 0.6;
    }
    
    // Challenge C: Toggle Order
    if (key === "t") {
      useTRSOrder = !useTRSOrder;
    }
  }
});

window.addEventListener("keyup", (event) => {
  keys[event.key.toLowerCase()] = false;
});

canvas.addEventListener("mousedown", (event) => {
  const rect = canvas.getBoundingClientRect();
  
  // Get pixel coordinates relative to canvas
  const x = event.clientX - rect.left;
  const y = event.clientY - rect.top;
  
  // Convert pixels to NDC (-1.0 to 1.0)
  const ndcX = (x / canvas.width) * 2.0 - 1.0;
  const ndcY = 1.0 - (y / canvas.height) * 2.0; // Flipped Y axis
  
  // Apply directly to Object A's position
  objectA.x = ndcX;
  objectA.y = ndcY;
});

// =========================================================
// 13. Update Functions (state-based, continuous)
// =========================================================

const moveSpeed =
  0.65;

function updateTranslation(dt) {
  if (keys["arrowleft"] || keys["a"]) {
    objectA.x -= moveSpeed * dt;
  }

  if (keys["arrowright"] || keys["d"]) {
    objectA.x += moveSpeed * dt;
  }

  if (keys["arrowup"] || keys["w"]) {
    objectA.y += moveSpeed * dt;
  }

  if (keys["arrowdown"] || keys["s"]) {
    objectA.y -= moveSpeed * dt;
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
  // 1. Batasi skala terlebih dahulu agar perhitungannya akurat
  objectA.scaleX = Math.max(0.2, Math.min(2.5, objectA.scaleX));
  objectA.scaleY = Math.max(0.2, Math.min(2.5, objectA.scaleY));

  // 2. Hitung jarak ukuran dari titik origin (0,0) ke ujung-ujung geometri
  // Berdasarkan 'vertices' Anda: max X = 0.18, max Y atas = 0.22, min Y bawah = 0.15
  const paddingX = 0.18 * objectA.scaleX;
  const paddingTop = 0.22 * objectA.scaleY;
  const paddingBottom = 0.15 * objectA.scaleY;

  // 3. Tentukan batas ruang WebGL (-1.0 sampai 1.0) dikurangi ukuran objek
  const minX = -1.0 + paddingX;
  const maxX =  1.0 - paddingX;
  const minY = -1.0 + paddingBottom;
  const maxY =  1.0 - paddingTop;

  // 4. Terapkan batasan posisi yang sudah dinamis
  objectA.x = Math.max(minX, Math.min(maxX, objectA.x));
  objectA.y = Math.max(minY, Math.min(maxY, objectA.y));
}

function update(dt) {
  updateTranslation(dt);
  updateRotation(dt);
  updateUniformScale(dt);
  updateNonUniformScale(dt);
  clampObjectA();

  // Animasi lokal untuk Object Child (berputar konstan)
  objectChild.rotation += 150.0 * dt; 
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

const orderInfo = document.getElementById("orderInfo");

function updateHUD() {
  positionInfo.textContent = `(${objectA.x.toFixed(2)}, ${objectA.y.toFixed(2)})`;
  rotationInfo.textContent = `${objectA.rotation.toFixed(1)}°`;
  scaleInfo.textContent = `(${objectA.scaleX.toFixed(2)}, ${objectA.scaleY.toFixed(2)})`;
  
  // Memperbarui UI teks Transform Order
  orderInfo.textContent = useAlternativeOrder 
    ? "Translate → Rotate (Orbit)" 
    : "Scale → Rotate → Translate";
}

// =========================================================
// 15. Draw Helpers
// =========================================================

function drawObject(
  matrix,
  color,
  useVertexColor = false,
  useTexture = false,
  texture = null,
  vao = triangleVAO, // NEW: Defaults to the triangle shape
  vertexCount = 3
) {  
  gl.bindVertexArray(
    vao
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

  gl.uniform1i(useVertexColorLocation, useVertexColor ? 1 : 0);
  gl.uniform1i(useTextureLocation, useTexture ? 1 : 0);

  if (useTexture && texture) {
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform1i(textureLocation, 0); // Bind to texture unit 0
  }

  gl.drawArrays(
    gl.TRIANGLES,
    0,
    vertexCount
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

  gl.uniform1i(useVertexColorLocation, 0);
  gl.uniform1i(useTextureLocation, 0);
  gl.drawArrays(
    gl.LINES,
    0,
    4
  );
}

// =========================================================
// 16. Scene Rendering
// =========================================================

function drawScene(seconds) {
  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0.03, 0.05, 0.10, 1.0);
  gl.clear(gl.COLOR_BUFFER_BIT);
  gl.useProgram(program);

  drawAxis();

  const matrixA = useTRSOrder ? createTRSMatrix(objectA) : createRTSMatrix(objectA);

  // Challenge E: Hierarchical Parent-Child Matrix
  const localChildMatrix = createTRSMatrix(objectChild);
  // Rumus Scene Graph: ChildWorld = ParentWorld * ChildLocal
  const matrixChildWorld = Mat3.multiply(matrixA, localChildMatrix); 

  const matrixB = createObjectBMatrix(seconds);
  const matrixC = createObjectCMatrix(seconds);

  childObject.rotation = seconds * 150.0; // Spin the child locally
  const localChildMatrix = createTRSMatrix(childObject);
  const worldChildMatrix = Mat3.multiply(matrixA, localChildMatrix);
  
  drawObject(matrixA, colorA, false, false, null); // Uses the solid colorA
  drawObject(worldChildMatrix, colorChild, false, false, null);
  drawObject(matrixB, colorB, true, false, null);  // Overrides colorB, uses RGB gradient
  drawObject(matrixC, colorC, false, true, frierenTexture, quadVAO, 6);
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
   const matrixCaseA = createTRSMatrix(objectA);  // Scale -> Rotate -> Translate
//   const matrixCaseB = createRTMatrix(objectA);   // Translate -> Rotate (tanpa scale)
//
// Coba set objectA.x = 0.4, objectA.rotation = 90, lalu bandingkan
// posisi triangle pada kedua matrix tersebut untuk melihat efek
// "orbit" ketika rotate diterapkan setelah translate.