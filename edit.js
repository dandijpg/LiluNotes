let notes = JSON.parse(localStorage.getItem('notes') || '[]');
let categories = JSON.parse(localStorage.getItem('categories') || '[]');
const urlParams = new URLSearchParams(window.location.search);
const noteId = urlParams.get('id');
const searchQuery = urlParams.get('search') || '';

document.addEventListener('DOMContentLoaded', () => {
    setupCategorySelect();
    setupEditor();
    setupEventListeners();
});

function setupCategorySelect() {
    const select = document.getElementById('categorySelect');
    if (!select) return;
    categories.forEach(category => {
        if (category !== 'All') {
            const option = document.createElement('option');
            option.value = category;
            option.textContent = category;
            select.appendChild(option);
        }
    });
}

function setupEditor() {
    const noteTitle = document.getElementById('noteTitle');
    const noteContent = document.getElementById('noteContent');
    const categorySelect = document.getElementById('categorySelect');

    if (!noteTitle || !noteContent || !categorySelect) {
        console.error('One or more editor elements not found');
        return;
    }

    if (noteId !== null) {
        const note = notes[noteId];
        noteTitle.value = note.title;
        noteContent.innerHTML = note.content;
        categorySelect.value = note.category;
        highlightSearchTerms(noteContent, searchQuery);
    } else {
        categorySelect.value = categories[1] || 'Uncategorized';
    }

    noteContent.focus();
    setupCalculatorListeners();
}

function setupEventListeners() {
    const buttons = {
        boldBtn: () => document.execCommand('bold', false, null),
        italicBtn: () => document.execCommand('italic', false, null),
        underlineBtn: () => document.execCommand('underline', false, null),
        highlightBtn: toggleHighlight,
        linkBtn: insertLink,
        numberedListBtn: () => document.execCommand('insertOrderedList', false, null),
        bulletListBtn: () => document.execCommand('insertUnorderedList', false, null),
        arrowListBtn: insertArrowList,
        alignLeftBtn: () => document.execCommand('justifyLeft', false, null),
        alignCenterBtn: () => document.execCommand('justifyCenter', false, null),
        alignRightBtn: () => document.execCommand('justifyRight', false, null),
        floatLeftBtn: () => applyFloat('left'),
        floatCenterBtn: () => applyFloat('none'),
        floatRightBtn: () => applyFloat('right'),
        tableBtn: insertTable,
        addRowBtn: addRow,
        addColBtn: addColumn,
        deleteRowBtn: deleteRow,
        deleteColBtn: deleteColumn,
        copyFormattedBtn: copyFormattedText,
        calcBtn: insertCalculator,
        saveBtn: saveNote,
        exitBtn: () => window.location.href = `index.html?search=${encodeURIComponent(searchQuery)}`
    };

    for (const [id, action] of Object.entries(buttons)) {
        const btn = document.getElementById(id);
        if (btn) {
            btn.addEventListener('click', action);
        } else {
            console.warn(`Button with ID "${id}" not found`);
        }
    }

    const noteContent = document.getElementById('noteContent');
    if (noteContent) {
        noteContent.addEventListener('click', toggleTableButtons);
        noteContent.addEventListener('keyup', toggleTableButtons);
        noteContent.addEventListener('click', (e) => {
            const target = e.target;
            if (target.classList.contains('copyable')) {
                const htmlContent = target.outerHTML;
                const textContent = target.textContent;
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
        });
    }
}

// Fungsi Kalkulator Baru
function insertCalculator() {
    const noteContent = document.getElementById('noteContent');
    if (!noteContent) {
        console.error('noteContent not found');
        return;
    }

    const calcWrapper = document.createElement('div');
    calcWrapper.className = 'calculator-wrapper';

    const numberLine1 = document.createElement('div');
    numberLine1.className = 'number-line';
    const num1 = document.createElement('span');
    num1.className = 'calc-number';
    num1.setAttribute('contenteditable', 'true');
    num1.textContent = '0';
    const spacer = document.createElement('span');
    spacer.textContent = '          '; // 10 spasi
    spacer.setAttribute('contenteditable', 'false');
    const operator = document.createElement('span');
    operator.className = 'calc-operator';
    operator.textContent = '+';
    operator.setAttribute('contenteditable', 'false');
    numberLine1.appendChild(num1);
    numberLine1.appendChild(spacer);
    numberLine1.appendChild(operator);

    const numberLine2 = document.createElement('div');
    numberLine2.className = 'number-line';
    const num2 = document.createElement('span');
    num2.className = 'calc-number';
    num2.setAttribute('contenteditable', 'true');
    num2.textContent = '';
    numberLine2.appendChild(num2);

    const separator = document.createElement('div');
    separator.className = 'separator';
    separator.textContent = '----------=';
    separator.setAttribute('contenteditable', 'false');

    const result = document.createElement('div');
    result.className = 'result';
    result.textContent = '0';
    result.setAttribute('contenteditable', 'false');

    calcWrapper.appendChild(numberLine1);
    calcWrapper.appendChild(numberLine2);
    calcWrapper.appendChild(separator);
    calcWrapper.appendChild(result);

    noteContent.appendChild(calcWrapper);
    setupCalculatorListeners();
    num1.focus();
}

function setupCalculatorListeners() {
    const calcWrappers = document.querySelectorAll('.calculator-wrapper');
    calcWrappers.forEach(wrapper => {
        const numbers = wrapper.querySelectorAll('.calc-number');
        numbers.forEach(num => {
            num.addEventListener('input', () => updateCalculator(wrapper));
            num.addEventListener('keydown', (e) => handleCalculatorKeydown(e, wrapper));
        });
    });
}

function updateCalculator(wrapper) {
    const numbers = wrapper.querySelectorAll('.calc-number');
    const operator = wrapper.querySelector('.calc-operator').textContent;
    const result = wrapper.querySelector('.result');

    const num1 = parseFloat(numbers[0].textContent.trim()) || 0;
    const num2 = parseFloat(numbers[1].textContent.trim()) || 0;
    let total;

    switch (operator) {
        case '+': total = num1 + num2; break;
        case '-': total = num1 - num2; break;
        case '*': total = num1 * num2; break;
        case '/': total = num2 !== 0 ? num1 / num2 : 'Error'; break;
        default: total = 'Error';
    }

    result.textContent = isNaN(total) || total === 'Error' ? 'Error' : total;
}

function handleCalculatorKeydown(e, wrapper) {
    const currentNum = e.target;
    if (e.key === 'Enter') {
        e.preventDefault();
        const numbers = wrapper.querySelectorAll('.calc-number');
        const nextNum = currentNum === numbers[0] ? numbers[1] : numbers[0];
        nextNum.focus();
    } else if (e.key.match(/[+\-*/]/)) {
        e.preventDefault();
        const operatorSpan = wrapper.querySelector('.calc-operator');
        operatorSpan.textContent = e.key;
        updateCalculator(wrapper);
        const numbers = wrapper.querySelectorAll('.calc-number');
        numbers[1].focus();
    } else if (!e.key.match(/[0-9.]|Backspace|Delete|ArrowLeft|ArrowRight/)) {
        e.preventDefault(); // Hanya izinkan angka, titik, dan kontrol navigasi
    }
}

// Fungsi Lain (Tidak Berubah)
function toggleHighlight() {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const selectedText = range.toString();
        if (selectedText) {
            const span = document.createElement('span');
            span.className = 'highlight';
            span.textContent = selectedText;
            range.deleteContents();
            range.insertNode(span);
        }
    }
}

