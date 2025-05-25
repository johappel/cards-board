
// Board Settings Functions
function openBoardSettings() {    document.getElementById('board-name').value = currentBoard.name;
    document.getElementById('board-authors-input').value = currentBoard.authors.join(', ');
    document.getElementById('board-summary-input').value = currentBoard.summary;
    document.getElementById('board-bg-color').value = currentBoard.backgroundColor;
    document.getElementById('ai-provider').value = currentBoard.aiConfig?.provider || '';
    document.getElementById('ai-api-key').value = currentBoard.aiConfig?.apiKey || '';
    document.getElementById('ai-model').value = currentBoard.aiConfig?.model || '';
    document.getElementById('ai-base-url').value = currentBoard.aiConfig?.baseUrl || '';
    
    toggleAIFields();
    openModal('board-settings-modal');
}

function toggleAIFields() {
    const provider = document.getElementById('ai-provider').value;
    const baseUrlGroup = document.getElementById('ai-base-url-group');
    
    if (provider === 'custom') {
        baseUrlGroup.style.display = 'block';
    } else {
        baseUrlGroup.style.display = 'none';
    }
}

function saveBoardSettings(e) {
    e.preventDefault();
      currentBoard.name = document.getElementById('board-name').value;
    currentBoard.authors = document.getElementById('board-authors-input').value.split(',').map(a => a.trim());
    currentBoard.summary = document.getElementById('board-summary-input').value;
    currentBoard.backgroundColor = document.getElementById('board-bg-color').value;
    currentBoard.aiConfig = {
        provider: document.getElementById('ai-provider').value,
        apiKey: document.getElementById('ai-api-key').value,
        model: document.getElementById('ai-model').value,
        baseUrl: document.getElementById('ai-base-url').value
    };
    
    updateBoardView();
    closeModal('board-settings-modal');
}

function deleteBoard() {
    if (confirm('Are you sure you want to delete this board? This action cannot be undone.')) {
        boards = boards.filter(b => b.id !== currentBoard.id);
        backToDashboard();
    }
}