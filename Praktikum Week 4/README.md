# Praktikum Grafika Komputer 4

## 3D Camera & Projection Playground

3D Camera & Projection Playground adalah hasil Praktikum Grafika Komputer Pertemuan 4 dari Kelompok 4. Aplikasi ini mendemonstrasikan rendering cube 3D menggunakan **WebGL 2.0**, lengkap dengan model matrix, view matrix, projection matrix, camera control, depth test, dan beberapa challenge interaktif.

Seluruh scene dibuat dengan JavaScript vanilla, shader GLSL ES 3.00, dan modul matematika buatan sendiri (`math3d.js`). Proyek tidak menggunakan Three.js maupun library grafika eksternal.

## Identitas Praktikum

| Nama | NRP | Mata Kuliah | Kelas | Kelompok |
| --- | --- | --- | --- | --- |
| Willy Marcelius | 5025241096 | Grafika Komputer | B | 4 |
| Rennard Filbert Tanjaya | 5025241122 | Grafika Komputer | B | 4 |

## Tujuan

1. Memahami pipeline transformasi 3D: model, view, dan projection.
2. Membuat kamera dengan fungsi `lookAt()`.
3. Membandingkan proyeksi perspective dan orthographic.
4. Mengatur field of view serta near/far clipping plane.
5. Memahami peran depth buffer melalui depth-test toggle.
6. Mengimplementasikan input keyboard state-based dan event-based.
7. Merender beberapa object 3D dengan posisi serta rotasi independen.

## Struktur File

```text
Praktikum Week 4/
├── index.html  # Struktur halaman, canvas utama, HUD, kontrol, dan split view
├── style.css   # Layout visual yang konsisten dengan praktikum sebelumnya
├── main.js     # Setup WebGL, shader, input, scene state, update, dan render loop
├── math3d.js   # Implementasi operasi matriks 4×4
└── README.md   # Dokumentasi proyek
```

## Scene dan Primitive

Scene utama berisi satu cube utama dan dua cube tambahan. Setiap cube terdiri dari 36 vertex, atau enam sisi yang masing-masing dibentuk oleh dua triangle. Warna diberikan per sisi melalui attribute `a_color`.

| Object | Posisi | Perilaku |
| --- | --- | --- |
| Cube utama | Origin | Berputar pada sumbu X dan Y. |
| Cube tambahan kiri | `(-1.6, 0.0, -1.5)` | Berputar dengan arah dan kecepatan sendiri. |
| Cube tambahan kanan | `(1.6, 0.0, 1.2)` | Berputar dengan arah dan kecepatan sendiri. |

Keberadaan cube pada kedalaman berbeda membuat pengaruh `DEPTH_TEST` terlihat jelas ketika toggle depth test digunakan.

## Shader dan Pipeline 3D

Vertex shader menerima `a_position` dan `a_color`, kemudian menghitung posisi clip space menggunakan rumus berikut:

```glsl
gl_Position = u_projection * u_view * u_model * vec4(a_position, 1.0);
```

- `u_model`: menerapkan rotasi dan translasi object dari local space ke world space.
- `u_view`: mengubah sudut pandang dunia berdasarkan posisi, target, dan up vector kamera.
- `u_projection`: mengubah view space menjadi clip space dengan proyeksi perspective atau orthographic.
- `v_color`: warna dari vertex shader yang diteruskan ke fragment shader.

Alur rendering:

```text
Cube vertex data
      ↓
Model matrix
      ↓
View matrix (lookAt camera)
      ↓
Projection matrix
      ↓
Depth test + fragment color
      ↓
Canvas WebGL
```

## Fitur Interaksi

| Input | Aksi | Pola |
| --- | --- | --- |
| Arrow keys | Mengubah posisi kamera pada X/Y | State-based |
| `W` / `S` | Mendekatkan / menjauhkan kamera pada Z | State-based |
| `PageUp` / `PageDown` | Mengubah tinggi kamera | State-based |
| `I`, `K`, `J`, `L` | Mengubah koordinat target kamera | State-based |
| `[` / `]` | Mengurangi / menambah FOV | State-based |
| `P` | Toggle perspective dan orthographic | Event-based |
| `1`, `2`, `3` | Preset FOV 35°, 60°, 90° | Event-based |
| `N` | Beralih preset near/far clipping | Event-based |
| `D` | Toggle depth test | Event-based |
| `O` | Toggle orbit camera | Event-based |
| `V` | Toggle perbandingan projection split view | Event-based |
| `R` | Reset state kamera, projection, dan challenge | Event-based |

### Parameter Control pada Halaman

Selain keyboard, panel **Parameter Control** menyediakan kontrol yang langsung tersambung ke state WebGL yang sama.

