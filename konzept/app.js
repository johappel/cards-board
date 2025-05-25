// Data Storage (in-memory only, no localStorage in sandbox)
let boards = [];
let currentBoard = null;
let currentColumn = null;
let currentCard = null;
let draggedCard = null;
let draggedColumn = null;
let columnImportData = null;

// Initialize Application
document.addEventListener('DOMContentLoaded', function() {
    initializeBoards();
    renderDashboard();
    setupEventListeners();
});

// Setup Event Listeners
function setupEventListeners() {
    // Form submissions
    document.getElementById('card-form').addEventListener('submit', saveCard);
    document.getElementById('column-form').addEventListener('submit', saveColumn);
    document.getElementById('board-settings-form').addEventListener('submit', saveBoardSettings);
    document.getElementById('new-board-form').addEventListener('submit', createNewBoard);

    // Close modals on outside click
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeModal(modal.id);
            }
        });
    });

    // Close dropdowns on outside click
    document.addEventListener('click', function(e) {
        if (!e.target.matches('.menu-dots')) {
            document.querySelectorAll('.dropdown-menu').forEach(menu => {
                menu.classList.remove('show');
            });
        }
    });
}

// Initialize default boards
function initializeBoards() {
    // Create default board
    boards = [{
        id: generateId(),
        name: 'My First Board',
        description: 'Welcome to your first Kanban board!',
        authors: ['User'],
        summary: '',
        backgroundColor: '#f5f7fa',
        customStyle: '',
        columns: [
            { id: generateId(), name: 'To Do', color: '#e9ecef', customStyle: '', cards: [] },
            { id: generateId(), name: 'In Progress', color: '#e9ecef', customStyle: '', cards: [] },
            { id: generateId(), name: 'Done', color: '#e9ecef', customStyle: '', cards: [] }
        ],
        aiConfig: {
            provider: '',
            apiKey: '',
            model: '',
            baseUrl: ''
        }
    }];
}

// Dashboard Functions
function renderDashboard() {
    const grid = document.getElementById('boards-grid');
    grid.innerHTML = '';

    boards.forEach(board => {
        const boardCard = createBoardCard(board);
        grid.appendChild(boardCard);
    });

    // Add "Create New Board" card
    const addCard = document.createElement('div');
    addCard.className = 'board-card add-board-card';
    addCard.innerHTML = '<button class="add-board-btn" onclick="openNewBoardModal()">+</button>';
    grid.appendChild(addCard);
}

function createBoardCard(board) {
    const card = document.createElement('div');
    card.className = 'board-card';
    
    const totalCards = board.columns.reduce((sum, col) => sum + col.cards.length, 0);
    
    card.innerHTML = `
        <div class="board-card-actions">
            <button class="board-delete-btn" onclick="deleteBoardFromDashboard(event, '${board.id}')" title="Delete Board">🗑️</button>
        </div>
        <h3>${board.name}</h3>
        <p>${board.description || 'No description'}</p>
        <p style="margin-top: 0.5rem; font-size: 0.8rem; color: #95a5a6;">
            ${board.columns.length} columns • ${totalCards} cards
        </p>
    `;
    
    card.onclick = (e) => {
        if (!e.target.classList.contains('board-delete-btn')) {
            openBoard(board.id);
        }
    };
    
    return card;
}

function deleteBoardFromDashboard(event, boardId) {
    event.stopPropagation();
    if (confirm('Are you sure you want to delete this board? This action cannot be undone.')) {
        boards = boards.filter(b => b.id !== boardId);
        renderDashboard();
    }
}

function openNewBoardModal() {
    document.getElementById('new-board-name').value = '';
    document.getElementById('new-board-description').value = '';
    openModal('new-board-modal');
}

