let notes = JSON.parse(localStorage.getItem('notes') || '[]');
let categories = JSON.parse(localStorage.getItem('categories') || '["All", "Uncategorized"]');
let categoryPins = JSON.parse(localStorage.getItem('categoryPins') || '{}');
const urlParams = new URLSearchParams(window.location.search);
const searchQuery = urlParams.get('search') || '';
let currentCategory = 'All';
let notesPerPage = 10;
let currentPage = 1;
let isListMode = false;
let unlockedNotes = new Set();

const CLIENT_ID = '383179112314-09lj6kh30oruk0f61khioi8teq6gevpd.apps.googleusercontent.com';
const API_KEY = 'AIzaSyAt05TP2qmv5ZaamtWPmULPFI9dfMT-9q8';
const SCOPES = 'https://www.googleapis.com/auth/drive.file';
let tokenClient;
let accessToken = localStorage.getItem('googleAccessToken');

function normalizeNotes() {
    notes = notes.map((note, index) => ({
        title: note.title || 'Untitled',
        content: note.content || '',
        category: note.category || 'Uncategorized',
        timestamp: note.timestamp || new Date().toISOString(),
        pinned: note.pinned || false,
        pinnedTimestamp: note.pinnedTimestamp || null,
        originalIndex: index
    }));
    localStorage.setItem('notes', JSON.stringify(notes));
}

document.addEventListener('DOMContentLoaded', () => {
    normalizeNotes();
    setupEventListeners();
    renderCategories();
    renderNotes();
    checkGoogleAuthStatus();
});

function initGoogleAPI() {
    gapi.load('client', () => {
        gapi.client.init({
            apiKey: API_KEY,
            discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'],
        }).then(() => {
            tokenClient = google.accounts.oauth2.initTokenClient({
                client_id: CLIENT_ID,
                scope: SCOPES,
                callback: (response) => {
                    if (response.access_token) {
                        accessToken = response.access_token;
                        localStorage.setItem('googleAccessToken', accessToken);
                        updateGoogleAuthUI(true);
                        alert('Successfully signed in with Google!');
                    }
                },
            });
            checkGoogleAuthStatus();
        });
    });
}

function checkGoogleAuthStatus() {
    if (accessToken) {
        updateGoogleAuthUI(true);
    } else {
        updateGoogleAuthUI(false);
    }
}

function updateGoogleAuthUI(isSignedIn) {
    document.getElementById('googleAuthBtn').style.display = isSignedIn ? 'none' : 'block';
    document.getElementById('backupGoogleBtn').style.display = isSignedIn ? 'block' : 'none';
    document.getElementById('googleLogoutBtn').style.display = isSignedIn ? 'block' : 'none';
}

function setupEventListeners() {
    document.getElementById('addCategoryBtn').addEventListener('click', addCategory);
    document.getElementById('addNoteBtn').addEventListener('click', () => window.location.href = 'edit.html');
    document.getElementById('toggleModeBtn').addEventListener('click', toggleMode);
    document.getElementById('moreBtn').addEventListener('click', toggleMoreOptions);
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
    document.getElementById('googleAuthBtn').addEventListener('click', () => {
        tokenClient.requestAccessToken();
    });
    document.getElementById('backupGoogleBtn').addEventListener('click', backupToGoogleDrive);
    document.getElementById('copyBackupBtn').addEventListener('click', copyBackupToClipboard);
    document.getElementById('googleLogoutBtn').addEventListener('click', logoutFromGoogle);
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.more-btn') && !e.target.closest('.more-options')) {
            hideMoreOptions();
        }
        hideContextMenus();
    });

    initGoogleAPI();
}

