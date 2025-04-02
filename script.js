let categories = [];
let notes = [];
let displayedNotes = 0;
const NOTES_PER_LOAD = 10;
const ADDITIONAL_NOTES = 5;
const MAX_PINNED = 5;
let lastSearchQuery = '';
let isGridMode = true;
let activeCategory = 'All';
let selectedNoteIndex = null;

document.addEventListener('DOMContentLoaded', () => {
    loadCategoriesFromStorage();
    loadNotesFromStorage();
    renderCategories();
    renderPinnedNotes();
    renderNotes();
    setupEventListeners();
});

function setupEventListeners() {
    document.getElementById('addCategoryBtn').addEventListener('click', addCategory);
    document.getElementById('viewMoreBtn').addEventListener('click', loadMoreNotes);
    document.getElementById('searchInput').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') searchNotes(e);
    });
    document.getElementById('addNoteBtn').addEventListener('click', addNewNote);
    document.getElementById('toggleModeBtn').addEventListener('click', toggleViewMode);
    document.getElementById('backupBtn').addEventListener('click', backupData);
    document.getElementById('restoreBtn').addEventListener('click', () => document.getElementById('restoreInput').click());
    document.getElementById('restoreInput').addEventListener('change', restoreData);
    document.getElementById('resetBtn').addEventListener('click', resetAllNotes);
}

function toggleViewMode() {
    isGridMode = !isGridMode;
    const toggleBtn = document.getElementById('toggleModeBtn');
    toggleBtn.textContent = isGridMode ? 'Grid' : 'List';
    const notesList = document.getElementById('notesList');
    const pinnedList = document.getElementById('pinnedList');
    if (isGridMode) {
        notesList.classList.remove('list-mode');
        pinnedList.classList.remove('list-mode');
    } else {
        notesList.classList.add('list-mode');
        pinnedList.classList.add('list-mode');
    }
    renderPinnedNotes();
    renderNotes();
}

function loadCategoriesFromStorage() {
    categories = JSON.parse(localStorage.getItem('categories') || '[]');
    if (!categories.includes('All')) {
        categories.unshift('All');
        saveCategoriesToStorage();
    }
}

function loadNotesFromStorage() {
    notes = JSON.parse(localStorage.getItem('notes') || '[]');
    notes.forEach(note => {
        if (note.pinned === undefined) note.pinned = false;
        if (note.pinned && !note.pinnedTimestamp) note.pinnedTimestamp = note.timestamp; // Default ke timestamp jika belum ada
    });
}

function renderCategories() {
    const container = document.getElementById('categories');
    container.innerHTML = '';
    categories.forEach(category => {
        const div = document.createElement('div');
        div.className = 'category';
        if (category === activeCategory) {
            div.classList.add('active');
        }
        div.textContent = `${category} (${category === 'All' ? notes.length : notes.filter(n => n.category === category).length})`;
        div.addEventListener('click', () => {
            activeCategory = category;
            renderCategories();
            renderPinnedNotes();
            renderNotes();
        });
        if (category !== 'All') {
            div.addEventListener('contextmenu', (e) => showContextMenu(e, category));
        }
        container.appendChild(div);
    });
}

function renderPinnedNotes() {
    const container = document.getElementById('pinnedList');
    const pinnedSection = document.querySelector('.pinned-section');
    container.innerHTML = '';
    
    // Hanya tampilkan pinned section di kategori "All"
    if (activeCategory === 'All') {
        pinnedSection.classList.add('active');
        const pinnedNotes = notes
            .filter(note => note.pinned)
            .sort((a, b) => new Date(b.pinnedTimestamp) - new Date(a.pinnedTimestamp)); // Urutkan berdasarkan pinnedTimestamp
        
        if (pinnedNotes.length === 0) {
            const noNotesDiv = document.createElement('div');
            noNotesDiv.className = 'no-notes';
            noNotesDiv.textContent = 'No pinned notes';
            container.appendChild(noNotesDiv);
        } else {
            pinnedNotes.forEach((note, index) => {
                const div = document.createElement('div');
                div.className = 'note';
                const time = new Date(note.timestamp).toLocaleString();
                div.innerHTML = `
                    ${note.title}
                    <span style="font-size: 0.9em; color: #4285f4">(${note.category})</span>
                    <div style="font-size: 0.8em; color: #888">${time}</div>
                `;
                div.addEventListener('click', () => {
                    const noteIndex = notes.findIndex(n => n === note);
                    window.location.href = `edit.html?id=${noteIndex}&search=${encodeURIComponent(lastSearchQuery)}`;
                });
                div.addEventListener('contextmenu', (e) => showNoteContextMenu(e, notes.indexOf(note)));
                let touchTimeout;
                div.addEventListener('touchstart', (e) => {
                    touchTimeout = setTimeout(() => showNoteContextMenu(e, notes.indexOf(note)), 500);
                });
                div.addEventListener('touchend', () => clearTimeout(touchTimeout));
                div.addEventListener('touchmove', () => clearTimeout(touchTimeout));
                container.appendChild(div);
            });
        }
    } else {
        pinnedSection.classList.remove('active');
    }
}

