let notes = JSON.parse(localStorage.getItem('notes') || '[]');
let categories = JSON.parse(localStorage.getItem('categories') || '[]');
const urlParams = new URLSearchParams(window.location.search);
const noteId = urlParams.get('id');
const searchQuery = urlParams.get('search') || '';
let calcMode = 'financial'; // Default mode

document.addEventListener('DOMContentLoaded', () => {
    setupCategorySelect();
    setupEditor();
    setupEventListeners();
});

// Fungsi untuk menyimpan posisi kursor
function saveCursorPosition(element) {
    const selection = window.getSelection();
    if (selection.rangeCount > 0 && element.contains(selection.anchorNode)) {
        return selection.getRangeAt(0);
    }
    return null;
}

// Fungsi untuk mengembalikan posisi kursor
function restoreCursorPosition(range) {
    if (range) {
        const selection = window.getSelection();
        selection.removeAllRanges();
        selection.addRange(range);
    }
}

function setupCategorySelect() {
    const select = document.getElementById('categorySelect');
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

    if (noteId !== null) {
        const note = notes[noteId];
        noteTitle.value = note.title;
        noteContent.innerHTML = note.content;
        categorySelect.value = note.category;
        highlightSearchTerms(noteContent, searchQuery);
    } else {
        categorySelect.value = categories[1] || 'Uncategorized';
        noteContent.innerHTML = '';
    }
}

function setupEventListeners() {
    const noteContent = document.getElementById('noteContent');

    // Fungsi pembantu untuk menerapkan perintah dengan mempertahankan kursor
    const applyCommand = (command, value = null) => {
        const range = saveCursorPosition(noteContent);
        document.execCommand(command, false, value);
        restoreCursorPosition(range);
    };

    document.getElementById('boldBtn').addEventListener('click', () => applyCommand('bold'));
    document.getElementById('italicBtn').addEventListener('click', () => applyCommand('italic'));
    document.getElementById('underlineBtn').addEventListener('click', () => applyCommand('underline'));
    document.getElementById('markDoneBtn').addEventListener('click', markAsDone);
    document.getElementById('linkBtn').addEventListener('click', insertLink);
    document.getElementById('numberedListBtn').addEventListener('click', () => applyCommand('insertOrderedList'));
    document.getElementById('bulletListBtn').addEventListener('click', () => applyCommand('insertUnorderedList'));
    document.getElementById('arrowListBtn').addEventListener('click', insertArrowList);
    document.getElementById('alignLeftBtn').addEventListener('click', () => applyCommand('justifyLeft'));
    document.getElementById('alignCenterBtn').addEventListener('click', () => applyCommand('justifyCenter'));
    document.getElementById('alignRightBtn').addEventListener('click', () => applyCommand('justifyRight'));
    document.getElementById('floatLeftBtn').addEventListener('click', () => applyFloat('left'));
    document.getElementById('floatCenterBtn').addEventListener('click', () => applyFloat('none'));
    document.getElementById('floatRightBtn').addEventListener('click', () => applyFloat('right'));
    document.getElementById('tableBtn').addEventListener('click', insertTable);
    document.getElementById('addRowBtn').addEventListener('click', addRow);
    document.getElementById('addColBtn').addEventListener('click', addColumn);
    document.getElementById('deleteRowBtn').addEventListener('click', deleteRow);
    document.getElementById('deleteColBtn').addEventListener('click', deleteColumn);
    document.getElementById('financeBtn').addEventListener('click', insertFinancialTable);
    document.getElementById('calcMode').addEventListener('change', (e) => calcMode = e.target.value);
    document.getElementById('copyFormattedBtn').addEventListener('click', copyFormattedText);
    document.getElementById('saveBtn').addEventListener('click', saveNote);
    document.getElementById('exitBtn').addEventListener('click', () => window.location.href = `index.html?search=${encodeURIComponent(searchQuery)}`);
    noteContent.addEventListener('click', handleTableClick);
    noteContent.addEventListener('input', checkAmountInput);
    noteContent.addEventListener('focusout', updateFinancialTable);
}

function markAsDone() {
    const noteContent = document.getElementById('noteContent');
    const range = saveCursorPosition(noteContent);
    if (range) {
        const selectedText = range.toString();
        if (selectedText) {
            const span = document.createElement('span');
            span.className = 'done';
            span.textContent = selectedText;
            range.deleteContents();
            range.insertNode(span);
            restoreCursorPosition(range);
        }
    }
}

