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
        noteContent.innerHTML = note.content;
        highlightSearchTerms(noteContent, searchQuery);
    } else {
        noteTitle.textContent = 'Note Not Found';
        noteContent.innerHTML = '<p>The requested note could not be found. It may have been deleted or the ID is invalid.</p>';
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
        alert('Formatted text copied to clipboard!');
    }).catch(err => {
        console.error('Failed to copy: ', err);
        alert('Failed to copy formatted text.');
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