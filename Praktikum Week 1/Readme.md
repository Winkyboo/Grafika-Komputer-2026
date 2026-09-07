# Praktikum Grafika Komputer 1

## Interactive Graphics Playground

Interactive Graphics Playground adalah hasil Praktikum Grafika Komputer Pertemuan 1 dari Kelompok 4. Halaman ini dibuat sebagai ruang eksperimen grafika 2D berbasis HTML Canvas. Di dalamnya terdapat primitive dasar, objek bergerak, sprite, input keyboard, input mouse, kontrol animasi, dan beberapa challenge interaktif.

Demo berjalan pada canvas berukuran **800 x 500 piksel** dan dapat langsung digunakan melalui browser tanpa framework atau proses build tambahan.

## Identitas Praktikum

| Nama           | NRP        | Mata Kuliah     | Kelas |
| ---            | ---        | ----------| --- |
| Willy Marcelius | 5025241096 | Grafika Komputer       | B |
| Rennard Filbert Tanjaya  | 5025241122           | Grafika Komputer | B |
  
## Tujuan

Proyek ini dibuat untuk menerapkan beberapa konsep dasar grafika komputer, yaitu:

1. Menggambar bentuk 2D menggunakan Canvas 2D API.
2. Mengatur posisi, ukuran, warna, dan properti objek melalui data JavaScript.
3. Membuat animasi menggunakan `requestAnimationFrame()`.
4. Mengolah input keyboard secara state-based.
5. Mengolah input mouse dan mengubah koordinat layar menjadi koordinat canvas.
6. Menggerakkan objek menggunakan posisi dan velocity.
7. Mendeteksi batas canvas dan membuat objek memantul.
8. Mengelola banyak objek dalam array.
9. Memahami perbedaan frame yang dibersihkan dan frame yang dipertahankan.

## Isi Halaman

Halaman terdiri atas beberapa bagian utama:

- **Canvas Playground**: area utama untuk melihat seluruh objek dan animasi.
- **Control Bar**: tombol trail, pause, reset, clear circles, dan pengatur kecepatan player.
- **Hint Row**: petunjuk input yang dapat digunakan.
- **Challenge Status**: daftar fitur interaktif yang tersedia.
- **Laporan Praktikum**: ringkasan parameter, kontrol, dan objek grafis.
- **How This Playground Works**: penjelasan alur data, update loop, dan rendering.
- **Challenge yang Diselesaikan**: penjelasan teknis untuk setiap challenge.

## Struktur File

```text
Praktikum Week 1/
├── index.html
├── style.css
├── app.js
├── frieren_player.png
├── frieren_movingobject.png
├── frieren_movingobject (2).png
├── screenshot.jpeg
└── Readme.md

```

### Penjelasan File

- `index.html`: struktur halaman, canvas, tombol, tabel laporan, dan konten dokumentasi yang tampil di browser.
- `style.css`: tampilan visual, layout responsif, warna, typography, panel, tabel, dan media query.
- `app.js`: seluruh logika Canvas 2D, animasi, input pengguna, state objek, dan event handler.
- `frieren_player.png`: sprite player yang dikendalikan oleh keyboard.
- `frieren_movingobject.png`: sprite objek Frieren bergerak pertama.
- `frieren_movingobject (2).png`: sprite objek Frieren bergerak kedua.
- `Readme.md`: dokumentasi proyek ini.

## Cara Menjalankan

### Cara 1: Membuka Langsung di Browser

1. Buka folder `Praktikum Week 1`.
2. Klik dua kali file `index.html`.
3. Browser akan menampilkan playground dan animasi secara otomatis.

### Cara 2: Menggunakan Live Server

Jika menggunakan Visual Studio Code:

1. Buka folder `Praktikum Week 1` di Visual Studio Code.
2. Pasang ekstensi Live Server jika belum tersedia.
3. Klik kanan `index.html`.
4. Pilih **Open with Live Server**.
5. Uji seluruh interaksi pada halaman yang terbuka.

Live Server disarankan saat mengembangkan proyek karena perubahan file dapat terlihat lebih mudah dan pemuatan aset lokal lebih konsisten.

## Kontrol Interaktif

