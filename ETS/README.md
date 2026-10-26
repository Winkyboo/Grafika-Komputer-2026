# Ujian Tengah Semester Grafika Komputer — Robot Swarm Factory

## Identitas

| Nama | NRP | Mata Kuliah | Kelas | Kelompok |
| --- | --- | --- | --- | --- |
| Willy Marcelius | 5025241096 | Grafika Komputer | B | 4 |
| Rennard Filbert Tanjaya | 5025241122 | Grafika Komputer | B | 4 |

## Judul Game

**Robot Swarm Factory**

## Deskripsi

Game 3D berbasis browser ini mengajak pemain memimpin kawanan robot melewati lini produksi di dalam pabrik. Kumpulkan peningkatan, hindari mesin berbahaya, kalahkan robot penjaga, lalu hancurkan bos reaktor di ujung lintasan.

## Gameplay

Pemain memulai dengan 10 robot. Selama berlari melewati pabrik, pilih jalur gerbang untuk menambah jumlah robot atau mengurangi kerugian, hindari gergaji dan mesin press, lalu ambil kristal untuk meningkatkan firepower. Di tengah lintasan, pemain menghadapi duel robot penjaga: geser untuk membidik dan menghindari zona serangan, lalu tembak saat target terlihat. Robot yang tersisa menyerang reaktor secara otomatis. Hindari kepalan bos sampai HP reaktor habis. Permainan berakhir jika seluruh robot habis sebelum bos dikalahkan.

## Kontrol dan Interaksi

| Aksi | Kontrol |
| --- | --- |
| Bergerak ke kiri/kanan | `A` / `D` atau tombol panah kiri/kanan |
| Bergerak di layar sentuh | Seret layar ke kiri/kanan |
| Membidik saat duel penjaga | Bergerak ke kiri/kanan menggunakan kontrol gerak |
| Menembak saat duel penjaga | Tahan `Space` atau `Enter` atau klik robotnya |
| Jeda atau lanjut | `P`, `Escape`, atau tombol **Pause** |
| Memulai permainan | Tombol **Mulai shift** |
| Memulai ulang atau kembali ke menu | Tombol pada overlay jeda |

## Fitur Grafis

- Lingkungan pabrik 3D dengan lantai bertekstur, dinding, langit-langit, rangka, rel derek, tungku, dan lampu kerja.
- Pencahayaan hemisphere dan directional, bayangan, fog atmosferik, ACES filmic tone mapping, dan environment map dari `RoomEnvironment`.
- Model robot dari berkas GLB, dimuat dengan `GLTFLoader`; geometri kawanan menggunakan instancing.
- Geometri dan tekstur prosedural untuk lantai, papan nama, material, debu, dan efek partikel.
- Animasi pada mesin, pickup, lampu, robot, tembakan, dan kamera; partikel digunakan untuk jejak, pickup, dan benturan.
- HUD menampilkan jumlah robot, firepower, HP bos, dan HP duel penjaga.
- Antarmuka menyesuaikan layar desktop dan ponsel serta mendukung keyboard dan sentuh.

## Aset dan Kredit

- **Model robot:** [Mini-robot BlackMikeDR](https://sketchfab.com/3d-models/mini-robot-blackmikedr-7d1afd480e9a45fb9e4da665150bdc4b), karya **BlackMikeDR**, diunduh dan digunakan sebagai `models/mini-robot.glb`. Lisensi mengikuti ketentuan yang tercantum pada halaman model Sketchfab.
- **Aset prosedural:** tekstur lantai dan papan nama, material, geometri lingkungan, debu, serta partikel dibuat atau dirangkai di kode game.
- **Library:** [Three.js](https://threejs.org/) untuk rendering 3D dan pemuatan model GLB.

## Struktur Project

```text
Grafika-Komputer-2026/
├── ETS/                    # Build statis game
│   ├── assets/             # JavaScript dan CSS hasil build
│   ├── models/             # Model robot GLB
│   ├── index.html
│   └── README.md
└── ets-vite/               # Source project untuk pengembangan
    ├── public/models/
    │   └── mini-robot.glb  # Aset 3D Robot
    ├── src/
    │   ├── main.js         # Scene Three.js, gameplay, input, dan animasi
    │   └── style.css       # HUD dan tampilan antarmuka
    ├── index.html
    ├── package.json
    └── vite.config.js
```

## Cara Menjalankan

Perlu Node.js dan npm. Jalankan perintah berikut dari folder utama repository untuk memulai server pengembangan:

```bash
cd ets-vite
npm install
npm run dev
```

Buka alamat lokal yang ditampilkan Vite di terminal. Untuk membuat dan melihat build produksi:

```bash
npm run build
npm run preview
```

Build Vite berada di `ets-vite/dist/`. Folder `ETS/` pada repository ini juga berisi build statis; sajikan melalui web server statis agar model dan berkas aset dapat dimuat dengan benar.

## Challenge yang Dikerjakan

- Menjaga performa saat banyak robot dan efek partikel tampil bersamaan; model robot dan objek berulang dirender menggunakan instancing.
- Menyeimbangkan jumlah robot, pilihan gerbang, rintangan, pickup, duel penjaga, dan kekuatan bos.
- Membuat duel penjaga yang menggabungkan bidikan, perlindungan di tengah, dan waktu menghindar.
- Menyelaraskan kontrol keyboard dan sentuh dengan HUD agar permainan dapat dimainkan di desktop maupun ponsel.
- Membangun tampilan pabrik yang terbaca sebagai ruang 3D dengan fog, pencahayaan, bayangan, material, dan detail lingkungan.

## Pembagian Kontribusi

| Anggota | Kontribusi |
| --- | --- |
| Willy Marcelius | 50% — merancang dan membangun fondasi scene 3D pabrik, mengembangkan lintasan utama beserta gerbang dan rintangan, serta mengintegrasikan model robot dan optimasi render kawanan. |
| Rennard Filbert Tanjaya | 50% — mengembangkan duel robot penjaga dan pertarungan bos, sistem pickup dan firepower, HUD serta menu jeda, dan penyempurnaan efek visual serta kontrol permainan. |

