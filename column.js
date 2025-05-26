// Column Functions
function addNewColumn() {    
    const newColumn = {
        id: generateId(),
        name: 'New Column',
        color: 'color-gradient-1',
        cards: []
    };
    
    currentBoard.columns.push(newColumn);
    saveAllBoards();
    renderColumns();
}

function toggleColumnMenu(event, columnId) {
    event.stopPropagation();
    const menu = document.getElementById(`column-menu-${columnId}`);
    
    // Close all other menus
    document.querySelectorAll('.dropdown-menu').forEach(m => {
        if (m !== menu) m.classList.remove('show');
    });
    
    menu.classList.toggle('show');
}

function openColumnSettings(columnId) {
    currentColumn = currentBoard.columns.find(c => c.id === columnId);
    if (!currentColumn) return;
      
    document.getElementById('column-name').value = currentColumn.name;
    document.getElementById('column-color').value = currentColumn.color || 'color-gradient-1';
    
    // Set selected color in palette
    setSelectedColor('column-color-palette', currentColumn.color || 'color-gradient-1');
    
    openModal('column-modal');
}

function saveColumn(e) {
    e.preventDefault();
    
    if (!currentColumn) return;
      
    currentColumn.name = document.getElementById('column-name').value;
    currentColumn.color = document.getElementById('column-color').value;
    
    saveAllBoards();
    renderColumns();
    closeModal('column-modal');
}

function deleteColumn(columnId) {
    if (confirm('Are you sure you want to delete this column?')) {
        currentBoard.columns = currentBoard.columns.filter(c => c.id !== columnId);
        saveAllBoards();
        renderColumns();
    }
}

function exportColumn(columnId) {
    const column = currentBoard.columns.find(c => c.id === columnId);
    if (!column) return;
    
    const exportData = {
        columnName: column.name,
        cards: column.cards,
        exportDate: new Date().toISOString()
    };
    
    downloadJSON(exportData, `column-${column.name}-${Date.now()}.json`);
}

function importColumnData(columnId) {
    currentColumn = currentBoard.columns.find(c => c.id === columnId);
    if (!currentColumn) return;
    
    document.getElementById('column-import-file').value = '';
    document.getElementById('column-import-preview').style.display = 'none';
    openModal('column-import-modal');
}

function handleColumnImport(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            columnImportData = JSON.parse(e.target.result);
            
            // Show preview
            const preview = document.getElementById('import-preview-content');
            preview.innerHTML = `
                <p><strong>Column Name:</strong> ${columnImportData.columnName || 'N/A'}</p>
                <p><strong>Cards:</strong> ${columnImportData.cards ? columnImportData.cards.length : 0}</p>
                <p><strong>Export Date:</strong> ${columnImportData.exportDate || 'N/A'}</p>
            `;
            
            document.getElementById('column-import-preview').style.display = 'block';
        } catch (error) {
            alert('Error reading file: ' + error.message);
        }
    };
    
    reader.readAsText(file);
}

function confirmColumnImport() {
    if (!columnImportData || !currentColumn) return;
    
    if (columnImportData.cards && Array.isArray(columnImportData.cards)) {
        // Add imported cards to current column
        columnImportData.cards.forEach(card => {
            const newCard = {
                ...card,
                id: generateId() // Generate new ID to avoid conflicts
            };
            currentColumn.cards.push(newCard);
        });
        
        renderColumns();
        closeModal('column-import-modal');
        alert(`Imported ${columnImportData.cards.length} cards successfully!`);
    } else {
        alert('No valid cards found in import file.');
    }
}

function createColumnElement(column, index) {
    const columnEl = document.createElement('div');
    const colorClass = column.color || 'color-gradient-1';
    columnEl.className = `kanban-column ${colorClass}`;
    columnEl.dataset.columnId = column.id;
    columnEl.dataset.columnIndex = index;
    
    columnEl.innerHTML = `
        <div class="column-header" draggable="true" ondragstart="dragColumnStart(event, '${column.id}')" ondragend="dragColumnEnd(event)">
            <div class="column-title">${column.name}</div>
            <div class="column-actions">
                <button class="menu-dots" onclick="toggleColumnMenu(event, '${column.id}')">⋮</button>
                <div class="dropdown-menu" id="column-menu-${column.id}">
                    <div class="dropdown-item" onclick="openColumnSettings('${column.id}')">Settings</div>
                    <div class="dropdown-item" onclick="exportColumn('${column.id}')">Export</div>
                    <div class="dropdown-item" onclick="importColumnData('${column.id}')">Import</div>
                    <div class="dropdown-item" onclick="deleteColumn('${column.id}')">Delete</div>
                </div>
            </div>
        </div>
        <div class="column-content" ondrop="dropCard(event, '${column.id}')" ondragover="allowDrop(event)" ondragleave="dragLeave(event)">
            ${column.cards.map(card => createCardElement(card, column.id)).join('')}
        </div>
        <button class="add-card-btn" onclick="openCardModal('${column.id}')">+ Add Card</button>
    `;
    
    // Add drag over event for column reordering
    columnEl.ondragover = (e) => {
        if (draggedColumn) {
            e.preventDefault();
            const boardContainer = document.getElementById('kanban-board');
            const afterElement = getDragAfterElement(boardContainer, e.clientX);
            if (afterElement == null) {
                boardContainer.insertBefore(draggedColumn, boardContainer.lastElementChild);
            } else {
                boardContainer.insertBefore(draggedColumn, afterElement);
            }
        }
    };
    
    return columnEl;
}


function renderColumns() {
    const boardContainer = document.getElementById('kanban-board');
    boardContainer.innerHTML = '';
    
    // Add existing columns
    currentBoard.columns.forEach((column, index) => {
        const columnEl = createColumnElement(column, index);
        boardContainer.appendChild(columnEl);
    });
    
    // Add "New Column" button
    const addColumnBtn = document.createElement('button');
    addColumnBtn.className = 'btn btn-secondary';
    addColumnBtn.style.minWidth = '200px';
    addColumnBtn.textContent = '+ Add Column';
    addColumnBtn.onclick = addNewColumn;
    boardContainer.appendChild(addColumnBtn);
}