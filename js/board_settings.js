// Board Settings Functions
function openBoardSettings() {
    document.getElementById('board-name').value = currentBoard.name;
    document.getElementById('board-authors-input').value = currentBoard.authors.join(', ');
    document.getElementById('board-summary-input').value = currentBoard.summary;
    document.getElementById('board-bg-color').value = currentBoard.backgroundColor;
    document.getElementById('board-custom-style').value = currentBoard.customStyle || '';
    
    // Load board color settings
    if (typeof loadBoardColorSettings === 'function') {
        loadBoardColorSettings(currentBoard);
    }
    
    
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

async function saveBoardSettings(e) {
    e.preventDefault();
    currentBoard.name = document.getElementById('board-name').value;
    currentBoard.authors = document.getElementById('board-authors-input').value.split(',').map(a => a.trim());
    currentBoard.summary = document.getElementById('board-summary-input').value;
    currentBoard.backgroundColor = document.getElementById('board-bg-color').value;
    currentBoard.customStyle = document.getElementById('board-custom-style').value;
    
    // Save board color settings
    if (typeof saveBoardColorSettings === 'function') {
        saveBoardColorSettings(currentBoard);
    }
    
    // Save board background hex separately (without transparency)
    if (typeof getCurrentBoardBackgroundHex === 'function') {
        currentBoard.backgroundHex = getCurrentBoardBackgroundHex();
    }
    
    // AI-Konfiguration wird nicht mehr pro Board gespeichert
    updateBoardView();
    
    // Apply board background style
    if (typeof applyBoardBackgroundStyle === 'function') {
        applyBoardBackgroundStyle();
    }
    
    // Save changes asynchronously
    try {
        if (typeof saveAllBoards === 'function') {
            await saveAllBoards();
        }
    } catch (error) {
        console.error('Failed to save board settings:', error);
    }
    
    closeModal('board-settings-modal');
}

function deleteBoard() {
    if (confirm('Are you sure you want to delete this board? This action cannot be undone.')) {
        boards = boards.filter(b => b.id !== currentBoard.id);
        backToDashboard();
    }
}

// Tab switching function for board settings
function switchBoardTab(tabName) {
    // Hide all tab contents
    document.querySelectorAll('#board-settings-modal .tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Remove active class from all tab buttons
    document.querySelectorAll('#board-settings-modal .tab-button').forEach(button => {
        button.classList.remove('active');
    });
    
    // Show selected tab content
    document.getElementById(`board-tab-${tabName}`).classList.add('active');
    
    // Add active class to clicked button
    event.target.classList.add('active');
}