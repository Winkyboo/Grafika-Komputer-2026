# Robot Swarm Factory
**UTS Grafika Komputer (EF234504) — Topik 4, Three.js Interactive 3D Project**

Anggota: (isi nama & NRP)

## Deskripsi
Mini game 3D: pimpin swarm robot melewati factory, pilih multiplier gate, hindari crusher & gergaji, kalahkan drone penjaga (mini battle), lalu hancurkan reactor.

## Gameplay
Start → pilih gate (kiri/kanan) → multiply/upgrade → hindari obstacle → mini battle → reactor boss → Win/Lose → Restart.
Win: reactor hancur. Lose: jumlah robot = 0.

## Control
`A/D`, `←/→`, atau gerakkan mouse = geser swarm · klik panel gate = pilih jalur · `Space/Enter/R` = mulai/restart

## Graphics Features
- Metallic PBR (`MeshStandardMaterial`, metalness/roughness) + environment map (PMREM/RoomEnvironment) untuk refleksi
- Emissive: mata robot, gate, lampu hazard, reactor core
- Crowd: robot GLB memakai `InstancedMesh` (maks. 32 model detail tampil untuk menjaga performa; jumlah logika tetap mengikuti gate)
- Lighting: Hemisphere + Directional (shadow) + 2 dynamic PointLight (cyan, hazard orbit, reactor pulse)
- Shadow: robot/mesin `castShadow`, lantai `receiveShadow`
- Animation: crusher, gergaji, gear, beacon, conveyor (texture offset), reactor rings
- VFX: spark/explosion `THREE.Points` additive, laser drone, shockwave ring
- Scene graph: gear (hub + teeth), gate (frame + pane + label), reactor (base + core + rings + light)
- Raycasting: klik panel gate untuk memilih jalur sebelum swarm melewatinya
- Environment: fog, pipe, conveyor, hazard lamp, industrial wall
- Challenge opsional: damage sparks, conveyor animation, instanced rendering

## Asset Credits
| Asset | Pembuat | Sumber | Lisensi |
|---|---|---|---|
| Mini-robot BlackMikeDR (`public/models/mini-robot_blackmikedr.glb`) | kredit mengikuti halaman unduhan asal | file GLB dari pengguna | cek dan cantumkan lisensi dari halaman unduhan asal |

> Model robot dimuat otomatis melalui `GLTFLoader`. Metadata GLB tidak menyertakan pencipta atau lisensi, jadi lengkapi kredit di atas berdasarkan halaman tempat model diunduh sebelum pengumpulan.

## Struktur
`src/main.js` berisi seluruh kode JavaScript dalam beberapa bagian berurutan: effects, HUD, scene/factory, gameplay, dan bootstrap aplikasi. `src/style.css` mengatur tampilan UI.
## Cara Menjalankan
```
npm install
npm run dev
```

## Pembagian Kontribusi
- Anggota 1: swarm & factory (bagian scene dan robot di `src/main.js`)
- Anggota 2: gate, battle, boss (bagian gameplay di `src/main.js`)
- Anggota 3: PBR, emissive, VFX, HUD (bagian scene, effects, dan UI di `src/main.js`)