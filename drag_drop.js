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
    if (typeof saveAllBoards === 'function') saveAllBoards();
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
        if (typeof saveAllBoards === 'function') saveAllBoards();
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