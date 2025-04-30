// edit.js

let notes = JSON.parse(localStorage.getItem('notes') || '[]');
let categories = JSON.parse(localStorage.getItem('categories') || '[]');
const urlParams = new URLSearchParams(window.location.search);
const noteId = urlParams.get('id');
const searchQuery = urlParams.get('search') || '';
let calcMode = 'financial'; // Mode default

const history = [];
let historyIndex = -1;
const redoStack = [];

document.addEventListener('DOMContentLoaded', () => {
    setupCategorySelect();
    setupEditor();
    setupEventListeners();
    initializeHistory();
});

function initializeHistory() {
    const noteContent = document.getElementById('noteContent');
    saveContentToHistory(noteContent.innerHTML);
}

function saveContentToHistory(content) {
    history.length = historyIndex + 1; // Remove future history
    history.push(content);
    historyIndex++;
    redoStack.length = 0; // Clear redo stack on new action
    updateUndoRedoButtons();
}

function undo() {
    if (historyIndex > 0) {
        redoStack.push(history[historyIndex]);
        historyIndex--;
        const noteContent = document.getElementById('noteContent');
        noteContent.innerHTML = history[historyIndex];
        updateUndoRedoButtons();
    }
}

function redo() {
    if (redoStack.length > 0) {
        historyIndex++;
        history[historyIndex] = redoStack.pop();
        const noteContent = document.getElementById('noteContent');
        noteContent.innerHTML = history[historyIndex];
        updateUndoRedoButtons();
    }
}

function updateUndoRedoButtons() {
    const undoBtn = document.getElementById('undoBtn');
    const redoBtn = document.getElementById('redoBtn');
    if (undoBtn) undoBtn.disabled = historyIndex <= 0;
    if (redoBtn) redoBtn.disabled = redoStack.length === 0;
}

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
        saveContentToHistory(noteContent.innerHTML);
    };

    document.getElementById('boldBtn').addEventListener('click', () => applyCommand('bold'));
    document.getElementById('italicBtn').addEventListener('click', () => applyCommand('italic'));
    document.getElementById('underlineBtn').addEventListener('click', () => applyCommand('underline'));
    document.getElementById('markDoneBtn').addEventListener('click', markAsDone);
    document.getElementById('linkBtn').addEventListener('click', insertLink);
    document.getElementById('imageBtn').addEventListener('click', importImage);
    document.getElementById('numberedListBtn').addEventListener('click', insertNumberedList);
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
    document.getElementById('copyFormattedBtn').addEventListener('click', makeTextCopyable);
    document.getElementById('tabBtn').addEventListener('click', insertTab);
    document.getElementById('saveBtn').addEventListener('click', saveNote);
    document.getElementById('exitBtn').addEventListener('click', () => window.location.href = `index.html?search=${encodeURIComponent(searchQuery)}`);
    noteContent.addEventListener('click', handleTableClick);
    noteContent.addEventListener('input', checkAmountInput);
    noteContent.addEventListener('focusout', updateFinancialTable);
    noteContent.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') {
            e.preventDefault();
            insertTab(e.shiftKey);
        } else if (e.key === 'Enter') {
            handleEnterKey(e);
        } else if (e.ctrlKey && e.shiftKey && e.key === '7') {
            e.preventDefault();
            insertNumberedList();
        }
    });
    noteContent.addEventListener('input', () => saveContentToHistory(noteContent.innerHTML));

    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey) {
            switch (e.key) {
                case 'b': e.preventDefault(); document.getElementById('boldBtn').click(); break;
                case 'i': e.preventDefault(); document.getElementById('italicBtn').click(); break;
                case 'u': e.preventDefault(); document.getElementById('underlineBtn').click(); break;
                case 's': e.preventDefault(); saveNote(); break;
                case 'z': e.preventDefault(); undo(); break;
                case 'y': e.preventDefault(); redo(); break;
            }
        }
    });

    const foldButton = document.getElementById('foldToolbarBtn');
    const toolbarContent = document.getElementById('toolbarContent');
    if (foldButton && toolbarContent) {
        foldButton.addEventListener('click', () => {
            toolbarContent.classList.toggle('folded');
        });
    }

    const undoBtn = document.getElementById('undoBtn');
    const redoBtn = document.getElementById('redoBtn');
    if (undoBtn) undoBtn.addEventListener('click', undo);
    if (redoBtn) redoBtn.addEventListener('click', redo);
    updateUndoRedoButtons();
}