function insertLink() {
    const noteContent = document.getElementById('noteContent');
    const range = saveCursorPosition(noteContent);
    const url = prompt('Enter the URL:');
    if (url && range) {
        const selectedText = range.toString();
        const a = document.createElement('a');
        a.href = url;
        a.target = '_blank';
        a.textContent = selectedText || url;
        a.className = 'copyable';
        range.deleteContents();
        range.insertNode(a);
        restoreCursorPosition(range);
    }
}

function insertArrowList() {
    const noteContent = document.getElementById('noteContent');
    const range = saveCursorPosition(noteContent);
    if (range) {
        const ul = document.createElement('ul');
        ul.style.listStyleType = '"➜ "';
        const li = document.createElement('li');
        ul.appendChild(li);
        range.deleteContents();
        range.insertNode(ul);
        const newRange = document.createRange();
        newRange.setStart(li, 0);
        newRange.setEnd(li, 0);
        restoreCursorPosition(newRange);
    }
}

function applyFloat(direction) {
    const noteContent = document.getElementById('noteContent');
    const range = saveCursorPosition(noteContent);
    if (range) {
        const selectedNode = range.commonAncestorContainer;
        const parentElement = selectedNode.nodeType === 3 ? selectedNode.parentElement : selectedNode;
        if (parentElement && parentElement !== noteContent) {
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
            restoreCursorPosition(range);
        }
    }
}

function insertTable() {
    const noteContent = document.getElementById('noteContent');
    const range = saveCursorPosition(noteContent);
    const tableHtml = `
        <div class="table-wrapper">
            <table class="regular-table">
                <tr><th>Header 1</th><th>Header 2</th></tr>
                <tr><td>Cell 1</td><td>Cell 2</td></tr>
            </table>
        </div>`;
    document.execCommand('insertHTML', false, tableHtml);
    restoreCursorPosition(range);
    toggleTableButtons();
}

function insertFinancialTable() {
    const noteContent = document.getElementById('noteContent');
    const range = saveCursorPosition(noteContent);
    const financeHtml = `
        <div class="finance-table-wrapper">
            <table class="finance-table" data-mode="${calcMode}">
                <thead>
                    <tr>
                        <th contenteditable="false">Description</th>
                        <th contenteditable="false">Amount</th>
                    </tr>
                </thead>
                <tbody>
                    <tr class="income" data-operation="+">
                        <td contenteditable="true"></td>
                        <td contenteditable="true" class="amount" placeholder="0"></td>
                    </tr>
                </tbody>
                <tfoot>
                    <tr>
                        <td contenteditable="false">Total</td>
                        <td contenteditable="false" class="total">0</td>
                    </tr>
                </tfoot>
            </table>
            <div class="finance-btn-group" contenteditable="false">
                <button class="finance-btn add-income" title="Add Income">+</button>
                <button class="finance-btn subtract-expense" title="Add Expense">-</button>
                <button class="finance-btn multiply" title="Multiply">*</button>
                <button class="finance-btn divide" title="Divide">/</button>
                <button class="finance-btn calculate" title="Calculate Total">=</button>
                <button class="finance-btn delete-last-row" title="Delete Last Row">🗑️</button>
            </div>
        </div>`;
    document.execCommand('insertHTML', false, financeHtml);
    const wrapper = noteContent.querySelector('.finance-table-wrapper:last-child');
    setupFinanceButtons(wrapper);
    restoreCursorPosition(range);
}

function setupFinanceButtons(wrapper) {
    const buttons = {
        'add-income': () => addFinanceRow(wrapper, '+'),
        'subtract-expense': () => addFinanceRow(wrapper, '-'),
        'multiply': () => addFinanceRow(wrapper, '*'),
        'divide': () => addFinanceRow(wrapper, '/'),
        'calculate': () => calculateTotal(wrapper),
        'delete-last-row': () => deleteLastRow(wrapper)
    };

    for (const [className, handler] of Object.entries(buttons)) {
        const btn = wrapper.querySelector(`.finance-btn.${className}`);
        if (btn) {
            btn.removeEventListener('click', handler); // Hindari duplikat listener
            btn.addEventListener('click', handler);
        }
    }

    wrapper.querySelector('.amount')?.focus();
}