function renderNotes(filteredNotes = notes) { // Ubah default filter, hapus !note.pinned
    const container = document.getElementById('notesList');
    container.innerHTML = '';
    const visibleNotes = filteredNotes
        .filter(note => activeCategory === 'All' || note.category === activeCategory)
        .slice(0, displayedNotes + NOTES_PER_LOAD);
    
    if (visibleNotes.length === 0) {
        const noNotesDiv = document.createElement('div');
        noNotesDiv.className = 'no-notes';
        noNotesDiv.textContent = 'No notes found';
        container.appendChild(noNotesDiv);
    } else {
        visibleNotes.forEach((note, index) => {
            const div = document.createElement('div');
            div.className = 'note';
            const time = new Date(note.timestamp).toLocaleString();
            div.innerHTML = `
                ${note.title}
                <span style="font-size: 0.9em; color: #4285f4">(${note.category})</span>
                <div style="font-size: 0.8em; color: #888">${time}</div>
            `;
            div.addEventListener('click', () => {
                const noteIndex = notes.findIndex(n => n === note);
                window.location.href = `edit.html?id=${noteIndex}&search=${encodeURIComponent(lastSearchQuery)}`;
            });
            div.addEventListener('contextmenu', (e) => showNoteContextMenu(e, notes.indexOf(note)));
            let touchTimeout;
            div.addEventListener('touchstart', (e) => {
                touchTimeout = setTimeout(() => showNoteContextMenu(e, notes.indexOf(note)), 500);
            });
            div.addEventListener('touchend', () => clearTimeout(touchTimeout));
            div.addEventListener('touchmove', () => clearTimeout(touchTimeout));
            container.appendChild(div);
        });
    }
    
    document.getElementById('viewMoreBtn').style.display = 
        displayedNotes + NOTES_PER_LOAD >= filteredNotes.filter(note => activeCategory === 'All' || note.category === activeCategory).length ? 'none' : 'block';
}

function showContextMenu(e, category) {
    e.preventDefault();
    if (category === 'All') return;
    const menu = document.getElementById('contextMenu');
    menu.style.display = 'block';
    menu.style.left = `${e.pageX}px`;
    menu.style.top = `${e.pageY}px`;

    document.getElementById('editCategory').onclick = () => editCategory(category);
    document.getElementById('deleteCategory').onclick = () => deleteCategory(category);

    document.addEventListener('click', hideContextMenu);
}

function hideContextMenu() {
    document.getElementById('contextMenu').style.display = 'none';
    document.removeEventListener('click', hideContextMenu);
}

function showNoteContextMenu(e, index) {
    e.preventDefault();
    selectedNoteIndex = index;
    const menu = document.getElementById('noteContextMenu');
    const pinOption = document.getElementById('pinNote');
    const unpinOption = document.getElementById('unpinNote');
    
    // Hanya tampilkan opsi pin/unpin jika kategori aktif adalah "All"
    if (activeCategory === 'All') {
        pinOption.style.display = notes[index].pinned ? 'none' : 'block';
        unpinOption.style.display = notes[index].pinned ? 'block' : 'none';
    } else {
        pinOption.style.display = 'none';
        unpinOption.style.display = 'none';
    }

    menu.style.display = 'block';
    menu.style.left = `${e.pageX || e.touches[0].pageX}px`;
    menu.style.top = `${e.pageY || e.touches[0].pageY}px`;

    pinOption.onclick = () => pinNote(index);
    unpinOption.onclick = () => unpinNote(index);
    document.getElementById('deleteNote').onclick = () => deleteNote();

    document.addEventListener('click', hideNoteContextMenu);
    document.addEventListener('touchstart', hideNoteContextMenu);
}

function hideNoteContextMenu(e) {
    const menu = document.getElementById('noteContextMenu');
    if (!menu.contains(e.target)) {
        menu.style.display = 'none';
        document.removeEventListener('click', hideNoteContextMenu);
        document.removeEventListener('touchstart', hideNoteContextMenu);
    }
}

