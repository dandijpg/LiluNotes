let notes = JSON.parse(localStorage.getItem('notes') || '[]');
let categories = JSON.parse(localStorage.getItem('categories') || '["All", "Uncategorized"]');
const urlParams = new URLSearchParams(window.location.search);
const searchQuery = urlParams.get('search') || '';
let currentCategory = 'All';
let notesPerPage = 10;
let currentPage = 1;
let isListMode = false;

document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    renderCategories();
    renderNotes();
});

function setupEventListeners() {
    document.getElementById('addCategoryBtn').addEventListener('click', addCategory);
    document.getElementById('addNoteBtn').addEventListener('click', () => window.location.href = 'edit.html');
    document.getElementById('toggleModeBtn').addEventListener('click', toggleMode);
    document.getElementById('backupBtn').addEventListener('click', backupNotes);
    document.getElementById('restoreBtn').addEventListener('click', restoreNotes);
    document.getElementById('resetBtn').addEventListener('click', resetNotes);
    document.getElementById('searchInput').addEventListener('input', () => {
        currentPage = 1;
        renderNotes();
    });
    document.getElementById('viewMoreBtn').addEventListener('click', () => {
        currentPage++;
        renderNotes();
    });
    document.addEventListener('click', hideContextMenus);
}

function renderCategories() {
    const categoryList = document.getElementById('categoryList');
    categoryList.innerHTML = '';
    categories.forEach(category => {
        const div = document.createElement('div');
        div.className = `category ${category === currentCategory ? 'active' : ''}`;
        div.textContent = category;
        div.addEventListener('click', () => {
            currentCategory = category;
            currentPage = 1;
            renderCategories();
            renderNotes();
        });
        div.addEventListener('contextmenu', (e) => showContextMenu(e, category));
        categoryList.appendChild(div);
    });
}

function renderNotes() {
    const pinnedNotes = document.getElementById('pinnedNotes');
    const notesList = document.getElementById('notesList');
    const pinnedSection = document.getElementById('pinnedSection');
    const viewMoreBtn = document.getElementById('viewMoreBtn');
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();

    // Selalu gunakan notes asli dengan originalIndex
    let filteredNotes = notes.map((note, originalIndex) => ({ ...note, originalIndex }))
        .filter(note => {
            const matchesCategory = currentCategory === 'All' || note.category === currentCategory;
            const matchesSearch = note.title.toLowerCase().includes(searchTerm) || note.content.toLowerCase().includes(searchTerm);
            return matchesCategory && matchesSearch;
        });

    // Pisahkan pinned dan regular hanya di "All"
    let pinned = [];
    let regular = filteredNotes;
    if (currentCategory === 'All') {
        pinned = filteredNotes.filter(note => note.pinned);
        regular = filteredNotes.filter(note => !note.pinned);
        pinned.sort((a, b) => new Date(b.pinnedTimestamp) - new Date(a.pinnedTimestamp));
    }
    regular.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    pinnedSection.style.display = (currentCategory === 'All' && pinned.length > 0) ? 'block' : 'none';
    pinnedNotes.innerHTML = '';
    notesList.innerHTML = '';

    const start = (currentPage - 1) * notesPerPage;
    const end = start + notesPerPage;

    if (currentCategory === 'All') {
        pinned.forEach(note => {
            pinnedNotes.appendChild(createNoteElement(note));
        });
    }

    const regularToShow = regular.slice(0, end);
    regularToShow.forEach(note => {
        notesList.appendChild(createNoteElement(note));
    });

    viewMoreBtn.style.display = regular.length > end ? 'block' : 'none';
    if (filteredNotes.length === 0) {
        notesList.innerHTML = '<div class="no-notes">No notes found.</div>';
    }

    notesList.className = `notes-list ${isListMode ? 'list-mode' : ''}`;
    pinnedNotes.className = `notes-list ${isListMode ? 'list-mode' : ''}`;
}

