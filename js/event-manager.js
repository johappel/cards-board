/**
 * Event Management
 * Handles global event listeners and cross-module coordination
 */
class EventManager {
    constructor() {
        if (EventManager.instance) {
            return EventManager.instance;
        }
        EventManager.instance = this;
        this.eventListeners = new Map();
        this.setupGlobalEventListeners();
    }

    static getInstance() {
        if (!EventManager.instance) {
            EventManager.instance = new EventManager();
        }
        return EventManager.instance;
    }

    setupGlobalEventListeners() {
        // Form submissions
        this.setupFormEventListeners();
        
        // Keyboard shortcuts
        this.setupKeyboardShortcuts();
        
        // Window events
        this.setupWindowEventListeners();
        
        // Modal events
        this.setupModalEventListeners();
    }

    setupFormEventListeners() {
        // Card form submission
        const cardForm = document.getElementById('card-form');
        if (cardForm) {
            cardForm.addEventListener('submit', (e) => this.handleCardFormSubmit(e));
        }

        // Column form submission
        const columnForm = document.getElementById('column-form');
        if (columnForm) {
            columnForm.addEventListener('submit', (e) => this.handleColumnFormSubmit(e));
        }

        // Board settings form submission
        const boardSettingsForm = document.getElementById('board-settings-form');
        if (boardSettingsForm) {
            boardSettingsForm.addEventListener('submit', (e) => this.handleBoardSettingsSubmit(e));
        }

        // New board form submission
        const newBoardForm = document.getElementById('new-board-form');
        if (newBoardForm) {
            newBoardForm.addEventListener('submit', (e) => this.handleNewBoardSubmit(e));
        }

        // AI form submissions
        const aiSummaryForm = document.getElementById('ai-summary-form');
        if (aiSummaryForm) {
            aiSummaryForm.addEventListener('submit', (e) => this.handleAISummarySubmit(e));
        }

        const aiCardForm = document.getElementById('ai-card-form');
        if (aiCardForm) {
            aiCardForm.addEventListener('submit', (e) => this.handleAICardSubmit(e));
        }
    }

    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + N: New card
            if ((e.ctrlKey || e.metaKey) && e.key === 'n' && !e.shiftKey) {
                e.preventDefault();
                this.handleNewCardShortcut();
            }
            
            // Ctrl/Cmd + Shift + N: New board
            if ((e.ctrlKey || e.metaKey) && e.key === 'N' && e.shiftKey) {
                e.preventDefault();
                this.handleNewBoardShortcut();
            }
            
