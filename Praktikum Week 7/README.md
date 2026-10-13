# Praktikum Grafika Komputer 7 — Interactive Web 3D Prototype

Prototype interaktif Three.js untuk materi scene graph, hierarchy, PBR, GLB, AnimationMixer, raycasting, selection, dan environment. Antarmuka mempertahankan palet navy, cyan, panel, dan tipografi Nunito yang dipakai pada praktikum sebelumnya, lalu disusun seperti referensi: viewport dan informasi objek di kiri, kontrol di kanan.

## Identitas

- Rennard Filbert Tanjaya — 5025241122, Kelas B
- Willy Marcelius — 5025241096, Kelas B
- Mata kuliah: EF234504 Grafika Komputer, Kelompok 4

## Menjalankan

```sh
npm install
npm run dev
```

Project memakai Vite dan Three.js. GLB lokal ada di `public/models/model.glb`; source generator aset tersedia di `scripts/generate_sample_glb.py`.

## Milestone dan Tugas Utama

1. **Scene dasar:** `Scene`, `PerspectiveCamera`, `WebGLRenderer`, resize observer, Ambient/DirectionalLight, ground, dan shadow map.
2. **Scene graph:** `Hierarchy Demo Group` memuat parent body, child object, dan aksen mesh. Transform group diterapkan bersama; transform child tetap lokal.
3. **Local vs world:** console menampilkan `child.position` dan `child.getWorldPosition()`. Parent diberi translasi, rotasi, dan skala sehingga world position berbeda.
4. **PBR:** `MeshStandardMaterial` pada sphere dapat diubah langsung melalui slider roughness dan metalness.
5. **GLB:** `GLTFLoader` memuat `Imported Duck GLB` secara asynchronous. `traverse()` menghitung mesh dan mengaktifkan `castShadow`/`receiveShadow` untuk semua descendant.
6. **Animation:** tiga clip GLB bernama Idle, Walk, dan Run dimainkan oleh satu `AnimationMixer`; mixer diperbarui menggunakan delta time.
7. **Raycasting:** koordinat pointer dikonversi ke NDC berdasarkan ukuran canvas, lalu `intersectObjects(..., true)` mengecek hierarchy secara rekursif.
8. **Hover:** state hover terpisah dari selection; feedback emissive dan skala 1.06 bersifat sementara.
9. **Click selection:** klik biasa memilih root entity, memperbesar skala ke 1.12, dan memperbarui panel informasi. Drag orbit/pan lebih dari 5 piksel tidak mengubah selection.
10. **Environment:** `RoomEnvironment` diproses oleh `PMREMGenerator` untuk `scene.environment`; `scene.background` tetap warna gelap. Tombol E membandingkan respons PBR dengan dan tanpa environment.

## Challenge A–H

- **A — Multiple Animation Clips:** tombol Clip 1/2/3 atau keyboard 1/2/3 mengganti action dengan fade antarclip.
- **B — Click Menjalankan Animasi:** klik duck memilihnya dan memulai clip berikutnya.
- **C — Information Panel:** panel menampilkan nama, posisi world, rotasi, skala, dan jenis material entity terpilih.
- **D — Hierarchical Solar System:** tombol S menampilkan Sun → Earth Orbit → Earth → Moon Orbit → Moon; rotasi orbit menggunakan hierarchy parent-child.
- **E — PBR Material Gallery:** tombol G menampilkan grid 3×3 kombinasi roughness 0.1/0.5/0.9 dan metalness 0/0.5/1.
- **F — Hover Emissive:** material GLB di-clone sebelum diberi emissive highlight agar material bersama tidak berubah destruktif.
- **G — Selection Rotation:** entity terpilih berputar perlahan; putaran tambahan berhenti saat selection dilepas.
- **H — Environment Toggle:** tombol E menyalakan/mematikan environment; HUD menampilkan ON/OFF.

## Kontrol

- Drag kiri untuk orbit, scroll untuk zoom, dan drag kanan untuk pan.
- Dropdown mengganti Perspective/Orthographic dengan posisi kamera dan target yang dipertahankan.
- Slider mengatur FOV, roughness, metalness, orbit speed, damping, rotate speed, dan zoom speed.
- Checkbox mengatur kontrol kamera, pan, dan damping. Reset (R) mengembalikan kamera serta hierarchy utama.
- Klik objek untuk memilih; klik objek terpilih lagi atau klik area kosong untuk melepas selection.

## Eksperimen yang Disertakan

- Bandingkan local dan world position pada hierarchy demo melalui console browser.
- Ubah roughness dan metalness sphere utama; gunakan gallery untuk melihat kombinasi parameter.
- Matikan environment untuk melihat dampak environment pada material metal.
- Gunakan tiga tombol clip dan lihat nama action aktif pada status GLB.
- Coba raycast recursive pada GLB yang berisi beberapa child mesh; panel memilih root `Imported Duck GLB`, bukan mesh bagian.

## Aset

`public/models/model.glb` adalah aset duck low-poly lokal yang dibuat untuk praktikum ini. GLB memiliki tujuh mesh descendant dan tiga animation clip (Idle, Walk, Run), sehingga proyek bisa dijalankan tanpa mengunduh model tambahan. Environment lighting dibuat secara prosedural dengan `RoomEnvironment`, jadi tidak memerlukan file panorama terpisah.

## Catatan Debugging

- Bila status GLB gagal, pastikan file `public/models/model.glb` tersedia dan jalankan melalui `npm run dev`.
- Buka Console browser untuk melihat jumlah mesh, nama clip, local/world transform, dan hasil selection raycast.
- Jika shadow tidak tampak, periksa `renderer.shadowMap.enabled`, `DirectionalLight.castShadow`, `mesh.castShadow`, dan `ground.receiveShadow`.
- `scene.environment` memengaruhi material, sedangkan `scene.background` menentukan warna latar yang terlihat.
