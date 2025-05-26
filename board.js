// Board View Functions
function openBoard(boardId) {
    currentBoard = boards.find(b => b.id === boardId);
    if (!currentBoard) return;

    document.getElementById('dashboard').style.display = 'none';
    document.getElementById('board-view').style.display = 'flex';

    // update url with board ID
    window.history.pushState({ boardId: currentBoard.id }, '', `?board=${currentBoard.id}`);
    
    updateBoardView();
    renderColumns();
}

function updateBoardView() {
    document.getElementById('board-title').textContent = currentBoard.name;
    document.getElementById('board-authors').textContent = 'Authors: ' + currentBoard.authors.join(', ');
    document.getElementById('board-summary').textContent = currentBoard.summary || 'No summary yet...';
    
    // Apply background color and custom styles
    const boardView = document.getElementById('board-view');
    boardView.style.backgroundColor = currentBoard.backgroundColor;
    
    if (currentBoard.customStyle) {
        applyCustomStyle('board-custom-style', currentBoard.customStyle);
    }
}