| Input | Aksi | Detail Implementasi |
|---|---|---|
| `W`, `A`, `S`, `D` | Menggerakkan player | Status tombol disimpan lalu dibaca pada setiap frame |
| Arrow keys | Menggerakkan player | Alternatif dari tombol WASD |
| `R` | Reset posisi player | Mengembalikan player ke posisi awal `(600, 350)` |
| `Space` | Pause atau resume | Menghentikan atau memulai kembali animation loop |
| Klik kiri pada canvas | Membuat circle | Circle baru disimpan ke array `clickedCircles` |
| Klik kiri pada canvas | Mengganti warna moving ball | Warna dipilih bergantian dari array `colors` |
| Klik kanan pada canvas | Menghapus circle terakhir | Menggunakan operasi `pop()` sebagai undo |
| Tombol Clear Circles | Menghapus semua circle | Mengosongkan array `clickedCircles` |
| Mouse move | Menggerakkan follower circle | Posisi mouse disimpan dalam koordinat canvas |
| Tombol Trail Mode | Mengaktifkan atau mematikan jejak | Mengatur apakah canvas dibersihkan setiap frame |
| Speed slider | Mengubah kecepatan player | Nilai kecepatan berada pada rentang 1 sampai 12 |

## Objek Grafis

### Primitive Statis

Primitive dasar digambar menggunakan fungsi Canvas 2D API:

- **Rectangle**: digambar dengan `fillRect()` pada posisi `(80, 80)` berukuran `160 x 100`.
- **Line**: digambar dengan `moveTo()` dan `lineTo()`, kemudian dirender menggunakan `stroke()`.
- **Circle**: digambar menggunakan `arc()` dengan radius 60 piksel.
- **Triangle**: dibentuk dari tiga vertex menggunakan `moveTo()`, `lineTo()`, dan `closePath()`. Triangle memiliki warna fill dan warna garis tepi yang berbeda.
- **Coordinate grid**: garis bantu setiap 50 piksel untuk memperjelas sistem koordinat canvas.

### Objek Dinamis

- **Moving ball**: bola ungu yang bergerak menggunakan `speedX` dan `speedY`. Warnanya dapat berubah saat canvas diklik.
- **Player Frieren**: sprite berukuran `107 x 60` yang bergerak dengan keyboard.
- **Moving Frieren 1**: sprite berukuran `60 x 60` yang bergerak dan memantul pada batas canvas.
- **Moving Frieren 2**: sprite berukuran `65 x 65` yang memiliki posisi dan velocity sendiri.
- **Follower circle**: circle berwarna oranye yang mengikuti posisi pointer mouse.
- **Clicked circles**: kumpulan circle tambahan yang dibuat oleh klik kiri, dengan ukuran dan warna acak.
- **Mouse coordinate**: teks koordinat pointer yang dirender pada bagian kiri atas canvas.

## Konsep Koordinat Canvas

Canvas memiliki sistem koordinat dengan titik awal `(0, 0)` di sudut kiri atas.

- Sumbu `x` bertambah ke kanan.
- Sumbu `y` bertambah ke bawah.
- Batas horizontal canvas adalah `0` sampai `800`.
- Batas vertikal canvas adalah `0` sampai `500`.

Saat ukuran canvas terlihat mengecil pada layar, koordinat mouse tetap dihitung berdasarkan ukuran internal canvas. Perhitungannya menggunakan perbandingan ukuran asli canvas dan ukuran tampilan melalui `getBoundingClientRect()`:

```js
mouse.x = (event.clientX - rect.left) * (canvas.width / rect.width);
mouse.y = (event.clientY - rect.top) * (canvas.height / rect.height);
```

Dengan cara ini, posisi follower dan circle hasil klik tetap sesuai dengan lokasi pointer walaupun layout halaman responsif.

## Arsitektur JavaScript

### Data dan State

Objek grafis disimpan sebagai object JavaScript yang memiliki properti sesuai kebutuhannya, misalnya posisi, ukuran, warna, radius, dan velocity. State utama yang digunakan adalah:

- `keys`: menyimpan status tombol keyboard yang sedang ditekan.
- `mouse`: menyimpan koordinat mouse pada sistem koordinat canvas.
- `clickedCircles`: array berisi semua circle hasil klik kiri.
- `colorIndex`: indeks warna moving ball yang sedang digunakan.
- `isTrailMode`: menentukan apakah frame sebelumnya dipertahankan.
- `isPaused`: menentukan apakah animasi sedang berhenti.
- `player.speed`: kecepatan player yang diubah oleh slider.

### Event-based Input

Event-based digunakan untuk aksi yang terjadi satu kali atau ketika sebuah event diterima, seperti:

- Klik tombol reset.
- Klik tombol pause.
- Klik tombol clear circles.
- Klik kiri canvas.
- Klik kanan canvas.
- Menekan tombol `R`.
- Menekan tombol `Space`.
- Mengubah nilai speed slider.

### State-based Input

Untuk pergerakan player, `keydown` dan `keyup` hanya mengubah nilai pada object `keys`. Fungsi `updatePlayer()` membaca state tersebut pada setiap frame.

Pendekatan ini membuat:

- Pergerakan terasa kontinu.
- Beberapa tombol dapat ditekan bersamaan.
- Pergerakan diagonal dapat dilakukan.
- Gerakan tidak bergantung sepenuhnya pada fitur keyboard repeat browser.

## Animation Loop

Fungsi `animate()` dijalankan pertama kali di bagian akhir `app.js`, kemudian memanggil dirinya kembali dengan `requestAnimationFrame(animate)`.

Urutan proses dalam satu frame adalah:

1. Memeriksa apakah animasi sedang pause.
2. Membersihkan canvas jika Trail Mode tidak aktif.
3. Menggambar kembali coordinate grid.
4. Memperbarui posisi moving ball.
5. Memperbarui posisi player berdasarkan input keyboard.
6. Memperbarui dua sprite Frieren yang bergerak.
7. Menggambar primitive statis.
8. Menggambar circle hasil klik.
9. Menggambar player.
10. Menggambar moving ball.
11. Menggambar dua moving Frieren.
12. Menggambar follower circle.
13. Menampilkan koordinat mouse.
14. Menjadwalkan frame berikutnya.

Secara konseptual, alurnya adalah:

```text
INPUT / STATE
     |
     v
UPDATE POSITIONS AND VALUES
     |
     v
DRAW TO CANVAS
     |
     v
requestAnimationFrame()
```

## Perilaku Bouncing Object

Moving ball, moving Frieren pertama, dan moving Frieren kedua memiliki velocity pada sumbu horizontal dan vertikal.

Pada setiap frame, posisi ditambahkan dengan velocity:

```js
object.x += object.speedX;
object.y += object.speedY;
```

Jika objek menyentuh batas canvas, velocity dibalik:

```js
object.speedX *= -1;
object.speedY *= -1;
```

Untuk moving ball, pemeriksaan batas memperhitungkan radius. Untuk sprite Frieren, pemeriksaan batas memperhitungkan lebar dan tinggi sprite.

## Trail Mode

Dalam mode normal, `clearCanvas()` dipanggil setiap frame. Akibatnya, gambar dari frame sebelumnya dihapus sebelum objek pada posisi terbaru digambar.

Saat Trail Mode aktif, proses pembersihan canvas dilewati. Gambar dari frame sebelumnya tetap berada di canvas sehingga menghasilkan jejak pergerakan.

Saat Trail Mode dimatikan kembali, frame berikutnya akan membersihkan canvas dan mengembalikan tampilan ke mode normal.

## Challenge yang Diselesaikan

### 1. Keyboard Movement

Player Frieren dikendalikan dengan WASD atau tombol panah. Event `keydown` dan `keyup` menyimpan status tombol, sedangkan `updatePlayer()` menerapkan pergerakan pada setiap frame. Posisi player dibatasi agar tidak keluar dari canvas.

### 2. Mouse Coordinate

Event `mousemove` mengambil posisi pointer dan mengonversinya dari koordinat halaman ke koordinat internal canvas. Koordinat tersebut ditampilkan secara real-time sebagai pasangan `(x, y)`.

### 3. Bouncing Object

Moving ball menggunakan `speedX` dan `speedY`. Ketika bagian tepi bola mencapai batas canvas, velocity pada sumbu yang sesuai dibalik sehingga bola memantul.

### 4. Follow Mouse

Follower circle menggunakan nilai `mouse.x` dan `mouse.y`. Karena nilai tersebut sudah dikonversi ke sistem koordinat canvas, follower tetap berada di bawah pointer meskipun canvas ditampilkan dengan ukuran berbeda.

### 5. Click to Create Circle

Setiap klik kiri membuat object baru yang berisi koordinat, radius acak, dan warna acak. Object tersebut dimasukkan ke `clickedCircles` dan digambar ulang pada setiap frame. Klik kanan menghapus object terakhir.

### 6. Trail Mode

Trail Mode mempertahankan hasil gambar dari frame sebelumnya dengan melewati pemanggilan `clearCanvas()`. Fitur ini memperlihatkan perbedaan antara rendering dengan frame buffer yang selalu dibersihkan dan frame yang dibiarkan menetap.

