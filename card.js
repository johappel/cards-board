// Card Functions
function openCardModal(columnId, cardId = null) {
    currentColumn = currentBoard.columns.find(c => c.id === columnId);
    
    if (cardId) {
        currentCard = currentColumn.cards.find(c => c.id === cardId);
        document.getElementById('modal-title').textContent = 'Edit Card';        document.getElementById('card-heading').value = currentCard.heading;
        document.getElementById('card-content').value = currentCard.content;
        document.getElementById('card-color').value = currentCard.color || '#ffffff';
    } else {
        currentCard = null;
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
    
    openModal('card-modal');
}

function saveCard(e) {
    e.preventDefault();
      const heading = document.getElementById('card-heading').value;
    const content = document.getElementById('card-content').value;
    const columnId = document.getElementById('card-column').value;
    const color = document.getElementById('card-color').value;
    
    const cardData = {
        heading,
        content,
        color,
        comments: currentCard?.comments || '',
        inactive: currentCard?.inactive || false
    };
    
    const targetColumn = currentBoard.columns.find(c => c.id === columnId);
    
    if (currentCard) {
        // Update existing card
        Object.assign(currentCard, cardData);
        
        // If column changed, move card
        if (currentColumn.id !== columnId) {
            currentColumn.cards = currentColumn.cards.filter(c => c.id !== currentCard.id);
            targetColumn.cards.push(currentCard);
        }
    } else {
        // Create new card
        const newCard = {
            id: generateId(),
            ...cardData
        };
        targetColumn.cards.push(newCard);
    }
    
    renderColumns();
    closeModal('card-modal');
}

function toggleCardVisibility(cardId, columnId) {
    const column = currentBoard.columns.find(c => c.id === columnId);
    const card = column.cards.find(c => c.id === cardId);
    
    if (card) {
        card.inactive = !card.inactive;
        renderColumns();
    }
}

function createCardElement(card, columnId) {
    const isInactive = card.inactive ? 'inactive' : '';
    const cardStyle = card.color ? `background-color: ${card.color};` : '';
    
    return `
        <div class="kanban-card ${isInactive}" 
             draggable="true" 
             ondragstart="dragStart(event, '${card.id}')"
             ondragend="dragEnd(event)"
             data-card-id="${card.id}"
             style="${cardStyle}">
            <div class="card-header">
                <div class="card-title">${card.heading}</div>
                <div class="card-actions">
                    <button class="card-btn" onclick="toggleCardVisibility('${card.id}', '${columnId}')">
                        ${card.inactive ? '👁️‍🗨️' : '👁️'}
                    </button>
                    <button class="card-btn" onclick="openCardModal('${columnId}', '${card.id}')">⋮</button>
                </div>
            </div>
            <div class="card-content">${card.content}</div>
            ${card.comments ? `<div class="card-comments">💬 ${card.comments}</div>` : ''}
        </div>
    `;
}