function addFinanceRow(wrapper, operation) {
    const tbody = wrapper.querySelector('tbody');
    const newRow = document.createElement('tr');
    newRow.className = operation === '+' ? 'income' : operation === '-' ? 'expense' : operation === '*' ? 'multiply' : 'divide';
    newRow.dataset.operation = operation;
    newRow.style.opacity = '0';
    newRow.style.transform = 'translateY(-10px)';
    newRow.innerHTML = `
        <td contenteditable="true"></td>
        <td contenteditable="true" class="amount" placeholder="0"></td>`;
    tbody.appendChild(newRow);

    setTimeout(() => {
        newRow.style.transition = 'all 0.3s ease';
        newRow.style.opacity = '1';
        newRow.style.transform = 'translateY(0)';
    }, 10);

    newRow.querySelector('.amount').focus();
}

function deleteLastRow(wrapper) {
    const table = wrapper.querySelector('.finance-table');
    const tbody = table.querySelector('tbody');
    const rows = tbody.querySelectorAll('tr');
    if (rows.length > 0) {
        tbody.removeChild(rows[rows.length - 1]);
        if (rows.length === 1) {
            const thead = table.querySelector('thead');
            const tfoot = table.querySelector('tfoot');
            if (thead) thead.remove();
            if (tfoot) tfoot.remove();
        } else {
            calculateTotal(wrapper);
        }
    }
}

function handleTableClick(event) {
    const noteContent = document.getElementById('noteContent');
    const wrapper = event.target.closest('.finance-table-wrapper');
    const table = event.target.closest('.regular-table') || event.target.closest('.finance-table');
    const allFinanceWrappers = noteContent.querySelectorAll('.finance-table-wrapper');

    // Sembunyikan semua tombol finansial terlebih dahulu
    allFinanceWrappers.forEach(w => {
        const btnGroup = w.querySelector('.finance-btn-group');
        if (btnGroup) btnGroup.style.display = 'none';
    });

    // Jika klik pada tabel finansial
    if (wrapper) {
        const btnGroup = wrapper.querySelector('.finance-btn-group') || wrapper.appendChild(createFinanceBtnGroup(wrapper));
        btnGroup.style.display = 'flex';
    }

    // Pastikan tombol tabel reguler muncul saat tabel reguler diklik
    toggleTableButtons();
}

function createFinanceBtnGroup(wrapper) {
    const btnGroup = document.createElement('div');
    btnGroup.className = 'finance-btn-group';
    btnGroup.setAttribute('contenteditable', 'false');
    btnGroup.innerHTML = `
        <button class="finance-btn add-income" title="Add Income">+</button>
        <button class="finance-btn subtract-expense" title="Add Expense">-</button>
        <button class="finance-btn multiply" title="Multiply">*</button>
        <button class="finance-btn divide" title="Divide">/</button>
        <button class="finance-btn calculate" title="Calculate Total">=</button>
        <button class="finance-btn delete-last-row" title="Delete Last Row">🗑️</button>
    `;
    setupFinanceButtons(wrapper);
    return btnGroup;
}

function checkAmountInput(event) {
    const target = event.target;
    if (target.classList.contains('amount')) {
        const value = target.innerText.trim();
        const isValid = /^-?[0-9]*$/.test(value.replace(/[^0-9-]/g, '')) && value !== '';
        const existingWarning = target.nextElementSibling?.classList.contains('warning');

        if (!isValid && value !== '' && !existingWarning) {
            const warning = document.createElement('span');
            warning.className = 'warning';
            warning.innerHTML = '⚠️';
            warning.title = 'Only numbers are supported';
            target.parentElement.appendChild(warning);
        } else if (isValid || value === '') {
            if (existingWarning) target.parentElement.removeChild(target.nextElementSibling);
        }
    }
}

function calculateTotal(wrapper) {
    const table = wrapper.querySelector('.finance-table');
    const mode = table.dataset.mode;
    const rows = table.querySelectorAll('tbody tr');
    let total = 0;

    rows.forEach((row, index) => {
        const amountCell = row.querySelector('.amount');
        let value = amountCell.innerText.trim().replace(/[^0-9-]/g, '');
        const num = parseFloat(value) || 0;
        const operation = row.dataset.operation;

        if (index === 0) total = num;
        else {
            switch (operation) {
                case '+': total += num; break;
                case '-': total -= num; break;
                case '*': total *= num; break;
                case '/': total = num !== 0 ? total / num : total; break;
            }
        }
    });

    const totalCell = table.querySelector('.total');
    if (totalCell) totalCell.innerText = mode === 'financial' ? formatCurrency(total) : total.toFixed(2);
}

