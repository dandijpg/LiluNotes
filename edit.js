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
    }

    noteContent.focus();
}

function setupEventListeners() {
    document.getElementById('boldBtn').addEventListener('click', () => document.execCommand('bold', false, null));
    document.getElementById('italicBtn').addEventListener('click', () => document.execCommand('italic', false, null));
    document.getElementById('underlineBtn').addEventListener('click', () => document.execCommand('underline', false, null));
    document.getElementById('highlightBtn').addEventListener('click', toggleHighlight);
    document.getElementById('linkBtn').addEventListener('click', insertLink);
    document.getElementById('numberedListBtn').addEventListener('click', () => document.execCommand('insertOrderedList', false, null));
    document.getElementById('bulletListBtn').addEventListener('click', () => document.execCommand('insertUnorderedList', false, null));
    document.getElementById('arrowListBtn').addEventListener('click', insertArrowList);
    document.getElementById('alignLeftBtn').addEventListener('click', () => document.execCommand('justifyLeft', false, null));
    document.getElementById('alignCenterBtn').addEventListener('click', () => document.execCommand('justifyCenter', false, null));
    document.getElementById('alignRightBtn').addEventListener('click', () => document.execCommand('justifyRight', false, null));
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
    document.getElementById('noteContent').addEventListener('click', toggleTableButtons);
    document.getElementById('noteContent').addEventListener('keyup', toggleTableButtons);
    document.getElementById('noteContent').addEventListener('input', checkAmountInput);
    document.getElementById('noteContent').addEventListener('focusout', updateFinancialTable);
}

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
    document.execCommand('insertHTML', false, tableHtml);
    toggleTableButtons();
}

function insertFinancialTable() {
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

    const wrapper = document.querySelector('.finance-table-wrapper:last-child');
    const table = wrapper.querySelector('.finance-table');
    wrapper.querySelector('.add-income').addEventListener('click', () => addFinanceRow(wrapper, '+'));
    wrapper.querySelector('.subtract-expense').addEventListener('click', () => addFinanceRow(wrapper, '-'));
    wrapper.querySelector('.multiply').addEventListener('click', () => addFinanceRow(wrapper, '*'));
    wrapper.querySelector('.divide').addEventListener('click', () => addFinanceRow(wrapper, '/'));
    wrapper.querySelector('.calculate').addEventListener('click', () => calculateTotal(wrapper));
    wrapper.querySelector('.delete-last-row').addEventListener('click', () => deleteLastRow(wrapper));
    table.addEventListener('focusin', () => toggleFinanceButtons(wrapper, true));
    table.addEventListener('focusout', () => toggleFinanceButtons(wrapper, false));
    wrapper.querySelector('.amount').focus();
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
    toggleFinanceButtons(wrapper, true);
}

function deleteLastRow(wrapper) {
    const tbody = wrapper.querySelector('tbody');
    const rows = tbody.querySelectorAll('tr');
    if (rows.length > 1) {
        tbody.removeChild(rows[rows.length - 1]);
        calculateTotal(wrapper);
    }
}

function toggleFinanceButtons(wrapper, show) {
    const btnGroup = wrapper.querySelector('.finance-btn-group');
    btnGroup.style.display = show ? 'flex' : 'none';
}

function checkAmountInput(event) {
    const target = event.target;
    if (target.classList.contains('amount')) {
        const value = target.innerText.trim();
        const isValid = /^-?[0-9]*$/.test(value.replace(/[^0-9-]/g, '')) && value !== '';
        const existingWarning = target.nextElementSibling && target.nextElementSibling.classList.contains('warning');

        if (!isValid && value !== '' && !existingWarning) {
            const warning = document.createElement('span');
            warning.className = 'warning';
            warning.innerHTML = '⚠️';
            warning.title = 'Only numbers are supported';
            target.parentElement.appendChild(warning);
        } else if (isValid || value === '') {
            if (existingWarning) {
                target.parentElement.removeChild(existingWarning);
            }
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
        let value = amountCell.innerText.trim();

        // Hapus semua karakter non-numerik kecuali tanda minus
        value = value.replace(/[^0-9-]/g, '');
        const num = parseFloat(value) || 0;

        const operation = row.dataset.operation;
        if (index === 0) {
            total = num;
        } else {
            switch (operation) {
                case '+':
                    total += num;
                    break;
                case '-':
                    total -= num;
                    break;
                case '*':
                    total *= num;
                    break;
                case '/':
                    total = num !== 0 ? total / num : total;
                    break;
            }
        }
    });

    const totalCell = table.querySelector('.total');
    totalCell.innerText = mode === 'financial' ? formatCurrency(total) : total.toFixed(2);
}

function updateFinancialTable(event) {
    const financeTables = document.querySelectorAll('.finance-table');
    financeTables.forEach(table => {
        const mode = table.dataset.mode;
        const rows = table.querySelectorAll('tbody tr');

        rows.forEach(row => {
            const amountCell = row.querySelector('.amount');
            if (event && event.target === amountCell) {
                let value = amountCell.innerText.trim();
                value = value.replace(/[^0-9-]/g, ''); // Hanya simpan angka dan tanda minus
                const num = parseFloat(value) || 0;
                if (mode === 'financial' && value !== '') {
                    amountCell.innerText = formatCurrency(num);
                } else if (value === '') {
                    amountCell.innerText = '';
                }
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
        if (rowIndex !== -1) {
            table.deleteRow(rowIndex);
            calculateTotal(table.closest('.finance-table-wrapper'));
        }
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
    document.getElementById('addRowBtn').style.display = table ? 'inline-block' : 'none';
    document.getElementById('addColBtn').style.display = table ? 'inline-block' : 'none';
    document.getElementById('deleteRowBtn').style.display = table && table.rows.length > 1 ? 'inline-block' : 'none';
    document.getElementById('deleteColBtn').style.display = table && table.rows[0].cells.length > 1 ? 'inline-block' : 'none';
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

    if (noteId !== null) {
        notes[noteId] = note;
    } else {
        notes.push(note);
    }

    localStorage.setItem('notes', JSON.stringify(notes));
    window.location.href = `index.html?search=${encodeURIComponent(searchQuery)}`;
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