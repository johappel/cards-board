// Board View Functions
function openBoard(boardId) {
    currentBoard = boards.find(b => b.id === boardId);
    if (!currentBoard) return;

    document.getElementById('dashboard').style.display = 'none';
    document.getElementById('board-view').style.display = 'flex';

    // update url with board ID
    window.history.pushState({ boardId: currentBoard.id }, '', `?board=${currentBoard.id}`);
    
    // Global currentBoard aktualisieren
    window.currentBoard = currentBoard;
    
    // Chatbot über Board-Wechsel informieren
    if (typeof window.handleBoardChange === 'function') {
        window.handleBoardChange(currentBoard.id);
    }
    
    updateBoardView();
    renderColumns();
}

function updateBoardView() {
    document.getElementById('board-title').textContent = currentBoard.name;
    document.getElementById('board-authors').textContent = 'Authors: ' + currentBoard.authors.join(', ');
    document.getElementById('board-summary').textContent = currentBoard.summary || 'No summary yet...';
      // Apply background colors
    const boardHeader = document.querySelector('.board-header');
    const boardView = document.getElementById('board-view');
    
    if (boardHeader) {
        if (currentBoard.headerRGBA) {
            // Header uses white with transparency to let board color show through
            boardHeader.style.backgroundColor = currentBoard.headerRGBA;
        } else if (currentBoard.backgroundColor) {
            // Fallback to old hex color
            boardHeader.style.backgroundColor = currentBoard.backgroundColor;
        }
    }
    
    if (boardView) {
        if (currentBoard.backgroundHex) {
            // Board background uses full color without transparency
            boardView.style.backgroundColor = currentBoard.backgroundHex;
        } else if (currentBoard.backgroundColor) {
            // Fallback to old hex color
            boardView.style.backgroundColor = currentBoard.backgroundColor;
        }
    }
    
    if (currentBoard.customStyle) {
        applyCustomStyle('board-custom-style', currentBoard.customStyle);
    }
}