function pinNote(index) {
    if (activeCategory !== 'All') {
        alert('Pinning is only available in the "All" category.');
        return;
    }
    const pinnedCount = notes.filter(note => note.pinned).length;
    if (pinnedCount >= MAX_PINNED) {
        alert(`You can only pin up to ${MAX_PINNED} notes. Unpin some notes first.`);
        return;
    }
    notes[index].pinned = true;
    notes[index].pinnedTimestamp = new Date().toISOString(); // Tambahkan waktu pin
    saveNotesToStorage();
    renderPinnedNotes();
    renderNotes();
    hideNoteContextMenu();
}

function unpinNote(index) {
    if (activeCategory !== 'All') {
        alert('Unpinning is only available in the "All" category.');
        return;
    }
    notes[index].pinned = false;
    delete notes[index].pinnedTimestamp; // Hapus pinnedTimestamp saat unpin
    saveNotesToStorage();
    renderPinnedNotes();
    renderNotes();
    hideNoteContextMenu();
}

function editCategory(category) {
    if (category === 'All') return;
    const newName = prompt('Edit category name:', category);
    if (newName && !categories.includes(newName) && newName !== 'All') {
        const index = categories.indexOf(category);
        categories[index] = newName;
        notes.forEach(note => {
            if (note.category === category) note.category = newName;
        });
        if (activeCategory === category) activeCategory = newName;
        saveCategoriesToStorage();
        saveNotesToStorage();
        renderCategories();
        renderPinnedNotes();
        renderNotes();
    }
}

function deleteCategory(category) {
    if (category === 'All') return;
    if (confirm(`Delete ${category}? Notes will be uncategorized.`)) {
        categories = categories.filter(cat => cat !== category);
        notes.forEach(note => {
            if (note.category === category) note.category = 'Uncategorized';
        });
        if (activeCategory === category) activeCategory = 'All';
        saveCategoriesToStorage();
        saveNotesToStorage();
        renderCategories();
        renderPinnedNotes();
        renderNotes();
    }
}

function deleteNote() {
    if (selectedNoteIndex !== null && confirm('Delete this note?')) {
        notes.splice(selectedNoteIndex, 1);
        saveNotesToStorage();
        renderCategories();
        renderPinnedNotes();
        renderNotes();
        document.getElementById('noteContextMenu').style.display = 'none';
    }
}

function filterNotesByCategory(category) {
    const filtered = notes.filter(note => note.category === category); // Hapus filter !note.pinned
    displayedNotes = 0;
    renderNotes(filtered);
}

function addCategory() {
    const name = prompt('Enter category name:');
    if (name && !categories.includes(name) && name !== 'All') {
        categories.push(name);
        saveCategoriesToStorage();
        renderCategories();
    }
}

function addNewNote() {
    window.location.href = 'edit.html';
}

function loadMoreNotes() {
    displayedNotes += ADDITIONAL_NOTES;
    renderNotes();
}

function searchNotes(e) {
    const search = e.target.value.toLowerCase();
    lastSearchQuery = search;
    const filtered = notes.filter(note => 
        (note.title.toLowerCase().includes(search) || 
        note.content.toLowerCase().includes(search) ||
        note.category.toLowerCase().includes(search) ||
        new Date(note.timestamp).toLocaleString().toLowerCase().includes(search))
    ); // Hapus filter !note.pinned
    displayedNotes = 0;
    renderPinnedNotes();
    renderNotes(filtered);
}

function saveCategoriesToStorage() {
    localStorage.setItem('categories', JSON.stringify(categories));
}

function saveNotesToStorage() {
    localStorage.setItem('notes', JSON.stringify(notes));
}

function backupData() {
    const backupData = {
        categories: categories,
        notes: notes
    };
    const dataStr = JSON.stringify(backupData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `technotes_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

function restoreData(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(event) {
        try {
            const restoredData = JSON.parse(event.target.result);
            if (restoredData.categories && restoredData.notes) {
                if (confirm('Restore will overwrite existing notes and categories. Continue?')) {
                    categories = restoredData.categories;
                    notes = restoredData.notes;
                    saveCategoriesToStorage();
                    saveNotesToStorage();
                    renderCategories();
                    renderPinnedNotes();
                    renderNotes();
                    alert('Backup restored successfully!');
                }
            } else {
                alert('Invalid backup file: Missing categories or notes.');
            }
        } catch (err) {
            alert('Error restoring backup: Invalid file format.');
        }
    };
    reader.readAsText(file);
    e.target.value = '';
}

function resetAllNotes() {
    if (confirm('Are you sure you want to reset all notes and categories? This will delete everything.')) {
        if (confirm('This action cannot be undone. Confirm again to proceed.')) {
            if (confirm('Last chance! Are you absolutely sure?')) {
                categories = ['All'];
                notes = [];
                saveCategoriesToStorage();
                saveNotesToStorage();
                renderCategories();
                renderPinnedNotes();
                renderNotes();
                alert('All notes and categories have been reset.');
            }
        }
    }
}