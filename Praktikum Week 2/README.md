# Praktikum Grafika Komputer 2

## WebGL Primitive Playground

WebGL Primitive Playground adalah hasil Praktikum Grafika Komputer Pertemuan 2 dari Kelompok 4. Aplikasi ini merupakan ruang eksperimen primitive 2D berbasis **WebGL 2.0**. Pengguna dapat mengamati vertex color dan interpolasi warna, mengubah bentuk serta draw mode primitive, menggerakkan object dengan keyboard, dan membuat primitive baru melalui klik mouse.

Canvas memiliki resolusi internal **800 × 600 piksel**. Seluruh proses gambar memakai JavaScript vanilla dan WebGL; tidak menggunakan framework, library grafika eksternal, maupun proses build.

## Identitas Praktikum

| Nama | NRP | Mata Kuliah | Kelas | Kelompok |
| --- | --- | --- | --- | --- |
| Willy Marcelius | 5025241096 | Grafika Komputer | B | 4 |
| Rennard Filbert Tanjaya | 5025241122 | Grafika Komputer | B | 4 |

## Deskripsi Aplikasi

Halaman dibagi menjadi dua panel: **WebGL Canvas Playground** sebagai area render dan **WebGL Controls** sebagai area parameter. Tiga object otomatis bergerak dengan velocity berbeda dan memantul pada batas Normalized Device Coordinates (NDC). Satu primitive terpilih dapat dipindahkan secara kontinu, diubah bentuknya, diubah draw mode-nya, dan diberi warna baru.

Primitive hasil klik kiri disimpan dalam array `spawned`, sehingga setiap klik akan menambah object baru ke scene. Klik kanan berfungsi sebagai undo untuk object terakhir, sedangkan tombol **Clear spawned primitives** menghapus seluruh object hasil spawn.

## Struktur File

```text
Praktikum Week 2/
├── index.html     # Struktur halaman, canvas, HUD, dan kontrol
├── style.css      # Layout dan identitas visual yang konsisten dengan Week 1
├── main.js        # WebGL, shader, buffer, animasi, dan interaksi
└── README.md      # Dokumentasi proyek
```

## Primitive yang Digunakan

| Primitive | Implementasi | Perilaku |
| --- | --- | --- |
| Triangle | Tiga vertex lokal | Salah satu object bouncing dan memiliki vertex color berbeda. |
| Rectangle | Enam vertex / dua triangle | Menjadi bentuk awal primitive yang dikontrol keyboard. |
| Line shape | Lima vertex membentuk garis patah | Dapat dipilih sebagai bentuk terkontrol atau object bouncing. |
| Procedural points | 18 vertex yang dibuat dengan perulangan JavaScript | Titik disusun melingkar dengan `sin()` dan `cos()`. |
| Procedural grid | Vertex garis yang dibuat dengan perulangan | Garis bantu NDC yang dapat ditampilkan atau disembunyikan. |
| Spawned primitive | Salinan bentuk aktif pada posisi klik | Dapat ditambah, di-undo, atau dihapus seluruhnya. |

## Shader dan Vertex Color

Aplikasi menggunakan satu vertex shader dan satu fragment shader.

- Attribute `a_position` menerima koordinat `vec2` setiap vertex.
- Attribute `a_color` menerima warna RGB `vec3` setiap vertex.
- Vertex shader meneruskan warna ke variabel `v_color`.
- Fragment shader menggunakan `v_color` sebagai warna pixel akhir.

Karena warna diberikan per vertex, GPU menginterpolasi warna di antara vertex saat primitive digambar. Triangle bouncing menggunakan tiga warna vertex yang berbeda sehingga gradasi warnanya terlihat jelas.

## Draw Mode

Primitive yang dikontrol dapat memakai salah satu mode berikut.

| Draw mode | Konstanta WebGL | Kegunaan |
| --- | --- | --- |
| Triangles | `gl.TRIANGLES` | Menggambar segitiga atau rectangle dari dua triangle. |
| Line Strip | `gl.LINE_STRIP` | Menghubungkan vertex secara berurutan menjadi garis. |
| Points | `gl.POINTS` | Menggambar setiap vertex sebagai titik. |

Grid procedural digambar menggunakan `gl.LINES` agar setiap pasangan vertex membentuk satu garis grid.

## Fitur Animasi

Tiga object pada array `bouncers` memiliki properti posisi `x`, `y`, velocity `vx`, `vy`, bentuk, mode, dan warna. Pada setiap frame, posisi diperbarui menggunakan velocity dan nilai velocity dibalik ketika mencapai batas NDC.

```js
item.x += item.vx * scale;
item.y += item.vy * scale;

if (item.x > 0.83 || item.x < -0.83) item.vx *= -1;
if (item.y > 0.83 || item.y < -0.83) item.vy *= -1;
```

Dengan pemeriksaan pada sumbu X dan Y, primitive memantul ke kiri/kanan sekaligus atas/bawah. Kecepatan animasi dapat diatur dengan slider. Rendering dilakukan terus-menerus memakai `requestAnimationFrame(render)`.

Alur satu frame:

```text
State keyboard dan parameter
        ↓
Update object bouncing dan object terkontrol
        ↓
Upload vertex position/color ke buffer GPU
        ↓
gl.drawArrays()
        ↓
requestAnimationFrame(render)
```

Posisi diunggah dengan `gl.DYNAMIC_DRAW` karena data vertex dapat berubah pada setiap frame.

## Fitur Interaksi

| Input / Kontrol | Aksi | Pola |
| --- | --- | --- |
| `W`, `A`, `S`, `D` atau Arrow key | Memindahkan primitive terpilih | State-based: `keydown`/`keyup` menyimpan state, lalu posisi di-update setiap frame. |
| `R` atau tombol Reset | Reset posisi primitive terkontrol, menghapus spawn, dan melanjutkan animasi | Event-based. |
| `P` atau tombol Pause | Pause / resume animasi | Event-based. |
| Primitive selector | Mengganti bentuk primitive terkontrol | Triangle, rectangle, line shape, atau procedural points. |
| Draw mode selector | Mengganti cara gambar primitive terkontrol | Triangles, line strip, atau points. |
| Tombol warna | Mengganti warna primitive terkontrol | Red, green, blue, cyan, atau random. |
| Klik kiri canvas | Spawn primitive baru pada posisi mouse | Koordinat pixel dikonversi ke NDC. |
| Klik kanan canvas | Undo spawn terakhir | `spawned.pop()`. |
| Clear spawned primitives | Menghapus semua primitive hasil klik | Mengosongkan array `spawned`. |
| Procedural grid pattern | Menampilkan / menyembunyikan grid | Toggle checkbox. |

## Konversi Mouse ke NDC

WebGL menggunakan NDC dengan rentang `-1` sampai `+1`; sumbu Y positif mengarah ke atas. Posisi mouse pada elemen canvas dikonversi sebelum object dibuat.

```js
const ndcX = (mouseX / canvasWidth) * 2 - 1;
const ndcY = 1 - (mouseY / canvasHeight) * 2;
```

Nilai hasil konversi ditampilkan pada HUD **Mouse NDC** dan digunakan sebagai posisi object hasil klik kiri.

## Challenge yang Dikerjakan

- [x] **Challenge A — Primitive Selector**: selector untuk triangle, rectangle, line shape, dan procedural points.
- [x] **Challenge B — Color Control**: tombol red, green, blue, cyan, serta random.
- [x] **Challenge C — Spawn Primitive**: klik kiri membuat primitive baru di lokasi mouse; klik kanan menghapus spawn terakhir.
- [x] **Challenge D — Multiple Moving Objects**: tiga object memiliki posisi, velocity, warna, dan arah berbeda; semuanya memantul pada empat sisi NDC.
- [x] **Challenge E — Procedural Pattern**: grid dan circular points dibentuk melalui perulangan JavaScript.
- [x] **Challenge F — Simple HUD**: menampilkan FPS, jumlah primitive, draw mode aktif, dan koordinat mouse NDC.

## Cara Menjalankan Project

### Cara 1: Buka langsung di browser

1. Buka folder `Praktikum Week 2`.
2. Klik dua kali `index.html`.
3. Browser akan memuat canvas dan memulai animasi secara otomatis.

### Cara 2: Menggunakan Live Server

1. Buka folder proyek pada Visual Studio Code.
2. Pasang ekstensi **Live Server** bila belum tersedia.
3. Klik kanan `Praktikum Week 2/index.html`.
4. Pilih **Open with Live Server**.
5. Coba seluruh kontrol keyboard, mouse, selector, dan tombol pada halaman.

Live Server disarankan saat pengembangan karena perubahan HTML, CSS, dan JavaScript dapat dimuat ulang dengan mudah.

## Checklist Pengujian

- [x] Canvas WebGL 2.0 muncul dengan background non-default.
- [x] Minimal tiga primitive tampil pada scene.
- [x] Minimal dua draw mode tersedia dan dapat digunakan.
- [x] Vertex color dan interpolasi warna digunakan.
- [x] Minimal satu triangle memiliki tiga warna vertex berbeda.
- [x] Object bergerak dan memantul pada batas horizontal serta vertikal.
- [x] Keyboard movement menggunakan pola state-based.
- [x] Klik kiri spawn dan klik kanan undo berfungsi.
- [x] Tombol pause, reset, clear, pengatur warna, dan speed slider tersedia.
- [x] Rendering loop menggunakan `requestAnimationFrame()`.
- [x] HUD dan grid procedural tersedia.

## Teknologi yang Digunakan

- HTML5
- CSS3
- JavaScript vanilla
- WebGL 2.0
- GLSL ES 3.00 (vertex shader dan fragment shader)
- `requestAnimationFrame()`
- Google Fonts: Nunito

## Kesimpulan

Praktikum ini menerapkan dasar pipeline WebGL: data posisi dan warna disimpan sebagai vertex attribute, shader mengolah data tersebut di GPU, lalu `gl.drawArrays()` menggambar primitive menggunakan draw mode yang dipilih. Dengan menggabungkan animation loop, dynamic buffer, state-based keyboard, mouse input, dan array spawn, aplikasi menjadi playground WebGL interaktif yang dapat dikembangkan lebih lanjut pada praktikum transformasi matrix berikutnya.
