// Storage Management Module

class StorageManager {
    constructor() {
        if (StorageManager.instance) {
            return StorageManager.instance;
        }
        StorageManager.instance = this;
        this.storageKey = 'kanban-boards';
    }

    static getInstance() {
        if (!StorageManager.instance) {
            StorageManager.instance = new StorageManager();
        }
        return StorageManager.instance;
    }

    // Initialize storage and ensure default boards exist
    initializeStorage() {
        const boards = this.loadBoards();
        this.saveBoards(boards);
        return boards;
    }

    // Get all boards from storage
    getAllBoards() {
        return this.loadBoards();
    }

    // Save all boards to storage
    saveAllBoards(boards) {
        this.saveBoards(boards);
    }

    // Get a specific board by ID
    getBoardById(boardId) {
        const boards = this.loadBoards();
        return boards.find(board => board.id === boardId);
    }

    // Save a single board (update if exists, add if new)
    saveBoard(board) {
        const boards = this.loadBoards();
        const existingIndex = boards.findIndex(b => b.id === board.id);
        
        if (existingIndex !== -1) {
            boards[existingIndex] = board;
        } else {
            boards.push(board);
        }
        
        this.saveBoards(boards);
    }

    // Delete a board by ID
    deleteBoard(boardId) {
        const boards = this.loadBoards();
        const filteredBoards = boards.filter(board => board.id !== boardId);
        this.saveBoards(filteredBoards);
    }

    loadBoards() {
        const stored = localStorage.getItem(this.storageKey);
        if (stored) {
            return JSON.parse(stored);
        } else {            // Create default board
            return [{
                id: this.generateId(),
                name: 'My First Board',
                description: 'Welcome to your first Kanban board!',
                authors: ['User'],
                summary: '',
                backgroundColor: '#f5f7fa',
                customStyle: '',
                lastModified: new Date().toISOString(),
                columns: [
                    { id: this.generateId(), name: 'To Do', color: '#e9ecef', customStyle: '', cards: [] },
                    { id: this.generateId(), name: 'In Progress', color: '#e9ecef', customStyle: '', cards: [] },
                    { id: this.generateId(), name: 'Done', color: '#e9ecef', customStyle: '', cards: [] }
                ],
                aiConfig: {
                    provider: '',
                    apiKey: ''
                }
            }];
        }
    }

    saveBoards(boards) {
        localStorage.setItem(this.storageKey, JSON.stringify(boards));
    }

    exportBoard(board) {
        const exportData = {
            ...board,
            exportDate: new Date().toISOString()
        };
        
        this.downloadJSON(exportData, `board-${board.name}-${Date.now()}.json`);
    }

    exportAllBoards(boards) {
        const exportData = {
            boards: boards,
            exportDate: new Date().toISOString()
        };
        
        this.downloadJSON(exportData, `all-boards-${Date.now()}.json`);
    }

    exportColumn(column) {
        const exportData = {
            columnName: column.name,
            cards: column.cards,
            exportDate: new Date().toISOString()
        };
        
        this.downloadJSON(exportData, `column-${column.name}-${Date.now()}.json`);
    }

    downloadJSON(data, filename) {
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

    // Export all boards (wrapper method for HTML compatibility)
    exportBoards() {
        const boards = this.loadBoards();
        this.exportAllBoards(boards);
    }

    // Export current board (requires current board context)
    exportCurrentBoard() {
        if (typeof BoardManager !== 'undefined') {
            const currentBoard = BoardManager.getInstance().getCurrentBoard();
            if (currentBoard) {
                this.exportBoard(currentBoard);
            } else {
                console.error('No current board to export');
            }
        }
    }

    // Erweiterte Import-Funktionalität mit Event-Handling
    importBoards(event) {
        const file = event.target.files[0];
        if (!file) return;

        this.importBoardsFromFile(file).then(data => {
            try {
                let boards;
                
                // Handle different import formats
                if (data.boards && Array.isArray(data.boards)) {
                    // Multiple boards export format
                    boards = data.boards;
                } else if (Array.isArray(data)) {
                    // Direct array format
                    boards = data;
                } else if (data.id) {
                    // Single board format
                    boards = [data];
                } else {
                    throw new Error('Invalid import format');
                }

                // Merge with existing boards
                const existingBoards = this.loadBoards();
                const mergedBoards = [...existingBoards];

                boards.forEach(importedBoard => {
                    // Generate new ID if board with same ID already exists
                    if (mergedBoards.find(b => b.id === importedBoard.id)) {
                        importedBoard.id = this.generateId();
                        importedBoard.name += ' (Imported)';
                    }
                    mergedBoards.push(importedBoard);
                });

                this.saveBoards(mergedBoards);
                
                // Refresh dashboard if available
                if (typeof DashboardManager !== 'undefined') {
                    DashboardManager.getInstance().showDashboard();
                }
                
                alert(`Successfully imported ${boards.length} board(s)!`);
            } catch (error) {
                console.error('Import error:', error);
                alert('Error importing boards: ' + error.message);
            }
        }).catch(error => {
            console.error('File reading error:', error);
            alert('Error reading file: ' + error.message);
        });
    }

    importBoardsFromFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    const data = JSON.parse(e.target.result);
                    resolve(data);
                } catch (error) {
                    reject(error);
                }
            };
            reader.readAsText(file);
        });
    }

    generateId() {
        return 'id-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    }
}

// Export for use in other modules
window.StorageManager = StorageManager;
