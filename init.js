// Data Storage (in-memory only, no localStorage in sandbox)
let boards = [];
let currentBoard = null;
let currentColumn = null;
let currentCard = null;
let draggedCard = null;
let draggedColumn = null;
let columnImportData = null;

// Initialize Application
document.addEventListener('DOMContentLoaded', async function() {
    // Prüfe auf ?board=ID in der URL
    const urlParams = new URLSearchParams(window.location.search);
    const boardId = urlParams.get('board');
    
    boards = await (window.KanbanStorage?.loadBoards?.() || []);
    console.log('Boards nach Laden:', JSON.stringify(boards, null, 2)); // Debug-Log
    // Logging für das tatsächlich geladene Board
    let boardForLog = null;
    if (boardId) {
        boardForLog = boards.find(b => b.id === boardId);
    } else if (boards && boards.length > 0) {
        boardForLog = boards[0];
    }
    if (boardForLog && boardForLog.columns) {
        console.log('### DEBUG: Spaltenreihenfolge nach Laden:', boardForLog.columns.map(c => c.name));
        boardForLog.columns.forEach(col => {
            console.log('### DEBUG: Kartenreihenfolge in Spalte', col.name, col.cards.map(card => card.heading));
        });
    }
    if (!boards || boards.length === 0) {
        initializeBoards();
        await window.KanbanStorage?.saveBoards?.(boards);
    }    if (boardId) {
        const board = boards.find(b => b.id === boardId);
        if (board) {
            currentBoard = board;
            window.currentBoard = currentBoard;
            document.getElementById('dashboard').style.display = 'none';
            document.getElementById('board-view').style.display = 'flex';
            
            // Chatbot über Board-Laden informieren (falls bereits initialisiert)
            if (typeof window.handleBoardChange === 'function') {
                window.handleBoardChange(currentBoard.id);
            }
            
            updateBoardView();
            renderColumns();
        } else {
            renderDashboard();
        }
    } else {
        renderDashboard();
    }
    setupEventListeners();
    initializeColorPalettes();
    // Nach Initialisierung window.currentBoard setzen
    window.currentBoard = currentBoard;
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

    // Tab button click handlers
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('tab-button')) {
            e.preventDefault();
        }
    });

    // AI-Icon im Card-Modal
    const aiBtn = document.getElementById('open-ai-modal');
    if (aiBtn) {
        aiBtn.addEventListener('click', function(e) {
            e.preventDefault();
            // Prompt-Modal öffnen
            openAIPromptModal();
        });
    }
}

// Initialize default boards
function initializeBoards() {
    // Create default board
    boards = [{
        id: generateId(),
        name: 'My First Board',
        description: 'Welcome to your first Kanban board!',
        authors: ['User'],
        summary: '',        backgroundColor: '#f5f7fa',
        customStyle: '',
        columns: [
            { id: generateId(), name: 'To Do', color: 'color-gradient-1', cards: [] },
            { id: generateId(), name: 'In Progress', color: 'color-gradient-2', cards: [] },
            { id: generateId(), name: 'Done', color: 'color-gradient-3', cards: [] }
        ],
        aiConfig: {
            provider: '',
            apiKey: '',
            model: '',
            baseUrl: ''
        }
    }];
}