function createNoteElement(note) {
    const div = document.createElement('div');
    div.className = 'note';
    div.innerHTML = `
        <strong>${note.title}</strong>
        <span>${new Date(note.timestamp).toLocaleString()}</span>
        <div>${note.content.slice(0, 100)}${note.content.length > 100 ? '...' : ''}</div>
    `;
    // Gunakan originalIndex sebagai ID
    div.addEventListener('click', () => window.location.href = `view.html?id=${note.originalIndex}&search=${encodeURIComponent(searchQuery)}`);
    div.addEventListener('contextmenu', (e) => showNoteContextMenu(e, note.originalIndex));
    return div;
}

function addCategory() {
    const category = prompt('Enter new category:');
    if (category && !categories.includes(category)) {
        categories.push(category);
        localStorage.setItem('categories', JSON.stringify(categories));
        renderCategories();
    }
}

function toggleMode() {
    isListMode = !isListMode;
    document.getElementById('toggleModeBtn').textContent = isListMode ? 'Grid Mode' : 'List Mode';
    renderNotes();
}

function backupNotes() {
    const data = { notes, categories };
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'technotes-backup.json';
    a.click();
    URL.revokeObjectURL(url);
}

function restoreNotes() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = (event) => {
            const data = JSON.parse(event.target.result);
            notes = data.notes || [];
            categories = data.categories || ['All', 'Uncategorized'];
            localStorage.setItem('notes', JSON.stringify(notes));
            localStorage.setItem('categories', JSON.stringify(categories));
            renderCategories();
            renderNotes();
        };
        reader.readAsText(file);
    };
    input.click();
}

function resetNotes() {
    if (confirm('Are you sure you want to reset all notes and categories?')) {
        notes = [];
        categories = ['All', 'Uncategorized'];
        localStorage.setItem('notes', JSON.stringify(notes));
        localStorage.setItem('categories', JSON.stringify(categories));
        renderCategories();
        renderNotes();
    }
}

function showContextMenu(e, category) {
    e.preventDefault();
    if (category === 'All' || category === 'Uncategorized') return;
    const contextMenu = document.getElementById('contextMenu');
    contextMenu.innerHTML = '<div class="menu-item" onclick="deleteCategory(\'' + category + '\')">Delete</div>';
    contextMenu.style.display = 'block';
    contextMenu.style.left = `${e.pageX}px`;
    contextMenu.style.top = `${e.pageY}px`;
}

function showNoteContextMenu(e, originalIndex) {
    e.preventDefault();
    const contextMenu = document.getElementById('noteContextMenu');
    const note = notes[originalIndex];
    contextMenu.innerHTML = `
        <div class="menu-item" onclick="togglePin(${originalIndex})">${note.pinned ? 'Unpin' : 'Pin'}</div>
        <div class="menu-item" onclick="deleteNote(${originalIndex})">Delete</div>
    `;
    contextMenu.style.display = 'block';
    contextMenu.style.left = `${e.pageX}px`;
    contextMenu.style.top = `${e.pageY}px`;
}

function hideContextMenus() {
    document.getElementById('contextMenu').style.display = 'none';
    document.getElementById('noteContextMenu').style.display = 'none';
}

function deleteCategory(category) {
    categories = categories.filter(c => c !== category);
    notes = notes.map(note => note.category === category ? { ...note, category: 'Uncategorized' } : note);
    localStorage.setItem('categories', JSON.stringify(categories));
    localStorage.setItem('notes', JSON.stringify(notes));
    currentCategory = 'All';
    renderCategories();
    renderNotes();
}

function togglePin(originalIndex) {
    notes[originalIndex].pinned = !notes[originalIndex].pinned;
    notes[originalIndex].pinnedTimestamp = notes[originalIndex].pinned ? new Date().toISOString() : null;
    localStorage.setItem('notes', JSON.stringify(notes));
    renderNotes();
}

function deleteNote(originalIndex) {
    notes.splice(originalIndex, 1);
    localStorage.setItem('notes', JSON.stringify(notes));
    renderNotes();
}