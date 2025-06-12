// Sidebar functionality
let sidebarOpen = false;

// Open settings sidebar
function openSettingsSidebar() {
    const sidebar = document.getElementById('settings-sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    const boardActionsSection = document.getElementById('board-actions-section');
    
    // Show/hide board-specific actions based on current view and active board
    const boardView = document.getElementById('board-view');
    const dashboard = document.getElementById('dashboard');
    
    // Check if we're actually in board view AND have an active board
    const isInBoardView = boardView && (boardView.style.display === 'flex' || 
                          (boardView.style.display !== 'none' && dashboard && dashboard.style.display === 'none'));
    const hasActiveBoard = window.currentBoard !== null && window.currentBoard !== undefined;
    
    if (isInBoardView && hasActiveBoard) {
        // We're in board view with an active board - show board actions
        boardActionsSection.style.display = 'block';
        initializeSidebarColumnWidth();
        console.log('✅ Showing board actions for:', window.currentBoard.name);
    } else {
        // We're in dashboard view or no active board - hide board actions
        boardActionsSection.style.display = 'none';
        console.log('ℹ️ Hiding board actions - in dashboard or no active board');
    }
    
    sidebar.classList.add('open');
    overlay.classList.add('show');
    sidebarOpen = true;
    
    // Prevent body scroll when sidebar is open
    document.body.style.overflow = 'hidden';
}

// Close settings sidebar
function closeSettingsSidebar() {
    const sidebar = document.getElementById('settings-sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    
    sidebar.classList.remove('open');
    overlay.classList.remove('show');
    sidebarOpen = false;
    
    // Restore body scroll
    document.body.style.overflow = '';
}

// Initialize column width slider in sidebar
function initializeSidebarColumnWidth() {
    const sidebarSlider = document.getElementById('sidebar-column-width-slider');
    const sidebarValue = document.getElementById('sidebar-width-value');
    const mainSlider = document.getElementById('column-width-slider');
    const mainValue = document.getElementById('column-width-value');
    
    if (!sidebarSlider || !sidebarValue) return;
    
    // Sync with main slider if it exists
    if (mainSlider) {
        sidebarSlider.value = mainSlider.value;
        sidebarValue.textContent = mainSlider.value + 'px';
    }
    
    // Update handler
    sidebarSlider.oninput = function() {
        const value = this.value;
        sidebarValue.textContent = value + 'px';
        
        // Update main slider if it exists
        if (mainSlider) {
            mainSlider.value = value;
        }
        if (mainValue) {
            mainValue.textContent = value + 'px';
        }
        
        // Apply the width change
        updateColumnWidth(value);
    };
}

// Update column width function
function updateColumnWidth(width) {
    const columns = document.querySelectorAll('.kanban-column');
    columns.forEach(column => {
        column.style.width = width + 'px';
        column.style.minWidth = width + 'px';
        column.style.maxWidth = width + 'px';
    });
    
    // Update CSS custom property for consistent styling
    document.documentElement.style.setProperty('--kanban-column-width', width + 'px');
    
    // Save to localStorage
    localStorage.setItem('kanban-column-width', width);
    
    // Update all slider values
    const mainSlider = document.getElementById('column-width-slider');
    const mainValue = document.getElementById('column-width-value');
    const sidebarSlider = document.getElementById('sidebar-column-width-slider');
    const sidebarValue = document.getElementById('sidebar-width-value');
    
    if (mainSlider) mainSlider.value = width;
    if (mainValue) mainValue.textContent = width + 'px';
    if (sidebarSlider) sidebarSlider.value = width;
    if (sidebarValue) sidebarValue.textContent = width + 'px';
}

// Close sidebar with Escape key
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape' && sidebarOpen) {
        closeSettingsSidebar();
    }
});

// Initialize sidebar functionality when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('🔧 Sidebar functionality initialized');
    
    // Load saved column width
    const savedWidth = localStorage.getItem('kanban-column-width') || '300';
    
    // Apply saved width to any existing columns
    setTimeout(() => {
        updateColumnWidth(savedWidth);
        
        // Update slider values
        const sidebarSlider = document.getElementById('sidebar-column-width-slider');
        const sidebarValue = document.getElementById('sidebar-width-value');
        const mainSlider = document.getElementById('column-width-slider');
        const mainValue = document.getElementById('column-width-value');
        
        if (sidebarSlider) sidebarSlider.value = savedWidth;
        if (sidebarValue) sidebarValue.textContent = savedWidth + 'px';
        if (mainSlider) mainSlider.value = savedWidth;
        if (mainValue) mainValue.textContent = savedWidth + 'px';
        
        // Also ensure the CSS custom property is set
        document.documentElement.style.setProperty('--kanban-column-width', savedWidth + 'px');
    }, 100);
    
    // Make updateColumnWidth globally available
    window.updateColumnWidth = updateColumnWidth;
});

