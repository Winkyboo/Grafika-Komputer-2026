// =======================================================
// LOGIKA NAVIGASI (SPA / IFRAME)
// =======================================================
const homeSection = document.getElementById('home-section');
const gameFrame = document.getElementById('game-frame');
const navButtons = document.querySelectorAll('.nav-btn');

// Fungsi kembali ke halaman beranda
function showHome(btnElement) {
    setActiveButton(btnElement);
    
    // Tampilkan Profil, sembunyikan iframe
    homeSection.classList.add('active-section');
    homeSection.classList.remove('hidden');
    
    gameFrame.classList.add('hidden');
    gameFrame.classList.remove('active-section');
    gameFrame.src = ""; // Kosongkan iframe agar game berhenti di background
}

// Fungsi membuka game kanvas ke dalam iframe
function loadPraktikum(btnElement, url) {
    setActiveButton(btnElement);
    
    // Sembunyikan Profil, tampilkan iframe
    homeSection.classList.remove('active-section');
    homeSection.classList.add('hidden');
    
    gameFrame.classList.remove('hidden');
    gameFrame.classList.add('active-section');
    
    // Muat URL file praktikum
    gameFrame.src = url;

    // Fokuskan ke iframe agar input keyboard (WASD) langsung bekerja di dalam game
    setTimeout(() => {
        gameFrame.focus();
    }, 100);
}

// Fungsi untuk mengganti warna tombol yang sedang aktif
function setActiveButton(activeBtn) {
    navButtons.forEach(btn => btn.classList.remove('active'));
    activeBtn.classList.add('active');
}

// =======================================================
// ANIMASI BACKGROUND CANVAS (PARTIKEL MANA SIHIR)
// =======================================================
const bgCanvas = document.getElementById('bgCanvas');
const ctxBg = bgCanvas.getContext('2d');

let particles = [];
const numParticles = 80; // Jumlah partikel sihir

// Sesuaikan ukuran canvas dengan layar
function resizeBg() {
    bgCanvas.width = window.innerWidth;
    bgCanvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeBg);
resizeBg();

// Membuat cetakan Partikel
class Particle {
    constructor() {
        this.reset();
        // Beri posisi awal secara acak di seluruh layar
        this.y = Math.random() * bgCanvas.height; 
    }

    reset() {
        this.x = Math.random() * bgCanvas.width;
        this.y = bgCanvas.height + 10; // Mulai dari bawah layar
        this.size = Math.random() * 3 + 1; // Ukuran bervariasi
        this.speedY = (Math.random() * 1.5) + 0.5; // Kecepatan naik
        this.speedX = (Math.random() - 0.5) * 1; // Gerakan menyamping perlahan
        this.opacity = Math.random() * 0.5 + 0.2;
        
        // Warna partikel kebiruan/ungu (Aesthetic Anime Sihir)
        const colors = ['#60a5fa', '#a78bfa', '#38bdf8', '#ffffff'];
        this.color = colors[Math.floor(Math.random() * colors.length)];
    }

    update() {
        this.y -= this.speedY;
        this.x += this.speedX;

        // Jika partikel keluar dari layar atas, reset ke bawah
        if (this.y < -10) {
            this.reset();
        }
    }

    draw() {
        ctxBg.beginPath();
        ctxBg.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctxBg.fillStyle = this.color;
        
        // Efek bersinar (glow)
        ctxBg.shadowBlur = 10;
        ctxBg.shadowColor = this.color;
        
        ctxBg.globalAlpha = this.opacity;
        ctxBg.fill();
        ctxBg.globalAlpha = 1.0; // Kembalikan ke normal
        ctxBg.shadowBlur = 0;
    }
}

// Inisialisasi daftar partikel
for (let i = 0; i < numParticles; i++) {
    particles.push(new Particle());
}

// Loop Animasi Background
function animateBg() {
    // Menghapus frame sebelumnya (bersihkan layar penuh)
    ctxBg.clearRect(0, 0, bgCanvas.width, bgCanvas.height);

    particles.forEach(p => {
        p.update();
        p.draw();
    });

    requestAnimationFrame(animateBg);
}

animateBg();