function updateFinancialTable(event) {
    const financeTables = document.querySelectorAll('.finance-table');
    financeTables.forEach(table => {
        const mode = table.dataset.mode;
        const rows = table.querySelectorAll('tbody tr');

        rows.forEach(row => {
            const amountCell = row.querySelector('.amount');
            if (event.target === amountCell) {
                let value = amountCell.innerText.trim().replace(/[^0-9-]/g, '');
                const num = parseFloat(value) || 0;
                if (mode === 'financial' && value !== '') {
                    amountCell.innerText = formatCurrency(num);
                } else if (value === '') {
                    amountCell.innerText = '';
                }
                calculateTotal(table.parentElement);
            }
        });
    });
}

function formatCurrency(value) {
    const formatted = Math.abs(value).toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return value < 0 ? `Rp -${formatted}` : `Rp ${formatted}`;
}

function addRow() {
    const table = getSelectedTable();
    if (table && !table.classList.contains('finance-table')) {
        const row = table.insertRow(-1);
        const cellCount = table.rows[0].cells.length;
        for (let i = 0; i < cellCount; i++) row.insertCell(-1).textContent = 'New Cell';
    }
}

function addColumn() {
    const table = getSelectedTable();
    if (table && !table.classList.contains('finance-table')) {
        Array.from(table.rows).forEach(row => {
            const cell = row.insertCell(-1);
            cell.textContent = row.cells[0].tagName === 'TH' ? 'New Header' : 'New Cell';
        });
    }
}

function deleteRow() {
    const table = getSelectedTable();
    if (table && !table.classList.contains('finance-table') && table.rows.length > 1) {
        const rowIndex = getSelectedRowIndex();
        if (rowIndex !== -1) table.deleteRow(rowIndex);
    }
}

function deleteColumn() {
    const table = getSelectedTable();
    if (table && !table.classList.contains('finance-table') && table.rows[0].cells.length > 1) {
        const colIndex = getSelectedColumnIndex();
        if (colIndex !== -1) Array.from(table.rows).forEach(row => row.deleteCell(colIndex));
    }
}

function getSelectedTable() {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
        let node = selection.getRangeAt(0).commonAncestorContainer;
        while (node && node.tagName !== 'TABLE') node = node.parentElement;
        return node;
    }
    return null;
}

function getSelectedRowIndex() {
    const table = getSelectedTable();
    if (table) {
        const range = window.getSelection().getRangeAt(0);
        let cell = range.commonAncestorContainer;
        while (cell && cell.tagName !== 'TD' && cell.tagName !== 'TH') cell = cell.parentElement;
        if (cell) return Array.from(table.rows).indexOf(cell.parentElement);
    }
    return -1;
}

function getSelectedColumnIndex() {
    const table = getSelectedTable();
    if (table) {
        const range = window.getSelection().getRangeAt(0);
        let cell = range.commonAncestorContainer;
        while (cell && cell.tagName !== 'TD' && cell.tagName !== 'TH') cell = cell.parentElement;
        if (cell) return Array.from(cell.parentElement.cells).indexOf(cell);
    }
    return -1;
}

function toggleTableButtons() {
    const table = getSelectedTable();
    const isRegularTable = table && !table.classList.contains('finance-table');
    
    document.getElementById('addRowBtn').style.display = isRegularTable ? 'inline-block' : 'none';
    document.getElementById('addColBtn').style.display = isRegularTable ? 'inline-block' : 'none';
    document.getElementById('deleteRowBtn').style.display = isRegularTable && table.rows.length > 1 ? 'inline-block' : 'none';
    document.getElementById('deleteColBtn').style.display = isRegularTable && table.rows[0].cells.length > 1 ? 'inline-block' : 'none';
}

function copyFormattedText() {
    const noteContent = document.getElementById('noteContent');
    const range = saveCursorPosition(noteContent);
    if (range) {
        const selectedText = range.cloneContents();
        const span = document.createElement('span');
        span.className = 'copyable';
        span.appendChild(selectedText);
        range.deleteContents();
        range.insertNode(span);
        restoreCursorPosition(range);
    } else {
        alert('Please select some text to make copyable.');
    }
}

function saveNote() {
    const noteTitle = document.getElementById('noteTitle').value.trim();
    const noteContent = document.getElementById('noteContent').innerHTML;
    const category = document.getElementById('categorySelect').value;

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

    if (noteId !== null) notes[noteId] = note;
    else notes.push(note);

    localStorage.setItem('notes', JSON.stringify(notes));
    window.location.href = `index.html?search=${encodeURIComponent(searchQuery)}`;
}

function highlightSearchTerms(element, query) {
    if (!query) return;
    const terms = query.split(/\s+/).filter(term => term.length > 0);
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null, false);
    const nodes = [];
    let node;

    while ((node = walker.nextNode())) nodes.push(node);

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