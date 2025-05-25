// Data Storage
let boards = [];
let currentBoard = null;
let currentColumn = null;
let currentCard = null;
let draggedCard = null;

// Initialize Application
document.addEventListener('DOMContentLoaded', function() {
    loadBoards();
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

// Storage Functions
function loadBoards() {
    const stored = localStorage.getItem('kanban-boards');
    if (stored) {
        boards = JSON.parse(stored);
    } else {
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
                apiKey: ''
            }
        }];
        saveBoards();
    }
}

function saveBoards() {
    localStorage.setItem('kanban-boards', JSON.stringify(boards));
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
    card.onclick = () => openBoard(board.id);
    
    const totalCards = board.columns.reduce((sum, col) => sum + col.cards.length, 0);
    
    card.innerHTML = `
        <h3>${board.name}</h3>
        <p>${board.description || 'No description'}</p>
        <p style="margin-top: 0.5rem; font-size: 0.8rem; color: #95a5a6;">
            ${board.columns.length} columns • ${totalCards} cards
        </p>
    `;
    
    return card;
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
            apiKey: ''
        }
    };
    
    boards.push(newBoard);
    saveBoards();
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
    currentBoard.columns.forEach(column => {
        const columnEl = createColumnElement(column);
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

function createColumnElement(column) {
    const columnEl = document.createElement('div');
    columnEl.className = 'kanban-column';
    columnEl.dataset.columnId = column.id;
    columnEl.style.backgroundColor = column.color;
    
    if (column.customStyle) {
        columnEl.style.cssText += column.customStyle;
    }
    
    columnEl.innerHTML = `
        <div class="column-header">
            <div class="column-title">${column.name}</div>
            <div class="column-actions">
                <button class="menu-dots" onclick="toggleColumnMenu(event, '${column.id}')">⋮</button>
                <div class="dropdown-menu" id="column-menu-${column.id}">
                    <div class="dropdown-item" onclick="openColumnSettings('${column.id}')">Settings</div>
                    <div class="dropdown-item" onclick="exportColumn('${column.id}')">Export</div>
                    <div class="dropdown-item" onclick="deleteColumn('${column.id}')">Delete</div>
                </div>
            </div>
        </div>
        <div class="column-content" ondrop="dropCard(event, '${column.id}')" ondragover="allowDrop(event)" ondragleave="dragLeave(event)">
            ${column.cards.map(card => createCardElement(card, column.id)).join('')}
        </div>
        <button class="add-card-btn" onclick="openCardModal('${column.id}')">+ Add Card</button>
    `;
    
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
    saveBoards();
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
    
    saveBoards();
    renderColumns();
    closeModal('column-modal');
}

function deleteColumn(columnId) {
    if (confirm('Are you sure you want to delete this column?')) {
        currentBoard.columns = currentBoard.columns.filter(c => c.id !== columnId);
        saveBoards();
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
    
    saveBoards();
    renderColumns();
    closeModal('card-modal');
}

function toggleCardVisibility(cardId, columnId) {
    const column = currentBoard.columns.find(c => c.id === columnId);
    const card = column.cards.find(c => c.id === cardId);
    
    if (card) {
        card.inactive = !card.inactive;
        saveBoards();
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
        
        saveBoards();
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
    
    openModal('board-settings-modal');
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
        apiKey: document.getElementById('ai-api-key').value
    };
    
    saveBoards();
    updateBoardView();
    closeModal('board-settings-modal');
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
            
            saveBoards();
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
    saveBoards();
    updateBoardView();
    
    alert('Summary generated! (This is a mock implementation)');
}

function useAsPrompt() {
    const content = document.getElementById('card-content').value;
    if (!content) {
        alert('Please enter some content first.');
        return;
    }
    
    // Simulate using content as prompt
    alert(`Using as prompt: "${content}"\n\n(In a real implementation, this would send the prompt to the configured AI API)`);
}

function generateWithAI() {
    if (!currentBoard.aiConfig?.provider || !currentBoard.aiConfig?.apiKey) {
        alert('Please configure AI settings in Board Settings first.');
        return;
    }
    
    // Simulate AI content generation
    const mockContent = 'This is AI-generated content based on your prompt. In a real implementation, this would use the configured AI provider to generate meaningful content.';
    
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
        saveBoards();
        
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
        saveBoards();
        
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
        saveBoards();
        
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
        saveBoards();
        
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
