// Card Functions

// Variable für die aktuell ausgewählte Karte (für Keyboard-Löschung)
let selectedCardData = null;

function deleteCard(cardId, columnId) {
    // if (!confirm('Sind Sie sicher, dass Sie diese Karte löschen möchten?')) {
    //     return;
    // }

    const column = currentBoard.columns.find(c => c.id === columnId);
    if (!column) {
        console.error('Column not found:', columnId);
        return;
    }

    const cardIndex = column.cards.findIndex(c => c.id === cardId);
    if (cardIndex === -1) {
        console.error('Card not found:', cardId);
        return;
    }

    // Karte aus der Spalte entfernen
    column.cards.splice(cardIndex, 1);

    // Speichern und Anzeige aktualisieren
    saveAllBoards();
    renderColumns();

    // Eventuell offenes Full Card Modal schließen
    const fullModal = document.getElementById('full-card-modal');
    if (fullModal) {
        closeCardFullModal();
    }

    // Card Modal schließen, falls es offen ist
    closeModal('card-modal');

    // Ausgewählte Karte zurücksetzen
    selectedCardData = null;
}

function selectCard(cardId, columnId) {
    // Alle Karten deselektieren
    document.querySelectorAll('.kanban-card').forEach(card => {
        card.classList.remove('selected');
    });

    // Paste-Spalte deselektieren (Karten-Auswahl und Paste-Auswahl sind separate Funktionen)
    if (typeof selectedColumnForPaste !== 'undefined' && selectedColumnForPaste !== null) {
        selectedColumnForPaste = null;

        // Visuelle Deselektierung aller Spalten für Paste
        document.querySelectorAll('.kanban-column').forEach(col => {
            col.classList.remove('selected-for-paste');
        });
    }

    // Karte auswählen
    const cardElement = document.querySelector(`[data-card-id="${cardId}"]`);
    if (cardElement) {
        cardElement.classList.add('selected');
        selectedCardData = { cardId, columnId };

        console.log('🎯 Card selected:', cardId, 'in column:', columnId);
    }
}

// Keyboard Event Listener für DEL-Taste
document.addEventListener('keydown', function (event) {
    if (event.key === 'Delete' && selectedCardData) {
        event.preventDefault();
        deleteCard(selectedCardData.cardId, selectedCardData.columnId);
    }

    // ESC-Taste zum Deselektieren
    if (event.key === 'Escape' && selectedCardData) {
        document.querySelectorAll('.kanban-card').forEach(card => {
            card.classList.remove('selected');
        });
        selectedCardData = null;
    }
});

// Click außerhalb einer Karte deselektiert alle Karten
document.addEventListener('click', function (event) {
    if (!event.target.closest('.kanban-card') && selectedCardData) {
        document.querySelectorAll('.kanban-card').forEach(card => {
            card.classList.remove('selected');
        });
        selectedCardData = null;
    }
});

