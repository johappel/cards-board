// Card Management Module

class CardManager {
    constructor() {
        if (CardManager.instance) {
            return CardManager.instance;
        }
        CardManager.instance = this;
        this.currentCard = null;
    }

    static getInstance() {
        if (!CardManager.instance) {
            CardManager.instance = new CardManager();
        }
        return CardManager.instance;
    }

    getCurrentCard() {
        return this.currentCard;
    }    createCardElement(card, columnId) {
        const isInactive = card.inactive ? 'inactive' : '';
        const cardStyle = card.background ? `background: ${card.background};` : '';
        
        return `
            <div class="kanban-card ${isInactive}" 
                    data-card-id="${card.id}"
                    style="${cardStyle}">
                <div class="card-header">
                    <div class="card-title">${card.heading}</div>
                    <div class="card-actions">
                        <button class="card-btn" onclick="CardManager.getInstance().toggleCardVisibility('${card.id}', '${columnId}')">
                            ${card.inactive ? '👁️‍🗨️' : '👁️'}
                        </button>
                        <button class="card-btn" onclick="CardManager.getInstance().openCardModal('${columnId}', '${card.id}')">⋮</button>
                    </div>
                </div>
                <div class="card-content">${card.content}</div>
                ${card.comments ? `<div class="card-comments">💬 ${card.comments}</div>` : ''}
            </div>
        `;
    }    openCardModal(columnId, cardId = null) {
        const currentBoard = BoardManager.getInstance().getCurrentBoard();
        if (!currentBoard) return;

        const currentColumn = currentBoard.columns.find(c => c.id === columnId);
        if (!currentColumn) return;

        if (cardId) {
            this.currentCard = currentColumn.cards.find(c => c.id === cardId);
            document.getElementById('modal-title').textContent = 'Edit Card';
            document.getElementById('card-heading').value = this.currentCard.heading;
            document.getElementById('card-content').value = this.currentCard.content;
            document.getElementById('card-color').value = this.currentCard.background || 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)';
            
            // Set selected color in palette
            this.setSelectedColorInPalette('card-color-palette', this.currentCard.background);
        } else {
            this.currentCard = null;
            document.getElementById('modal-title').textContent = 'Create New Card';
            document.getElementById('card-form').reset();
            document.getElementById('card-color').value = 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)';
            this.setSelectedColorInPalette('card-color-palette', 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)');
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
          // Setup color palette events
        this.setupColorPalette('card-color-palette', 'card-color', this.updateCardPreview.bind(this));
        
        // Create preview area
        this.createCardPreview();
        
        // Store original column ID for moving cards
        this.originalColumnId = columnId;
        
