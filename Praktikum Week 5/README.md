# Praktikum Grafika Komputer — Pertemuan 5

**Kelompok:** 4 · **Kelas:** B  
**Anggota:** Willy Marcelius (5025241096), Rennard Filbert Tanjaya (5025241122)

## Textured and Lit Object Playground

Playground WebGL 2 untuk mengamati hubungan normal, UV, texture, serta ambient, diffuse, dan specular lighting. Scene menyediakan kubus, bola, torus, dan torus knot; bentuk selain kubus dibangkitkan secara prosedural. Texture bawaan meliputi checkerboard, stripes, gradient, dan image texture dari `assets/texture.png`. Pengguna juga bisa memilih file gambar lokal.

## Menjalankan

Buka folder `Praktikum Week 5` melalui server lokal seperti VS Code Live Server, lalu buka `index.html`. ES modules dan pemuatan image lokal memerlukan halaman yang dijalankan melalui HTTP lokal.

## Kontrol

| Kontrol | Fungsi |
| --- | --- |
| Arrow keys, W/S | Geser point light pada X/Y/Z |
| I/J/K/L | Gerakkan kamera pada X/Y |
| Q/E | Gerakkan kamera maju/mundur pada Z |
| A/Z | Naikkan/turunkan ambient strength |
| F | Ganti flat/smooth shading |
| T | Texture ON/OFF |
| O | Toggle camera orbit |
| P | Jeda/lanjutkan rotasi objek |
| N | Toggle uniform/non-uniform scale |
| 1/2/3 | Toggle ambient/diffuse/specular |
| G | Ganti wrapping |
| [/ ] | Kurangi/tambah UV scale |
| -/+ | Kurangi/tambah shininess |

Filtering diatur dari dropdown: `NEAREST`, `LINEAR`, `LINEAR_MIPMAP_LINEAR`, dan `NEAREST_MIPMAP_NEAREST`. Light orbit beralih antara mode otomatis dan manual lewat tombol **Light Orbit**. Posisi light manual, ambient, shininess, dan skala objek juga tersedia melalui slider.

## Implementasi utama dan challenge A–F

- Position, normal, dan UV dikirim sebagai vertex attributes. Flat/smooth shading mengganti face-normal dan vertex-normal buffer aktif.
- Normal ditransformasikan dengan inverse-transpose normal matrix dan dinormalisasi di fragment shader.
- Fragment shader menghitung ambient, diffuse dengan dot product, serta specular berdasarkan arah pandang, reflection, dan shininess.
- Texture image lokal dimuat melalui `Image`, dibalik sumbu V, dan menghasilkan mipmap. Pengguna juga dapat memuat image miliknya dari komputer.
- Challenge B: tombol A/Z mengubah ambient strength dan nilainya tampil di HUD.
- Challenge C: gerakan kamera berbasis state memakai I/J/K/L dan Q/E; specular memakai posisi kamera terbaru.
- Challenge D: N mengganti uniform/non-uniform scale. Normal matrix tetap digunakan.
- Challenge E: tombol Light Orbit memilih cahaya otomatis mengorbit atau kontrol manual.
- Challenge F: tombol 1/2/3 menyalakan atau mematikan ambient, diffuse, dan specular secara terpisah.

## Texture dan filtering

NEAREST memilih texel terdekat, sedangkan LINEAR menginterpolasi texel di sekitarnya. Mode mipmap menyediakan filter minifikasi untuk objek kecil atau jauh. UV scale dan wrapping dapat dipakai untuk melihat pengulangan texture.
