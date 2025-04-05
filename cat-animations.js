// cat-animations.js

// Fungsi untuk membuat gelembung
function createBubble(x, y) {
    const bubble = document.createElement('div');
    bubble.className = 'bubble';
    bubble.style.left = `${x}px`;
    bubble.style.top = `${y}px`;
    document.body.appendChild(bubble);
    setTimeout(() => bubble.remove(), 3000); // Hilang setelah animasi selesai
}

// Fungsi untuk kucing acak saat klik
function spawnRandomCat() {
    const cat = document.createElement('div');
    cat.className = 'random-cat';
    cat.innerHTML = `
        <svg width="50" height="50" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <path d="M50 20c-10 0-15 10-15 15s5 15 15 15 15-10 15-15-5-15-15-15zm-8 15a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm16 0a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" fill="#8888a8"/>
        </svg>
    `;
    document.body.appendChild(cat);

    const x = Math.random() * (window.innerWidth - 50);
    const y = Math.random() * (window.innerHeight - 50);
    cat.style.position = 'fixed';
    cat.style.left = `${x}px`;
    cat.style.top = `${y}px`;
    cat.style.zIndex = '1000';
    cat.style.animation = 'catPop 2s ease-in-out forwards';

    setTimeout(() => cat.remove(), 2000);
}

// Gelembung dan kucing saat klik tombol
document.querySelectorAll('button, .add-category, .add-note, .toggle-mode, .more-btn, .backup-btn, .restore-btn, .copy-backup-btn, .google-auth-btn, .backup-google-btn, .google-logout-btn, .reset-btn, .view-more, .save-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        spawnRandomCat();
        for (let i = 0; i < 5; i++) {
            const x = e.clientX + (Math.random() * 20 - 10);
            const y = e.clientY + (Math.random() * 20 - 10);
            createBubble(x, y);
        }
    });
});

// Gelembung saat scroll
let lastScroll = 0;
window.addEventListener('scroll', () => {
    const currentScroll = window.scrollY;
    if (Math.abs(currentScroll - lastScroll) > 50) { // Muncul setiap 50px scroll
        for (let i = 0; i < 3; i++) {
            const x = Math.random() * window.innerWidth;
            const y = window.scrollY + window.innerHeight - 20;
            createBubble(x, y);
        }
        lastScroll = currentScroll;
    }
});

// Gelembung saat popup dibuka
document.querySelectorAll('.more-options, .finance-popup').forEach(popup => {
    popup.addEventListener('transitionend', (e) => {
        if (popup.classList.contains('active')) {
            const rect = popup.getBoundingClientRect();
            for (let i = 0; i < 5; i++) {
                const x = rect.left + (Math.random() * rect.width);
                const y = rect.top + rect.height;
                createBubble(x, y);
            }
        }
    });
});

// Gelembung default saat diam
let idleTimeout;
function spawnIdleBubbles() {
    clearTimeout(idleTimeout);
    idleTimeout = setTimeout(() => {
        for (let i = 0; i < 2; i++) {
            const x = Math.random() * window.innerWidth;
            const y = Math.random() * window.innerHeight;
            createBubble(x, y);
        }
        spawnIdleBubbles();
    }, 10000); // Muncul setiap 10 detik saat diam
}

document.addEventListener('mousemove', () => clearTimeout(idleTimeout));
document.addEventListener('scroll', () => clearTimeout(idleTimeout));
document.addEventListener('click', () => clearTimeout(idleTimeout));
spawnIdleBubbles();

// Partikel sambutan saat halaman dimuat
function spawnWelcomeParticles() {
    for (let i = 0; i < 20; i++) {
        const particle = document.createElement('div');
        particle.className = 'welcome-particle';
        particle.style.position = 'fixed';
        particle.style.width = `${Math.random() * 5 + 2}px`;
        particle.style.height = particle.style.width;
        particle.style.background = '#e8c8d8'; /* Pastel pink tua */
        particle.style.borderRadius = '50%';
        particle.style.left = `${Math.random() * window.innerWidth}px`;
        particle.style.top = `${Math.random() * window.innerHeight}px`;
        particle.style.zIndex = '1000';
        particle.style.animation = `particleFade ${Math.random() * 2 + 1}s ease-out forwards`;
        document.body.appendChild(particle);
        setTimeout(() => particle.remove(), 3000);
    }
}

window.addEventListener('load', spawnWelcomeParticles);

// Animasi untuk kucing dan partikel
const styleSheet = document.createElement('style');
styleSheet.textContent = `
    @keyframes catPop {
        0% { transform: scale(0); opacity: 0; }
        50% { transform: scale(1.2); opacity: 1; }
        100% { transform: scale(1); opacity: 0; }
    }
    @keyframes particleFade {
        0% { transform: scale(1); opacity: 1; }
        50% { transform: scale(1.5) translateY(-20px); opacity: 0.7; }
        100% { transform: scale(0.5) translateY(-40px); opacity: 0; }
    }
`;
document.head.appendChild(styleSheet);