### 7. Multiple Moving Objects

Dua sprite Frieren memiliki data posisi, ukuran, dan velocity masing-masing. Keduanya diperbarui secara independen sehingga dapat bergerak dengan kecepatan dan lintasan berbeda.

## Teknologi yang Digunakan

- HTML5
- CSS3
- JavaScript vanilla
- HTML Canvas 2D API
- `requestAnimationFrame()`
- Google Fonts: Nunito
- Format aset gambar: PNG

Proyek ini tidak menggunakan framework JavaScript, library grafika eksternal, package manager, atau proses kompilasi.

## Desain Responsif

`style.css` menyediakan beberapa penyesuaian layout:

- Pada layar lebar, playground dan laporan ditampilkan dalam dua kolom.
- Pada layar sekitar 900 piksel atau lebih kecil, konten utama berubah menjadi satu kolom.
- Pada layar kecil, challenge ditampilkan satu kolom agar mudah dibaca.
- Canvas menggunakan lebar 100% sehingga dapat mengikuti lebar panel.
- Ukuran internal canvas tetap 800 x 500 sehingga sistem koordinat dan perhitungan objek tetap konsisten.
- Control bar berubah menjadi susunan vertikal pada layar kecil.

## Troubleshooting

### Canvas kosong atau sprite tidak muncul

Pastikan file berikut berada di folder yang sama dengan `index.html`:

- `frieren_player.png`
- `frieren_movingobject.png`
- `frieren_movingobject (2).png`

Periksa juga nama file, termasuk spasi dan penggunaan huruf besar atau kecil.

### Tombol keyboard tidak berfungsi

Klik area halaman atau canvas terlebih dahulu, lalu coba tekan WASD, tombol panah, `R`, atau `Space`. Pastikan browser tidak sedang fokus pada address bar atau input lain.

### Klik kanan membuka menu browser

Kode sudah memanggil `event.preventDefault()` untuk context menu pada canvas. Jika menu tetap muncul, pastikan klik kanan dilakukan tepat di area canvas.

### Animasi berhenti

Klik tombol **Resume** atau tekan `Space`. Jika tab browser tidak sedang aktif, browser dapat mengurangi frekuensi `requestAnimationFrame()` untuk menghemat sumber daya.

### Tidak ada perubahan setelah mengedit file

Muat ulang halaman browser. Jika menggunakan Live Server, pastikan file yang diedit berada di folder proyek yang sedang dijalankan.

## Checklist Pengujian

- [x] `index.html` dapat dibuka tanpa error.
- [x] Canvas terlihat dengan ukuran dan layout yang sesuai.
- [x] Rectangle, line, circle, dan triangle terlihat.
- [x] Moving ball bergerak dan memantul.
- [x] Dua sprite moving Frieren bergerak dan memantul.
- [x] Player dapat digerakkan dengan WASD.
- [x] Player dapat digerakkan dengan tombol panah.
- [x] Player tidak keluar dari batas canvas.
- [x] Tombol `R` dan Reset mengembalikan posisi player.
- [x] Tombol `Space` dan Pause dapat menghentikan animasi.
- [x] Speed slider mengubah kecepatan player.
- [x] Koordinat mouse tampil dan berubah secara real-time.
- [x] Follower circle mengikuti mouse.
- [x] Klik kiri membuat circle baru.
- [x] Klik kiri mengubah warna moving ball.
- [x] Klik kanan menghapus circle terakhir.
- [x] Clear Circles menghapus semua circle hasil klik.
- [x] Trail Mode menghasilkan jejak gerakan.
- [x] Console browser tidak menampilkan error merah.
- [x] Semua aset PNG dapat dimuat.

## Kesimpulan

Interactive Graphics Playground berhasil menggabungkan primitive 2D, image rendering, animasi, input keyboard, input mouse, collision sederhana dengan batas canvas, pengelolaan array object, dan kontrol state dalam satu halaman web. Struktur data dipisahkan dari fungsi update dan fungsi draw, sehingga alur utama program dapat dipahami sebagai:

```text
Data dan input
    -> update state
    -> render ulang ke Canvas
    -> ulangi pada frame berikutnya
```

Proyek ini menjadi dasar untuk mempelajari transformasi 2D, sprite animation, collision detection yang lebih kompleks, dan teknik rendering interaktif pada praktikum berikutnya.
