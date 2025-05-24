/**
 /**
 * Dashboard Management
 * Handles the dashboard view and board cards rendering
 */
class DashboardManager {
    constructor() {
        if (DashboardManager.instance) {
            return DashboardManager.instance;
        }
        DashboardManager.instance = this;
        this.setupEventListeners();
    }

    static getInstance() {
        if (!DashboardManager.instance) {
            DashboardManager.instance = new DashboardManager();
        }
        return DashboardManager.instance;
    }

    setupEventListeners() {
        // New board button
        const newBoardBtn = document.getElementById('new-board-btn');
        if (newBoardBtn) {
            newBoardBtn.addEventListener('click', () => {
                const modalManager = ModalManager.getInstance();
                modalManager.openNewBoardModal();
            });
        }

        // Import boards button
        const importBtn = document.getElementById('import-boards-btn');
        if (importBtn) {
            importBtn.addEventListener('click', () => {
                const storageManager = StorageManager.getInstance();
                storageManager.importBoards();
            });
        }

        // Export boards button
        const exportBtn = document.getElementById('export-boards-btn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                const storageManager = StorageManager.getInstance();
                storageManager.exportBoards();
            });
        }
    }    showDashboard() {
        const dashboardElement = document.getElementById('dashboard');
        const boardViewElement = document.getElementById('board-view');
        
        if (dashboardElement) {
            dashboardElement.style.display = 'block';
        } else {
            console.error('Dashboard element not found');
        }
        
        if (boardViewElement) {
            boardViewElement.style.display = 'none';
        } else {
            console.error('Board view element not found');
        }
        
        // Try to render board cards, but catch any errors
        try {
            this.renderBoardCards();
        } catch (error) {
            console.error('Error rendering board cards:', error);
        }
    }

    hideDashboard() {
        const dashboardElement = document.getElementById('dashboard');
        const boardViewElement = document.getElementById('board-view');
        
        if (dashboardElement) {
            dashboardElement.style.display = 'none';
        }
        
        if (boardViewElement) {
            boardViewElement.style.display = 'block';
        }
    }    renderBoardCards() {
        try {
            const storageManager = StorageManager.getInstance();
            const boards = storageManager.getAllBoards();
            const boardsGrid = document.getElementById('boards-grid');
            
            if (!boardsGrid) {
                console.error('boards-grid element not found');
                return;
            }

            boardsGrid.innerHTML = '';

            if (!boards || boards.length === 0) {
                boardsGrid.innerHTML = '<p>No boards available. Create your first board!</p>';
                return;
            }

            boards.forEach(board => {
                try {
                    const boardCard = this.createBoardCard(board);
                    boardsGrid.appendChild(boardCard);
                } catch (error) {
                    console.error('Error creating board card:', error);
                }
            });
        } catch (error) {
            console.error('Error in renderBoardCards:', error);
        }
    }

    createBoardCard(board) {
        const boardCard = document.createElement('div');
        boardCard.className = 'board-card';
        boardCard.style.backgroundColor = board.backgroundColor || '#ffffff';
        
        if (board.customStyle) {
            const styleElement = document.createElement('style');
            styleElement.textContent = `.board-card[data-board-id="${board.id}"] { ${board.customStyle} }`;
            document.head.appendChild(styleElement);
            boardCard.setAttribute('data-board-id', board.id);
        }

        const cardCount = board.columns.reduce((total, column) => total + column.cards.length, 0);

        boardCard.innerHTML = `
            <div class="board-card-header">
                <h3>${this.escapeHtml(board.name)}</h3>
                <div class="board-card-menu">                    <button class="menu-dots" onclick="DashboardManager.getInstance().toggleBoardMenu('${board.id}')">⋮</button>
                    <div class="dropdown-menu" id="board-menu-${board.id}">
                        <button onclick="DashboardManager.getInstance().openBoard('${board.id}')">Öffnen</button>
                        <button onclick="DashboardManager.getInstance().duplicateBoard('${board.id}')">Duplizieren</button>
                        <button onclick="DashboardManager.getInstance().deleteBoard('${board.id}')">Löschen</button>
                    </div>
                </div>
            </div>
            <div class="board-card-content">
                <p class="board-description">${this.escapeHtml(board.summary || 'Keine Beschreibung')}</p>
                <div class="board-stats">
                    <span class="stat-item">${board.columns.length} Spalten</span>
                    <span class="stat-item">${cardCount} Karten</span>
                </div>
                <div class="board-authors">
                    <small>Autoren: ${board.authors.join(', ')}</small>
                </div>
                <div class="board-last-modified">
                    <small>Zuletzt bearbeitet: ${new Date(board.lastModified).toLocaleDateString('de-DE')}</small>
                </div>
            </div>
        `;

        // Make the card clickable to open the board
        boardCard.addEventListener('click', (e) => {
            // Don't trigger if clicking on menu or buttons
            if (!e.target.closest('.board-card-menu') && !e.target.closest('button')) {
                this.openBoard(board.id);
            }
        });

        return boardCard;
    }

    openBoard(boardId) {
        const boardManager = BoardManager.getInstance();
        const modalManager = ModalManager.getInstance();
        
        // Close any open dropdowns
        document.querySelectorAll('.dropdown-menu').forEach(menu => {
            menu.classList.remove('show');
        });

        boardManager.openBoard(boardId);
        this.hideDashboard();
    }    duplicateBoard(boardId) {
        const storageManager = StorageManager.getInstance();
        const modalManager = ModalManager.getInstance();
        
        const originalBoard = storageManager.getBoardById(boardId);
        if (!originalBoard) return;

        const duplicatedBoard = {
            ...originalBoard,
            id: storageManager.generateId(),
            name: `${originalBoard.name} (Kopie)`,
            lastModified: new Date().toISOString(),
            columns: originalBoard.columns.map(column => ({
                ...column,
                id: storageManager.generateId(),
                cards: column.cards.map(card => ({
                    ...card,
                    id: storageManager.generateId()
                }))
            }))
        };

        storageManager.saveBoard(duplicatedBoard);
        this.renderBoardCards();
        modalManager.showNotification('Board erfolgreich dupliziert!');
    }

    deleteBoard(boardId) {
        const storageManager = StorageManager.getInstance();
        const modalManager = ModalManager.getInstance();
        
        modalManager.showConfirmDialog('Sind Sie sicher, dass Sie dieses Board löschen möchten?', () => {
            storageManager.deleteBoard(boardId);
            this.renderBoardCards();
            modalManager.showNotification('Board erfolgreich gelöscht!');
        });
    }

    toggleBoardMenu(boardId) {
        const modalManager = ModalManager.getInstance();
        modalManager.toggleDropdownMenu(`board-menu-${boardId}`);
    }

    createNewBoard(name, description) {
        const storageManager = StorageManager.getInstance();
        const boardManager = BoardManager.getInstance();
        
        const newBoard = {
            id: storageManager.generateId(),
            name: name,
            summary: description,
            authors: ['Benutzer'],
            backgroundColor: '#ffffff',
            customStyle: '',
            columns: [],
            lastModified: new Date().toISOString(),
            aiConfig: {
                provider: '',
                apiKey: ''
            }
        };

        storageManager.saveBoard(newBoard);
        this.renderBoardCards();
        this.openBoard(newBoard.id);
    }

    // Create new board via button click (simplified version)
    createNewBoard() {
        const modalManager = ModalManager.getInstance();
        modalManager.openNewBoardModal();
    }

    // Search and filter functionality
    searchBoards(query) {
        const storageManager = StorageManager.getInstance();
        const boards = storageManager.getAllBoards();
        
        const filteredBoards = boards.filter(board => 
            board.name.toLowerCase().includes(query.toLowerCase()) ||
            board.summary.toLowerCase().includes(query.toLowerCase()) ||
            board.authors.some(author => author.toLowerCase().includes(query.toLowerCase()))
        );

        this.renderFilteredBoards(filteredBoards);
    }

    renderFilteredBoards(boards) {
        const boardsGrid = document.getElementById('boards-grid');
        if (!boardsGrid) return;

        boardsGrid.innerHTML = '';
        boards.forEach(board => {
            const boardCard = this.createBoardCard(board);
            boardsGrid.appendChild(boardCard);
        });
    }

    // Utility method
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Future enhancements placeholder methods
    sortBoards(criteria) {
        // Placeholder for board sorting functionality
        console.log('Sorting boards by:', criteria);
    }

    filterBoardsByAuthor(author) {
        // Placeholder for author-based filtering
        console.log('Filtering boards by author:', author);
    }

    showBoardStatistics() {
        // Placeholder for board statistics view
        console.log('Showing board statistics');
    }

    exportBoard(boardId) {
        // Placeholder for individual board export
        console.log('Exporting board:', boardId);
    }

    importBoard() {
        // Placeholder for individual board import
        console.log('Importing individual board');
    }
}

// Export for use in other modules
window.DashboardManager = DashboardManager;
