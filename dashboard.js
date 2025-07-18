// Dashboard Functions
function renderDashboard() {
    const grid = document.getElementById('boards-grid');
    grid.innerHTML = '';

    boards.forEach(board => {
        const boardCard = createBoardCard(board);
        grid.appendChild(boardCard);
    });

    // Add "Create New Board" card
    const addCard = document.createElement('div');
    addCard.className = 'board-card add-board-card';
    addCard.innerHTML = '<button class="add-board-btn" onclick="openNewBoardModal()">+</button>';
    grid.appendChild(addCard);
}

function createBoardCard(board) {
    const card = document.createElement('div');
    card.className = 'board-card';
      // Apply board background color if available
    if (board.headerRGBA) {
        // Dashboard cards use white with transparency to let board color show through
        card.style.backgroundColor = board.headerRGBA;
        // Set board color as background behind the transparent header
        if (board.backgroundHex) {
            card.style.background = `linear-gradient(${board.headerRGBA}, ${board.headerRGBA}), ${board.backgroundHex}`;
        }
    } else if (board.backgroundColor) {
        // Fallback to hex color for older boards
        card.style.backgroundColor = board.backgroundColor;
    }
    
    const totalCards = board.columns.reduce((sum, col) => sum + col.cards.length, 0);
    
    card.innerHTML = `
        <div class="board-card-actions">
            <button class="board-delete-btn" onclick="deleteBoardFromDashboard(event, '${board.id}')" title="Delete Board">🗑️</button>
        </div>
        <h3>${board.name}</h3>
        <p>${board.description || 'No description'}</p>
        <p style="margin-top: 0.5rem; font-size: 0.8rem; color: #95a5a6;">
            ${board.columns.length} columns • ${totalCards} cards
        </p>
    `;
    
    card.onclick = (e) => {
        if (!e.target.classList.contains('board-delete-btn')) {
            openBoard(board.id);
        }
    };
    
    return card;
}

function openNewBoardModal() {
    document.getElementById('new-board-name').value = '';
    document.getElementById('new-board-description').value = '';
    openModal('new-board-modal');
}

function createNewBoard(e) {
    e.preventDefault();
    const newBoard = {
        id: generateId(),
        name: document.getElementById('new-board-name').value,
        description: document.getElementById('new-board-description').value,
        authors: ['User'],
        summary: '',
        backgroundColor: '#f5f7fa',
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
    };
    boards.push(newBoard);
    saveAllBoards();
    renderDashboard();
    closeModal('new-board-modal');
}

function deleteBoardFromDashboard(event, boardId) {
    event.stopPropagation();
    if (confirm('Are you sure you want to delete this board? This action cannot be undone.')) {
        boards = boards.filter(b => b.id !== boardId);
        saveAllBoards();
        renderDashboard();
    }
}
