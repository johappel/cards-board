/**
 /**
 * Main Application Coordinator
 * Initializes and coordinates all modules using standardized ES6 Singleton pattern
 */

// Global module instances for legacy compatibility
let storageManager;
let boardManager;
let columnManager;
let cardManager;
let modalManager;
let dashboardManager;
let aiManager;
let eventManager;

// Initialize Application
document.addEventListener('DOMContentLoaded', function() {
    // Ensure DOM is fully loaded
    setTimeout(() => {
        try {
            initializeModules();
            initializeApplication();
        } catch (error) {
            console.error('Critical initialization error:', error);
            // Show user-friendly error message
            document.body.innerHTML = `
                <div style="padding: 20px; background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; margin: 20px; border-radius: 5px;">
                    <h2>⚠️ Initialization Error</h2>
                    <p>The Cards Board application failed to initialize properly.</p>
                    <p><strong>Error:</strong> ${error.message}</p>
                    <p>Please refresh the page or check the browser console for more details.</p>
                </div>
            `;
        }
    }, 100);
});

// Initialize all modules
function initializeModules() {
    console.log('Initializing modules...');
    
    // Initialize modules in dependency order
    storageManager = StorageManager.getInstance();
    modalManager = ModalManager.getInstance();
    aiManager = AIManager.getInstance();
    boardManager = BoardManager.getInstance();
    columnManager = ColumnManager.getInstance();
    cardManager = CardManager.getInstance();
    dashboardManager = DashboardManager.getInstance();
    eventManager = EventManager.getInstance();
    
    // Make instances globally available for legacy compatibility
    window.storageManager = storageManager;
    window.boardManager = boardManager;
    window.columnManager = columnManager;
    window.cardManager = cardManager;
    window.modalManager = modalManager;
    window.dashboardManager = dashboardManager;
    window.aiManager = aiManager;
    window.eventManager = eventManager;
    
    console.log('All modules initialized successfully');
}

// Initialize the application
function initializeApplication() {
    console.log('Starting application initialization...');
    
    try {
        // Verify that critical DOM elements exist
        const requiredElements = ['dashboard', 'board-view', 'boards-grid'];
        const missingElements = requiredElements.filter(id => !document.getElementById(id));
        
        if (missingElements.length > 0) {
            throw new Error(`Missing required DOM elements: ${missingElements.join(', ')}`);
        }
        
        console.log('✅ All required DOM elements found');
        
        // Load existing boards or create default using standardized getInstance() calls
        StorageManager.getInstance().initializeStorage();
        console.log('✅ Storage initialized');
        
        // Show dashboard initially using standardized getInstance() calls
        DashboardManager.getInstance().showDashboard();
        console.log('✅ Dashboard displayed');
        
        // Setup additional legacy event handlers if needed
        setupLegacyEventHandlers();
        console.log('✅ Legacy event handlers setup');
        
        console.log('🎉 Application initialized successfully');
    } catch (error) {
        console.error('Error initializing application:', error);
        const modalManagerInstance = ModalManager.getInstance();
        if (modalManagerInstance && typeof modalManagerInstance.showNotification === 'function') {
            modalManagerInstance.showNotification('Fehler beim Initialisieren der Anwendung: ' + error.message, 'error');
        } else {
            // Fallback error display
            alert('Fehler beim Initialisieren der Anwendung: ' + error.message);
        }
        throw error; // Re-throw for outer error handler
    }
}

