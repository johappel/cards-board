// Card Functions
function openCardModal(columnId, cardId = null) {
    currentColumn = currentBoard.columns.find(c => c.id === columnId);
    if (cardId) {
        currentCard = currentColumn.cards.find(c => c.id === cardId);
        document.getElementById('modal-title').textContent = 'Edit Card';
        document.getElementById('card-heading').value = currentCard.heading;
        document.getElementById('card-content').value = currentCard.content;
        document.getElementById('card-color').value = currentCard.color || 'color-gradient-1';
        document.getElementById('card-thumbnail').value = currentCard.thumbnail || '';
        setSelectedColor('card-color-palette', currentCard.color || 'color-gradient-1');
    } else {
        currentCard = null;
        document.getElementById('modal-title').textContent = 'Create New Card';
        document.getElementById('card-form').reset();
        document.getElementById('card-color').value = 'color-gradient-1';
        document.getElementById('card-thumbnail').value = '';
        setSelectedColor('card-color-palette', 'color-gradient-1');
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
    const thumbnail = document.getElementById('card-thumbnail').value;
    const cardData = {
        heading,
        content,
        color,
        thumbnail,
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
    saveAllBoards();
    renderColumns();
    closeModal('card-modal');
}

function toggleCardVisibility(cardId, columnId) {
    const column = currentBoard.columns.find(c => c.id === columnId);
    const card = column.cards.find(c => c.id === cardId);
    if (card) {
        card.inactive = !card.inactive;
        if (card.inactive) card.expanded = false;
        saveAllBoards();
        renderColumns();
    }
}

function toggleCardExpand(event, cardId, columnId) {
    event.stopPropagation();
    const column = currentBoard.columns.find(c => c.id === columnId);
    const card = column.cards.find(c => c.id === cardId);
    if (!card) return;
    if (card.inactive) return; // Minimierte Karten können nicht expandiert werden
    card.expanded = !card.expanded;
    saveAllBoards();
    renderColumns();
}

function createCardElement(card, columnId) {
    const colorClass = card.color || 'color-gradient-1';
    let previewText = '';
    if (card.content) {
        const match = card.content.match(/[^.!?\n]+[.!?\n]/);
        previewText = match ? match[0] : card.content.substring(0, 240);
        if (previewText.length > 240) previewText = previewText.substring(0, 240) + '...';
    }
    return `
        <div class="kanban-card ${colorClass}" 
             draggable="true" 
             ondragstart="dragStart(event, '${card.id}')"
             ondragend="dragEnd(event)"
             data-card-id="${card.id}"
             ondblclick="showCardFullModal('${card.id}', '${columnId}')"
             ontouchstart="cardTouchStart(event, '${card.id}', '${columnId}')"
             ontouchend="cardTouchEnd(event)">
            ${card.thumbnail ? `<div class='card-thumb'><img src='${card.thumbnail}' alt='thumbnail' /></div>` : ''}
            <div class="card-header">
                <div class="card-title">${card.heading || ''}</div>
                <div class="card-actions">
                    <button class="card-btn" onclick="event.stopPropagation();openCardModal('${columnId}', '${card.id}')">⋮</button>
                </div>
            </div>
            <div class="card-preview-content">${previewText}</div>
        </div>
    `;
}

// Touch-Logik für langes Halten
let cardTouchTimer = null;
function cardTouchStart(event, cardId, columnId) {
    cardTouchTimer = setTimeout(() => {
        showCardFullModal(cardId, columnId);
    }, 500);
}
function cardTouchEnd(event) {
    if (cardTouchTimer) clearTimeout(cardTouchTimer);
}

// Vollständiges Card-Modal anzeigen
function showCardFullModal(cardId, columnId) {
    const column = currentBoard.columns.find(c => c.id === columnId);
    const card = column.cards.find(c => c.id === cardId);
    if (!card) return;
    // Modal erzeugen
    let modal = document.getElementById('full-card-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'full-card-modal';
        modal.className = 'modal show';
        document.body.appendChild(modal);
    }
    // Modal-Inhalt
    modal.innerHTML = `
        <div class="modal-content ${card.color || ''}" style="max-width:600px;">
            <div class="modal-header">
                <h2>${card.heading || ''}</h2>
                <div style="display:flex;gap:0.5rem;align-items:center;">
                    <button class="card-btn" onclick="openCardModal('${columnId}', '${cardId}')">⋮</button>
                    <button class="close-btn" onclick="closeCardFullModal()">&times;</button>
                </div>
            </div>
            ${card.thumbnail ? `<div class='card-thumb-modal'><img src='${card.thumbnail}' alt='thumbnail' /></div>` : ''}
            <div class="card-content-full">${card.content || ''}</div>
        </div>
    `;
    modal.onclick = function(e) { if (e.target === modal) closeCardFullModal(); };
}
function closeCardFullModal() {
    const modal = document.getElementById('full-card-modal');
    if (modal) modal.remove();
}