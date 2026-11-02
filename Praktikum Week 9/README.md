# Praktikum Grafika Komputer 9 — Blender Fundamental & 3D Modeling

## Identitas

| Nama | NRP | Mata Kuliah | Kelas | Kelompok |
| --- | --- | --- | --- | --- |
| Willy Marcelius | 5025241096 | Grafika Komputer | B | 4 |
| Rennard Filbert Tanjaya | 5025241122 | Grafika Komputer | B | 4 |

## Nama Asset dan Konsep

**Kelompok 04 — Modular Sci-Fi Supply Crate**

Asset ini adalah peti kargo futuristik bergaya industrial sci-fi, terinspirasi dari kotak perlengkapan militer dan kontainer teknologi. Bentuk utamanya berupa kotak dengan panel depan cekung, panel armor, pelindung sudut, pegangan samping, cooling fins, baut, pengunci, dan indikator.

Badan berwarna gelap dipadukan dengan aksen oranye dan indikator biru untuk memberi kesan kuat dan modern. Model dibuat sebagai hard-surface asset dengan komponen yang terpisah dan dikelompokkan menurut fungsinya.

## Primitive Awal

Model disusun dari beberapa primitive Blender:

- **Cube** untuk badan utama, tutup, armor, pelindung sudut, pegangan, pengunci, dan komponen mekanis.
- **Plane** untuk panel tipis yang kemudian diberi ketebalan menggunakan Solidify Modifier.
- **Cylinder** untuk baut, pengunci, dan indikator berbentuk bulat.
- **Text Object** untuk tulisan identitas pada panel depan.

Primitive diatur dengan Grab (G), Rotate (R), dan Scale (S), termasuk pembatasan sumbu X, Y, dan Z. Scale diterapkan sebelum penggunaan modifier agar hasilnya lebih terkontrol.

## Operasi Modeling dan Modifier

Modeling dilakukan di Object Mode dan Edit Mode. Operasi utama yang digunakan adalah transformasi posisi, rotasi, dan skala, serta teknik **Inset**, **Extrude**, **Loop Cut**, dan **Bevel** untuk membangun serta merapikan bentuk hard-surface.

Modifier yang digunakan:

- **Mirror** untuk membuat pelindung sudut yang simetris.
- **Array** untuk menyusun cooling fins berulang dengan jarak teratur.
- **Solidify** untuk memberi ketebalan pada panel armor yang dibuat dari plane.
- **Bevel** untuk memotong tepi tajam pada badan dan komponen.
- **Weighted Normal** untuk membantu merapikan shading pada permukaan.

## Penerapan Teknik Modeling

- **Inset:** diterapkan pada face depan badan utama untuk membentuk batas/bingkai panel depan.
- **Extrude:** face hasil Inset didorong ke dalam untuk membentuk area panel yang cekung (recessed).
- **Loop Cut:** digunakan pada mesh badan utama dengan Ctrl + R untuk menambah edge loop dan memberi kontrol lebih pada pembagian geometri serta tepi panel.
- **Bevel:** diterapkan pada tepi badan utama dan komponen armor. Bevel juga digunakan pada komponen kecil seperti baut, pegangan, dan panel agar sudutnya tidak tampak terlalu tajam.

## Tahap Pengerjaan

### 1. Blockout

Badan kotak dan tutup atas dibentuk terlebih dahulu dari cube untuk menetapkan proporsi dasar peti.

![Blockout badan dan tutup atas](Screenshot%20Proses/blockout.png)

### 2. Panel Depan dengan Inset dan Extrude

Face depan badan utama dipilih, kemudian diberi Inset untuk membentuk bingkai panel. Area di dalam bingkai diproses lebih lanjut dengan Extrude ke arah dalam.

![Tahap Inset dan Extrude panel depan](Screenshot%20Proses/extrude.png)

### 3. Loop Cut dan Bevel

Edge loop ditambahkan pada badan utama untuk membantu mengontrol tepi panel. Bevel kemudian membentuk chamfer pada tepi dan mempertahankan silhouette kotak.

![Tahap Loop Cut dan persiapan Bevel](Screenshot%20Proses/bevel.png)

### 4. Penerapan Modifier

Modifier digunakan untuk membuat komponen simetris dan berulang, memberi ketebalan pada panel, serta merapikan tepi dan shading.

![Penerapan modifier pada komponen asset](Screenshot%20Proses/modifier.png)

### 5. Hasil Akhir

Asset akhir menampilkan badan peti, panel depan berbingkai dengan cooling fins dan indikator, armor oranye, panel samping, pegangan, serta detail mekanis lainnya.

![Hasil akhir Modular Sci-Fi Supply Crate](Screenshot%20Final/final.png)

## Topology Cleanup

Tahap cleanup mencakup pemeriksaan dan perapian geometri agar bentuk asset tetap terbaca dan siap untuk tahap lanjutan, seperti UV Unwrapping dan pemberian material:

- Memeriksa dan menggabungkan vertex yang bertumpuk menggunakan **Merge by Distance** bila diperlukan.
- Memeriksa arah normal dan memperbaikinya dengan **Recalculate Outside** bila diperlukan.
- Memastikan bevel tidak bertumpuk atau menghasilkan geometri yang tidak diinginkan.
- Memeriksa silhouette, proporsi, posisi, dan susunan komponen.
- Menamai object dengan jelas dan mengelompokkan komponen berdasarkan fungsinya di Outliner.

## Challenge yang Diterapkan

1. **Symmetric Prop (Mirror):** pelindung sudut dibuat simetris.
2. **Repeated Detail (Array):** cooling fins disusun berulang dengan jarak teratur.
3. **Thin Panel (Solidify):** panel armor berbahan plane diberi ketebalan.
4. **Precision Modeling:** nilai numerik digunakan pada dimensi dan transformasi agar ukuran serta posisi komponen konsisten.

## Kendala dan Solusi

1. **Pengaturan render engine:** script awal menggunakan nama render engine yang tidak tersedia pada Blender 5.2.  
   **Solusi:** pengaturan engine diubah menjadi **BLENDER_EEVEE** sesuai pilihan yang tersedia.

2. **Izin penyimpanan file:** file tidak dapat disimpan di folder instalasi Blender pada Program Files karena pembatasan izin Windows.  
   **Solusi:** lokasi penyimpanan dipindahkan ke folder Downloads yang dapat ditulisi.

3. **Collection duplikat di Outliner:** menjalankan script berulang kali dapat membuat collection bernama sama dengan akhiran .001 atau .002.  
   **Solusi:** Outliner dirapikan, object dikelompokkan berdasarkan fungsi, dan pembuatan collection duplikat dihindari.

4. **Loop Cut otomatis bergantung pada konteks viewport:** operasi otomatis dapat gagal ketika konteks viewport Blender tidak sesuai.  
   **Solusi:** Loop Cut dilakukan secara manual menggunakan Ctrl + R di Edit Mode agar penempatan edge loop dapat dikontrol langsung.

## File Proyek

- File Blender: [P09_04_Sci-FiCrate.blend](P09_04_Sci-FiCrate.blend)
- Screenshot proses: folder [Screenshot Proses](Screenshot%20Proses/)
- Screenshot hasil akhir: folder [Screenshot Final](Screenshot%20Final/)