function createNewBoard(e) {
    e.preventDefault();
    
    const newBoard = {
        id: generateId(),
        name: document.getElementById('new-board-name').value,
        description: document.getElementById('new-board-description').value,
        authors: ['User'],
        summary: '',
        backgroundColor: '#f5f7fa',
        customStyle: '',
        columns: [
            { id: generateId(), name: 'To Do', color: '#e9ecef', customStyle: '', cards: [] },
            { id: generateId(), name: 'In Progress', color: '#e9ecef', customStyle: '', cards: [] },
            { id: generateId(), name: 'Done', color: '#e9ecef', customStyle: '', cards: [] }
        ],
        aiConfig: {
            provider: '',
            apiKey: '',
            model: '',
            baseUrl: ''
        }
    };
    
    boards.push(newBoard);
    renderDashboard();
    closeModal('new-board-modal');
}

// Board View Functions
function openBoard(boardId) {
    currentBoard = boards.find(b => b.id === boardId);
    if (!currentBoard) return;

    document.getElementById('dashboard').style.display = 'none';
    document.getElementById('board-view').style.display = 'flex';
    
    updateBoardView();
    renderColumns();
}

function updateBoardView() {
    document.getElementById('board-title').textContent = currentBoard.name;
    document.getElementById('board-authors').textContent = 'Authors: ' + currentBoard.authors.join(', ');
    document.getElementById('board-summary').textContent = currentBoard.summary || 'No summary yet...';
    
    // Apply custom styles
    const boardView = document.getElementById('board-view');
    boardView.style.backgroundColor = currentBoard.backgroundColor;
    if (currentBoard.customStyle) {
        applyCustomStyle('board-custom-style', currentBoard.customStyle);
    }
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

function createColumnElement(column, index) {
    const columnEl = document.createElement('div');
    columnEl.className = 'kanban-column';
    columnEl.dataset.columnId = column.id;
    columnEl.dataset.columnIndex = index;
    columnEl.style.backgroundColor = column.color;
    
    if (column.customStyle) {
        columnEl.style.cssText += column.customStyle;
    }
    
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

function createCardElement(card, columnId) {
    const isInactive = card.inactive ? 'inactive' : '';
    const cardStyle = card.color ? `background-color: ${card.color};` : '';
    const customStyle = card.customStyle || '';
    
    return `
        <div class="kanban-card ${isInactive}" 
             draggable="true" 
             ondragstart="dragStart(event, '${card.id}')"
             ondragend="dragEnd(event)"
             data-card-id="${card.id}"
             style="${cardStyle} ${customStyle}">
            <div class="card-header">
                <div class="card-title">${card.heading}</div>
                <div class="card-actions">
                    <button class="card-btn" onclick="toggleCardVisibility('${card.id}', '${columnId}')">
                        ${card.inactive ? '👁️‍🗨️' : '👁️'}
                    </button>
                    <button class="card-btn" onclick="openCardModal('${columnId}', '${card.id}')">⋮</button>
                </div>
            </div>
            <div class="card-content">${card.content}</div>
            ${card.comments ? `<div class="card-comments">💬 ${card.comments}</div>` : ''}
        </div>
    `;
}

// Column Functions
function addNewColumn() {
    const newColumn = {
        id: generateId(),
        name: 'New Column',
        color: '#e9ecef',
        customStyle: '',
        cards: []
    };
    
    currentBoard.columns.push(newColumn);
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
    document.getElementById('column-color').value = currentColumn.color;
    document.getElementById('column-custom-style').value = currentColumn.customStyle || '';
    
    openModal('column-modal');
}

function saveColumn(e) {
    e.preventDefault();
    
    if (!currentColumn) return;
    
    currentColumn.name = document.getElementById('column-name').value;
    currentColumn.color = document.getElementById('column-color').value;
    currentColumn.customStyle = document.getElementById('column-custom-style').value;
    
    renderColumns();
    closeModal('column-modal');
}

function deleteColumn(columnId) {
    if (confirm('Are you sure you want to delete this column?')) {
        currentBoard.columns = currentBoard.columns.filter(c => c.id !== columnId);
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

// Column Drag and Drop
function dragColumnStart(event, columnId) {
    draggedColumn = event.target.closest('.kanban-column');
    draggedColumn.classList.add('dragging');
}

function dragColumnEnd(event) {
    if (draggedColumn) {
        draggedColumn.classList.remove('dragging');
        
        // Update column order in data
        const newOrder = [];
        document.querySelectorAll('.kanban-column').forEach(col => {
            const colId = col.dataset.columnId;
            const column = currentBoard.columns.find(c => c.id === colId);
            if (column) newOrder.push(column);
        });
        
        currentBoard.columns = newOrder;
        draggedColumn = null;
    }
}

function getDragAfterElement(container, x) {
    const draggableElements = [...container.querySelectorAll('.kanban-column:not(.dragging)')];
    
    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = x - box.left - box.width / 2;
        
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

// Card Functions
function openCardModal(columnId, cardId = null) {
    currentColumn = currentBoard.columns.find(c => c.id === columnId);
    
    if (cardId) {
        currentCard = currentColumn.cards.find(c => c.id === cardId);
        document.getElementById('modal-title').textContent = 'Edit Card';
        document.getElementById('card-heading').value = currentCard.heading;
        document.getElementById('card-content').value = currentCard.content;
        document.getElementById('card-color').value = currentCard.color || '#ffffff';
        document.getElementById('card-custom-style').value = currentCard.customStyle || '';
    } else {
        currentCard = null;
        document.getElementById('modal-title').textContent = 'Create New Card';
        document.getElementById('card-form').reset();
    }
    
    // Populate column select
    const columnSelect = document.getElementById('card-column');
    columnSelect.innerHTML = '';
    currentBoard.columns.forEach(col => {
        const option = document.createElement('option');
        option.value = col.id;
        option.textContent = col.name;
        option.selected = col.id === columnId;
        columnSelect.appendChild(option);
    });
    
    openModal('card-modal');
}

function saveCard(e) {
    e.preventDefault();
    
    const heading = document.getElementById('card-heading').value;
    const content = document.getElementById('card-content').value;
    const columnId = document.getElementById('card-column').value;
    const color = document.getElementById('card-color').value;
    const customStyle = document.getElementById('card-custom-style').value;
    
    const cardData = {
        heading,
        content,
        color,
        customStyle,
        comments: currentCard?.comments || '',
        inactive: currentCard?.inactive || false
    };
    
    const targetColumn = currentBoard.columns.find(c => c.id === columnId);
    
    if (currentCard) {
        // Update existing card
        Object.assign(currentCard, cardData);
        
        // If column changed, move card
        if (currentColumn.id !== columnId) {
            currentColumn.cards = currentColumn.cards.filter(c => c.id !== currentCard.id);
            targetColumn.cards.push(currentCard);
        }
    } else {
        // Create new card
        const newCard = {
            id: generateId(),
            ...cardData
        };
        targetColumn.cards.push(newCard);
    }
    
    renderColumns();
    closeModal('card-modal');
}

function toggleCardVisibility(cardId, columnId) {
    const column = currentBoard.columns.find(c => c.id === columnId);
    const card = column.cards.find(c => c.id === cardId);
    
    if (card) {
        card.inactive = !card.inactive;
        renderColumns();
    }
}

// Drag and Drop Functions
function dragStart(event, cardId) {
    draggedCard = {
        id: cardId,
        sourceColumnId: event.target.closest('.kanban-column').dataset.columnId
    };
    event.target.classList.add('dragging');
}

function dragEnd(event) {
    event.target.classList.remove('dragging');
    draggedCard = null;
}

function allowDrop(event) {
    event.preventDefault();
    event.currentTarget.classList.add('drag-over');
}

function dragLeave(event) {
    event.currentTarget.classList.remove('drag-over');
}

function dropCard(event, targetColumnId) {
    event.preventDefault();
    event.currentTarget.classList.remove('drag-over');
    
    if (!draggedCard) return;
    
    const sourceColumn = currentBoard.columns.find(c => c.id === draggedCard.sourceColumnId);
    const targetColumn = currentBoard.columns.find(c => c.id === targetColumnId);
    const card = sourceColumn.cards.find(c => c.id === draggedCard.id);
    
    if (card && sourceColumn && targetColumn) {
        // Remove from source
        sourceColumn.cards = sourceColumn.cards.filter(c => c.id !== card.id);
        
        // Add to target
        targetColumn.cards.push(card);
        
        renderColumns();
    }
}

// Board Settings Functions
function openBoardSettings() {
    document.getElementById('board-name').value = currentBoard.name;
    document.getElementById('board-authors-input').value = currentBoard.authors.join(', ');
    document.getElementById('board-summary-input').value = currentBoard.summary;
    document.getElementById('board-bg-color').value = currentBoard.backgroundColor;
    document.getElementById('board-custom-style').value = currentBoard.customStyle || '';
    document.getElementById('ai-provider').value = currentBoard.aiConfig?.provider || '';
    document.getElementById('ai-api-key').value = currentBoard.aiConfig?.apiKey || '';
    document.getElementById('ai-model').value = currentBoard.aiConfig?.model || '';
    document.getElementById('ai-base-url').value = currentBoard.aiConfig?.baseUrl || '';
    
    toggleAIFields();
    openModal('board-settings-modal');
}

function toggleAIFields() {
    const provider = document.getElementById('ai-provider').value;
    const baseUrlGroup = document.getElementById('ai-base-url-group');
    
    if (provider === 'custom') {
        baseUrlGroup.style.display = 'block';
    } else {
        baseUrlGroup.style.display = 'none';
    }
}

function saveBoardSettings(e) {
    e.preventDefault();
    
    currentBoard.name = document.getElementById('board-name').value;
    currentBoard.authors = document.getElementById('board-authors-input').value.split(',').map(a => a.trim());
    currentBoard.summary = document.getElementById('board-summary-input').value;
    currentBoard.backgroundColor = document.getElementById('board-bg-color').value;
    currentBoard.customStyle = document.getElementById('board-custom-style').value;
    currentBoard.aiConfig = {
        provider: document.getElementById('ai-provider').value,
        apiKey: document.getElementById('ai-api-key').value,
        model: document.getElementById('ai-model').value,
        baseUrl: document.getElementById('ai-base-url').value
    };
    
    updateBoardView();
    closeModal('board-settings-modal');
}

function deleteBoard() {
    if (confirm('Are you sure you want to delete this board? This action cannot be undone.')) {
        boards = boards.filter(b => b.id !== currentBoard.id);
        backToDashboard();
    }
}

// Export/Import Functions
function exportBoard() {
    const exportData = {
        ...currentBoard,
        exportDate: new Date().toISOString()
    };
    
    downloadJSON(exportData, `board-${currentBoard.name}-${Date.now()}.json`);
}

function exportAllBoards() {
    const exportData = {
        boards: boards,
        exportDate: new Date().toISOString()
    };
    
    downloadJSON(exportData, `all-boards-${Date.now()}.json`);
}

function importBoards(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            
            if (data.boards) {
                // Multiple boards
                boards = data.boards;
            } else {
                // Single board
                boards.push(data);
            }
            
            renderDashboard();
            alert('Import successful!');
        } catch (error) {
            alert('Error importing file: ' + error.message);
        }
    };
    
    reader.readAsText(file);
    event.target.value = ''; // Reset file input
}

function downloadJSON(data, filename) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// AI Functions
function generateBoardSummary() {
    if (!currentBoard.aiConfig?.provider || !currentBoard.aiConfig?.apiKey) {
        alert('Please configure AI settings in Board Settings first.');
        return;
    }
    
    // Collect all card content
    const allContent = [];
    currentBoard.columns.forEach(column => {
        column.cards.forEach(card => {
            allContent.push(`${column.name}: ${card.heading} - ${card.content}`);
        });
    });
    
    // Simulate AI call (in real implementation, this would call the configured AI API)
    const mockSummary = `This board contains ${currentBoard.columns.length} columns with a total of ${allContent.length} cards. The workflow progresses through ${currentBoard.columns.map(c => c.name).join(', ')}. Key focus areas include project planning, task management, and completion tracking.`;
    
    currentBoard.summary = mockSummary;
    updateBoardView();
    
    alert('Summary generated! (This is a mock implementation)');
}

function useAsPrompt() {
    const content = document.getElementById('card-content').value;
    if (!content) {
        alert('Please enter some content first.');
        return;
    }
    
    if (!currentBoard.aiConfig?.provider || !currentBoard.aiConfig?.apiKey) {
        alert('Please configure AI settings in Board Settings first.');
        return;
    }
    
    // Simulate using content as prompt
    alert(`Using as prompt with ${currentBoard.aiConfig.provider} (${currentBoard.aiConfig.model}):\n\n"${content}"\n\n(In a real implementation, this would send the prompt to the configured AI API)`);
}

function generateWithAI() {
    if (!currentBoard.aiConfig?.provider || !currentBoard.aiConfig?.apiKey) {
        alert('Please configure AI settings in Board Settings first.');
        return;
    }
    
    // Simulate AI content generation
    const mockContent = `This is AI-generated content using ${currentBoard.aiConfig.provider} (${currentBoard.aiConfig.model}). In a real implementation, this would use the configured AI provider to generate meaningful content.`;
    
    document.getElementById('card-content').value = mockContent;
    
    alert('Content generated! (This is a mock implementation)');
}

// Utility Functions
function generateId() {
    return 'id-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
}

function openModal(modalId) {
    document.getElementById(modalId).classList.add('show');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('show');
}

function backToDashboard() {
    document.getElementById('board-view').style.display = 'none';
    document.getElementById('dashboard').style.display = 'block';
    currentBoard = null;
    renderDashboard();
}

function applyCustomStyle(elementId, styles) {
    const styleElement = document.getElementById(elementId) || document.createElement('style');
    styleElement.id = elementId;
    styleElement.textContent = styles;
    
    if (!document.getElementById(elementId)) {
        document.head.appendChild(styleElement);
    }
}

// API Interface (for external integration)
window.KanbanAPI = {
    // Column API
    addColumn: function(boardId, columnName, color) {
        const board = boards.find(b => b.id === boardId);
        if (!board) return { error: 'Board not found' };
        
        const newColumn = {
            id: generateId(),
            name: columnName,
            color: color || '#e9ecef',
            customStyle: '',
            cards: []
        };
        
        board.columns.push(newColumn);
        
        if (currentBoard && currentBoard.id === boardId) {
            renderColumns();
        }
        
        return { success: true, columnId: newColumn.id };
    },
    
    setColumnColor: function(boardId, columnId, color) {
        const board = boards.find(b => b.id === boardId);
        if (!board) return { error: 'Board not found' };
        
        const column = board.columns.find(c => c.id === columnId);
        if (!column) return { error: 'Column not found' };
        
        column.color = color;
        
        if (currentBoard && currentBoard.id === boardId) {
            renderColumns();
        }
        
        return { success: true };
    },
    
    setColumnTitle: function(boardId, columnId, title) {
        const board = boards.find(b => b.id === boardId);
        if (!board) return { error: 'Board not found' };
        
        const column = board.columns.find(c => c.id === columnId);
        if (!column) return { error: 'Column not found' };
        
        column.name = title;
        
        if (currentBoard && currentBoard.id === boardId) {
            renderColumns();
        }
        
        return { success: true };
    },
    
    // Card API
    addCard: function(boardId, columnId, heading, content) {
        const board = boards.find(b => b.id === boardId);
        if (!board) return { error: 'Board not found' };
        
        const column = board.columns.find(c => c.id === columnId);
        if (!column) return { error: 'Column not found' };
        
        const newCard = {
            id: generateId(),
            heading: heading,
            content: content,
            color: '#ffffff',
            customStyle: '',
            comments: '',
            inactive: false
        };
        
        column.cards.push(newCard);
        
        if (currentBoard && currentBoard.id === boardId) {
            renderColumns();
        }
        
        return { success: true, cardId: newCard.id };
    },
    
    // Board API
    getBoards: function() {
        return boards;
    },
    
    getBoard: function(boardId) {
        return boards.find(b => b.id === boardId);
    }
};