| Kontrol UI | Fungsi |
| --- | --- |
| FOV slider | Mengatur FOV perspective pada rentang 30°–100°. |
| Camera height slider | Mengubah nilai `camera.position[1]`. |
| Target X/Y slider | Mengubah titik fokus `lookAt()` pada sumbu X dan Y. |
| FOV preset button | Memilih 35°, 60°, atau 90°. |
| Near/Far button | Memilih salah satu preset clipping plane. |
| Projection button | Menukar perspective dan orthographic. |
| Depth test button | Menyalakan atau mematikan `gl.DEPTH_TEST`. |
| Orbit / Split button | Mengaktifkan orbit camera atau perbandingan dua proyeksi. |
| Reset button | Mengembalikan seluruh state scene ke nilai awal. |

Input state-based menyimpan status tombol pada object `keys`; fungsi update membaca state itu setiap frame. Dengan pendekatan ini pergerakan kamera kontinu dan tidak bergantung pada keyboard repeat browser.

## Animasi dan Delta Time

Semua cube berotasi menggunakan delta time sehingga kecepatan tidak bergantung pada FPS.

```js
cube.rotationX += 25 * dt;
cube.rotationY += 40 * dt;
```

Nilai `dt` dihitung dari selisih timestamp `requestAnimationFrame()`. Nilai tersebut dibatasi sampai `0.05` detik untuk mencegah lonjakan posisi bila tab browser sebelumnya tidak aktif.

## Projection dan Camera

### Perspective Projection

Proyeksi perspective membuat object yang jauh terlihat lebih kecil. Mode ini memakai FOV, aspect ratio canvas, serta near/far clipping plane.

### Orthographic Projection

Proyeksi orthographic mempertahankan ukuran object meskipun jaraknya berbeda. Mode ini berguna untuk membandingkan efek perspektif dan melihat object tanpa foreshortening.

### Split Projection View

Tombol `V` menampilkan dua canvas tambahan. Keduanya menggunakan model dan kamera yang sama, tetapi kiri memakai perspective sementara kanan memakai orthographic. Setiap canvas memiliki WebGL context, shader program, buffer, dan VAO sendiri karena resource WebGL tidak dapat dibagikan lintas context.

## Challenge yang Dikerjakan

- [x] **Challenge A — Orbit Camera**: tombol `O` membuat kamera mengorbit target pada radius tetap.
- [x] **Challenge B — Camera Height Control**: `PageUp` dan `PageDown` mengubah posisi Y kamera.
- [x] **Challenge C — Target Control**: `I/K/J/L` mengubah target pada fungsi `lookAt()`.
- [x] **Challenge D — Projection Comparison**: tombol `V` menampilkan perspective dan orthographic secara berdampingan.
- [x] **Challenge E — Multiple Cube Depth Test**: dua cube tambahan di kedalaman berbeda memperlihatkan hasil depth buffer.
- [x] **Challenge F — FOV Presets**: tombol `1`, `2`, dan `3` memilih FOV 35°, 60°, dan 90°.

## Cara Menjalankan Project

### Membuka langsung di browser

1. Buka folder `Praktikum Week 4`.
2. Klik dua kali `index.html`.
3. Jika browser mendukung WebGL 2.0, scene akan langsung berjalan.

### Menggunakan Live Server

1. Buka folder proyek pada Visual Studio Code.
2. Pasang ekstensi **Live Server** jika belum tersedia.
3. Klik kanan `Praktikum Week 4/index.html`.
4. Pilih **Open with Live Server**.

Live Server disarankan ketika pengembangan karena script ES module (`main.js`) dapat dimuat konsisten dan perubahan file lebih mudah diuji.

## Checklist Pengujian

- [x] Canvas utama merender tiga cube berwarna.
- [x] Cube berotasi dengan delta time.
- [x] Kamera berpindah dengan keyboard.
- [x] Target kamera dapat diubah.
- [x] Perspective dan orthographic dapat ditukar.
- [x] FOV serta near/far clipping dapat diubah.
- [x] Depth test dapat diaktifkan dan dimatikan.
- [x] Orbit camera berjalan.
- [x] Split projection view berjalan.
- [x] HUD memperbarui informasi scene secara real-time.

## Teknologi yang Digunakan

- HTML5
- CSS3
- JavaScript ES Modules
- WebGL 2.0
- GLSL ES 3.00
- `requestAnimationFrame()`
- Google Fonts: Nunito

## Kesimpulan

Praktikum ini memperlihatkan bagaimana geometri cube lokal dapat dirender sebagai scene 3D interaktif melalui komposisi matriks model, view, dan projection. Camera control, depth test, orbit camera, FOV, clipping plane, dan split projection memberikan gambaran langsung mengenai komponen utama pipeline grafika 3D modern.
