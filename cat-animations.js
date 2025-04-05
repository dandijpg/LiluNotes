// cat-animations.js

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

document.querySelectorAll('button, .add-category, .add-note, .toggle-mode, .more-btn, .backup-btn, .restore-btn, .copy-backup-btn, .google-auth-btn, .backup-google-btn, .google-logout-btn, .reset-btn, .view-more, .save-btn').forEach(btn => {
    btn.addEventListener('click', spawnRandomCat);
});

const styleSheet = document.createElement('style');
styleSheet.textContent = `
    @keyframes catPop {
        0% { transform: scale(0); opacity: 0; }
        50% { transform: scale(1.2); opacity: 1; }
        100% { transform: scale(1); opacity: 0; }
    }
`;
document.head.appendChild(styleSheet);