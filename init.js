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

    // Tab button click handlers
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('tab-button')) {
            e.preventDefault();
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
            { id: generateId(), name: 'To Do', color: '#e9ecef', cards: [] },
            { id: generateId(), name: 'In Progress', color: '#e9ecef', cards: [] },
            { id: generateId(), name: 'Done', color: '#e9ecef', cards: [] }
        ],
        aiConfig: {
            provider: '',
            apiKey: '',
            model: '',
            baseUrl: ''
        }
    }];
}