function insertTab(isShift = false) {
    const noteContent = document.getElementById('noteContent');
    const range = saveCursorPosition(noteContent);
    if (!range) return;

    const selectedNode = range.commonAncestorContainer;
    const parentLi = selectedNode.nodeType === Node.TEXT_NODE ? selectedNode.parentElement.closest('li') : selectedNode.closest('li');

    if (parentLi && parentLi.parentElement.tagName === 'OL') {
        let currentIndent = parseInt(parentLi.dataset.indent || '0');
        if (isShift) {
            if (currentIndent > 0) {
                currentIndent--;
                if (currentIndent === 0) {
                    parentLi.removeAttribute('data-indent');
                } else {
                    parentLi.setAttribute('data-indent', currentIndent);
                }
            }
        } else {
            if (currentIndent < 3) {
                currentIndent++;
                parentLi.setAttribute('data-indent', currentIndent);
            }
        }
        const newRange = document.createRange();
        newRange.selectNodeContents(parentLi);
        newRange.collapse(false);
        restoreCursorPosition(newRange);
        saveContentToHistory(noteContent.innerHTML);
    } else {
        const tabNode = document.createTextNode('\u00A0\u00A0\u00A0\u00A0');
        range.deleteContents();
        range.insertNode(tabNode);
        const newRange = document.createRange();
        newRange.setStartAfter(tabNode);
        newRange.setEndAfter(tabNode);
        restoreCursorPosition(newRange);
        saveContentToHistory(noteContent.innerHTML);
    }
}

function handleEnterKey(e) {
    const noteContent = document.getElementById('noteContent');
    const selection = window.getSelection();
    if (!selection.rangeCount) return;

    const range = selection.getRangeAt(0);
    let selectedNode = range.commonAncestorContainer;
    if (selectedNode.nodeType === Node.TEXT_NODE) {
        selectedNode = selectedNode.parentElement;
    }
    const parentLi = selectedNode.closest('li');

    if (parentLi && parentLi.parentElement.tagName === 'OL') {
        e.preventDefault();
        const ol = parentLi.parentElement;
        const isEmpty = parentLi.innerText.trim() === '' && !parentLi.querySelector('img, table, div');

        if (isEmpty) {
            const p = document.createElement('p');
            p.innerHTML = '<br>';
            if (ol.nextSibling) {
                ol.parentNode.insertBefore(p, ol.nextSibling);
            } else {
                ol.parentNode.appendChild(p);
            }
            ol.removeChild(parentLi);
            if (ol.children.length === 0) {
                ol.parentNode.removeChild(ol);
            }
            const newRange = document.createRange();
            newRange.setStart(p, 0);
            newRange.setEnd(p, 0);
            selection.removeAllRanges();
            selection.addRange(newRange);
            noteContent.focus();
        } else {
            const newLi = document.createElement('li');
            const currentIndent = parentLi.dataset.indent || '0';
            if (currentIndent !== '0') {
                newLi.setAttribute('data-indent', currentIndent);
            }
            if (parentLi.nextSibling) {
                ol.insertBefore(newLi, parentLi.nextSibling);
            } else {
                ol.appendChild(newLi);
            }
            newLi.innerHTML = '<br>';
            const newRange = document.createRange();
            newRange.selectNodeContents(newLi);
            newRange.collapse(true);
            selection.removeAllRanges();
            selection.addRange(newRange);
            noteContent.focus();
        }
        saveContentToHistory(noteContent.innerHTML);
    }
}

