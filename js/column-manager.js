// Column Management Module

class ColumnManager {
    constructor() {
        if (ColumnManager.instance) {
            return ColumnManager.instance;
        }
        ColumnManager.instance = this;
        this.currentColumn = null;
        this.sortableInstances = [];
    }

    static getInstance() {
        if (!ColumnManager.instance) {
            ColumnManager.instance = new ColumnManager();
        }
        return ColumnManager.instance;
    }

    getCurrentColumn() {
        return this.currentColumn;
    }    createColumnElement(column) {
        const columnEl = document.createElement('div');
        columnEl.className = 'kanban-column';
        columnEl.dataset.columnId = column.id;
        
        if (column.background) {
            columnEl.style.background = column.background;
        }
        
        columnEl.innerHTML = `
            <div class="column-header">
                <div class="column-title-section">
                    <button class="column-drag-handle">⋮⋮</button>
                    <div class="column-title">${column.name}</div>
                </div>
                <div class="column-actions">
                    <button class="menu-dots" onclick="ColumnManager.getInstance().toggleColumnMenu(event, '${column.id}')">⋮</button>
                    <div class="dropdown-menu" id="column-menu-${column.id}">                        <div class="dropdown-item" onclick="ColumnManager.getInstance().openColumnSettings('${column.id}')">Settings</div>
                        <div class="dropdown-item" onclick="ColumnManager.getInstance().exportColumn('${column.id}')">Export</div>
                        <div class="dropdown-item" onclick="ColumnManager.getInstance().deleteColumn('${column.id}')">Delete</div>
                    </div>
                </div>
            </div>            <div class="column-content" data-column-id="${column.id}">
                ${column.cards.map(card => CardManager.getInstance().createCardElement(card, column.id)).join('')}
            </div>
            <button class="add-card-btn" onclick="CardManager.getInstance().openCardModal('${column.id}')">+ Add Card</button>
        `;
        
        return columnEl;
    }    renderColumns() {
        const boardContainer = document.getElementById('kanban-board');
        boardContainer.innerHTML = '';
        
        const currentBoard = BoardManager.getInstance().getCurrentBoard();
        if (!currentBoard) return;

        console.log('Rendering columns:', currentBoard.columns.length);
        
        // Add existing columns
        currentBoard.columns.forEach(column => {
            const columnEl = this.createColumnElement(column);
            boardContainer.appendChild(columnEl);
        });
        
        // Add "New Column" button
        const addColumnBtn = document.createElement('button');
        addColumnBtn.className = 'btn btn-secondary';
        addColumnBtn.style.minWidth = '200px';
        addColumnBtn.textContent = '+ Add Column';
        addColumnBtn.onclick = () => this.addNewColumn();
        boardContainer.appendChild(addColumnBtn);
        
        // Initialize SortableJS after DOM is ready
        setTimeout(() => this.initializeSortable(), 0);
    }    addNewColumn() {
        const currentBoard = BoardManager.getInstance().getCurrentBoard();
        if (!currentBoard) return;        const newColumn = {
            id: StorageManager.getInstance().generateId(),
            name: 'New Column',
            background: 'linear-gradient(135deg, #e9ecef 0%, #f8f9fa 100%)',
            cards: []
        };
        
        currentBoard.columns.push(newColumn);
        BoardManager.getInstance().saveBoards();
        this.renderColumns();
    }

    toggleColumnMenu(event, columnId) {
        event.stopPropagation();
        const menu = document.getElementById(`column-menu-${columnId}`);
        
        // Close all other menus
        document.querySelectorAll('.dropdown-menu').forEach(m => {
            if (m !== menu) m.classList.remove('show');
        });
        
        menu.classList.toggle('show');
    }    openColumnSettings(columnId) {
        const currentBoard = BoardManager.getInstance().getCurrentBoard();
        if (!currentBoard) return;

        this.currentColumn = currentBoard.columns.find(c => c.id === columnId);
        if (!this.currentColumn) return;
        
        document.getElementById('column-name').value = this.currentColumn.name;
        document.getElementById('column-color').value = this.currentColumn.background || 'linear-gradient(135deg, #e9ecef 0%, #f8f9fa 100%)';
        
        // Set selected color in palette
        this.setSelectedColorInPalette('column-color-palette', this.currentColumn.background);
        
        // Setup color palette events
        this.setupColorPalette('column-color-palette', 'column-color', this.updateColumnPreview.bind(this));
        
        // Create preview area
        this.createColumnPreview();
        
        ModalManager.getInstance().openModal('column-modal');
    }    saveColumn(formData) {
        if (!this.currentColumn) return false;
        
        // Advanced column settings can be added here in the future
        this.currentColumn.name = formData.name;
        this.currentColumn.background = formData.background;
        
        // Future enhancements: validation rules, workflow settings, etc.
        
        BoardManager.getInstance().saveBoards();
        this.renderColumns();
        return true;
    }