function renderCategories() {
    const categoryList = document.getElementById('categoryList');
    categoryList.innerHTML = '';
    categories.forEach(category => {
        const count = category === 'All' 
            ? notes.length 
            : notes.filter(note => note.category === category).length;
        const div = document.createElement('div');
        div.className = `category ${category === currentCategory ? 'active' : ''}`;
        div.innerHTML = `${category} <span class="count">${count}</span>`;
        div.addEventListener('click', () => {
            if (categoryPins[category]) {
                const pin = prompt(`Enter PIN for ${category}:`);
                if (pin !== categoryPins[category]) {
                    alert('Incorrect PIN!');
                    return;
                }
            }
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

    let filteredNotes = notes.map((note, index) => ({ ...note, originalIndex: index }))
        .filter(note => {
            const matchesCategory = currentCategory === 'All' || note.category === currentCategory;
            const matchesSearch = note.title.toLowerCase().includes(searchTerm) || note.content.toLowerCase().includes(searchTerm);
            return matchesCategory && matchesSearch;
        });

    let pinned = [];
    let regular = filteredNotes;
    if (currentCategory === 'All') {
        pinned = filteredNotes.filter(note => note.pinned);
        regular = filteredNotes.filter(note => !note.pinned);
        pinned.sort((a, b) => new Date(b.pinnedTimestamp || b.timestamp) - new Date(a.pinnedTimestamp || a.timestamp));
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
    const isBlurred = categoryPins[note.category] && currentCategory !== note.category && !unlockedNotes.has(note.originalIndex);
    div.className = `note ${isBlurred ? 'blurred' : ''}`;
    const date = new Date(note.timestamp);
    const formattedDate = date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) + ', ' + 
                         date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    const previewText = note.content.replace(/<[^>]+>/g, '').substring(0, 50) + (note.content.length > 50 ? '...' : '');
    div.innerHTML = `
        <div class="title">${note.title}</div>
        <div class="category">${note.category}</div>
        <div class="timestamp">${formattedDate}</div>
        <div class="preview">${previewText || 'No content'}</div>
    `;
    div.addEventListener('click', () => {
        if (isBlurred) {
            const pin = prompt(`Enter PIN for ${note.category} to view this note:`);
            if (pin === categoryPins[note.category]) {
                unlockedNotes.add(note.originalIndex);
                window.location.href = `view.html?id=${note.originalIndex}&search=${encodeURIComponent(searchQuery)}`;
            } else {
                alert('Incorrect PIN!');
            }
        } else {
            window.location.href = `view.html?id=${note.originalIndex}&search=${encodeURIComponent(searchQuery)}`;
        }
    });
    div.addEventListener('contextmenu', (e) => showNoteContextMenu(e, note.originalIndex));
    return div;
}

function addCategory() {
    const category = prompt('Enter new category:').trim();
    if (category && !categories.includes(category)) {
        categories.push(category);
        localStorage.setItem('categories', JSON.stringify(categories));
        renderCategories();
    }
}

function toggleMode() {
    isListMode = !isListMode;
    const toggleBtn = document.getElementById('toggleModeBtn');
    const modeIcon = toggleBtn.querySelector('.mode-icon');
    modeIcon.innerHTML = isListMode 
        ? '<rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/>'
        : '<rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/>';
    toggleBtn.lastChild.nodeValue = isListMode ? ' Grid Mode' : ' List Mode';
    renderNotes();
}

function toggleMoreOptions() {
    const moreOptions = document.getElementById('moreOptions');
    moreOptions.classList.toggle('active');
}

function hideMoreOptions() {
    const moreOptions = document.getElementById('moreOptions');
    moreOptions.classList.remove('active');
}

function backupNotes() {
    const data = { notes, categories, categoryPins };
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'technotes-backup.json';
    a.click();
    URL.revokeObjectURL(url);
    hideMoreOptions();
}

function backupToGoogleDrive() {
    if (!accessToken) {
        alert('Please sign in with Google first!');
        return;
    }

    const data = { notes, categories, categoryPins };
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const metadata = {
        name: `technotes-backup-${new Date().toISOString()}.json`,
        mimeType: 'application/json',
    };

    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', blob);

    fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: new Headers({ 'Authorization': `Bearer ${accessToken}` }),
        body: form,
    })
    .then(response => response.json())
    .then(data => {
        if (data.id) {
            alert('Backup successfully uploaded to Google Drive!');
            hideMoreOptions();
        } else {
            throw new Error('Upload failed');
        }
    })
    .catch(error => {
        console.error('Error uploading to Google Drive:', error);
        alert('Failed to backup to Google Drive. Please try again.');
    });
}

function copyBackupToClipboard() {
    const data = { notes, categories, categoryPins };
    const jsonString = JSON.stringify(data);
    navigator.clipboard.writeText(jsonString)
        .then(() => {
            alert('Backup copied to clipboard. Paste it into a new file in Google Drive or any text editor.');
            hideMoreOptions();
        })
        .catch(err => {
            console.error('Error copying to clipboard:', err);
            alert('Failed to copy to clipboard. Please try again.');
        });
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
            categoryPins = data.categoryPins || {};
            normalizeNotes();
            localStorage.setItem('notes', JSON.stringify(notes));
            localStorage.setItem('categories', JSON.stringify(categories));
            localStorage.setItem('categoryPins', JSON.stringify(categoryPins));
            renderCategories();
            renderNotes();
        };
        reader.readAsText(file);
    };
    input.click();
    hideMoreOptions();
}

function resetNotes() {
    if (confirm('Are you sure you want to reset all notes and categories?')) {
        notes = [];
        categories = ['All', 'Uncategorized'];
        categoryPins = {};
        localStorage.setItem('notes', JSON.stringify(notes));
        localStorage.setItem('categories', JSON.stringify(categories));
        localStorage.setItem('categoryPins', JSON.stringify(categoryPins));
        renderCategories();
        renderNotes();
    }
}

function logoutFromGoogle() {
    accessToken = null;
    localStorage.removeItem('googleAccessToken');
    updateGoogleAuthUI(false);
    alert('Signed out from Google.');
    hideMoreOptions();
}