function insertNumberedList() {
    const noteContent = document.getElementById('noteContent');
    const range = saveCursorPosition(noteContent);
    if (!range) return;

    const selectedNode = range.commonAncestorContainer;
    const parentLi = selectedNode.nodeType === Node.TEXT_NODE ? selectedNode.parentElement.closest('li') : selectedNode.closest('li');
    const parentOl = parentLi ? parentLi.parentElement : null;

    if (parentOl && parentOl.tagName === 'OL') {
        const p = document.createElement('p');
        p.innerHTML = parentLi.innerText || '<br>';
        if (parentOl.nextSibling) {
            parentOl.parentNode.insertBefore(p, parentOl.nextSibling);
        } else {
            parentOl.parentNode.appendChild(p);
        }
        parentOl.removeChild(parentLi);
        if (parentOl.children.length === 0) {
            parentOl.parentNode.removeChild(parentOl);
        }
        const newRange = document.createRange();
        newRange.selectNodeContents(p);
        newRange.collapse(true);
        restoreCursorPosition(newRange);
        noteContent.focus();
    } else {
        const ol = document.createElement('ol');
        ol.className = 'custom-numbered';
        const li = document.createElement('li');
        li.innerHTML = '<br>';
        ol.appendChild(li);
        range.deleteContents();
        range.insertNode(ol);
        const p = document.createElement('p');
        p.innerHTML = '<br>';
        if (ol.nextSibling) {
            ol.parentNode.insertBefore(p, ol.nextSibling);
        } else {
            ol.parentNode.appendChild(p);
        }
        const newRange = document.createRange();
        newRange.selectNodeContents(li);
        newRange.collapse(true);
        restoreCursorPosition(newRange);
        noteContent.focus();
    }
    saveContentToHistory(noteContent.innerHTML);
}

function importImage() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                alert('Ukuran gambar terlalu besar. Maksimum 2MB.');
                return;
            }

            const reader = new FileReader();
            reader.onload = (event) => {
                const container = document.createElement('div');
                container.style.textAlign = 'center';

                const img = document.createElement('img');
                img.classList.add('loading');
                img.src = event.target.result;

                img.onload = () => {
                    img.classList.remove('loading');
                };

                const captionText = prompt('Masukkan keterangan gambar (kosongkan jika tidak perlu):') || '';
                if (captionText) {
                    const caption = document.createElement('div');
                    caption.className = 'image-caption';
                    caption.textContent = captionText;
                    container.appendChild(img);
                    container.appendChild(caption);
                } else {
                    container.appendChild(img);
                }

                const noteContent = document.getElementById('noteContent');
                const range = saveCursorPosition(noteContent);
                if (range) {
                    range.deleteContents();
                    range.insertNode(container);
                    const newRange = document.createRange();
                    newRange.setStartAfter(container);
                    newRange.setEndAfter(container);
                    restoreCursorPosition(newRange);
                } else {
                    noteContent.appendChild(container);
                }

                img.addEventListener('click', () => openImageModal(event.target.result));
                saveContentToHistory(noteContent.innerHTML);
            };
            reader.readAsDataURL(file);
        }
    };
    input.click();
}

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

    modal.querySelector('.close-btn').onclick = () => closeImageModal(modal);
    modal.onclick = (e) => {
        if (e.target === modal) closeImageModal(modal);
    };
}

function closeImageModal(modal) {
    modal.classList.remove('active');
    setTimeout(() => {
        modal.style.display = 'none';
    }, 300);
}

function markAsDone() {
    const noteContent = document.getElementById('noteContent');
    const range = saveCursorPosition(noteContent);
    if (range) {
        const selectedNode = range.commonAncestorContainer;
        const parentElement = selectedNode.nodeType === Node.TEXT_NODE ? selectedNode.parentElement : selectedNode;

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
                const newRange = document.createRange();
                newRange.setStartAfter(span);
                newRange.setEndAfter(span);
                restoreCursorPosition(newRange);
            }
        }
        saveContentToHistory(noteContent.innerHTML);
    }
}

function insertLink() {
    const noteContent = document.getElementById('noteContent');
    const range = saveCursorPosition(noteContent);
    const url = prompt('Masukkan URL:');
    if (url && range) {
        const selectedText = range.toString();
        const a = document.createElement('a');
        a.href = url;
        a.target = '_blank';
        a.textContent = selectedText || url;
        a.className = 'copyable';
        range.deleteContents();
        range.insertNode(a);
        const newRange = document.createRange();
        newRange.setStartAfter(a);
        newRange.setEndAfter(a);
        restoreCursorPosition(newRange);
        saveContentToHistory(noteContent.innerHTML);
    }
}

function insertArrowList() {
    const noteContent = document.getElementById('noteContent');
    const range = saveCursorPosition(noteContent);
    if (range) {
        const ul = document.createElement('ul');
        ul.style.listStyleType = '"➜ "';
        const li = document.createElement('li');
        li.innerHTML = '<br>';
        ul.appendChild(li);
        range.deleteContents();
        range.insertNode(ul);
        const newRange = document.createRange();
        newRange.selectNodeContents(li);
        newRange.collapse(true);
        restoreCursorPosition(newRange);
        noteContent.focus();
        saveContentToHistory(noteContent.innerHTML);
    }
}