function openCardModal(columnId, cardId = null) {
    if (cardId) {
        // Zuerst die Karte in allen Spalten suchen (für den Fall, dass sie verschoben wurde)
        let foundCard = null;
        let foundColumn = null;
        for (const col of currentBoard.columns) {
            const card = col.cards.find(c => c.id === cardId);
            if (card) {
                foundCard = card;
                foundColumn = col;
                break;
            }
        }

        if (!foundCard || !foundColumn) {
            console.error('Card not found anywhere:', cardId);
            return;
        }
        // Verwende die gefundene Spalte, nicht die übergebene
        currentCard = foundCard;
        currentColumn = foundColumn;
        columnId = foundColumn.id; // Update columnId für den Rest der Funktion        document.getElementById('modal-title').textContent = 'Edit Card';
        document.getElementById('card-heading').value = currentCard.heading;
        document.getElementById('card-content').value = currentCard.content; document.getElementById('card-color').value = currentCard.color || 'color-gradient-1';
        document.getElementById('card-thumbnail').value = currentCard.thumbnail || '';
        document.getElementById('card-comments').value = currentCard.comments || '';
        document.getElementById('card-url').value = currentCard.url || '';
        document.getElementById('card-labels').value = currentCard.labels || '';
        setSelectedColor('card-color-palette', currentCard.color || 'color-gradient-1');

        // Delete-Button anzeigen bei bestehenden Karten
        const deleteBtn = document.getElementById('delete-card-btn');
        if (deleteBtn) deleteBtn.style.display = 'inline-block';
    } else {
        // Für neue Karten: Verwende die übergebene columnId
        currentColumn = currentBoard.columns.find(c => c.id === columnId);
        if (!currentColumn) {
            console.error('Column not found for new card:', columnId);
            return;
        }
        currentCard = null; document.getElementById('modal-title').textContent = 'Create New Card'; document.getElementById('card-form').reset(); document.getElementById('card-color').value = 'color-gradient-1';
        document.getElementById('card-thumbnail').value = '';
        document.getElementById('card-comments').value = '';
        document.getElementById('card-url').value = '';
        document.getElementById('card-labels').value = '';
        setSelectedColor('card-color-palette', 'color-gradient-1');

        // Delete-Button verstecken bei neuen Karten
        const deleteBtn = document.getElementById('delete-card-btn');
        if (deleteBtn) deleteBtn.style.display = 'none';
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

function saveCard(e, keepOpen) {
    if (e) e.preventDefault();
    // Hole Werte wie im Original
    const heading = document.getElementById('card-heading').value;
    const content = document.getElementById('card-content').value;
    const columnId = document.getElementById('card-column').value;
    const color = document.getElementById('card-color').value;
    const thumbnail = document.getElementById('card-thumbnail').value;
    const comments = document.getElementById('card-comments').value;
    const url = document.getElementById('card-url').value;
    const labels = document.getElementById('card-labels').value;
    const cardData = {
        heading,
        content,
        color,
        thumbnail,
        comments,
        url,
        labels,
        inactive: currentCard?.inactive || false
    };
    const targetColumn = currentBoard.columns.find(c => c.id === columnId);
    if (!targetColumn) {
        console.error('Target column not found:', columnId);
        return;
    }

    if (currentCard) {
        // Update existing card
        Object.assign(currentCard, cardData);
        // If column changed, move card
        if (currentColumn && currentColumn.id !== columnId) {
            // Entferne Karte aus alter Spalte
            currentColumn.cards = currentColumn.cards.filter(c => c.id !== currentCard.id);
            // Füge Karte zu neuer Spalte hinzu
            targetColumn.cards.push(currentCard);
            // Aktualisiere currentColumn
            currentColumn = targetColumn;
        }
        // Full Card Modal live aktualisieren, falls offen
        updateFullCardModal(currentCard.id);
    } else {
        // Create new card
        const newCard = {
            id: generateId(),
            ...cardData
        };
        targetColumn.cards.push(newCard);
        currentCard = newCard;
        currentColumn = targetColumn;
    }
    saveAllBoards();
    renderColumns();
    if (!keepOpen) {
        closeModal('card-modal');
    }
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
        // Für die Vorschau: YouTube-Embed-Blöcke entfernen (mehrzeilig)
        let markdownPreview = card.content.replace(/<div class="youtube-embed"[\s\S]*?<\/div>/g, '');

        // Zusätzlich: Gesamte YouTube-Einbettungsblöcke entfernen (inklusive Überschriften)
        markdownPreview = markdownPreview.replace(/## 🎥 Video Player[\s\S]*?(?=##|$)/g, '');

        // Erste 6 Zeilen und max. 240 Zeichen für Vorschau
        markdownPreview = markdownPreview.split('\n').slice(0, 6).join('\n'); // max. 6 Zeilen

        if (markdownPreview.length > 240) markdownPreview = markdownPreview.substring(0, 240) + '...';

        // Use renderMarkdownToHtml function if available, otherwise simple line breaks
        if (typeof renderMarkdownToHtml === 'function') {
            previewText = renderMarkdownToHtml(markdownPreview);
        } else {
            previewText = markdownPreview.replace(/\n/g, '<br>');
        }
    }// Kommentar und URL-Bereiche generieren
    let commentHtml = '';
    let urlHtml = '';
    let labelsHtml = '';

    if (card.comments && card.comments.trim()) {
        //commentHtml = `<div class="card-comment">💬 ${card.comments}</div>`;
    }

    if (card.url && card.url.trim()) {
        // URL verkürzen für Anzeige
        let displayUrl = card.url.length > 40 ? card.url.substring(0, 37) + '...' : card.url;
        urlHtml = `<a href="${card.url}" class="card-url-link" onclick="event.stopPropagation()" target="_blank" rel="noopener noreferrer" title="${card.url}">🔗</a>`;
    }    // Labels verarbeiten
    if (card.labels && card.labels.trim()) {
        const labels = card.labels.split(',').map(label => label.trim()).filter(label => label.length > 0);
        if (labels.length > 0) {
            const labelTags = labels.map(label => {
                const colorClass = getLabelColorClass(label);
                return `<span class="card-label ${colorClass}">${label}</span>`;
            }).join('');
            labelsHtml = `<div class="card-labels">${labelTags}</div>`;
        }
    }

    return `
        <div class="kanban-card ${colorClass}"
             data-card-id="${card.id}"
             onclick="selectCard('${card.id}', '${columnId}')"
             ondblclick="showCardFullModal('${card.id}', '${columnId}')"
             ontouchstart="cardTouchStart(event, '${card.id}', '${columnId}')"
             ontouchend="cardTouchEnd(event)">
            ${card.thumbnail ? `<div class='card-thumb'><img src='${card.thumbnail}' alt='thumbnail' /></div>` : ''}
            <div class="card-header">
                <div class="card-title">${card.heading || ''}</div>
                <div class="card-actions">
                    <button class="card-btn card-delete" onclick="event.stopPropagation();deleteCard('${card.id}', '${columnId}')" title="Karte löschen">🗑️</button>
                    <button class="card-btn" onclick="event.stopPropagation();openCardModal('${columnId}', '${card.id}')" title="Karte bearbeiten">⋮</button>
                </div>
            </div>            <div class="card-preview-content" style="padding-top:0.1rem;padding-bottom:0.1rem;">
                <ul style="margin-top:0.2em;margin-bottom:0.2em;">${previewText}</ul>
            </div>
            ${commentHtml}
            <div class="card-footer">
                <div class="card-footer-actions">
                    <span class="card-comments-count">💬 ${(card.comments && card.comments.trim()) ? '1' : '0'}</span>
                    ${urlHtml}
                    ${labelsHtml}
                </div>
            </div>
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

// Nachträglich alle Touch-Listener auf passive setzen
// (wird nach jedem renderColumns() aufgerufen)
function setPassiveTouchListeners() {
    document.querySelectorAll('.kanban-card').forEach(card => {
        card.removeEventListener('touchstart', card._touchStartHandler, { passive: false });
        card.removeEventListener('touchend', card._touchEndHandler, { passive: false });
        card._touchStartHandler = function (e) { cardTouchStart(e, card.dataset.cardId, card.closest('.kanban-column').dataset.columnId); };
        card._touchEndHandler = function (e) { cardTouchEnd(e); };
        card.addEventListener('touchstart', card._touchStartHandler, { passive: true });
        card.addEventListener('touchend', card._touchEndHandler, { passive: true });
    });
}
// Nach jedem renderColumns() aufrufen
if (typeof window.setPassiveTouchListeners !== 'function') {
    window.setPassiveTouchListeners = setPassiveTouchListeners;
}

// Vollständiges Card-Modal anzeigen
// Nutzt renderMarkdownToHtml für Card-Content-Anzeige
function showCardFullModal(cardId, columnId) {
    // Zuerst die Karte in allen Spalten suchen (für den Fall, dass sie verschoben wurde)
    let foundCard = null;
    let foundColumn = null;
    for (const col of currentBoard.columns) {
        const card = col.cards.find(c => c.id === cardId);
        if (card) {
            foundCard = card;
            foundColumn = col;
            break;
        }
    }
    if (!foundCard || !foundColumn) {
        console.error('Card not found anywhere for showCardFullModal:', cardId);
        return;
    }

    let modal = document.getElementById('full-card-modal');
    if (!modal) {
        modal = document.createElement('div');
        modal.id = 'full-card-modal';
        modal.className = 'modal show';
        document.body.appendChild(modal);
    }    // Modal-Inhalt (verwende die gefundene Spalte)
    modal.innerHTML = `
        <div class="modal-content ${foundCard.color || ''}">
            <div class="modal-header">
                <h2>${foundCard.heading || ''}</h2>
                <div class="modal-header-actions">
                    <div class="primary-actions">
                        <button class="card-btn" onclick="openCardModal('${foundColumn.id}', '${cardId}')" title="Karte bearbeiten">
                            ✏️ Bearbeiten
                        </button>
                    </div>
                    <div class="secondary-actions">
                        <button class="card-btn delete-btn" onclick="deleteCard('${cardId}', '${foundColumn.id}')" title="Karte löschen">
                            🗑️ Löschen
                        </button>
                        <button class="close-btn" onclick="closeCardFullModal()" title="Schließen">&times;</button>
                    </div>
                </div>
            </div>            <div class="modal-body">                ${foundCard.thumbnail ? `<div class='card-thumb-modal'><img src='${foundCard.thumbnail}' alt='thumbnail' /></div>` : ''}
                <div class="card-content-full">${window.renderMarkdownToHtml ? window.renderMarkdownToHtml(foundCard.content || '') : (foundCard.content || '')}</div>
                ${foundCard.comments ? `<div class="card-comment">${window.renderMarkdownToHtml ? window.renderMarkdownToHtml(foundCard.comments) : foundCard.comments}</div>` : ''}
                ${foundCard.url ? `<div class="card-url"><a href="${foundCard.url}" class="card-url-link" target="_blank" rel="noopener noreferrer">${foundCard.url}</a></div>` : ''}
                ${foundCard.labels ? `<div class="card-labels-full">${foundCard.labels.split(',').map(label => {
        const colorClass = getLabelColorClass(label.trim());
        return `<span class="card-label-full ${colorClass}">${label.trim()}</span>`;
    }).join('')}</div>` : ''}
            </div>
        </div>
    `;
    modal.onclick = function (e) { if (e.target === modal) closeCardFullModal(); };
}
function closeCardFullModal() {
    const modal = document.getElementById('full-card-modal');
    if (modal) modal.remove();
}

// Aktualisiert das Full Card Modal, falls es für die aktuelle Karte offen ist
function updateFullCardModal(cardId) {
    const modal = document.getElementById('full-card-modal');
    if (!modal) return;
    // Prüfe, ob das Modal für die richtige Karte offen ist
    const headingEl = modal.querySelector('.modal-header h2');
    if (!headingEl) return;
    // Hole aktuelle Karte und Spalte
    let card, column;
    for (const col of currentBoard.columns) {
        const c = col.cards.find(card => card.id === cardId);
        if (c) { card = c; column = col; break; }
    }
    if (!card || !column) return;    // Modal-Inhalt neu setzen (wie in showCardFullModal)
    modal.innerHTML = `
        <div class="modal-content ${card.color || ''}">
            <div class="modal-header">
                <h2>${card.heading || ''}</h2>
                <div class="modal-header-actions">
                    <div class="primary-actions">
                        <button class="card-btn" onclick="openCardModal('${column.id}', '${card.id}')" title="Karte bearbeiten">
                            ✏️ Bearbeiten
                        </button>
                    </div>
                    <div class="secondary-actions">
                        <button class="card-btn delete-btn" onclick="deleteCard('${card.id}', '${column.id}')" title="Karte löschen">
                            🗑️ Löschen
                        </button>
                        <button class="close-btn" onclick="closeCardFullModal()" title="Schließen">&times;</button>
                    </div>
                </div>
            </div>            <div class="modal-body">                ${card.thumbnail ? `<div class='card-thumb-modal'><img src='${card.thumbnail}' alt='thumbnail' /></div>` : ''}
                <div class="card-content-full">${window.renderMarkdownToHtml ? window.renderMarkdownToHtml(card.content || '') : (card.content || '')}</div>
                ${card.comments ? `<div class="card-comment">${window.renderMarkdownToHtml ? window.renderMarkdownToHtml(card.comments) : card.comments}</div>` : ''}
                ${card.url ? `<div class="card-url"><a href="${card.url}" class="card-url-link" target="_blank" rel="noopener noreferrer">${card.url}</a></div>` : ''}
                ${card.labels ? `<div class="card-labels-full">${card.labels.split(',').map(label => {
        const colorClass = getLabelColorClass(label.trim());
        return `<span class="card-label-full ${colorClass}">${label.trim()}</span>`;
    }).join('')}</div>` : ''}
            </div>
        </div>
    `;
    modal.onclick = function (e) { if (e.target === modal) closeCardFullModal(); };
}

// Automatisches Speichern im Card-Modal bei Änderungen
// Debounce, damit nicht bei jedem Tastendruck gespeichert wird
let cardAutoSaveTimeout = null;

function setupCardAutoSave() {
    const fields = [
        'card-heading',
        'card-content',
        'card-color',
        'card-thumbnail',
        'card-comments',
        'card-url',
        'card-labels',
        'card-column'
    ];
    fields.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.removeEventListener('input', autoSaveCardHandler);
            el.removeEventListener('change', autoSaveCardHandler);
            el.addEventListener('input', autoSaveCardHandler);
            el.addEventListener('change', autoSaveCardHandler);
        }
    });
    // Color-Palette: Klick auf Farboptionen
    const palette = document.getElementById('card-color-palette');
    if (palette) {
        palette.querySelectorAll('.color-option').forEach(opt => {
            opt.removeEventListener('click', paletteColorHandler);
            opt.addEventListener('click', paletteColorHandler);
        });
    }
}

function paletteColorHandler(e) {
    const color = e.target.getAttribute('data-color');
    if (color) {
        document.getElementById('card-color').value = color;
        setSelectedColor('card-color-palette', color);
        autoSaveCardHandler();
    }
}

function autoSaveCardHandler(e) {
    if (cardAutoSaveTimeout) clearTimeout(cardAutoSaveTimeout);
    cardAutoSaveTimeout = setTimeout(() => {
        saveCard(null, true); // true = Modal bleibt offen
    }, 400);
}

// saveCard anpassen: Modal nur schließen, wenn explizit gewünscht
if (typeof origSaveCard !== 'function') {
    var origSaveCard = saveCard;
}
saveCard = function (e, keepOpen) {
    if (e) e.preventDefault();
    // Hole Werte wie im Original
    const heading = document.getElementById('card-heading').value;
    const content = document.getElementById('card-content').value;
    const columnId = document.getElementById('card-column').value;
    const color = document.getElementById('card-color').value;
    const thumbnail = document.getElementById('card-thumbnail').value;
    const comments = document.getElementById('card-comments').value;
    const url = document.getElementById('card-url').value;
    const labels = document.getElementById('card-labels').value;
    const cardData = {
        heading,
        content,
        color,
        thumbnail,
        comments,
        url,
        labels,
        inactive: currentCard?.inactive || false
    };
    const targetColumn = currentBoard.columns.find(c => c.id === columnId);
    if (!targetColumn) {
        console.error('Target column not found:', columnId);
        return;
    }

    if (currentCard) {
        // Update existing card
        Object.assign(currentCard, cardData);
        // If column changed, move card
        if (currentColumn && currentColumn.id !== columnId) {
            // Entferne Karte aus alter Spalte
            currentColumn.cards = currentColumn.cards.filter(c => c.id !== currentCard.id);
            // Füge Karte zu neuer Spalte hinzu
            targetColumn.cards.push(currentCard);
            // Aktualisiere currentColumn
            currentColumn = targetColumn;
        }
        // Full Card Modal live aktualisieren, falls offen
        updateFullCardModal(currentCard.id);
    } else {
        // Create new card
        const newCard = {
            id: generateId(),
            ...cardData
        };
        targetColumn.cards.push(newCard);
        currentCard = newCard;
        currentColumn = targetColumn;
    }
    saveAllBoards();
    renderColumns();
    if (!keepOpen) {
        closeModal('card-modal');
    }
}

// openCardModal überschreiben, aber Endlosschleife verhindern
if (typeof origOpenCardModal !== 'function') {
    var origOpenCardModal = openCardModal;
}
openCardModal = function (columnId, cardId = null) {
    origOpenCardModal(columnId, cardId);
    setupCardAutoSave();
}

// Hilfsfunktion: Card in Spalte einfügen (für Chatbot)
function addCardToColumn(columnId, cardData) {
    const column = currentBoard.columns.find(c => c.id === columnId);
    if (!column) return;
    const newCard = {
        id: generateId(),
        heading: cardData.heading || cardData.title || 'Neue Karte',
        content: cardData.content || cardData.fragment || '',
        color: cardData.color || 'color-gradient-1',
        thumbnail: cardData.thumbnail || '',
        comments: cardData.comments || cardData.comment || '',
        url: cardData.url || '',
        labels: cardData.labels || '',
        inactive: false
    };
    column.cards.push(newCard);
    saveAllBoards();
    renderColumns();
}

function deleteCurrentCard() {
    if (!currentCard || !currentColumn) {
        console.error('No current card selected for deletion');
        return;
    }

    deleteCard(currentCard.id, currentColumn.id);
}

// Hilfsfunktion: Konsistente Farbklasse basierend auf Label-Text
function getLabelColorClass(labelText) {
    // Einfacher Hash-Algorithmus für konsistente Farben
    let hash = 0;
    for (let i = 0; i < labelText.length; i++) {
        const char = labelText.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // 32-bit integer
    }

    // Verwende absoluten Wert und modulo für Farbe 1-10
    const colorNumber = (Math.abs(hash) % 10) + 1;
    return `label-color-${colorNumber}`;
}