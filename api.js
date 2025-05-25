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