document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const noteId = urlParams.get('id');
    const searchQuery = urlParams.get('search') || '';
    
    const notes = JSON.parse(localStorage.getItem('notes') || '[]');
    const categories = JSON.parse(localStorage.getItem('categories') || '[]');
    const note = notes[noteId] || { title: '', content: '', category: categories[1] || 'Uncategorized', timestamp: new Date().toISOString(), pinned: false };
    
    const title = document.getElementById('noteTitle');
    const content = document.getElementById('noteContent');
    const categorySelect = document.getElementById('noteCategory');
    const editBtn = document.getElementById('editBtn');
    const viewBtn = document.getElementById('viewBtn');
    const saveBtn = document.getElementById('saveNote');
    const exitBtn = document.getElementById('exitEditBtn');
    const toolbar = document.querySelector('.toolbar');
    const toolbarButtons = document.querySelectorAll('.tool-btn');
    const colorPicker = document.getElementById('colorPicker');

    let selectedTable = null;

    // Tambahkan tombol tabel ke toolbar
    const tableTools = `
        <button class="table-tool-btn add-row-btn" title="Add Row">+ Row</button>
        <button class="table-tool-btn delete-row-btn" title="Delete Row">− Row</button>
        <button class="table-tool-btn add-col-btn" title="Add Column">+ Col</button>
        <button class="table-tool-btn delete-col-btn" title="Delete Column">− Col</button>
    `;
    toolbar.insertAdjacentHTML('beforeend', tableTools);

    const tableToolButtons = document.querySelectorAll('.table-tool-btn');

    // Populate category dropdown
    categories.filter(cat => cat !== 'All').forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        option.textContent = cat;
        if (cat === note.category) option.selected = true;
        categorySelect.appendChild(option);
    });

    // Initial view mode
    title.value = note.title;
    content.innerHTML = highlightText(note.content, searchQuery);
    content.contentEditable = false;
    setupCopyableText(); // Pastikan dipanggil di awal

    // Edit mode
    editBtn.addEventListener('click', () => {
        title.readOnly = false;
        title.style.userSelect = 'text';
        content.contentEditable = true;
        content.innerHTML = note.content; // Muat konten asli
        editBtn.style.display = 'none';
        viewBtn.style.display = 'inline';
        saveBtn.style.display = 'inline';
        categorySelect.style.display = 'inline';
        toolbarButtons.forEach(btn => btn.style.display = 'inline');
        colorPicker.style.display = 'inline';
        setupToolbar();
        setupTableEditing();
        setupCopyableText(); // Pastikan copyable tetap berfungsi di mode edit
    });

    // View mode
    viewBtn.addEventListener('click', () => {
        title.readOnly = true;
        title.style.userSelect = 'none';
        content.contentEditable = false;
        content.innerHTML = highlightText(note.content, searchQuery); // Muat konten dengan highlight
        editBtn.style.display = 'inline';
        viewBtn.style.display = 'none';
        saveBtn.style.display = 'none';
        categorySelect.style.display = 'none';
        toolbarButtons.forEach(btn => btn.style.display = 'none');
        tableToolButtons.forEach(btn => btn.style.display = 'none');
        colorPicker.style.display = 'none';
        selectedTable = null;
        setupCopyableText(); // Panggil ulang untuk elemen baru
    });

    // Exit button
    exitBtn.addEventListener('click', () => {
        window.location.href = 'index.html';
    });

    saveBtn.addEventListener('click', () => saveNote(noteId));
});

function setupToolbar() {
    const buttons = document.querySelectorAll('.tool-btn');
    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            const action = btn.dataset.action;
            if (action === 'link') {
                const url = prompt('Enter URL:');
                if (url) document.execCommand('createLink', false, url);
            } else if (action === 'copyable') {
                document.execCommand('insertHTML', false, '<span class="copyable">' + document.getSelection().toString() + '</span>');
            } else if (action === 'table') {
                insertTable();
            } else {
                document.execCommand(action, false, null);
            }
        });
    });

    document.getElementById('colorPicker').addEventListener('change', (e) => {
        document.execCommand('foreColor', false, e.target.value);
    });

    const tableToolButtons = document.querySelectorAll('.table-tool-btn');
    tableToolButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            if (selectedTable) {
                if (btn.classList.contains('add-row-btn')) addRow(selectedTable);
                if (btn.classList.contains('delete-row-btn')) deleteRow(selectedTable);
                if (btn.classList.contains('add-col-btn')) addColumn(selectedTable);
                if (btn.classList.contains('delete-col-btn')) deleteColumn(selectedTable);
            } else {
                alert('Please select a table first!');
            }
        });
    });
}

function insertTable() {
    const rows = prompt('Enter number of rows:', '2');
    const cols = prompt('Enter number of columns:', '2');
    if (!rows || !cols || isNaN(rows) || isNaN(cols) || rows < 1 || cols < 1) {
        alert('Please enter valid numbers (at least 1) for rows and columns.');
        return;
    }
    const tableHTML = createTableHTML(parseInt(rows), parseInt(cols));
    document.execCommand('insertHTML', false, tableHTML);
    setupTableEditing();
}