function insertLink() {
    const url = prompt('Enter the URL:');
    if (url) {
        const selection = window.getSelection();
        if (selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            const selectedText = range.toString();
            const a = document.createElement('a');
            a.href = url;
            a.target = '_blank';
            a.textContent = selectedText || url;
            a.className = 'copyable';
            range.deleteContents();
            range.insertNode(a);
        }
    }
}

function insertArrowList() {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const ul = document.createElement('ul');
        ul.style.listStyleType = '"➜ "';
        const li = document.createElement('li');
        ul.appendChild(li);
        range.deleteContents();
        range.insertNode(ul);
        selection.removeAllRanges();
        const newRange = document.createRange();
        newRange.setStart(li, 0);
        newRange.setEnd(li, 0);
        selection.addRange(newRange);
    }
}

function applyFloat(direction) {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const selectedNode = range.commonAncestorContainer;
        const parentElement = selectedNode.nodeType === 3 ? selectedNode.parentElement : selectedNode;
        if (parentElement && parentElement !== document.getElementById('noteContent')) {
            parentElement.style.float = direction;
            if (direction === 'none') {
                parentElement.style.display = 'block';
                parentElement.style.marginLeft = 'auto';
                parentElement.style.marginRight = 'auto';
            } else {
                parentElement.style.display = 'inline-block';
                parentElement.style.marginLeft = direction === 'left' ? '0' : 'auto';
                parentElement.style.marginRight = direction === 'right' ? '0' : 'auto';
            }
        }
    }
}

