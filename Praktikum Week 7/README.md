# Praktikum Grafika Komputer 7 — Interactive Web 3D Prototype

## Identitas

| Nama | NRP | Mata Kuliah | Kelas | Kelompok |
| --- | --- | --- | --- | --- |
| Willy Marcelius | 5025241096 | Grafika Komputer | B | 4 |
| Rennard Filbert Tanjaya | 5025241122 | Grafika Komputer | B | 4 |

## Judul Prototype

**Interactive Web 3D Prototype — Duck Scene**

## Deskripsi Aplikasi

Aplikasi Three.js ini menampilkan scene 3D interaktif dengan model bebek GLB, demonstrasi hierarchy parent-child, sistem orbit matahari-bumi-bulan, serta gallery material PBR. Pengguna dapat mengorbit, zoom, dan pan kamera; memilih objek; mengganti kamera dan environment; mengatur roughness, metalness, serta bloom; dan memutar animation clip model.

## Struktur Scene Graph

Ringkasan objek utama di dalam `THREE.Scene`:

```text
Scene
├── PerspectiveCamera / OrthographicCamera
├── Lights
├── Ground
├── Hierarchy Demo (Group)
│   ├── Pillar
│   ├── Body (Box)
│   │   └── Child Object (Box)
│   └── Marker (Sphere + PointLight)
├── PBR Sphere
├── Material Gallery (9 sphere: 3 roughness × 3 metalness)
├── Sun
│   └── Earth Orbit (Group)
│       └── Earth
│           └── Moon Orbit (Group)
│               └── Moon
└── Imported GLB (Duck)
    ├── Duck Body
    ├── Duck Head
    ├── Duck Beak
    ├── Duck Wing Left / Duck Wing Right
    └── Duck Eye Left / Duck Eye Right
```

GLB dimuat secara asynchronous dengan `GLTFLoader`, lalu ukurannya disesuaikan ke tinggi 2,4 unit dan diletakkan di atas ground. Kamera dikendalikan dengan `OrbitControls`; objek yang bisa dipilih dideteksi dengan `Raycaster` recursive.

## Hierarchy Parent-Child

- `Hierarchy Demo` menjadi parent bagi `Pillar`, `Body`, dan `Marker`. Rotasi group diterapkan kepada seluruh child.
- `Child Object` menjadi child dari `Body`, sehingga transform world-nya merupakan gabungan transform parent `Hierarchy Demo`, `Body`, dan transform lokal child.
- Sistem tata surya tersusun sebagai `Sun → Earth Orbit → Earth → Moon Orbit → Moon`. Rotasi group orbit menggerakkan benda langit mengelilingi parent.
- Root model GLB memiliki child mesh untuk bagian tubuh, kepala, paruh, sayap, dan mata bebek.

## Model GLB yang Digunakan

- **File:** `models/model.glb`
- **Model:** bebek dengan mesh tubuh, kepala, paruh, dua sayap, dan dua mata.
- **Hierarchy root:** `Imported Duck GLB`.
- **Animation clip dalam file:** `Idle`, `Walk`, dan `Run`.
- Mesh GLB disiapkan untuk menerima dan menghasilkan shadow. Materialnya dikloning agar efek hover dan selection tidak mengubah material asal.

## Sumber Asset

- Model bebek disertakan pada `Praktikum Week 7/models/model.glb`. Metadata GLB mencatat generator **“Praktikum Grafika Komputer 7 sample asset”**.
- Environment HDRI studio tersedia di `environment/environment.hdr`; Fireplace HDRI tersedia di `environment/fireplace_4k.hdr`.
- Scene juga membuat procedural studio secara lokal, dan memakai `RoomEnvironment` sebagai fallback bila HDRI studio gagal dimuat.
- Informasi kredit atau URL sumber eksternal HDRI tidak tercatat di file proyek.

## Animation Clip yang Digunakan

`AnimationMixer` memutar clip `Idle`, `Walk`, dan `Run` dari GLB. Tombol **Idle (1)**, **Walk (2)**, dan **Run (3)** memilih clip yang sesuai dan melakukan crossfade; tombol angka `1`, `2`, dan `3` juga dapat dipakai saat canvas menerima fokus. Saat model tidak menyediakan nama clip yang cocok, tombol memilih clip berdasarkan urutan sebagai fallback.

Klik model akan menjalankan clip gesture sekali jalan jika asset menyediakan clip bernama `Wave`, `Thumbsup`, `Jump`, atau `Yes`. GLB yang disertakan saat ini hanya berisi `Idle`, `Walk`, dan `Run`, jadi klik model memilihnya tanpa clip gesture tambahan.

## PBR Material

Sphere utama memakai `MeshStandardMaterial` berwarna hijau dengan nilai awal **roughness 0,25** dan **metalness 0,10**. Keduanya dapat diatur melalui slider dari 0 sampai 1. Gallery menampilkan sembilan kombinasi roughness `0,1 / 0,5 / 0,9` dan metalness `0 / 0,5 / 1`.