        ModalManager.getInstance().openModal('card-modal');
    }    saveCard(formData) {
        const currentBoard = BoardManager.getInstance().getCurrentBoard();
        if (!currentBoard) return false;

        const currentColumn = currentBoard.columns.find(c => c.id === formData.originalColumnId);
        const targetColumn = currentBoard.columns.find(c => c.id === formData.columnId);
        
        if (!targetColumn) return false;        const cardData = {
            heading: formData.heading,
            content: formData.content,
            background: formData.background,
            comments: this.currentCard?.comments || '',
            inactive: this.currentCard?.inactive || false
        };
        
        // Future enhancements: validation, tags, due dates, etc.
        
        if (this.currentCard) {
            // Update existing card
            Object.assign(this.currentCard, cardData);
            
            // If column changed, move card
            if (currentColumn && currentColumn.id !== formData.columnId) {
                currentColumn.cards = currentColumn.cards.filter(c => c.id !== this.currentCard.id);
                targetColumn.cards.push(this.currentCard);
            }
        } else {
            // Create new card
            const newCard = {
                id: StorageManager.getInstance().generateId(),
                ...cardData
            };
            targetColumn.cards.push(newCard);
        }
        
        BoardManager.getInstance().saveBoards();
        ColumnManager.getInstance().renderColumns();
        return true;
    }    toggleCardVisibility(cardId, columnId) {
        const currentBoard = BoardManager.getInstance().getCurrentBoard();
        if (!currentBoard) return;

        const column = currentBoard.columns.find(c => c.id === columnId);
        const card = column?.cards.find(c => c.id === cardId);
        
        if (card) {
            card.inactive = !card.inactive;
            BoardManager.getInstance().saveBoards();
            ColumnManager.getInstance().renderColumns();
        }
    }

    // SortableJS Integration
    handleCardMove(event) {
        const cardId = event.item.dataset.cardId;
        const sourceColumnId = event.from.dataset.columnId;
        const targetColumnId = event.to.dataset.columnId;
        
        console.log('Card moved:', cardId, 'from', sourceColumnId, 'to', targetColumnId);
        
        if (sourceColumnId === targetColumnId) {
            // Same column, just reorder
            this.handleCardReorder(sourceColumnId, event.oldIndex, event.newIndex);
        } else {
            // Different column, move card
            this.moveCardBetweenColumns(cardId, sourceColumnId, targetColumnId, event.newIndex);
        }
    }    handleCardReorder(columnId, oldIndex, newIndex) {
        const currentBoard = BoardManager.getInstance().getCurrentBoard();
        if (!currentBoard) return;

        const column = currentBoard.columns.find(c => c.id === columnId);
        if (!column) return;
        
        const [movedCard] = column.cards.splice(oldIndex, 1);
        column.cards.splice(newIndex, 0, movedCard);
        
        BoardManager.getInstance().saveBoards();
        console.log('Card reordered within column');
    }    moveCardBetweenColumns(cardId, sourceColumnId, targetColumnId, newIndex) {
        const currentBoard = BoardManager.getInstance().getCurrentBoard();
        if (!currentBoard) return;

        const sourceColumn = currentBoard.columns.find(c => c.id === sourceColumnId);
        const targetColumn = currentBoard.columns.find(c => c.id === targetColumnId);
        
        if (!sourceColumn || !targetColumn) return;
        
        const cardIndex = sourceColumn.cards.findIndex(c => c.id === cardId);
        if (cardIndex === -1) return;
        
        const [movedCard] = sourceColumn.cards.splice(cardIndex, 1);
        targetColumn.cards.splice(newIndex, 0, movedCard);
        
        BoardManager.getInstance().saveBoards();
        console.log('Card moved between columns');
    }

    // AI Integration
    useAsPrompt() {
        const content = document.getElementById('card-content').value;
        if (!content) {
            return { success: false, message: 'Please enter some content first.' };
        }
        
        // Simulate using content as prompt
        return { 
            success: true, 
            message: `Using as prompt: "${content}"\n\n(In a real implementation, this would send the prompt to the configured AI API)` 
        };
    }

    generateWithAI() {
        const currentBoard = boardManager.getCurrentBoard();
        if (!currentBoard?.aiConfig?.provider || !currentBoard?.aiConfig?.apiKey) {
            return { success: false, message: 'Please configure AI settings in Board Settings first.' };
        }
        
        // Simulate AI content generation
        const mockContent = 'This is AI-generated content based on your prompt. In a real implementation, this would use the configured AI provider to generate meaningful content.';
        
        document.getElementById('card-content').value = mockContent;
        
        return { success: true, message: 'Content generated! (This is a mock implementation)' };
    }

    // Color Palette and Live Preview Methods
    setupColorPalette(paletteId, hiddenInputId, updateCallback) {
        const palette = document.getElementById(paletteId);
        const hiddenInput = document.getElementById(hiddenInputId);
        
        if (!palette || !hiddenInput) return;
        
        palette.addEventListener('click', (e) => {
            if (e.target.classList.contains('color-option')) {
                // Remove previous selection
                palette.querySelectorAll('.color-option').forEach(option => {
                    option.classList.remove('selected');
                });
                
                // Set new selection
                e.target.classList.add('selected');
                const gradient = e.target.dataset.gradient;
                hiddenInput.value = gradient;
                
                // Trigger update callback
                if (updateCallback) {
                    updateCallback(gradient);
                }
            }
        });
    }
    
    setSelectedColorInPalette(paletteId, selectedBackground) {
        const palette = document.getElementById(paletteId);
        if (!palette) return;
        
        // Remove all selections
        palette.querySelectorAll('.color-option').forEach(option => {
            option.classList.remove('selected');
        });
        
        // Find and select the matching option
        const matchingOption = Array.from(palette.querySelectorAll('.color-option')).find(option => 
            option.dataset.gradient === selectedBackground
        );
        
        if (matchingOption) {
            matchingOption.classList.add('selected');
        } else {
            // Default to white if no match found
            const defaultOption = palette.querySelector('.color-option[data-gradient*="ffffff"]');
            if (defaultOption) {
                defaultOption.classList.add('selected');
            }
        }
    }
    
    createCardPreview() {
        const modal = document.getElementById('card-modal');
        const form = modal.querySelector('form');
        
        // Remove existing preview
        const existingPreview = modal.querySelector('.preview-card');
        if (existingPreview) {
            existingPreview.remove();
        }
        
        // Create new preview
        const preview = document.createElement('div');
        preview.className = 'preview-card';
        preview.innerHTML = 'Live-Vorschau der Karte';
        
        // Insert after color palette
        const colorGroup = form.querySelector('.form-group:has(#card-color-palette)');
        if (colorGroup) {
            colorGroup.appendChild(preview);
        }
        
        // Set initial preview
        const currentBackground = document.getElementById('card-color').value;
        this.updateCardPreview(currentBackground);
    }
    
    updateCardPreview(background) {
        const preview = document.querySelector('.preview-card');
        if (preview) {
            preview.style.setProperty('--preview-background', background);
            preview.style.background = background;
        }
    }

    // Future enhancement methods placeholder
    validateCardData(cardData) {
        // Future: Add validation rules for cards
        const errors = [];
        
        if (!cardData.heading || cardData.heading.trim() === '') {
            errors.push('Card heading is required');
        }
        
        return { valid: errors.length === 0, errors };
    }

    addCardTag(cardId, tag) {
        // Future: Add tag system
        console.log('Card tag system to be implemented');
    }

    setCardDueDate(cardId, dueDate) {
        // Future: Add due date functionality
        console.log('Card due date system to be implemented');
    }

    addCardComment(cardId, comment) {
        // Future: Enhanced comment system
        console.log('Enhanced card comment system to be implemented');
    }

    getCardHistory(cardId) {
        // Future: Card change history
        console.log('Card history tracking to be implemented');
    }

    assignCardToUser(cardId, userId) {
        // Future: User assignment system
        console.log('Card assignment system to be implemented');
    }
}

// Export for use in other modules
window.CardManager = CardManager;