function insertTable() {
    const tableHtml = `
        <div class="table-wrapper">
            <table>
                <tr><th>Header 1</th><th>Header 2</th></tr>
                <tr><td>Cell 1</td><td>Cell 2</td></tr>
            </table>
        </div>`;
    const noteContent = document.getElementById('noteContent');
    if (noteContent) {
        const div = document.createElement('div');
        div.innerHTML = tableHtml;
        noteContent.appendChild(div.firstChild);
        toggleTableButtons();
    }
}

function addRow() {
    const table = getSelectedTable();
    if (table) {
        const row = table.insertRow(-1);
        const cellCount = table.rows[0].cells.length;
        for (let i = 0; i < cellCount; i++) {
            row.insertCell(-1).textContent = 'New Cell';
        }
    }
}

function addColumn() {
    const table = getSelectedTable();
    if (table) {
        Array.from(table.rows).forEach(row => {
            const cell = row.insertCell(-1);
            cell.textContent = row.cells[0].tagName === 'TH' ? 'New Header' : 'New Cell';
        });
    }
}

function deleteRow() {
    const table = getSelectedTable();
    if (table && table.rows.length > 1) {
        const rowIndex = getSelectedRowIndex();
        if (rowIndex !== -1) table.deleteRow(rowIndex);
    }
}

function deleteColumn() {
    const table = getSelectedTable();
    if (table && table.rows[0].cells.length > 1) {
        const colIndex = getSelectedColumnIndex();
        if (colIndex !== -1) {
            Array.from(table.rows).forEach(row => row.deleteCell(colIndex));
        }
    }
}

function getSelectedTable() {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        let node = range.commonAncestorContainer;
        while (node && node.tagName !== 'TABLE') {
            node = node.parentElement;
        }
        return node;
    }
    return null;
}

function getSelectedRowIndex() {
    const table = getSelectedTable();
    if (table) {
        const selection = window.getSelection();
        const range = selection.getRangeAt(0);
        let cell = range.commonAncestorContainer;
        while (cell && cell.tagName !== 'TD' && cell.tagName !== 'TH') {
            cell = cell.parentElement;
        }
        if (cell) {
            const row = cell.parentElement;
            return Array.from(table.rows).indexOf(row);
        }
    }
    return -1;
}

function getSelectedColumnIndex() {
    const table = getSelectedTable();
    if (table) {
        const selection = window.getSelection();
        const range = selection.getRangeAt(0);
        let cell = range.commonAncestorContainer;
        while (cell && cell.tagName !== 'TD' && cell.tagName !== 'TH') {
            cell = cell.parentElement;
        }
        if (cell) {
            return Array.from(cell.parentElement.cells).indexOf(cell);
        }
    }
    return -1;
}

function toggleTableButtons() {
    const table = getSelectedTable();
    const addRowBtn = document.getElementById('addRowBtn');
    const addColBtn = document.getElementById('addColBtn');
    const deleteRowBtn = document.getElementById('deleteRowBtn');
    const deleteColBtn = document.getElementById('deleteColBtn');

    if (addRowBtn) addRowBtn.style.display = table ? 'inline-block' : 'none';
    if (addColBtn) addColBtn.style.display = table ? 'inline-block' : 'none';
    if (deleteRowBtn) deleteRowBtn.style.display = table && table.rows.length > 1 ? 'inline-block' : 'none';
    if (deleteColBtn) deleteColBtn.style.display = table && table.rows[0].cells.length > 1 ? 'inline-block' : 'none';
}

function copyFormattedText() {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const selectedText = range.cloneContents();
        const span = document.createElement('span');
        span.className = 'copyable';
        span.appendChild(selectedText);
        range.deleteContents();
        range.insertNode(span);
    } else {
        alert('Please select some text to make copyable.');
    }
}

function saveNote() {
    const noteTitle = document.getElementById('noteTitle')?.value.trim();
    const noteContent = document.getElementById('noteContent')?.innerHTML;
    const category = document.getElementById('categorySelect')?.value;

    if (!noteTitle || !noteContent) {
        alert('Title and content cannot be empty!');
        return;
    }

    const note = {
        title: noteTitle,
        content: noteContent,
        category: category,
        timestamp: new Date().toISOString(),
        pinned: noteId !== null ? (notes[noteId]?.pinned || false) : false,
        pinnedTimestamp: noteId !== null ? (notes[noteId]?.pinnedTimestamp || null) : null
    };

    if (noteId !== null) {
        notes[noteId] = note;
    } else {
        notes.push(note);
    }

    localStorage.setItem('notes', JSON.stringify(notes));
    window.location.href = `index.html?search=${encodeURIComponent(searchQuery)}`;
}

function highlightSearchTerms(element, query) {
    if (!query || !element) return;
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