// SortableJS für Kanban-Board Columns & Cards
function initSortableKanban() {
    // Vorherige Sortable-Instanz für Columns entfernen
    const board = document.getElementById('kanban-board');
    if (board && board._sortableInstance) {
        board._sortableInstance.destroy();
        board._sortableInstance = null;
    }
    // Columns im Board (Spalten Drag&Drop) - IMMER neu initialisieren!
    if (board) {
        board._sortableInstance = new Sortable(board, {
            group: 'kanban-columns',
            animation: 220,
            ghostClass: 'kanban-column-drag-ghost',
            chosenClass: 'kanban-column-drag-chosen',
            dragClass: 'kanban-column-dragging',
            filter: '.btn, .add-card-btn', // Buttons nicht ziehbar
            draggable: '.kanban-column',
            handle: '.column-header', // Nur Header als Drag-Handle
            onEnd: function (evt) {
                try {
                    console.log('### DEBUG: onEnd Spalten-Drag erreicht');
                    console.log('window.currentBoard:', window.currentBoard);
                    console.log('window.currentBoard.columns:', window.currentBoard?.columns);
                    if (!window.currentBoard || !window.currentBoard.columns) return;
                    const colMap = {};
                    window.currentBoard.columns.forEach(col => { colMap[col.id] = col; });
                    // Vorher loggen
                    console.log('Spalten vorher:', window.currentBoard.columns.map(c => c.name));
                    const newOrder = [];
                    board.querySelectorAll('.kanban-column').forEach(colEl => {
                        const colId = colEl.dataset.columnId;
                        if (colMap[colId]) newOrder.push(colMap[colId]);
                    });
                    // Nachher loggen
                    console.log('Spalten nach Drag:', newOrder.map(c => c.name));
                    window.currentBoard.columns = newOrder;
                    if (typeof saveAllBoards === 'function') saveAllBoards();
                    console.log('saveAllBoards() nach Spalten-Drag ausgeführt');
                } catch(e) {
                    console.error('Fehler im onEnd Spalten-Drag:', e);
                }
            }
        });
    }

    // Für jede Spalte: Sortable für Karten IMMER neu initialisieren
    window.currentBoard?.columns?.forEach(col => {
        const colEl = document.querySelector(`.kanban-column[data-column-id="${col.id}"] .column-content`);
        if (colEl && colEl._sortableInstance) {
            colEl._sortableInstance.destroy();
            colEl._sortableInstance = null;
        }
        if (colEl) {
            colEl._sortableInstance = new Sortable(colEl, {
                group: 'kanban-cards',
                animation: 180,
                ghostClass: 'kanban-card-drag-ghost',
                chosenClass: 'kanban-card-drag-chosen',
                dragClass: 'kanban-card-dragging',
                draggable: '.kanban-card',
                handle: '.card-header', // ganzer Header als Drag-Handle
                onEnd: function (evt) {
                    try {
                        console.log('### DEBUG: onEnd Karten-Drag erreicht');
                        if (!window.currentBoard || !window.currentBoard.columns) return;
                        const fromColId = evt.from.closest('.kanban-column').dataset.columnId;
                        const toColId = evt.to.closest('.kanban-column').dataset.columnId;
                        const fromCol = window.currentBoard.columns.find(c => c.id === fromColId);
                        const toCol = window.currentBoard.columns.find(c => c.id === toColId);
                        if (!fromCol || !toCol) return;
                        // Vorher loggen
                        console.log('Karten vorher (from):', fromCol.cards.map(c => c.title));
                        console.log('Karten vorher (to):', toCol.cards.map(c => c.title));
                        // Karten neu anordnen
                        const cardMap = {};
                        window.currentBoard.columns.forEach(col => {
                            col.cards.forEach(card => { cardMap[card.id] = card; });
                        });
                        // Karten in Zielspalte nach DOM sortieren
                        const newToCards = [];
                        evt.to.querySelectorAll('.kanban-card').forEach(cardEl => {
                            const cardId = cardEl.dataset.cardId;
                            if (cardMap[cardId]) newToCards.push(cardMap[cardId]);
                        });
                        toCol.cards = newToCards;
                        // Karten in Quellspalte nach DOM sortieren (falls moved)
                        if (fromCol !== toCol) {
                            const newFromCards = [];
                            evt.from.querySelectorAll('.kanban-card').forEach(cardEl => {
                                const cardId = cardEl.dataset.cardId;
                                if (cardMap[cardId]) newFromCards.push(cardMap[cardId]);
                            });
                            fromCol.cards = newFromCards;
                        }
                        // Nachher loggen
                        console.log('Karten nach (from):', fromCol.cards.map(c => c.title));
                        console.log('Karten nach (to):', toCol.cards.map(c => c.title));
                        if (typeof saveAllBoards === 'function') saveAllBoards();
                        console.log('saveAllBoards() nach Karten-Drag ausgeführt');
                    } catch(e) {
                        console.error('Fehler im onEnd Karten-Drag:', e);
                    }
                }
            });
        }
    });
}

// Nach jeder Änderung speichern
function saveAllBoards() {
    console.log('saveAllBoards() aufgerufen', JSON.stringify(boards, null, 2));
    if (window.currentBoard && window.currentBoard.columns) {
        console.log('### DEBUG: Spaltenreihenfolge beim Speichern:', window.currentBoard.columns.map(c => c.name));
        window.currentBoard.columns.forEach(col => {
            console.log('### DEBUG: Kartenreihenfolge in Spalte', col.name, col.cards.map(card => card.heading));
        });
    }
    window.KanbanStorage?.saveBoards?.(boards);
}

// Nach jedem renderColumns() aufrufen!
window.initSortableKanban = initSortableKanban;