// Setup any remaining legacy event handlers
function setupLegacyEventHandlers() {
    // Add any remaining event handlers that haven't been moved to EventManager
    // This function can be removed once full migration is complete
      // Legacy button handlers that might be called from HTML
    window.openBoard = function(boardId) {
        DashboardManager.getInstance().openBoard(boardId);
    };
    
    window.addColumn = function() {
        ColumnManager.getInstance().openNewColumnDialog();
    };
    
    window.addCard = function(columnId) {
        ModalManager.getInstance().openCardModal(columnId);
    };
    
    window.openCardModal = function(columnId, cardId = null) {
        ModalManager.getInstance().openCardModal(columnId, cardId);
    };
    
    window.openColumnSettings = function(columnId) {
        ModalManager.getInstance().openColumnSettings(columnId);
    };
    
    window.openBoardSettings = function() {
        ModalManager.getInstance().openBoardSettings();
    };
    
    window.openNewBoardModal = function() {
        ModalManager.getInstance().openNewBoardModal();
    };
    
    window.deleteColumn = function(columnId) {
        ColumnManager.getInstance().deleteColumn(columnId);
    };
      window.deleteCard = function(cardId) {
        CardManager.getInstance().deleteCard(cardId);
    };
    
    window.toggleColumnMenu = function(event, columnId) {
        event.stopPropagation();
        ModalManager.getInstance().toggleDropdownMenu(`column-menu-${columnId}`);
    };
    
    window.toggleCardVisibility = function(cardId, columnId) {
        CardManager.getInstance().toggleCardVisibility(cardId, columnId);
    };
    
    window.showDashboard = function() {
        DashboardManager.getInstance().showDashboard();
    };
    
    window.exportBoard = function() {
        BoardManager.getInstance().exportCurrentBoard();
    };
    
    window.exportAllBoards = function() {
        StorageManager.getInstance().exportBoards();
    };
    
    window.importBoards = function() {
        StorageManager.getInstance().importBoards();
    };
    
    window.generateAISummary = function() {
        generateAISummary();
    };
    
    // Additional legacy functions that might be called from HTML onclick attributes
    window.backToDashboard = function() {
        DashboardManager.getInstance().showDashboard();
    };    window.useAsPrompt = function() {
        // Legacy AI prompt function - delegate to AI Manager
        const content = document.getElementById('card-content').value;
        if (!content.trim()) {
            ModalManager.getInstance().showNotification('Bitte geben Sie zuerst Inhalt ein.', 'warning');
            return;
        }
        
        const currentBoard = BoardManager.getInstance().getCurrentBoard();
        if (!currentBoard || !currentBoard.aiConfig?.provider || !currentBoard.aiConfig?.apiKey) {
            ModalManager.getInstance().showNotification('Bitte konfigurieren Sie zuerst die AI-Einstellungen in den Board-Einstellungen.', 'warning');
            return;
        }
        
        // This would be implemented properly with AI integration
        ModalManager.getInstance().showNotification(`Verwende als Prompt: "${content}"`, 'info');
    };

    window.generateWithAI = function() {
        // Legacy AI generation function - delegate to AI Manager
        const currentBoard = BoardManager.getInstance().getCurrentBoard();
        if (!currentBoard || !currentBoard.aiConfig?.provider || !currentBoard.aiConfig?.apiKey) {
            ModalManager.getInstance().showNotification('Bitte konfigurieren Sie zuerst die AI-Einstellungen in den Board-Einstellungen.', 'warning');
            return;
        }
        
        AIManager.getInstance().generateCardContent('Generiere Karteninhalt basierend auf dem aktuellen Kontext')
            .then(cardData => {
                document.getElementById('card-content').value = cardData.content;
                ModalManager.getInstance().showNotification('Inhalt erfolgreich generiert!', 'success');
            })
            .catch(error => {
                ModalManager.getInstance().showNotification('Fehler beim Generieren: ' + error.message, 'error');
            });
    };

    // Download utility function that might be used by modules
    window.downloadJSON = function(data, filename) {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };
}

// Legacy function compatibility layer
// These functions maintain backward compatibility for any remaining references

// Board functions - delegate to BoardManager
function loadBoard(boardId) {
    return BoardManager.getInstance().loadBoard(boardId);
}

function saveBoard() {
    return BoardManager.getInstance().saveCurrentBoard();
}

function saveBoards() {
    return StorageManager.getInstance().saveAllBoards();
}

function loadBoards() {
    return StorageManager.getInstance().getAllBoards();
}

// Modal functions - delegate to ModalManager
function openModal(modalId) {
    return ModalManager.getInstance().openModal(modalId);
}

function closeModal(modalId) {
    return ModalManager.getInstance().closeModal(modalId);
}

// AI functions - delegate to AIManager
function generateAISummary() {
    const currentBoard = BoardManager.getInstance().getCurrentBoard();
    if (!currentBoard) return;
    
    AIManager.getInstance().generateBoardSummary(currentBoard)
        .then(summary => {
            document.getElementById('board-summary-input').value = summary;
            ModalManager.getInstance().showNotification('Zusammenfassung erfolgreich generiert!', 'success');
        })
        .catch(error => {
            ModalManager.getInstance().showNotification('Fehler beim Generieren: ' + error.message, 'error');
        });
}

// Utility functions that might still be needed
function generateId() {
    return StorageManager.getInstance().generateId();
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Export/Import functions
function exportBoards() {
    return StorageManager.getInstance().exportBoards();
}

function importBoards() {
    return StorageManager.getInstance().importBoards();
}

// Dashboard functions
function showDashboard() {
    return DashboardManager.getInstance().showDashboard();
}

function renderDashboard() {
    return DashboardManager.getInstance().renderBoardCards();
}

// Global error handler
window.addEventListener('error', function(e) {
    console.error('Global error:', e.error);
    const modalManagerInstance = ModalManager.getInstance();
    if (modalManagerInstance) {
        modalManagerInstance.showNotification('Ein unerwarteter Fehler ist aufgetreten', 'error');
    }
});

// Global unhandled promise rejection handler
window.addEventListener('unhandledrejection', function(e) {
    console.error('Unhandled promise rejection:', e.reason);
    const modalManagerInstance = ModalManager.getInstance();
    if (modalManagerInstance) {
        modalManagerInstance.showNotification('Ein unerwarteter Fehler ist aufgetreten', 'error');
    }
});

console.log('Cards Board application loaded - modular architecture active');
