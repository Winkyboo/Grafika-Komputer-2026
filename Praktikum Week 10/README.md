# Praktikum Grafika Komputer 10 — UV Mapping, PBR Texturing & Rendering

## Identitas

| Nama | NRP | Mata Kuliah | Kelas | Kelompok |
| --- | --- | --- | --- | --- |
| Willy Marcelius | 5025241096 | Grafika Komputer | B | 4 |
| Rennard Filbert Tanjaya | 5025241122 | Grafika Komputer | B | 4 |


## Nama Asset

**Kelompok 04 — Modular Sci-Fi Supply Crate**

## Deskripsi Asset

Peti kargo futuristik bergaya industrial sci-fi, dilengkapi dengan panel pelindung, baut, gagang samping, dan indikator status LED (*emission*). Asset ini dimodelkan sebagai *hard-surface* dan kini telah diberikan tekstur *Physically Based Rendering* (PBR).

## UV Mapping

*   **Strategi Seam:** 
    Garis *seam* (Mark Seam) ditempatkan pada sudut-sudut tajam (sudut 90 derajat) dan rusuk yang tidak langsung terlihat oleh kamera (seperti bagian bawah krat atau bagian belakang panel). Tujuannya agar *UV Island* dapat terbentang datar di kanvas 2D tanpa distorsi, sekaligus menyembunyikan "jahitan" tekstur dari sudut pandang utama.
*   **Jumlah/Jenis UV Island Utama:** 
    Terdapat *island* besar untuk bodi utama, panel atas, dan armor oranye. Komponen kecil seperti baut-baut dan gagang pintu dijadikan *island* berukuran lebih kecil yang terselip di area kosong.
*   **Masalah UV yang Ditemukan:** 
    Beberapa area bodi mengalami *stretching* (pola catur/checker tampak memanjang atau tertarik).
*   **Cara Memperbaiki Distortion:** 
    Menambahkan *Mark Seam* tambahan pada area yang melengkung tajam dan melakukan proses *Unwrap* ulang. Kami juga menggunakan fitur *Pack Islands* dengan memberikan jarak margin antar *island* agar tekstur tidak bocor (*bleeding*).

## Material & PBR Texturing

*   **Texture Maps yang Digunakan:**
    1. `asset_basecolor.png` (Warna Dasar)
    2. `asset_roughness.png` (Tingkat Kekasaran/Kekusaman)
    3. `asset_metalness.png` (Sifat Logam)
    4. `asset_normal.png` (Detail Timbul/Relief)
    5. `asset_emission.png` (Pendaran Cahaya/Masking Lampu)
*   **Color Space Setiap Map:**
    *   Base Color & Emission: **sRGB**
    *   Roughness, Metallic, & Normal Map: **Non-Color**
*   **Bagian Metal:**
    Area logam murni yang catnya terkelupas. Diatur melalui piksel putih (nilai 1) pada `asset_metalness.png`.
*   **Bagian Non-Metal:**
    Seluruh area bodi yang terlapisi cat oranye dan abu-abu gelap. Diatur melalui piksel hitam (nilai 0) pada `asset_metalness.png`.
*   **Bagian Emission:**
    Area titik lampu indikator (Status Indicator) berwarna *cyan* terang.
*   **Normal Detail:**
    Penggunaan `asset_normal.png` untuk menghasilkan ilusi ukiran tulisan "KELOMPOK 04", garis-garis ventilasi (*grill*), dan goresan-goresan kecil tanpa perlu menambah jumlah poligon/geometri pada 3D mesh.

## Challenge yang Dikerjakan

1.  **Challenge A (Multi-Material Surface):** Menggunakan dua material terpisah, yaitu `Main Body` (PBR logam/cat) dan `Status Indicator` (khusus *emission* LED) agar pendaran lampu lebih fokus dan mudah dikontrol.
2.  **Challenge D (Custom Emission Mask):** Menggunakan file `asset_emission.png` khusus di material *Status Indicator* berlatar belakang hitam pekat, sehingga memastikan hanya area lampu yang menyala, tanpa ada kebocoran cahaya (*Zero Light-Bleed*) ke bodi utama.
3.  **Challenge E (Custom Roughness Variation):** Menggunakan `asset_roughness.png` untuk menciptakan variasi pantulan; area cat bersih memantulkan cahaya tajam, sedangkan area lecet memantul pudar tanpa mengubah geometri.
4.  **Challenge F (Metal + Painted Surface):** Menggunakan nilai pada *Metallic Map* untuk mendefinisikan batas antara cat non-logam dengan bodi besi telanjang dalam satu material bodi krat.
5.  **Challenge G (UV Optimization):** Merapikan *UV Layout* dengan *margin* aman dan meminimalkan ruang kosong (negative space) untuk konsistensi resolusi *texel*.
6.  **Challenge H (Normal Detail):** Menggunakan *Normal Map* untuk detail tulisan "KELOMPOK 04", sangat menghemat memori (*polycount* rendah) dibanding harus memodelkan lekukan huruf satu per satu.

## Kendala dan Solusi

1.  **Cahaya Indikator Membocor (*Light Bleed*) ke Seluruh Bodi:**
    *   **Kendala:** Saat mengatur node Emission, bodi cat di main body ikut berpendar terang memutih.
    *   **Solusi:** Memisahkan *Status Indicator* ke dalam slot materialnya sendiri dan menerapkan *Custom Emission Mask* hitam pekat.
2.  **Komponen Tertinggal Warna Bawaan (Putih):**
    *   **Kendala:** Panel atas dan kanan tertinggal tanpa tekstur karena materialnya belum di-*assign*.
    *   **Solusi:** Menyeleksi panel-panel yang belum diwarna, memilih bodi utama (K04 | Graphite Armor) sebagai *active object*, lalu menekan **Ctrl + L (Link Materials)** untuk menerapkan slot material PBR secara instan ke objek sisanya.

## File project

- File Blender: [P10_04_Sci-FiCrate.blend](P10_04_Sci-FiCrate.blend)
- Screenshot: folder [Screenshot](screenshots/)
- Texture: folder [Texture](textures/)
