const homeSection = document.getElementById('home-section');
const profileSection = document.getElementById('profile-section');
const gameFrame = document.getElementById('game-frame');
const navButtons = document.querySelectorAll('.nav-btn');

function showSection(sectionName, btnElement) {
    setActiveButton(btnElement);
    const currentSection = sectionName === 'home' ? homeSection : profileSection;

    [homeSection, profileSection].forEach((section) => {
        section.classList.remove('active-section');
        section.classList.add('hidden');
    });

    currentSection.classList.add('active-section');
    currentSection.classList.remove('hidden');
    gameFrame.classList.add('hidden');
    gameFrame.classList.remove('active-section');
    gameFrame.src = '';
    document.title = `${sectionName === 'home' ? 'Beranda' : 'Profile'} - Grafika Komputer B`;
}

function loadPraktikum(btnElement, url, practicumName) {
    setActiveButton(btnElement);
    homeSection.classList.remove('active-section');
    homeSection.classList.add('hidden');
    profileSection.classList.remove('active-section');
    profileSection.classList.add('hidden');
    gameFrame.classList.remove('hidden');
    gameFrame.classList.add('active-section');
    gameFrame.src = url;
    document.title = `${practicumName} - Grafika Komputer B`;
    setTimeout(() => gameFrame.focus(), 100);
}

function openPraktikumOne() {
    const practicumButton = document.querySelectorAll('.nav-btn')[2];
    loadPraktikum(practicumButton, './Praktikum Week 1/index.html', 'Praktikum 1');
}

function setActiveButton(activeBtn) {
    navButtons.forEach((btn) => btn.classList.remove('active'));
    activeBtn.classList.add('active');
}

const bgCanvas = document.getElementById('bgCanvas');
const ctxBg = bgCanvas.getContext('2d');
const particles = [];
const numParticles = 80;

function resizeBg() {
    bgCanvas.width = window.innerWidth;
    bgCanvas.height = window.innerHeight;
}

class Particle {
    constructor() {
        this.reset();
        this.y = Math.random() * bgCanvas.height;
    }

    reset() {
        this.x = Math.random() * bgCanvas.width;
        this.y = bgCanvas.height + 10;
        this.size = Math.random() * 3 + 1;
        this.speedY = Math.random() * 1.5 + .5;
        this.speedX = (Math.random() - .5);
        this.opacity = Math.random() * .5 + .2;
        const colors = ['#60a5fa', '#a78bfa', '#38bdf8', '#ffffff'];
        this.color = colors[Math.floor(Math.random() * colors.length)];
    }

    update() {
        this.y -= this.speedY;
        this.x += this.speedX;
        if (this.y < -10) this.reset();
    }

    draw() {
        ctxBg.beginPath();
        ctxBg.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctxBg.fillStyle = this.color;
        ctxBg.shadowBlur = 10;
        ctxBg.shadowColor = this.color;
        ctxBg.globalAlpha = this.opacity;
        ctxBg.fill();
        ctxBg.globalAlpha = 1;
        ctxBg.shadowBlur = 0;
    }
}

window.addEventListener('resize', resizeBg);
resizeBg();
for (let index = 0; index < numParticles; index += 1) particles.push(new Particle());

function animateBg() {
    ctxBg.clearRect(0, 0, bgCanvas.width, bgCanvas.height);
    particles.forEach((particle) => {
        particle.update();
        particle.draw();
    });
    requestAnimationFrame(animateBg);
}

animateBg();
