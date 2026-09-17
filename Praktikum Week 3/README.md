# Praktikum Grafika Komputer 3: Interactive Transformation Playground

Interactive Transformation Playground adalah hasil Praktikum Grafika Komputer Pertemuan 3 dari **Kelompok 4**. Aplikasi ini merupakan ruang eksperimen transformasi 2D berbasis **WebGL 2.0**. 

## Deskripsi Singkat

Pengguna dapat mengamati perubahan *Local Space* menuju *World Space* menggunakan perkalian matriks, membandingkan urutan transformasi (Transform Order), menguji hierarki Parent-Child (Scene Graph), serta memuat 2D Texture secara dinamis.

Canvas memiliki resolusi internal **900 × 600 piksel**. Seluruh proses matematika matriks, render grafis, dan logika interaksi dibangun menggunakan **JavaScript vanilla**, **WebGL murni**, dan *library* matematika kustom (`matrix3.js`); tidak menggunakan *framework* grafika eksternal (seperti Three.js).

---

## Identitas Praktikum

| Nama | NRP | Mata Kuliah | Kelas | Kelompok |
|------|-----|------------|-------|---------|
| Willy Marcelius | 5025241096 | Grafika Komputer | B | 4 |
| Rennard Filbert Tanjaya | 5025241122 | Grafika Komputer | B | 4 |

---

## Struktur Aplikasi

Halaman dibagi menjadi dua panel:
- **WebGL Transformation Canvas** — Area render WebGL
- **Input & Legend** — Panduan parameter interaktif

Geometri dasar dibuat sekali secara lokal. Penempatan geometri-geometri tersebut direalisasikan menjadi beberapa entitas (Player, Child, Entity berputar, dan Quad bertekstur) melalui manipulasi *Model Matrix*.

### Fitur Utama:
- Gerakkan Object A (Player) menggunakan keyboard dengan Delta Time
- Pantau perubahan nilai transformasi pada HUD secara real-time
- Tukar logika *Transform Order* untuk melihat efek *pivot* orbit
- Teleportasi objek ke titik kursor mouse

---

## Struktur File

```
Praktikum Week 3/
├── index.html       # Struktur halaman, canvas, elemen HUD, dan layout grid
├── style.css        # Layout dan identitas visual (mendukung report & legend)
├── main.js          # WebGL setup, shader, buffer geometry, input, dan render loop
├── matrix3.js       # Modul fungsi matematika Matriks 3x3 (Column-Major convention)
├── FrierenCry.png   # Aset gambar untuk demonstrasi Texture Mapping
└── README.md        # Dokumentasi proyek
```

---

## Transformasi Matriks yang Digunakan

| Transformasi | Implementasi (matrix3.js) | Perilaku pada Objek |
|---|---|---|
| **Translation** | `Mat3.translation(tx, ty)` | Memindahkan titik tengah (pivot) objek relatif terhadap dunia atau parent |
| **Rotation** | `Mat3.rotation(radian)` | Memutar geometri menggunakan Math.sin dan Math.cos |
| **Uniform Scale** | `Mat3.scaling(s, s)` | Membesarkan/mengecilkan ukuran objek secara proporsional |
| **Axis Scale** | `Mat3.scaling(sx, sy)` | Menarik/memampatkan objek secara non-uniform (hanya sumbu X atau Y) |
| **Multiply** | `Mat3.multiply(m1, m2)` | Mengomposisikan beberapa matriks menjadi satu Model Matrix utuh |

---

## Shader dan Uniform Variables

Aplikasi ini mendemonstrasikan efisiensi GPU dengan tidak lagi mengupdate buffer posisi setiap frame.

- **Attribute `a_position`** — Menampung bentuk awal geometri (segitiga/kotak)
- **Homogeneous Coordinate** — `vec3(a_position, 1.0)` digunakan agar posisi 2D dapat dikalikan dengan matriks 3×3
- **Uniform `u_matrix`** — Menerima Model Matrix dari CPU untuk mengeksekusi perpindahan langsung di GPU
- **Uniform `u_use_texture` & `sampler2D u_texture`** — Memungkinkan Fragment Shader memetakan piksel gambar eksternal menggunakan koordinat UV (`v_texcoord`)

---

## Transform Order & Fitur Animasi

Secara default, matriks dikomposisikan dengan urutan:
$$T \times R \times S$$
(*Scale → Rotate → Translate*)

Objek membesar, berputar di porosnya sendiri, lalu digeser ke titik koordinat dunia.

### Orbit Mode
Jika urutan diubah menjadi $R \times T$ (*Translate → Rotate*), rotasi akan bertumpu pada origin (0,0) dunia, menciptakan efek objek yang melayang/mengorbit.

### Delta Time (Frame-Rate Independent)
```javascript
// Pergerakan Frame-Rate Independent
let dt = (time - lastTime) * 0.001;
objectA.x += moveSpeed * dt;
objectChild.rotation += 150.0 * dt;
```

