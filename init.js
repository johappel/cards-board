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
    if (!boards || boards.length === 0) {
        initializeBoards();
        await window.KanbanStorage?.saveBoards?.(boards);
    }
    if (boardId) {
        const board = boards.find(b => b.id === boardId);
        if (board) {
            currentBoard = board;
            document.getElementById('dashboard').style.display = 'none';
            document.getElementById('board-view').style.display = 'flex';
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

// Nach jeder Änderung speichern
function saveAllBoards() {
    window.KanbanStorage?.saveBoards?.(boards);
}