function applyFloat(direction) {
    const noteContent = document.getElementById('noteContent');
    const range = saveCursorPosition(noteContent);
    if (range) {
        const selectedNode = range.commonAncestorContainer;
        const parentElement = selectedNode.nodeType === Node.TEXT_NODE ? selectedNode.parentElement : selectedNode;
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
            saveContentToHistory(noteContent.innerHTML);
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
    const newRange = document.createRange();
    newRange.setStartAfter(noteContent.querySelector('.table-wrapper:last-child'));
    newRange.setEndAfter(noteContent.querySelector('.table-wrapper:last-child'));
    restoreCursorPosition(newRange);
    toggleTableButtons();
    saveContentToHistory(noteContent.innerHTML);
}

function insertFinancialTable() {
    const noteContent = document.getElementById('noteContent');
    const range = saveCursorPosition(noteContent);
    const financeHtml = `
        <div class="finance-table-wrapper">
            <table class="finance-table" data-mode="${calcMode}">
                <thead>
                    <tr>
                        <th contenteditable="false">Deskripsi</th>
                        <th contenteditable="false">Jumlah</th>
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
    const newRange = document.createRange();
    newRange.setStartAfter(noteContent.querySelector('.finance-table-wrapper:last-child'));
    newRange.setEndAfter(noteContent.querySelector('.finance-table-wrapper:last-child'));
    restoreCursorPosition(newRange);
    toggleFinanceButtons();
    saveContentToHistory(noteContent.innerHTML);
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
    saveContentToHistory(noteContent.innerHTML);
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
        saveContentToHistory(noteContent.innerHTML);
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
            warning.title = 'Hanya angka yang didukung';
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
        for (let i = 0; i < cellCount; i++) row.insertCell(-1).textContent = 'Sel Baru';
        saveContentToHistory(noteContent.innerHTML);
    }
}

function addColumn() {
    const table = getSelectedTable();
    if (table && !table.classList.contains('finance-table')) {
        Array.from(table.rows).forEach(row => {
            const cell = row.insertCell(-1);
            cell.textContent = row.cells[0].tagName === 'TH' ? 'Header Baru' : 'Sel Baru';
        });
        saveContentToHistory(noteContent.innerHTML);
    }
}

function deleteRow() {
    const table = getSelectedTable();
    if (table && !table.classList.contains('finance-table') && table.rows.length > 1) {
        const rowIndex = getSelectedRowIndex();
        if (rowIndex !== -1) table.deleteRow(rowIndex);
        saveContentToHistory(noteContent.innerHTML);
    }
}

function deleteColumn() {
    const table = getSelectedTable();
    if (table && !table.classList.contains('finance-table') && table.rows[0].cells.length > 1) {
        const colIndex = getSelectedColumnIndex();
        if (colIndex !== -1) Array.from(table.rows).forEach(row => row.deleteCell(colIndex));
        saveContentToHistory(noteContent.innerHTML);
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

function makeTextCopyable() {
    const noteContent = document.getElementById('noteContent');
    const range = window.getSelection().getRangeAt(0);

    if (range && !range.collapsed) {
        const selectedText = range.extractContents();
        const span = document.createElement('span');
        span.className = 'copyable';
        span.appendChild(selectedText);
        range.insertNode(span);

        // Remove selection
        window.getSelection().removeAllRanges();

        // Add event listener for the new span (event delegation)
        noteContent.addEventListener('click', handleCopyableClick);
        saveContentToHistory(noteContent.innerHTML);
    } else {
        alert('Pilih teks yang ingin dijadikan dapat disalin.');
    }
}

function handleCopyableClick(event) {
    if (event.target.classList.contains('copyable')) {
        const text = event.target.innerText;
        navigator.clipboard.writeText(text).then(() => {
            alert(`Teks "${text}" telah disalin!`);
        }).catch(err => {
            console.error('Gagal menyalin teks: ', err);
        });
    }
}

function saveNote() {
    const noteTitle = document.getElementById('noteTitle').value.trim();
    const noteContent = document.getElementById('noteContent').innerHTML;
    const category = document.getElementById('categorySelect').value;

    if (!noteTitle) {
        alert('Silakan masukkan judul untuk catatan Anda.');
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
