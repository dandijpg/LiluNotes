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

function saveCursorPosition(element) {
    const selection = window.getSelection();
    if (selection.rangeCount > 0 && element.contains(selection.anchorNode)) {
        return selection.getRangeAt(0);
    }
    return null;
}

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
    document.getElementById('addIncomeBtn').addEventListener('click', () => addFinanceRow(getSelectedFinanceTableWrapper(), '+'));
    document.getElementById('subtractExpenseBtn').addEventListener('click', () => addFinanceRow(getSelectedFinanceTableWrapper(), '-'));
    document.getElementById('multiplyBtn').addEventListener('click', () => addFinanceRow(getSelectedFinanceTableWrapper(), '*'));
    document.getElementById('divideBtn').addEventListener('click', () => addFinanceRow(getSelectedFinanceTableWrapper(), '/'));
    document.getElementById('calculateBtn').addEventListener('click', () => calculateTotal(getSelectedFinanceTableWrapper()));
    document.getElementById('deleteLastRowBtn').addEventListener('click', () => deleteLastRow(getSelectedFinanceTableWrapper()));
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
        const selectedNode = range.commonAncestorContainer;
        const parentElement = selectedNode.nodeType === 3 ? selectedNode.parentElement : selectedNode;

        if (parentElement.classList && parentElement.classList.contains('done')) {
            const textNode = document.createTextNode(parentElement.textContent);
            parentElement.parentNode.replaceChild(textNode, parentElement);
            const newRange = document.createRange();
            newRange.setStart(textNode, 0);
            newRange.setEnd(textNode, textNode.length);
            restoreCursorPosition(newRange);
        } else {
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
        </div>`;
    document.execCommand('insertHTML', false, financeHtml);
    restoreCursorPosition(range);
    toggleFinanceButtons();
}

function addFinanceRow(wrapper, operation) {
    if (!wrapper) return;
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
    if (!wrapper) return;
    const table = wrapper.querySelector('.finance-table');
    const tbody = table.querySelector('tbody');
    const rows = tbody.querySelectorAll('tr');
    if (rows.length > 0) {
        tbody.removeChild(rows[rows.length - 1]);
        if (rows.length === 1) {
            wrapper.parentNode.removeChild(wrapper);
        } else {
            calculateTotal(wrapper);
        }
    }
}

function handleTableClick(event) {
    const noteContent = document.getElementById('noteContent');
    const wrapper = event.target.closest('.finance-table-wrapper');
    const table = event.target.closest('.regular-table') || event.target.closest('.finance-table');

    if (!wrapper && !table) {
        const range = document.createRange();
        const selection = window.getSelection();
        const target = event.target;

        if (target === noteContent || !noteContent.contains(target)) {
            range.selectNodeContents(noteContent);
            range.collapse(false);
            selection.removeAllRanges();
            selection.addRange(range);
        }
    }

    toggleTableButtons();
    toggleFinanceButtons();
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
    if (!wrapper) return;
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

function getSelectedFinanceTableWrapper() {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
        let node = selection.getRangeAt(0).commonAncestorContainer;
        while (node && !node.classList?.contains('finance-table-wrapper')) node = node.parentElement;
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
    document.getElementById('deleteRowBtn').style.display = isRegularTable ? 'inline-block' : 'none';
    document.getElementById('deleteColBtn').style.display = isRegularTable ? 'inline-block' : 'none';
}

function toggleFinanceButtons() {
    const wrapper = getSelectedFinanceTableWrapper();
    const isFinanceTable = !!wrapper;
    
    document.getElementById('addIncomeBtn').style.display = isFinanceTable ? 'inline-block' : 'none';
    document.getElementById('subtractExpenseBtn').style.display = isFinanceTable ? 'inline-block' : 'none';
    document.getElementById('multiplyBtn').style.display = isFinanceTable ? 'inline-block' : 'none';
    document.getElementById('divideBtn').style.display = isFinanceTable ? 'inline-block' : 'none';
    document.getElementById('calculateBtn').style.display = isFinanceTable ? 'inline-block' : 'none';
    document.getElementById('deleteLastRowBtn').style.display = isFinanceTable ? 'inline-block' : 'none';
}

function copyFormattedText() {
    const noteContent = document.getElementById('noteContent');
    const range = document.createRange();
    range.selectNodeContents(noteContent);
    const selection = window.getSelection();
    selection.removeAllRanges();
    selection.addRange(range);
    document.execCommand('copy');
    selection.removeAllRanges();
    alert('Formatted text copied to clipboard!');
}

function saveNote() {
    const noteTitle = document.getElementById('noteTitle').value.trim();
    const noteContent = document.getElementById('noteContent').innerHTML;
    const category = document.getElementById('categorySelect').value;

    if (!noteTitle) {
        alert('Please enter a title for your note.');
        return;
    }

    const note = {
        title: noteTitle,
        content: noteContent,
        category: category,
        timestamp: new Date().toISOString(),
        pinned: noteId !== null ? notes[noteId]?.pinned || false : false
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

    const regex = new RegExp(`(${query.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')})`, 'gi');
    const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, null, false);
    const nodesToReplace = [];

    while (walker.nextNode()) {
        const node = walker.currentNode;
        if (regex.test(node.nodeValue) && !node.parentElement.closest('th, td.total')) {
            nodesToReplace.push(node);
        }
    }

    nodesToReplace.forEach(node => {
        const span = document.createElement('span');
        span.innerHTML = node.nodeValue.replace(regex, '<mark>$1</mark>');
        node.parentNode.replaceChild(span, node);
    });
}

document.addEventListener('keydown', (e) => {
    if (e.ctrlKey) {
        switch (e.key) {
            case 'b': e.preventDefault(); document.getElementById('boldBtn').click(); break;
            case 'i': e.preventDefault(); document.getElementById('italicBtn').click(); break;
            case 'u': e.preventDefault(); document.getElementById('underlineBtn').click(); break;
            case 's': e.preventDefault(); saveNote(); break;
        }
    }
});