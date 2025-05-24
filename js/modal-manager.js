/**
 * Modal Management
 * Handles all modal operations and UI interactions
 */
class ModalManager {
    constructor() {
        if (ModalManager.instance) {
            return ModalManager.instance;
        }
        ModalManager.instance = this;
        this.setupEventListeners();
    }

    static getInstance() {
        if (!ModalManager.instance) {
            ModalManager.instance = new ModalManager();
        }
        return ModalManager.instance;
    }

    setupEventListeners() {
        // Close modals on outside click
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeModal(modal.id);
                }
            });
        });

        // Close dropdowns on outside click
        document.addEventListener('click', (e) => {
            if (!e.target.matches('.menu-dots')) {
                document.querySelectorAll('.dropdown-menu').forEach(menu => {
                    menu.classList.remove('show');
                });
            }
        });
    }

    openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('show');
        }
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('show');
        }
    }

    toggleDropdownMenu(menuId) {
        const menu = document.getElementById(menuId);
        if (!menu) return;

        // Close all other menus
        document.querySelectorAll('.dropdown-menu').forEach(m => {
            if (m !== menu) m.classList.remove('show');
        });

        menu.classList.toggle('show');
    }

    // Card Modal Management
    openCardModal(columnId, cardId = null) {
        const boardManager = BoardManager.getInstance();
        const cardManager = CardManager.getInstance();
        const currentBoard = boardManager.getCurrentBoard();
        
        if (!currentBoard) return;

        const currentColumn = currentBoard.columns.find(c => c.id === columnId);
        let currentCard = null;

        if (cardId) {
            currentCard = currentColumn.cards.find(c => c.id === cardId);
            document.getElementById('modal-title').textContent = 'Edit Card';
            document.getElementById('card-heading').value = currentCard.heading;
            document.getElementById('card-content').value = currentCard.content;
            document.getElementById('card-color').value = currentCard.color || '#ffffff';
            document.getElementById('card-custom-style').value = currentCard.customStyle || '';
        } else {
            document.getElementById('modal-title').textContent = 'Create New Card';
            document.getElementById('card-form').reset();
        }

        // Populate column select
        const columnSelect = document.getElementById('card-column');
        columnSelect.innerHTML = '';
        currentBoard.columns.forEach(col => {
            const option = document.createElement('option');
            option.value = col.id;
            option.textContent = col.name;
            option.selected = col.id === columnId;
            columnSelect.appendChild(option);
        });

        this.openModal('card-modal');
    }

    // Column Modal Management
    openColumnSettings(columnId) {
        const columnManager = ColumnManager.getInstance();
        const boardManager = BoardManager.getInstance();
        const currentBoard = boardManager.getCurrentBoard();
        
        if (!currentBoard) return;

        const currentColumn = currentBoard.columns.find(c => c.id === columnId);
        if (!currentColumn) return;

        document.getElementById('column-name').value = currentColumn.name;
        document.getElementById('column-color').value = currentColumn.color;
        document.getElementById('column-custom-style').value = currentColumn.customStyle || '';

        this.openModal('column-modal');
    }

    // Board Settings Modal
    openBoardSettings() {
        const boardManager = BoardManager.getInstance();
        const currentBoard = boardManager.getCurrentBoard();
        if (!currentBoard) return;

        document.getElementById('board-name').value = currentBoard.name || '';
        document.getElementById('board-authors-input').value = (currentBoard.authors || []).join(', ');
        document.getElementById('board-summary-input').value = currentBoard.summary || '';
        document.getElementById('board-bg-color').value = currentBoard.backgroundColor || '#f5f7fa';
        document.getElementById('board-custom-style').value = currentBoard.customStyle || '';
        
        // AI Configuration
        if (currentBoard.aiConfig) {
            document.getElementById('ai-provider').value = currentBoard.aiConfig.provider || '';
            document.getElementById('ai-api-key').value = currentBoard.aiConfig.apiKey || '';
        }

        this.openModal('board-settings-modal');
    }

    // New Board Modal
    openNewBoardModal() {
        document.getElementById('new-board-form').reset();
        this.openModal('new-board-modal');
    }

    // Notification System
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        // Style the notification
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 4px;
            color: white;
            font-weight: 500;
            z-index: 10000;
            max-width: 400px;
            word-wrap: break-word;
            transform: translateX(100%);
            transition: transform 0.3s ease;
        `;
        
        // Set background color based on type
        switch (type) {
            case 'success':
                notification.style.backgroundColor = '#28a745';
                break;
            case 'error':
                notification.style.backgroundColor = '#dc3545';
                break;
            case 'warning':
                notification.style.backgroundColor = '#ffc107';
                notification.style.color = '#212529';
                break;
            default:
                notification.style.backgroundColor = '#17a2b8';
        }
        
        // Add to DOM
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 10);
        
        // Auto-remove after 4 seconds
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 4000);
    }    // Column Settings Management
    openColumnSettings(columnId) {
        const columnManager = ColumnManager.getInstance();
        columnManager.openColumnSettings(columnId);
    }

    // Simple confirmation dialog
    showConfirmDialog(message, onConfirm, onCancel = null) {
        if (confirm(message)) {
            if (onConfirm) onConfirm();
        } else {
            if (onCancel) onCancel();
        }
    }

    // Future enhancements placeholder methods
    showAdvancedCardSettings(cardId) {
        // Placeholder for future advanced card settings modal
        console.log('Advanced card settings for:', cardId);
    }

    showAdvancedColumnSettings(columnId) {
        // Placeholder for future advanced column settings modal
        console.log('Advanced column settings for:', columnId);
    }

    showWorkflowSettings(boardId) {
        // Placeholder for future workflow configuration modal
        console.log('Workflow settings for board:', boardId);
    }
}

// Export for use in other modules
window.ModalManager = ModalManager;
