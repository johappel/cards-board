// Board Management Module

class BoardManager {
    constructor() {
        if (BoardManager.instance) {
            return BoardManager.instance;
        }
        BoardManager.instance = this;
        this.boards = [];
        this.currentBoard = null;
    }

    static getInstance() {
        if (!BoardManager.instance) {
            BoardManager.instance = new BoardManager();
        }
        return BoardManager.instance;
    }

    initialize() {
        const storageManager = StorageManager.getInstance();
        this.boards = storageManager.loadBoards();
        storageManager.saveBoards(this.boards);
    }

    getAllBoards() {
        return this.boards;
    }

    getCurrentBoard() {
        return this.currentBoard;
    }    openBoard(boardId) {
        // Ensure boards are loaded
        if (!this.boards || this.boards.length === 0) {
            this.initialize();
        }
        
        this.currentBoard = this.boards.find(b => b.id === boardId);
        if (!this.currentBoard) {
            console.error('Board not found:', boardId);
            return false;
        }

        console.log('Opening board:', this.currentBoard.name);
        
        document.getElementById('dashboard').style.display = 'none';
        document.getElementById('board-view').style.display = 'flex';
        
        this.updateBoardView();
        const columnManager = ColumnManager.getInstance();
        columnManager.renderColumns();
        return true;
    }    createNewBoard(name, description) {
        const storageManager = StorageManager.getInstance();
        const newBoard = {
            id: storageManager.generateId(),
            name: name,
            description: description,
            authors: ['User'],
            summary: '',
            backgroundColor: '#f5f7fa',
            customStyle: '',
            columns: [
                { id: storageManager.generateId(), name: 'To Do', color: '#e9ecef', customStyle: '', cards: [] },
                { id: storageManager.generateId(), name: 'In Progress', color: '#e9ecef', customStyle: '', cards: [] },
                { id: storageManager.generateId(), name: 'Done', color: '#e9ecef', customStyle: '', cards: [] }
            ],
            aiConfig: {
                provider: '',
                apiKey: ''
            }
        };
        
        this.boards.push(newBoard);
        this.saveBoards();
        return newBoard;
    }

    updateBoardView() {
        document.getElementById('board-title').textContent = this.currentBoard.name;
        document.getElementById('board-authors').textContent = 'Authors: ' + this.currentBoard.authors.join(', ');
        document.getElementById('board-summary').textContent = this.currentBoard.summary || 'No summary yet...';
        
        // Apply custom styles
        const boardView = document.getElementById('board-view');
        boardView.style.backgroundColor = this.currentBoard.backgroundColor;
        if (this.currentBoard.customStyle) {
            this.applyCustomStyle('board-custom-style', this.currentBoard.customStyle);
        }
    }

    updateBoardSettings(settings) {
        if (!this.currentBoard) return false;

        this.currentBoard.name = settings.name;
        this.currentBoard.authors = settings.authors.split(',').map(a => a.trim());
        this.currentBoard.summary = settings.summary;
        this.currentBoard.backgroundColor = settings.backgroundColor;
        this.currentBoard.customStyle = settings.customStyle;
        this.currentBoard.aiConfig = {
            provider: settings.aiProvider,
            apiKey: settings.apiKey
        };
        
        this.saveBoards();
        this.updateBoardView();
        return true;
    }

    generateBoardSummary() {
        if (!this.currentBoard.aiConfig?.provider || !this.currentBoard.aiConfig?.apiKey) {
            return { success: false, message: 'Please configure AI settings in Board Settings first.' };
        }
        
        // Collect all card content
        const allContent = [];
        this.currentBoard.columns.forEach(column => {
            column.cards.forEach(card => {
                allContent.push(`${column.name}: ${card.heading} - ${card.content}`);
            });
        });

        // Simulate AI call (in real implementation, this would call the configured AI API)
        const mockSummary = `This board contains ${this.currentBoard.columns.length} columns with a total of ${allContent.length} cards. The workflow progresses through ${this.currentBoard.columns.map(c => c.name).join(', ')}. Key focus areas include project planning, task management, and completion tracking.`;
        
        // Update the board summary and save
        this.currentBoard.summary = mockSummary;
        this.saveBoards();
        this.updateBoardView();
        
        return { success: true, message: 'Board summary generated successfully!' };
    }    saveBoards() {
        const storageManager = StorageManager.getInstance();
        storageManager.saveBoards(this.boards);
    }

    exportBoard() {
        if (!this.currentBoard) return false;
        const storageManager = StorageManager.getInstance();
        storageManager.exportBoard(this.currentBoard);
        return true;
    }

    exportAllBoards() {
        const storageManager = StorageManager.getInstance();
        storageManager.exportAllBoards(this.boards);
    }    async importBoards(file) {
        try {
            const storageManager = StorageManager.getInstance();
            const data = await storageManager.importBoards(file);
            
            if (data.boards) {
                // Multiple boards
                this.boards = data.boards;
            } else {
                // Single board
                this.boards.push(data);
            }
            
            this.saveBoards();
            return { success: true, message: 'Import successful!' };
        } catch (error) {
            return { success: false, message: 'Error importing file: ' + error.message };
        }
    }

    backToDashboard() {
        document.getElementById('board-view').style.display = 'none';
        document.getElementById('dashboard').style.display = 'block';
        this.currentBoard = null;
    }

    applyCustomStyle(elementId, styles) {
        const styleElement = document.getElementById(elementId) || document.createElement('style');
        styleElement.id = elementId;
        styleElement.textContent = styles;
        
        if (!document.getElementById(elementId)) {
            document.head.appendChild(styleElement);
        }
    }
}

// Export for use in other modules
window.BoardManager = BoardManager;