function showContextMenu(e, category) {
    e.preventDefault();
    if (category === 'All' || category === 'Uncategorized') return;
    const contextMenu = document.getElementById('contextMenu');
    contextMenu.innerHTML = `
        <div class="menu-item" onclick="editCategory('${category}')">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
            Edit
        </div>
        <div class="menu-item" onclick="deleteCategory('${category}')">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M4 6l1 14a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1l1-14"/></svg>
            Delete
        </div>
        <div class="menu-item" onclick="setCategoryPin('${category}')">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22v-5"/><path d="M18 5l-6-3-6 3v12l6 3 6-3z"/></svg>
            ${categoryPins[category] ? 'Change/Remove PIN' : 'Set PIN'}
        </div>
    `;

    // Hitung posisi secara dinamis
    const categoryElement = e.target.closest('.category');
    const rect = categoryElement.getBoundingClientRect();
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const viewportHeight = window.innerHeight;

    contextMenu.style.display = 'block';
    contextMenu.style.left = `${rect.left}px`;
    const topPosition = rect.bottom + scrollTop;
    const menuHeight = contextMenu.offsetHeight;

    if (topPosition + menuHeight > scrollTop + viewportHeight) {
        contextMenu.style.top = `${rect.top + scrollTop - menuHeight}px`;
    } else {
        contextMenu.style.top = `${topPosition}px`;
    }
}

function showNoteContextMenu(e, originalIndex) {
    e.preventDefault();
    const contextMenu = document.getElementById('noteContextMenu');
    const note = notes[originalIndex];
    contextMenu.innerHTML = `
        <div class="menu-item" onclick="togglePin(${originalIndex})">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                ${note.pinned ? '<path d="M12 17v5"/><path d="M10 3h4v14h-4z"/>' : '<path d="M12 22v-5"/><path d="M18 5l-6-3-6 3v12l6 3 6-3z"/>'}
            </svg>
            ${note.pinned ? 'Unpin' : 'Pin'}
        </div>
        <div class="menu-item" onclick="deleteNote(${originalIndex})">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M4 6l1 14a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1l1-14"/></svg>
            Delete
        </div>
    `;

    // Hitung posisi secara dinamis
    const noteElement = e.target.closest('.note');
    const rect = noteElement.getBoundingClientRect();
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const viewportHeight = window.innerHeight;

    contextMenu.style.display = 'block';
    contextMenu.style.left = `${rect.left}px`;
    const topPosition = rect.bottom + scrollTop;
    const menuHeight = contextMenu.offsetHeight;

    if (topPosition + menuHeight > scrollTop + viewportHeight) {
        contextMenu.style.top = `${rect.top + scrollTop - menuHeight}px`;
    } else {
        contextMenu.style.top = `${topPosition}px`;
    }
}

function hideContextMenus() {
    document.getElementById('contextMenu').style.display = 'none';
    document.getElementById('noteContextMenu').style.display = 'none';
}

function editCategory(oldCategory) {
    const newCategory = prompt('Edit category name:', oldCategory).trim();
    if (newCategory && newCategory !== oldCategory && !categories.includes(newCategory)) {
        const index = categories.indexOf(oldCategory);
        categories[index] = newCategory;
        notes = notes.map(note => 
            note.category === oldCategory ? { ...note, category: newCategory } : note
        );
        if (categoryPins[oldCategory]) {
            categoryPins[newCategory] = categoryPins[oldCategory];
            delete categoryPins[oldCategory];
        }
        localStorage.setItem('categories', JSON.stringify(categories));
        localStorage.setItem('notes', JSON.stringify(notes));
        localStorage.setItem('categoryPins', JSON.stringify(categoryPins));
        if (currentCategory === oldCategory) currentCategory = newCategory;
        renderCategories();
        renderNotes();
    }
}

function deleteCategory(category) {
    categories = categories.filter(c => c !== category);
    notes = notes.map(note => note.category === category ? { ...note, category: 'Uncategorized' } : note);
    delete categoryPins[category];
    localStorage.setItem('categories', JSON.stringify(categories));
    localStorage.setItem('notes', JSON.stringify(notes));
    localStorage.setItem('categoryPins', JSON.stringify(categoryPins));
    currentCategory = 'All';
    renderCategories();
    renderNotes();
}

function setCategoryPin(category) {
    const currentPin = categoryPins[category];
    if (currentPin) {
        const oldPin = prompt(`Enter current PIN for ${category} to change or remove it:`);
        if (oldPin === null) return;
        if (oldPin !== currentPin) {
            alert('Incorrect current PIN!');
            return;
        }
    }

    const action = currentPin ? 'Enter new PIN (leave blank to remove):' : 'Set PIN for category:';
    const pin = prompt(action, '');
    if (pin === null) return;
    if (pin.trim() === '') {
        delete categoryPins[category];
        alert(`PIN removed from ${category}`);
    } else {
        categoryPins[category] = pin.trim();
        alert(`PIN ${currentPin ? 'changed for' : 'set for'} ${category}`);
    }
    localStorage.setItem('categoryPins', JSON.stringify(categoryPins));
    hideContextMenus();
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