---

## Fitur Interaksi

### Kontrol Keyboard & Mouse

| Input | Aksi | Tipe |
|-------|------|------|
| **W, A, S, D** atau **Arrow Keys** | Translasi (Pindah posisi) Object A | State-based |
| **Q, E** | Rotasi Object A ke kiri / kanan | State-based |
| **+, -** | Uniform Scaling (Skala proporsional) | State-based |
| **Z, X, C, V** | Non-Uniform Scaling pada sumbu X dan Y | State-based |
| **1, 2, 3** | Load Preset Transformasi | Event-based |
| **T** | Toggle Transform Order (TRS vs Orbit) | Event-based |
| **R** | Reset posisi, rotasi, dan skala ke setelan awal | Event-based |
| **Klik kiri canvas** | Memindahkan Object A ke posisi kursor | Event-based |

### Konversi Mouse ke NDC
Saat kanvas diklik, koordinat piksel layar diubah menjadi Normalized Device Coordinates (NDC) dengan rentang -1.0 hingga 1.0:

```javascript
const ndcX = (mouseX / canvas.width) * 2.0 - 1.0;
const ndcY = (1.0 - (mouseY / canvas.height)) * 2.0 - 1.0;
objectA.x = ndcX;
objectA.y = ndcY;
```

---

## Challenge yang Dikerjakan

- [x] **Challenge A** — Reset Transform: Tombol R mengembalikan wujud dan posisi Object A ke nilai default
- [x] **Challenge B** — Transform Presets: Tombol 1, 2, dan 3 menyediakan set matriks (Posisi, Skala, Rotasi) siap pakai
- [x] **Challenge C** — Toggle Order & HUD: Tombol T menukar aliran matriks dari TRS standar menjadi RT (Orbit mode) secara interaktif
- [x] **Challenge D** — Mouse Translation: Klik kiri mengubah koordinat kursor menjadi NDC dan memindahkan Object A
- [x] **Challenge E** — Parent & Child: Object Pink mengimplementasikan graf scene ($ChildWorld = ParentWorld \times ChildLocal$)
- [x] **Challenge F** — Simple Orbit & Texture: Object C mengorbit pusat dunia secara dinamis murni lewat komposisi Matriks

---

## Cara Menjalankan Project

**Penting:** Karena proyek ini memuat gambar eksternal (FrierenCry.png) untuk tekstur, menjalankan `index.html` langsung akan menyebabkan **Error CORS Tainted Canvas** pada browser modern. Proyek wajib dijalankan menggunakan **Local Web Server**.

### Menggunakan Live Server

1. Buka folder proyek pada **Visual Studio Code**
2. Pasang ekstensi **Live Server** (jika belum tersedia)
3. Klik kanan pada `index.html`
4. Pilih **"Open with Live Server"**
5. Coba seluruh kontrol matriks keyboard, toggle, dan klik mouse pada halaman

### Alternatif: Menggunakan Python

```bash
# Python 3.x
python -m http.server 8000

# Python 2.x
python -m SimpleHTTPServer 8000
```

Kemudian buka `http://localhost:8000` di browser.

---

## Checklist Pengujian

- [x] Canvas WebGL 2.0 muncul dengan Axis (X/Y) di pusat dunia
- [x] Object A dapat digerakkan secara kontinu dengan panah / WASD
- [x] Rotasi (Q/E) dan Scaling (Uniform & Non-Uniform) merespons secara mulus
- [x] Fungsi batas kanvas (Dynamic Clamping) beradaptasi dengan skala objek terkini
- [x] HUD menampilkan akurasi angka matriks transformasi secara real-time
- [x] Tombol Presets (1, 2, 3) dan Reset (R) berfungsi sempurna
- [x] Object B (Animasi Matrix Mandiri) dan Object Child berputar tanpa interupsi
- [x] Pertukaran Transform Order menghasilkan perbedaan bentuk putaran
- [x] Geometri (Segitiga VAO) berhasil di-reuse untuk dirender di lokasi berbeda
- [x] Tekstur pada Quad dimuat dan di-render tanpa error
- [x] Konsol tidak mengeluarkan laporan error selama manipulasi normal

---

## Kesimpulan

Praktikum ini memperkenalkan konsep fundamental grafika komputer modern: **Matrix Composition**. Dengan memanfaatkan uniform matrix dari CPU, kita dapat mempertahankan data geometri di Local Space dan membiarkan GPU menghitung pergeseran World Space-nya secara paralel.

Penggabungan Parent-Child hierarchy, komposisi rotasi-translasi, kontrol state-based, dan pemetaan Texture 2D menghasilkan sebuah purwarupa mini-engine ruang interaktif yang tangguh dan teroptimasi.

---