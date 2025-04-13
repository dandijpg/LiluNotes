// Selalu ambil data terbaru dari localStorage untuk sinkronisasi
let notes = JSON.parse(localStorage.getItem('notes') || '[]');
const urlParams = new URLSearchParams(window.location.search);
const noteId = parseInt(urlParams.get('id'), 10); // Pastikan noteId adalah integer
const searchQuery = urlParams.get('search') || '';

document.addEventListener('DOMContentLoaded', () => {
    setupView();
    setupEventListeners();
});

function setupView() {
    const noteTitle = document.getElementById('noteTitle');
    const noteContent = document.getElementById('noteContent');
    
    // Validasi noteId
    if (!isNaN(noteId) && noteId >= 0 && noteId < notes.length && notes[noteId]) {
        const note = notes[noteId];
        noteTitle.textContent = note.title;
        
        // Bersihkan konten dari atribut contenteditable
        let cleanContent = note.content;
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = cleanContent;
        
        // Hapus semua atribut contenteditable="true" dan ubah ke false
        const editableElements = tempDiv.querySelectorAll('[contenteditable="true"]');
        editableElements.forEach(el => {
            el.setAttribute('contenteditable', 'false');
            el.removeAttribute('placeholder'); // Hapus placeholder agar tidak membingungkan
        });
        
        noteContent.innerHTML = tempDiv.innerHTML;
        highlightSearchTerms(noteContent, searchQuery);

        // Tambahkan event listener untuk semua gambar
        noteContent.querySelectorAll('img').forEach(img => {
            img.addEventListener('click', () => openImageModal(img.src));
        });
    } else {
        noteTitle.textContent = 'Catatan Tidak Ditemukan';
        noteContent.innerHTML = '<p>Catatan yang diminta tidak ditemukan. Mungkin telah dihapus atau ID tidak valid.</p>';
    }
}

function setupEventListeners() {
    document.getElementById('editBtn').addEventListener('click', () => {
        window.location.href = `edit.html?id=${noteId}&search=${encodeURIComponent(searchQuery)}`;
    });

    document.getElementById('noteContent').addEventListener('click', (e) => {
        const target = e.target;
        if (target.classList.contains('copyable')) {
            copyFormattedText(target);
        }
    });
}

function copyFormattedText(element) {
    const htmlContent = element.outerHTML;
    const textContent = element.textContent;

    navigator.clipboard.write([
        new ClipboardItem({
            'text/html': new Blob([htmlContent], { type: 'text/html' }),
            'text/plain': new Blob([textContent], { type: 'text/plain' })
        })
    ]).then(() => {
        alert('Teks terformat disalin ke clipboard!');
    }).catch(err => {
        console.error('Gagal menyalin: ', err);
        alert('Gagal menyalin teks terformat.');
    });
}

function highlightSearchTerms(element, query) {
    if (!query) return;
    const terms = query.split(/\s+/).filter(term => term.length > 0);
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null, false);
    const nodes = [];
    let node;

    while ((node = walker.nextNode())) {
        nodes.push(node);
    }

    nodes.forEach(node => {
        terms.forEach(term => {
            const regex = new RegExp(`(${term})`, 'gi');
            if (regex.test(node.textContent)) {
                const span = document.createElement('span');
                span.innerHTML = node.textContent.replace(regex, '<span class="highlight">$1</span>');
                node.parentNode.replaceChild(span, node);
            }
        });
    });
}

// Fungsi untuk membuka modal gambar
function openImageModal(src) {
    let modal = document.querySelector('.image-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.className = 'image-modal';
        modal.innerHTML = `
            <span class="close-btn">×</span>
            <img src="${src}">
        `;
        document.body.appendChild(modal);
    } else {
        modal.querySelector('img').src = src;
    }

    modal.style.display = 'flex';
    modal.classList.add('active');

    // Tutup modal saat klik tombol close atau di luar gambar
    modal.querySelector('.close-btn').onclick = () => closeImageModal(modal);
    modal.onclick = (e) => {
        if (e.target === modal) closeImageModal(modal);
    };
}

// Fungsi untuk menutup modal
function closeImageModal(modal) {
    modal.classList.remove('active');
    setTimeout(() => {
        modal.style.display = 'none';
    }, 300);
}