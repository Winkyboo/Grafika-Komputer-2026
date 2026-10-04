# Praktikum Grafika Komputer 4 - Textured and Lit Object

## Deskripsi Aplikasi
Aplikasi ini adalah hasil Praktikum Grafika Komputer Pertemuan 4 dari Kelompok 4. Aplikasi ini mendemonstrasikan rendering objek 3D (Cube, Sphere, Torus, dan Torus Knot) menggunakan **WebGL 2.0**. 

Fitur utama aplikasi ini mencakup:
- Implementasi **Phong Lighting** (Ambient, Diffuse, Specular) dengan kontrol penuh.
- **Texture Mapping** dengan berbagai sumber tekstur (Checker, Stripes, Gradient, Gambar, dan Upload File).
- Pengaturan **Filtering** dan **Wrapping** tekstur.
- Perbandingan **Flat Shading** dan **Smooth Shading**.
- Kontrol kamera (orbit, pergerakan posisi, dan rotasi objek).
- Pengaturan posisi cahaya, shininess, ambient strength, dan UV scale.

Seluruh scene dibuat dengan JavaScript vanilla, shader GLSL ES 3.00, dan modul matematika buatan sendiri (`math3d.js`). Proyek tidak menggunakan library grafika eksternal seperti Three.js.

## Identitas Praktikum
| Nama | NRP | Mata Kuliah | Kelas | Kelompok |
| --- | --- | --- | --- | --- |
| Willy Marcelius | 5025241096 | Grafika Komputer | B | 4 |
| Rennard Filbert Tanjaya | 5025241122 | Grafika Komputer | B | 4 |

## Kontrol Keyboard
Input state-based menyimpan status tombol pada object `keys` atau `cameraKeys`; fungsi update membaca state itu setiap frame.

| Input | Aksi | Pola |
| --- | --- | --- |
| Arrow Keys / W / S | Mengubah posisi cahaya (Light Position X, Y, Z) | Event-based |
| `F` | Toggle Flat Shading / Smooth Shading | Event-based |
| `T` | Toggle Texture ON / OFF | Event-based |
| `G` | Mengganti mode Wrapping tekstur (Repeat, Clamp, Mirror) | Event-based |
| `[` / `]` | Mengurangi / menambah UV Scale | State-based |
| `+` / `-` | Menambah / mengurangi nilai Shininess | Event-based |
| `A` / `Z` | Menambah / mengurangi Ambient Strength | Event-based |
| `1` / `2` / `3` | Toggle komponen lighting (Ambient, Diffuse, Specular) | Event-based |
| `N` | Toggle Non-Uniform Scale pada objek | Event-based |
| `I`, `K`, `J`, `L`, `Q`, `E` | Menggerakkan kamera (kiri, kanan, atas, bawah, maju, mundur) | State-based |
| `O` | Toggle Orbit Camera | Event-based |
| `P` | Toggle Rotasi Objek | Event-based |
| `R` | Reset state kamera, lighting, tekstur, dan objek | Event-based |

## Jenis Shading
Aplikasi ini mengimplementasikan dua jenis shading yang dapat ditukar secara langsung:
1. **Smooth Shading (Default)**: Normal diinterpolasi antar vertex sehingga permukaan terlihat halus. Menggunakan `geometry.normals`.
2. **Flat Shading**: Setiap segitiga memiliki satu normal yang seragam, membuat permukaan terlihat datar/patah-patah. Menggunakan `geometry.flatNormals` yang dihitung per segitiga.

## Texture yang Digunakan
Aplikasi menyediakan beberapa sumber tekstur yang dapat dipilih melalui UI:
1. **Checker**: Pola kotak-kotak prosedural.
2. **Stripes**: Pola garis vertikal prosedural.
3. **Gradient**: Gradasi warna horizontal prosedural.
4. **Image**: Memuat gambar dari `./assets/texture.png`.
5. **Upload**: Memuat file gambar lokal yang di-upload oleh pengguna.

## Filtering yang Tersedia
Pengguna dapat memilih mode filtering tekstur melalui dropdown `#filterSelect`:
1. `NEAREST`: Filter terdekat (pixelated).
2. `LINEAR`: Filter linear (halus).
3. `NEAREST_MIPMAP_NEAREST`: Mipmap terdekat dengan filter terdekat.
4. `LINEAR_MIPMAP_LINEAR`: Mipmap linear dengan filter linear (paling halus).

## Wrapping yang Tersedia
Mode wrapping tekstur dapat diubah melalui dropdown `#wrapSelect` atau tombol `G`:
1. `REPEAT`: Mengulang tekstur di luar rentang UV 0-1.
2. `CLAMP_TO_EDGE`: Menjepit tekstur di tepi (warna tepi diperpanjang).
3. `MIRRORED_REPEAT`: Mengulang tekstur secara bercermin di luar rentang UV 0-1.

## Nilai Default Lighting
- **Nilai Ambient Default**: `0.18`
- **Nilai Shininess Default**: `32`

## Challenge yang Dikerjakan
- [x] **Challenge A — Texturing**: Implementasi berbagai tekstur prosedural (Checker, Stripes, Gradient) dan tekstur dari gambar.
- [x] **Challenge B — Filtering & Wrapping**: Kontrol mode filtering dan wrapping tekstur secara real-time.
- [x] **Challenge C — Phong Lighting**: Implementasi ambient, diffuse, dan specular dengan toggle independen.
- [x] **Challenge D — Flat vs Smooth Shading**: Perbandingan visual antara flat shading dan smooth shading pada objek 3D.
- [x] **Challenge E — Multiple Geometries**: Menampilkan Cube, Sphere, Torus, dan Torus Knot dengan kontrol parametrik.
- [x] **Challenge F — Light & Camera Control**: Kontrol posisi cahaya, orbit kamera, dan rotasi objek secara interaktif.

## Cara Menjalankan Project
### Membuka langsung di browser
1. Buka folder proyek.
2. Klik dua kali `index.html`.
3. Jika browser mendukung WebGL 2.0, scene akan langsung berjalan.

### Menggunakan Live Server
1. Buka folder proyek pada Visual Studio Code.
2. Pasang ekstensi **Live Server** jika belum tersedia.
3. Klik kanan `index.html`.
4. Pilih **Open with Live Server**.

Live Server disarankan ketika pengembangan karena script ES module (`main.js` / `app.js`) dapat dimuat konsisten dan perubahan file lebih mudah diuji.

## Catatan Debugging
- **WebGL 2.0 Tidak Tersedia**: Jika browser tidak mendukung WebGL 2.0, aplikasi akan melempar error. Pastikan menggunakan browser modern (Chrome, Firefox, Edge terbaru).
- **Shader Compilation Error**: Jika shader gagal dikompilasi, pesan error akan muncul di console. Periksa kembali sintaks GLSL ES 3.00, terutama penggunaan `in`/`out` dan `#version 300 es`.
- **Texture Loading**: Jika tekstur dari file gambar gagal dimuat, pastikan path `./assets/texture.png` benar dan file tersedia. Untuk upload file, pastikan file yang dipilih adalah format gambar yang didukung browser.
- **Delta Time**: Nilai `dt` dibatasi hingga `0.05` detik untuk mencegah lonjakan posisi bila tab browser sebelumnya tidak aktif (di-background).
- **Normal Matrix**: Untuk objek dengan non-uniform scale, pastikan menggunakan `normalMatrix` (inverse transpose) agar arah normal tetap benar dan lighting tidak rusak.