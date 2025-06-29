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

function column_width_changer() {
    // Spaltenbreite live anpassen
    const colWidthSlider = document.getElementById('column-width-slider');
    const colWidthValue = document.getElementById('column-width-value');
    const sidebarSlider = document.getElementById('sidebar-column-width-slider');
    const sidebarValue = document.getElementById('sidebar-width-value');
    
    function setColumnWidth(val) {
        document.documentElement.style.setProperty('--kanban-column-width', val + 'px');
        if(colWidthValue) colWidthValue.textContent = val + 'px';
        if(sidebarValue) sidebarValue.textContent = val + 'px';
        
        // Also update the other slider
        if(colWidthSlider && sidebarSlider) {
            colWidthSlider.value = val;
            sidebarSlider.value = val;
        }
        
        // Apply direct styling for immediate effect
        if (window.updateColumnWidth) {
            window.updateColumnWidth(val);
        } else {
            // Fallback: apply directly
            const columns = document.querySelectorAll('.kanban-column');
            columns.forEach(column => {
                column.style.width = val + 'px';
                column.style.minWidth = val + 'px';
                column.style.maxWidth = val + 'px';
            });
            localStorage.setItem('kanban-column-width', val);
        }
    }
    
    // Initialize with stored value
    const savedWidth = localStorage.getItem('kanban-column-width') || '300';
    setColumnWidth(savedWidth);
    
    if(colWidthSlider) {
        colWidthSlider.addEventListener('input', e => setColumnWidth(e.target.value));
    }
    
    if(sidebarSlider) {
        sidebarSlider.addEventListener('input', e => setColumnWidth(e.target.value));
    }
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
    // if (confirm('Are you sure you want to delete this column?')) {
        currentBoard.columns = currentBoard.columns.filter(c => c.id !== columnId);
        saveAllBoards();
        renderColumns();
        closeModal('column-modal');
    // }
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
        <div class="column-header">
            <div class="column-title">${column.name}</div>
            <div class="column-actions">
                <button class="column-btn column-ai-btn" onclick="openColumnAIModal('${column.id}')" title="AI-Assistent für diese Spalte">🤖</button>
                <button class="column-btn column-delete-btn" onclick="deleteColumn('${column.id}')" title="Spalte löschen">🗑️</button>
                <button class="menu-dots" onclick="openColumnSettings('${column.id}')">⋮</button>
            </div>
        </div>
        <div class="column-content">
            ${column.cards.map(card => createCardElement(card, column.id)).join('')}
        </div>
        <button class="add-card-btn" onclick="openCardModal('${column.id}')">+ Add Card</button>
    `;
    // Drag&Drop-Handler entfernt, SortableJS übernimmt alles
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
    
    // Apply saved column width after rendering
    applyStoredColumnWidth();
}

// Apply stored column width to all columns
function applyStoredColumnWidth() {
    const savedWidth = localStorage.getItem('kanban-column-width') || '300';
    const columns = document.querySelectorAll('.kanban-column');
    
    columns.forEach(column => {
        column.style.width = savedWidth + 'px';
        column.style.minWidth = savedWidth + 'px';
        column.style.maxWidth = savedWidth + 'px';
    });
    
    // Update CSS custom property
    document.documentElement.style.setProperty('--kanban-column-width', savedWidth + 'px');
    
    // Update slider values if they exist
    const mainSlider = document.getElementById('column-width-slider');
    const mainValue = document.getElementById('column-width-value');
    const sidebarSlider = document.getElementById('sidebar-column-width-slider');
    const sidebarValue = document.getElementById('sidebar-width-value');
    
    if (mainSlider) mainSlider.value = savedWidth;
    if (mainValue) mainValue.textContent = savedWidth + 'px';
    if (sidebarSlider) sidebarSlider.value = savedWidth;
    if (sidebarValue) sidebarValue.textContent = savedWidth + 'px';
}

// Nach jedem Render Columns SortableJS initialisieren
const origRenderColumns = typeof renderColumns === 'function' ? renderColumns : null;
window.renderColumns = function() {
    if (origRenderColumns) origRenderColumns();
    if (window.initSortableKanban) window.initSortableKanban();
    if (window.setPassiveTouchListeners) window.setPassiveTouchListeners();
    
    // Apply column width after rendering
    setTimeout(() => applyStoredColumnWidth(), 50);
};