function createTableHTML(rows, cols) {
    let html = '<div class="table-wrapper"><table contenteditable="true">';
    for (let i = 0; i < rows; i++) {
        html += '<tr>';
        for (let j = 0; j < cols; j++) {
            html += '<td> </td>'; // Gunakan   untuk memastikan sel tidak kosong
        }
        html += '</tr>';
    }
    html += '</table></div><br>'; // Tambah <br> agar bisa lanjut mengetik di luar tabel
    return html;
}

function setupTableEditing() {
    const tables = document.querySelectorAll('.note-content table');
    const tableToolButtons = document.querySelectorAll('.table-tool-btn');

    tables.forEach(table => {
        table.addEventListener('click', (e) => {
            if (document.getElementById('noteContent').contentEditable === 'true') {
                e.stopPropagation();
                selectedTable = table;
                tableToolButtons.forEach(btn => btn.style.display = 'inline');
            }
        });
    });

    // Klik di luar tabel untuk menonaktifkan tombol
    document.getElementById('noteContent').addEventListener('click', (e) => {
        if (!e.target.closest('table')) {
            selectedTable = null;
            tableToolButtons.forEach(btn => btn.style.display = 'none');
        }
    });
}

let selectedTable = null;

function addRow(table) {
    const newRow = document.createElement('tr');
    const colCount = table.rows[0] ? table.rows[0].cells.length : 1;
    for (let i = 0; i < colCount; i++) {
        const td = document.createElement('td');
        td.innerHTML = ' ';
        newRow.appendChild(td);
    }
    table.appendChild(newRow);
}

function deleteRow(table) {
    if (table.rows.length > 0) {
        table.deleteRow(-1);
        if (table.rows.length === 0) {
            table.parentNode.remove(); // Hapus tabel dan wrapper jika kosong
            selectedTable = null;
            document.querySelectorAll('.table-tool-btn').forEach(btn => btn.style.display = 'none');
        }
    }
}

function addColumn(table) {
    if (table.rows.length === 0) {
        const newRow = document.createElement('tr');
        const td = document.createElement('td');
        td.innerHTML = ' ';
        newRow.appendChild(td);
        table.appendChild(newRow);
    } else {
        Array.from(table.rows).forEach(row => {
            const td = document.createElement('td');
            td.innerHTML = ' ';
            row.appendChild(td);
        });
    }
}

function deleteColumn(table) {
    if (table.rows.length > 0 && table.rows[0].cells.length > 0) {
        Array.from(table.rows).forEach(row => {
            row.deleteCell(-1);
        });
        if (table.rows[0].cells.length === 0) {
            table.parentNode.remove(); // Hapus tabel dan wrapper jika kosong
            selectedTable = null;
            document.querySelectorAll('.table-tool-btn').forEach(btn => btn.style.display = 'none');
        }
    }
}

function setupCopyableText() {
    const copyableElements = document.querySelectorAll('.copyable');
    copyableElements.forEach(element => {
        // Hapus event listener lama untuk mencegah duplikat
        element.removeEventListener('click', handleCopy);
        element.removeEventListener('touchstart', handleTouchCopy);

        // Tambahkan event listener baru
        element.addEventListener('click', handleCopy);
        element.addEventListener('touchstart', handleTouchCopy);
    });

    function handleCopy() {
        const text = this.textContent;
        navigator.clipboard.writeText(text).then(() => {
            alert(`Copied to clipboard: "${text}"`);
        }).catch(err => {
            console.error('Failed to copy: ', err);
            alert('Failed to copy text.');
        });
    }

    function handleTouchCopy(e) {
        e.preventDefault();
        const text = this.textContent;
        navigator.clipboard.writeText(text).then(() => {
            alert(`Copied to clipboard: "${text}"`);
        }).catch(err => {
            console.error('Failed to copy: ', err);
            alert('Failed to copy text.');
        });
    }
}

function saveNote(noteId) {
    const title = document.getElementById('noteTitle').value;
    const content = document.getElementById('noteContent').innerHTML;
    const category = document.getElementById('noteCategory').value;
    let notes = JSON.parse(localStorage.getItem('notes') || '[]');
    
    const noteData = { 
        title, 
        content, 
        category, 
        pinned: noteId ? notes[noteId].pinned : false,
        pinnedTimestamp: noteId ? notes[noteId].pinnedTimestamp : undefined,
        timestamp: noteId ? notes[noteId].timestamp : new Date().toISOString()
    };
    
    if (noteId) {
        notes[noteId] = noteData;
    } else {
        notes.push(noteData);
    }
    
    localStorage.setItem('notes', JSON.stringify(notes));
    window.location.href = 'index.html';
}

function highlightText(text, query) {
    if (!query) return text;
    const regex = new RegExp(`(${query})`, 'gi');
    return text.replace(regex, '<span class="highlight">$1</span>');
}