    deleteColumn(columnId) {
        const currentBoard = BoardManager.getInstance().getCurrentBoard();
        if (!currentBoard) return;

        if (confirm('Are you sure you want to delete this column?')) {
            currentBoard.columns = currentBoard.columns.filter(c => c.id !== columnId);
            BoardManager.getInstance().saveBoards();
            this.renderColumns();
        }
    }

    exportColumn(columnId) {
        const currentBoard = BoardManager.getInstance().getCurrentBoard();
        if (!currentBoard) return;

        const column = currentBoard.columns.find(c => c.id === columnId);
        if (!column) return;
        
        StorageManager.getInstance().exportColumn(column);
    }

    // SortableJS Integration
    initializeSortable() {
        // Clean up existing instances
        this.sortableInstances.forEach(instance => instance.destroy());
        this.sortableInstances = [];

        const boardContainer = document.getElementById('kanban-board');
        
        // Initialize column sorting
        const columnSortable = new Sortable(boardContainer, {
            animation: 150,
            handle: '.column-drag-handle',
            filter: '.btn-secondary', // Exclude the "Add Column" button
            onEnd: (event) => {
                this.handleColumnReorder(event.oldIndex, event.newIndex);
            }
        });
        this.sortableInstances.push(columnSortable);
        
        // Initialize card sorting for each column
        document.querySelectorAll('.column-content').forEach(columnContent => {
            const cardSortable = new Sortable(columnContent, {
                group: 'cards', // Allow cards to be moved between columns
                animation: 150,
                onEnd: (event) => {
                    cardManager.handleCardMove(event);
                }
            });
            this.sortableInstances.push(cardSortable);
        });
    }    handleColumnReorder(oldIndex, newIndex) {
        console.log('Column reordered from', oldIndex, 'to', newIndex);
        
        if (oldIndex === newIndex) return;
        
        const currentBoard = BoardManager.getInstance().getCurrentBoard();
        if (!currentBoard) return;

        const newColumns = [...currentBoard.columns];
        const [movedColumn] = newColumns.splice(oldIndex, 1);
        newColumns.splice(newIndex, 0, movedColumn);
        
        currentBoard.columns = newColumns;
        BoardManager.getInstance().saveBoards();
        
        console.log('Column reordering completed');
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
            // Default to gray if no match found
            const defaultOption = palette.querySelector('.color-option[data-gradient*="e9ecef"]');
            if (defaultOption) {
                defaultOption.classList.add('selected');
            }
        }
    }
    
    createColumnPreview() {
        const modal = document.getElementById('column-modal');
        const form = modal.querySelector('form');
        
        // Remove existing preview
        const existingPreview = modal.querySelector('.preview-column');
        if (existingPreview) {
            existingPreview.remove();
        }
        
        // Create new preview
        const preview = document.createElement('div');
        preview.className = 'preview-column';
        preview.innerHTML = 'Live-Vorschau der Spalte';
        
        // Insert after color palette
        const colorGroup = form.querySelector('.form-group:has(#column-color-palette)');
        if (colorGroup) {
            colorGroup.appendChild(preview);
        }
        
        // Set initial preview
        const currentBackground = document.getElementById('column-color').value;
        this.updateColumnPreview(currentBackground);
    }
    
    updateColumnPreview(background) {
        const preview = document.querySelector('.preview-column');
        if (preview) {
            preview.style.setProperty('--preview-background', background);
            preview.style.background = background;
        }
    }

    // Future enhancement methods placeholder
    validateColumnRules(columnData) {
        // Future: Add validation rules for columns
        return { valid: true, errors: [] };
    }

    applyColumnWorkflow(columnId, workflowSettings) {
        // Future: Apply workflow rules to columns
        console.log('Column workflow settings to be implemented');
    }    getColumnStatistics(columnId) {
        // Future: Calculate column statistics
        const currentBoard = BoardManager.getInstance().getCurrentBoard();
        if (!currentBoard) return null;

        const column = currentBoard.columns.find(c => c.id === columnId);
        if (!column) return null;

        return {
            cardCount: column.cards.length,
            activeCards: column.cards.filter(c => !c.inactive).length,
            inactiveCards: column.cards.filter(c => c.inactive).length
        };
    }
}

// Export for use in other modules
window.ColumnManager = ColumnManager;