Material bawaan GLB: `Duck Yellow` (roughness 0,30; metalness 0,05), `Orange Beak` (0,32; 0), dan `Dark Eyes` (0,16; 0,10). Environment map memberi pantulan dan pencahayaan pada material PBR.

## Roughness

Nilai awal sphere utama **0,25**. Slider mengubah roughness secara langsung dalam rentang **0–1**; nilai lebih rendah tampak lebih halus dan reflektif, sedangkan nilai lebih tinggi tampak lebih kasar.

## Metalness

Nilai awal sphere utama **0,10**. Slider mengubah metalness secara langsung dalam rentang **0–1**. Gallery menyediakan pembanding metalness **0, 0,5, dan 1**.

## Jenis Interaction

- Orbit, zoom, dan pan kamera melalui `OrbitControls`.
- Klik objek memilih objek dan memperbarui panel informasi transform serta material.
- Pergantian kamera perspective/orthographic, FOV, environment, environment intensity, bloom, roughness, metalness, dan animation clip melalui kontrol halaman.
- Shortcut keyboard: `C` ganti kamera, `R` reset kamera, `E` toggle environment, `B` toggle bloom, dan `1`/`2`/`3` pilih clip.
- Objek terpilih berputar perlahan sampai selection berubah.

## Hover Feedback

Raycasting pada pointer menyorot objek yang dapat dipilih. Objek yang di-hover membesar menjadi **1,06×** dan menerima emissive highlight biru dengan intensitas **0,25**. Ketika pointer keluar, efek hover dipulihkan.

## Click Feedback

Klik memilih objek, membesarkannya menjadi **1,12×**, memberi emissive highlight lebih kuat (intensitas **0,5**), dan menampilkan nama, posisi world, rotasi, skala dasar, serta tipe material di panel selection. Jika pointer menggeser lebih dari 5 px, gesture dianggap sebagai drag kamera dan tidak memilih objek. Selection GLB juga mencoba memainkan clip gesture bila tersedia.

## Environment

Pilihan environment meliputi **Studio Small 09 (HDR)** dari `environment/environment.hdr`, **Fireplace HDRI** dari `environment/fireplace_4k.hdr`, dan **Procedural Studio** yang dibuat dengan canvas. Preset dapat dipilih pada dropdown; tombol **Environment** atau `E` menyalakan/mematikan environment lighting. Intensitas environment awal **0,55**. Jika HDRI studio gagal dimuat, scene menggunakan `RoomEnvironment` sebagai fallback.

## Challenge yang Dikerjakan

- **A — Multiple Animation Clips:** memilih Idle, Walk, dan Run dengan crossfade.
- **B — Click Animation:** klik GLB menjalankan clip gesture sekali jalan bila clip tersebut tersedia.
- **C — Information Panel:** menampilkan transform dan tipe material objek terpilih.
- **D — Hierarchical Solar System:** orbit Earth dan Moon dibangun menggunakan hierarchy group.
- **E — PBR Material Gallery:** membandingkan kombinasi roughness dan metalness.
- **F — Hover Emissive:** hover mengubah scale dan emissive tanpa merusak material asal.
- **G — Selection Rotation:** objek terpilih berputar perlahan.
- **H — Environment Toggle:** memilih HDRI atau procedural studio dan mengaktifkan/nonaktifkan environment lighting.

## Cara Menjalankan

**Versi siap buka:** buka folder `Praktikum Week 7` dengan Visual Studio Code, lalu jalankan `index.html` menggunakan ekstensi Live Server. Aplikasi memakai JavaScript module dan memuat model serta HDRI, sehingga server lokal lebih konsisten daripada membuka file dengan skema `file://`.

**Versi sumber Vite:** buka terminal pada folder `praktikum-7-vite`, lalu jalankan:

```bash
npm install
npm run dev
```

Buka alamat lokal yang ditampilkan Vite. Untuk membuat build produksi jalankan `npm run build`, kemudian sajikan isi folder `dist` melalui server lokal.

## Catatan Debugging

- Jika model tidak muncul, pastikan `models/model.glb` tersedia. Versi Vite mengambil file dari `public/models/model.glb`.
- Jika environment HDRI gagal dimuat, pastikan kedua file HDR berada di folder `environment` (atau `public/environment` untuk Vite). Studio tetap memiliki fallback `RoomEnvironment`.
- Jika animasi tidak berjalan, periksa status pemuatan model dan daftar clip di Console browser. Tombol clip mencari nama `Idle`, `Walk`, dan `Run`, lalu menggunakan urutan clip sebagai fallback.
- Jika klik objek tidak merespons, klik canvas untuk mengembalikan fokus keyboard dan pastikan pointer berada di atas objek. Drag kamera tidak dihitung sebagai klik selection.
- Jika tampilan atau interaksi bermasalah, periksa Console Developer Tools untuk error JavaScript/WebGL dan pastikan browser mendukung WebGL.