            // Ctrl/Cmd + S: Save/Export
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                this.handleSaveShortcut();
            }
            
            // Ctrl/Cmd + D: Dashboard
            if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
                e.preventDefault();
                this.handleDashboardShortcut();
            }
            
            // Escape: Close modals
            if (e.key === 'Escape') {
                this.handleEscapeKey();
            }
        });
    }

    setupWindowEventListeners() {
        // Auto-save on page unload
        window.addEventListener('beforeunload', (e) => {
            const boardManager = BoardManager.getInstance();
            boardManager.autoSave();
        });

        // Handle window resize
        window.addEventListener('resize', () => {
            this.handleWindowResize();
        });
    }

    setupModalEventListeners() {
        // Close buttons for all modals
        document.querySelectorAll('.modal .close').forEach(closeBtn => {
            closeBtn.addEventListener('click', (e) => {
                const modal = e.target.closest('.modal');
                if (modal) {
                    const modalManager = ModalManager.getInstance();
                    modalManager.closeModal(modal.id);
                }
            });
        });    }

    // Form submission handlers
    handleCardFormSubmit(e) {
        e.preventDefault();
        const cardManager = CardManager.getInstance();
        const modalManager = ModalManager.getInstance();
          const cardData = {
            heading: document.getElementById('card-heading').value,
            content: document.getElementById('card-content').value,
            background: document.getElementById('card-color').value,
            originalColumnId: cardManager.originalColumnId,
            columnId: document.getElementById('card-column').value
        };
        
        try {
            if (cardManager.saveCard(cardData)) {
                modalManager.closeModal('card-modal');
                modalManager.showNotification('Karte erfolgreich gespeichert!', 'success');
            } else {
                modalManager.showNotification('Fehler beim Speichern der Karte', 'error');
            }
        } catch (error) {
            modalManager.showNotification('Fehler beim Speichern der Karte: ' + error.message, 'error');
        }
    }    handleColumnFormSubmit(e) {
        e.preventDefault();
        const columnManager = ColumnManager.getInstance();
        const modalManager = ModalManager.getInstance();
        
        const columnData = {
            name: document.getElementById('column-name').value,
            background: document.getElementById('column-color').value
        };
        
        try {
            if (columnManager.saveColumn(columnData)) {
                modalManager.closeModal('column-modal');
                modalManager.showNotification('Spalte erfolgreich gespeichert!', 'success');
            } else {
                modalManager.showNotification('Fehler beim Speichern der Spalte', 'error');
            }
        } catch (error) {
            modalManager.showNotification('Fehler beim Speichern der Spalte: ' + error.message, 'error');
        }
    }

    handleBoardSettingsSubmit(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const boardManager = BoardManager.getInstance();
        const modalManager = ModalManager.getInstance();
        
        const boardData = {
            name: formData.get('name'),
            authors: formData.get('authors').split(',').map(a => a.trim()),
            summary: formData.get('summary'),
            backgroundColor: formData.get('backgroundColor'),
            customStyle: formData.get('customStyle'),
            aiConfig: {
                provider: formData.get('aiProvider'),
                apiKey: formData.get('apiKey')
            }
        };
        
        try {
            boardManager.updateBoardSettings(boardData);
            modalManager.closeModal('board-settings-modal');
            modalManager.showNotification('Board-Einstellungen gespeichert!', 'success');
        } catch (error) {
            modalManager.showNotification('Fehler beim Speichern der Einstellungen: ' + error.message, 'error');
        }
    }

    handleNewBoardSubmit(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const dashboardManager = DashboardManager.getInstance();
        const modalManager = ModalManager.getInstance();
        
        const name = formData.get('name');
        const description = formData.get('description');
        
        if (!name.trim()) {
            modalManager.showNotification('Board-Name ist erforderlich', 'error');
            return;
        }
        
        try {
            dashboardManager.createNewBoard(name, description);
            modalManager.closeModal('new-board-modal');
            e.target.reset();
        } catch (error) {
            modalManager.showNotification('Fehler beim Erstellen des Boards: ' + error.message, 'error');
        }
    }

    async handleAISummarySubmit(e) {
        e.preventDefault();
        const aiManager = AIManager.getInstance();
        const boardManager = BoardManager.getInstance();
        const modalManager = ModalManager.getInstance();
        
        const currentBoard = boardManager.getCurrentBoard();
        if (!currentBoard) return;
        
        try {
            const summary = await aiManager.generateBoardSummary(currentBoard);
            document.getElementById('board-summary-input').value = summary;
            modalManager.showNotification('Zusammenfassung erfolgreich generiert!', 'success');
        } catch (error) {
            modalManager.showNotification('Fehler beim Generieren der Zusammenfassung: ' + error.message, 'error');
        }
    }

    async handleAICardSubmit(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const aiManager = AIManager.getInstance();
        const modalManager = ModalManager.getInstance();
        
        const prompt = formData.get('prompt');
        const columnId = formData.get('columnId');
        
        if (!prompt.trim()) {
            modalManager.showNotification('Prompt ist erforderlich', 'error');
            return;
        }
        
        try {
            const cardData = await aiManager.generateCardContent(prompt, { columnId });
            document.getElementById('card-heading').value = cardData.heading;
            document.getElementById('card-content').value = cardData.content;
            modalManager.closeModal('ai-card-modal');
            modalManager.showNotification('Karte erfolgreich generiert!', 'success');
        } catch (error) {
            modalManager.showNotification('Fehler beim Generieren der Karte: ' + error.message, 'error');
        }
    }

    // Keyboard shortcut handlers
    handleNewCardShortcut() {
        const boardManager = BoardManager.getInstance();
        const modalManager = ModalManager.getInstance();
        const currentBoard = boardManager.getCurrentBoard();
        
        if (currentBoard && currentBoard.columns.length > 0) {
            // Open card modal for first column
            modalManager.openCardModal(currentBoard.columns[0].id);
        }
    }

    handleNewBoardShortcut() {
        const modalManager = ModalManager.getInstance();
        modalManager.openNewBoardModal();
    }

    handleSaveShortcut() {
        const boardManager = BoardManager.getInstance();
        boardManager.saveCurrentBoard();
    }

    handleDashboardShortcut() {
        const dashboardManager = DashboardManager.getInstance();
        dashboardManager.showDashboard();
    }

    handleEscapeKey() {
        // Close all open modals
        document.querySelectorAll('.modal.show').forEach(modal => {
            const modalManager = ModalManager.getInstance();
            modalManager.closeModal(modal.id);
        });
        
        // Close all open dropdowns
        document.querySelectorAll('.dropdown-menu.show').forEach(menu => {
            menu.classList.remove('show');
        });
    }    handleWindowResize() {
        // Handle responsive layout adjustments
        const boardView = document.getElementById('board-view');
        if (boardView) {
            // Future enhancement: Adjust column widths or layout
        }
    }

    // Custom event system for cross-module communication
    addEventListener(eventName, callback) {
        if (!this.eventListeners.has(eventName)) {
            this.eventListeners.set(eventName, []);
        }
        this.eventListeners.get(eventName).push(callback);
    }

    removeEventListener(eventName, callback) {
        const listeners = this.eventListeners.get(eventName);
        if (listeners) {
            const index = listeners.indexOf(callback);
            if (index > -1) {
                listeners.splice(index, 1);
            }
        }
    }

    emit(eventName, data) {
        const listeners = this.eventListeners.get(eventName);
        if (listeners) {
            listeners.forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in event listener for ${eventName}:`, error);
                }
            });
        }
    }

    // Future enhancements placeholder methods
    setupAdvancedKeyboardShortcuts() {
        // Placeholder for more advanced keyboard shortcuts
        console.log('Setting up advanced keyboard shortcuts');
    }

    setupTouchGestures() {
        // Placeholder for mobile touch gesture support
        console.log('Setting up touch gestures');
    }

    setupCollaborationEvents() {
        // Placeholder for real-time collaboration events
        console.log('Setting up collaboration events');
    }

    setupNotificationSystem() {
        // Placeholder for push notification system
        console.log('Setting up notification system');
    }
}

// Export for use in other modules
window.EventManager = EventManager;
