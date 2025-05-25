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

function deleteBoardFromDashboard(event, boardId) {
    event.stopPropagation();
    if (confirm('Are you sure you want to delete this board? This action cannot be undone.')) {
        boards = boards.filter(b => b.id !== boardId);
        renderDashboard();
    }
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
    };
    
    boards.push(newBoard);
    renderDashboard();
    closeModal('new-board-modal');
}
