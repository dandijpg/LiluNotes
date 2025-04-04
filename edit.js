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
    document.getElementById('calcBtn').addEventListener('click', insertCalculator);
    document.getElementById('copyFormattedBtn').addEventListener('click', copyFormattedText);
    document.getElementById('saveBtn').addEventListener('click', saveNote);
    document.getElementById('exitBtn').addEventListener('click', () => window.location.href = `index.html?search=${encodeURIComponent(searchQuery)}`);
    document.getElementById('noteContent').addEventListener('click', toggleTableButtons);
    document.getElementById('noteContent').addEventListener('keyup', toggleTableButtons);
    document.getElementById('noteContent').addEventListener('input', handleCalculatorInput);
    document.getElementById('noteContent').addEventListener('keydown', restrictCalculatorInput);

    document.getElementById('noteContent').addEventListener('click', (e) => {
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

function insertCalculator() {
    const calcHtml = `
        <div class="calculator-wrapper">
            <div class="calc-line"><span class="calc-number" contenteditable="true"></span><span class="calc-operator"></span><span class="calc-comment"></span></div>
        </div>`;
    document.execCommand('insertHTML', false, calcHtml);
    const calcWrapper = document.querySelector('.calculator-wrapper:last-child .calc-number');
    const selection = window.getSelection();
    const range = document.createRange();
    range.setStart(calcWrapper, 0);
    range.setEnd(calcWrapper, 0);
    selection.removeAllRanges();
    selection.addRange(range);
}

function handleCalculatorInput(e) {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const container = range.commonAncestorContainer;
        const calcWrapper = container.closest('.calculator-wrapper');
        if (calcWrapper) {
            const lines = calcWrapper.querySelectorAll('.calc-line');
            const firstLine = lines[0];
            const numberSpan = firstLine.querySelector('.calc-number');
            const operatorSpan = firstLine.querySelector('.calc-operator');
            const commentSpan = firstLine.querySelector('.calc-comment');

            // Deteksi input pertama (misalnya "5+")
            const textContent = numberSpan.textContent.trim();
            if (textContent.match(/^\d+\s*\+$/)) {
                const number = textContent.replace('+', '').trim();
                numberSpan.textContent = number;
                operatorSpan.textContent = '          +'; // 10 spasi sebelum +
                addSecondLine(calcWrapper);
                moveCursorToNextLine(calcWrapper.querySelectorAll('.calc-line')[1].querySelector('.calc-number'));
            }

            // Jika ada baris kedua, tangani inputnya
            if (lines.length > 1) {
                const secondLine = lines[1];
                const secondNumberSpan = secondLine.querySelector('.calc-number');
                const secondCommentSpan = secondLine.querySelector('.calc-comment');
                const num1 = parseFloat(numberSpan.textContent) || 0;
                const num2 = parseFloat(secondNumberSpan.textContent) || 0;

                // Tambahkan pembatas dan hasil jika ada angka kedua
                if (!isNaN(num2) && operatorSpan.textContent.includes('+')) {
                    if (lines.length < 4) {
                        addDividerAndResult(calcWrapper);
                    }
                    const resultLine = calcWrapper.querySelectorAll('.calc-line')[3];
                    resultLine.querySelector('.calc-result').textContent = num1 + num2;
                }

                // Tangani komentar di baris kedua
                const secondText = secondLine.textContent.trim();
                const secondNumberText = secondNumberSpan.textContent.trim();
                if (secondText.length > secondNumberText.length) {
                    const comment = secondText.substring(secondNumberText.length).trim();
                    if (comment) {
                        secondCommentSpan.textContent = ` ${comment}`;
                        secondCommentSpan.style.color = 'green';
                    }
                }
            }

            // Tangani komentar di baris pertama
            const firstText = firstLine.textContent.trim();
            const firstNumberText = numberSpan.textContent.trim();
            if (firstText.length > firstNumberText.length + operatorSpan.textContent.length) {
                const comment = firstText.substring(firstNumberText.length + operatorSpan.textContent.length).trim();
                if (comment) {
                    commentSpan.textContent = ` ${comment}`;
                    commentSpan.style.color = 'green';
                }
            }
        }
    }
}

function addSecondLine(calcWrapper) {
    if (calcWrapper.querySelectorAll('.calc-line').length === 1) {
        const secondLine = document.createElement('div');
        secondLine.className = 'calc-line';
        secondLine.innerHTML = '<span class="calc-number" contenteditable="true"></span><span class="calc-comment"></span>';
        calcWrapper.appendChild(secondLine);
    }
}

function addDividerAndResult(calcWrapper) {
    if (calcWrapper.querySelectorAll('.calc-line').length < 4) {
        const dividerLine = document.createElement('div');
        dividerLine.className = 'calc-line calc-divider';
        dividerLine.innerHTML = '<span class="calc-result"><b>----------=</b></span>';
        calcWrapper.appendChild(dividerLine);

        const resultLine = document.createElement('div');
        resultLine.className = 'calc-line';
        resultLine.innerHTML = '<span class="calc-result"></span>';
        calcWrapper.appendChild(resultLine);
    }
}

function moveCursorToNextLine(nextLine) {
    const selection = window.getSelection();
    const range = document.createRange();
    range.setStart(nextLine, 0);
    range.setEnd(nextLine, 0);
    selection.removeAllRanges();
    selection.addRange(range);
}

function restrictCalculatorInput(e) {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const container = range.commonAncestorContainer;
        const calcWrapper = container.closest('.calculator-wrapper');
        if (calcWrapper) {
            const lines = calcWrapper.querySelectorAll('.calc-line');
            const currentLine = container.closest('.calc-line') || lines[0];
            const lineIndex = Array.from(lines).indexOf(currentLine);

            // Batasi input di baris hasil
            if (lineIndex === 3) {
                e.preventDefault();
                return;
            }

            // Batasi enter di dalam kalkulator
            if (e.key === 'Enter') {
                e.preventDefault();
                if (lineIndex === 0 && lines.length > 1) {
                    moveCursorToNextLine(lines[1].querySelector('.calc-number'));
                }
                return;
            }

            // Hanya izinkan angka, spasi, dan '+' di baris pertama
            if (lineIndex === 0 && !/[\d+\s]/.test(e.key) && e.key !== 'Backspace') {
                e.preventDefault();
                return;
            }

            // Hanya izinkan angka dan spasi di baris kedua
            if (lineIndex === 1 && !/[\d\s]/.test(e.key) && e.key !== 'Backspace') {
                e.preventDefault();
                return;
            }
        }
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