// Enhanced showPasteHelp function that closes sidebar first
function showPasteHelp() {
    closeSettingsSidebar();
    openSmartPasteModal();
}

// Export single board function with sidebar close
function exportBoard() {
    closeSettingsSidebar();
    
    if (!currentBoard) {
        alert('Kein Board ausgewählt');
        return;
    }
    
    const dataStr = JSON.stringify(currentBoard, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${currentBoard.name || 'board'}.json`;
    link.click();
    URL.revokeObjectURL(url);
}

// Export all boards function with sidebar close
function exportAllBoards() {
    closeSettingsSidebar();
    
    const boards = getAllBoards();
    if (!boards || boards.length === 0) {
        alert('Keine Boards zum Exportieren gefunden');
        return;
    }
    
    const exportData = {
        version: "1.0",
        timestamp: new Date().toISOString(),
        boards: boards
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `kanban-boards-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
}

// Open board settings with sidebar close
function openBoardSettings() {
    closeSettingsSidebar();
    openModal('board-settings-modal');
    loadBoardSettings();
}

// Open AI settings with sidebar close
function openAISettingsModal() {
    closeSettingsSidebar();
    openModal('ai-settings-modal');
    if (typeof loadAISettings === 'function') {
        loadAISettings();
    }
}

// Additional helper functions that might be missing
function getAllBoards() {
    if (typeof loadAllBoards === 'function') {
        return loadAllBoards();
    }
    // Fallback: try to get from localStorage
    try {
        const boardIds = JSON.parse(localStorage.getItem('kanban-boards') || '[]');
        return boardIds.map(id => {
            const boardData = localStorage.getItem(`kanban-board-${id}`);
            return boardData ? JSON.parse(boardData) : null;
        }).filter(board => board !== null);
    } catch (e) {
        console.error('Error loading boards:', e);
        return [];
    }
}

function loadBoardSettings() {
    if (!currentBoard) return;
    
    // Load basic settings
    const boardNameInput = document.getElementById('board-name');
    const boardAuthorsInput = document.getElementById('board-authors-input');
    const boardSummaryInput = document.getElementById('board-summary-input');
    const boardBgColorInput = document.getElementById('board-bg-color');
    
    if (boardNameInput) boardNameInput.value = currentBoard.name || '';
    if (boardAuthorsInput) boardAuthorsInput.value = currentBoard.authors || '';
    if (boardSummaryInput) boardSummaryInput.value = currentBoard.summary || '';
    if (boardBgColorInput) boardBgColorInput.value = currentBoard.backgroundColor || '#f5f7fa';
    
    // Load board color settings
    if (typeof loadBoardColorSettings === 'function') {
        setTimeout(() => loadBoardColorSettings(currentBoard), 200);
    }
    
    // Load AI settings
    const aiProvider = document.getElementById('ai-provider');
    const aiBaseUrl = document.getElementById('ai-base-url');
    const aiApiKey = document.getElementById('ai-api-key');
    const aiModel = document.getElementById('ai-model');
    
    if (currentBoard.aiConfig) {
        if (aiProvider) aiProvider.value = currentBoard.aiConfig.provider || '';
        if (aiBaseUrl) aiBaseUrl.value = currentBoard.aiConfig.baseUrl || '';
        if (aiApiKey) aiApiKey.value = currentBoard.aiConfig.apiKey || '';
        if (aiModel) aiModel.value = currentBoard.aiConfig.model || '';
    }
}

function loadAISettings() {
    // Load global AI settings from localStorage
    const aiSettings = JSON.parse(localStorage.getItem('kanban-ai-settings') || '{}');
    
    const wsUrl = document.getElementById('ai-websocket-url');
    const webhookUrl = document.getElementById('ai-webhook-url');
    const provider = document.getElementById('ai-provider');
    const apiKey = document.getElementById('ai-api-key');
    const model = document.getElementById('ai-model');
    const baseUrl = document.getElementById('ai-base-url');
    
    if (wsUrl) wsUrl.value = aiSettings.websocketUrl || '';
    if (webhookUrl) webhookUrl.value = aiSettings.webhookUrl || '';
    if (provider) provider.value = aiSettings.provider || '';
    if (apiKey) apiKey.value = aiSettings.apiKey || '';
    if (model) model.value = aiSettings.model || '';
    if (baseUrl) baseUrl.value = aiSettings.baseUrl || '';
}
