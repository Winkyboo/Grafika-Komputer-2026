# Praktikum Grafika Komputer 6 — Introduction to Three.js

## Identitas

| Nama | NRP | Mata Kuliah | Kelas | Kelompok |
| --- | --- | --- | --- | --- |
| Willy Marcelius | 5025241096 | Grafika Komputer | B | 4 |
| Rennard Filbert Tanjaya | 5025241122 | Grafika Komputer | B | 4 |

## Judul dan Deskripsi Scene

**Mini 3D Scene: Introduction to Three.js** adalah scene 3D interaktif yang dibuat dengan Three.js. Scene menampilkan beberapa geometri di atas lantai, dapat dilihat melalui kamera perspective atau orthographic, dan dirender dengan pencahayaan serta bayangan. Kontrol pada halaman mengatur kamera, material, tingkat detail sphere, cahaya, shadow map, animasi, dan tampilan gallery material.

## Daftar Geometry

- `BoxGeometry` — kubus utama.
- `SphereGeometry` — sphere utama dan empat sphere di material gallery; segment sphere utama dapat diubah.
- `PlaneGeometry` — lantai berukuran 10 × 10.
- `CylinderGeometry`, `ConeGeometry`, dan `TorusGeometry` — objek tambahan pada scene.
- `SphereGeometry` kecil — penanda posisi directional light.

## Daftar Material

- Kubus: `MeshLambertMaterial` (default), `MeshBasicMaterial`, `MeshNormalMaterial`, atau `MeshPhongMaterial`.
- Sphere: `MeshPhongMaterial`.
- Lantai dan cylinder: `MeshLambertMaterial`.
- Cone dan torus: `MeshPhongMaterial`.
- Gallery: contoh `MeshBasicMaterial`, `MeshNormalMaterial`, `MeshLambertMaterial`, dan `MeshPhongMaterial`.
- Penanda cahaya: `MeshBasicMaterial`.

## Daftar Light

- `AmbientLight` putih, intensitas awal **0.35**.
- `DirectionalLight` putih, intensitas awal **2.0**, posisi awal `(3, 5, 2)`.

## Konfigurasi Shadow

Shadow map renderer aktif secara default dengan resolusi **1024 × 1024**. Directional light dan kubus utama melemparkan bayangan, sedangkan lantai menerima bayangan. Panel kontrol dapat mengaktifkan atau menonaktifkan shadow map renderer, `light.castShadow`, `cube.castShadow`, dan `ground.receiveShadow`. Resolusi dapat dipilih antara **512 × 512**, **1024 × 1024**, dan **2048 × 2048**; tombol `B` mengganti resolusi secara bergiliran.

## Animasi yang Dibuat

Kubus, sphere, cylinder, cone, dan torus berotasi. Sphere juga bergerak naik-turun menggunakan fungsi sinus. Animasi objek dapat dijeda dan dilanjutkan; directional light dapat dibuat mengorbit secara horizontal. Pembaruan gerak memakai delta time dengan batas maksimum 0,05 detik per frame.

## Challenge yang Dikerjakan

- **A — Primitive tambahan:** cylinder, cone, dan torus melengkapi kubus dan sphere.
- **B — Material gallery:** tombol `G` menampilkan atau menyembunyikan empat variasi material.
- **C — Kontrol kamera:** tukar perspective/orthographic, atur FOV, dan navigasi dengan OrbitControls.
- **D — Light orbit:** tombol `L` menggerakkan directional light dan penandanya.
- **E — Shadow control:** atur ukuran shadow map dan empat opsi shadow melalui panel.
- **F — HUD:** menampilkan informasi kamera, objek, segitiga, FPS, material, vertex sphere, animasi, light, dan shadow.
- **G — Toggle animasi:** jeda atau lanjutkan animasi dengan `Space`.
- **H — Kontrol kubus kontinu:** panah menggerakkan kubus dan `Q`/`E` memutarnya.

## Cara Menjalankan

Versi siap dibuka tersedia di folder ini. Buka `index.html` langsung di browser atau gunakan Live Server di Visual Studio Code. File halaman memuat bundle Three.js dari folder `assets`.

Untuk menjalankan versi sumber Vite, buka terminal pada folder `praktikum-6-vite`, lalu jalankan:

```bash
npm install
npm run dev
```

Buka alamat lokal yang ditampilkan Vite. Untuk membangun versi produksi, jalankan `npm run build` dari folder tersebut.

## Kontrol Keyboard dan Mouse

| Input | Aksi |
| --- | --- |
| Mouse drag pada canvas | Mengorbit kamera (OrbitControls) |
| Scroll pada canvas | Zoom kamera |
| `P` | Beralih antara kamera perspective dan orthographic |
| `R` | Reset tampilan kamera dan FOV |
| `Space` | Jeda atau lanjutkan animasi objek |
| `L` | Toggle orbit directional light |
| `G` | Tampilkan atau sembunyikan material gallery |
| `M` | Ganti material kubus berikutnya |
| `B` | Ganti ukuran shadow map berikutnya |
| Panah | Gerakkan kubus pada bidang X/Z selama tombol ditahan |
| `Q` / `E` | Putar kubus selama tombol ditahan |

## Catatan Debugging

- Jika halaman tidak memuat, pastikan folder `assets` tetap berada di samping `index.html` dan kedua file bundle di dalamnya tidak dipindahkan atau diubah namanya.
- Jika perubahan pada source tidak terlihat di halaman siap buka, jalankan kembali build Vite dari `praktikum-6-vite` dan salin hasil build ke folder Week 6 sesuai alur proyek.
- Jika kontrol keyboard tidak merespons, klik area halaman terlebih dahulu dan pastikan fokus tidak sedang berada pada input, dropdown, atau tombol.
- Jika bayangan hilang, periksa empat checkbox shadow di panel, serta pastikan directional light, kubus, dan lantai masing-masing diatur untuk melempar atau menerima bayangan.
- Detail error JavaScript dan WebGL dapat diperiksa melalui Developer Tools browser (Console).
