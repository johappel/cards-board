// Duplicate functionality replacement for init.js SortableJS section

// SortableJS für Kanban-Board Columns & Cards mit Duplikationsfunktionalität
function initSortableKanban() {
    // Vorherige Sortable-Instanz für Columns entfernen
    const board = document.getElementById('kanban-board');
    if (board && board._sortableInstance) {
        board._sortableInstance.destroy();
        board._sortableInstance = null;
    }
    
    // Columns im Board (Spalten Drag&Drop) - IMMER neu initialisieren!
    if (board) {
        board._sortableInstance = new Sortable(board, {
            group: 'kanban-columns',
            animation: 220,
            ghostClass: 'kanban-column-drag-ghost',
            chosenClass: 'kanban-column-drag-chosen',
            dragClass: 'kanban-column-dragging',
            filter: '.btn, .add-card-btn', // Buttons nicht ziehbar
            draggable: '.kanban-column',
            handle: '.column-header', // Nur Header als Drag-Handle
            onStart: function(evt) {
                if (window.addDuplicateClass) {
                    window.addDuplicateClass(evt.item, evt);
                }
            },
            onEnd: function (evt) {
                if (window.removeDuplicateClass) {
                    window.removeDuplicateClass(evt.item);
                }
                try {
                    console.log('### DEBUG: onEnd Spalten-Drag erreicht');
                    if (!window.currentBoard || !window.currentBoard.columns) return;
                    
                    // Ctrl+Drag: Spalte duplizieren
                    if (evt.originalEvent && evt.originalEvent.ctrlKey) {
                        const colId = evt.item.dataset.columnId;
                        const originalColumn = window.currentBoard.columns.find(c => c.id === colId);
                        if (originalColumn) {
                            const duplicatedColumn = {
                                ...originalColumn,
                                id: generateId(),
                                name: originalColumn.name + ' (Kopie)',
                                cards: originalColumn.cards.map(card => ({
                                    ...card,
                                    id: generateId()
                                }))
                            };                            // Spalte an der gewünschten Position einfügen
                            const newOrder = [];
                            board.querySelectorAll('.kanban-column').forEach(colEl => {
                                const cId = colEl.dataset.columnId;
                                const existingCol = window.currentBoard.columns.find(c => c.id === cId);
                                if (existingCol) {
                                    newOrder.push(existingCol);
                                    if (cId === colId) {
                                        // Nach der Zielspalte die duplizierte Spalte einfügen
                                        newOrder.push(duplicatedColumn);
                                    }
                                }
                            });
                            window.currentBoard.columns = newOrder;
                            // Element aus DOM entfernen (SortableJS hat es nur temporär bewegt)
                            evt.item.remove();
                            if (typeof saveAllBoards === 'function') saveAllBoards();
                            if (typeof renderColumns === 'function') renderColumns();
                            console.log('Spalte dupliziert:', duplicatedColumn.name);
                            return;
                        }
                    }
                    
                    // Normale Bewegung (kein Ctrl gedrückt)
                    const colMap = {};
                    window.currentBoard.columns.forEach(col => { colMap[col.id] = col; });
                    // Vorher loggen
                    console.log('Spalten vorher:', window.currentBoard.columns.map(c => c.name));
                    const newOrder = [];
                    board.querySelectorAll('.kanban-column').forEach(colEl => {
                        const colId = colEl.dataset.columnId;
                        if (colMap[colId]) newOrder.push(colMap[colId]);
                    });
                    // Nachher loggen
                    console.log('Spalten nach Drag:', newOrder.map(c => c.name));
                    window.currentBoard.columns = newOrder;
                    if (typeof saveAllBoards === 'function') saveAllBoards();
                    console.log('saveAllBoards() nach Spalten-Drag ausgeführt');
                } catch(e) {
                    console.error('Fehler im onEnd Spalten-Drag:', e);
                }
            }
        });
    }

    // Für jede Spalte: Sortable für Karten IMMER neu initialisieren
    window.currentBoard?.columns?.forEach(col => {
        const colEl = document.querySelector(`.kanban-column[data-column-id="${col.id}"] .column-content`);
        if (colEl && colEl._sortableInstance) {
            colEl._sortableInstance.destroy();
            colEl._sortableInstance = null;
        }
        if (colEl) {
            colEl._sortableInstance = new Sortable(colEl, {
                group: 'kanban-cards',
                animation: 180,
                ghostClass: 'kanban-card-drag-ghost',
                chosenClass: 'kanban-card-drag-chosen',
                dragClass: 'kanban-card-dragging',
                draggable: '.kanban-card',
                handle: '.card-header', // ganzer Header als Drag-Handle
                onStart: function(evt) {
                    if (window.addDuplicateClass) {
                        window.addDuplicateClass(evt.item, evt);
                    }
                },
                onEnd: function (evt) {
                    if (window.removeDuplicateClass) {
                        window.removeDuplicateClass(evt.item);
                    }
                    try {
                        console.log('### DEBUG: onEnd Karten-Drag erreicht');
                        if (!window.currentBoard || !window.currentBoard.columns) return;
                        const fromColId = evt.from.closest('.kanban-column').dataset.columnId;
                        const toColId = evt.to.closest('.kanban-column').dataset.columnId;
                        const fromCol = window.currentBoard.columns.find(c => c.id === fromColId);
                        const toCol = window.currentBoard.columns.find(c => c.id === toColId);
                        if (!fromCol || !toCol) return;
                        
                        // Ctrl+Drag: Karte duplizieren
                        if (evt.originalEvent && evt.originalEvent.ctrlKey) {
                            const cardId = evt.item.dataset.cardId;
                            const originalCard = fromCol.cards.find(c => c.id === cardId);
                            if (originalCard) {
                                const duplicatedCard = {
                                    ...originalCard,
                                    id: generateId(),
                                    heading: originalCard.heading + ' (Kopie)'
                                };                                // Karte zur Zielspalte hinzufügen (am Ende der gewünschten Position)
                                const newToCards = [];
                                evt.to.querySelectorAll('.kanban-card').forEach((cardEl, index) => {
                                    const cId = cardEl.dataset.cardId;
                                    const existingCard = [...fromCol.cards, ...toCol.cards].find(c => c.id === cId);
                                    if (existingCard) {
                                        newToCards.push(existingCard);
                                        if (cId === cardId) {
                                            // Nach der ursprünglichen Karte die duplizierte Karte einfügen
                                            newToCards.push(duplicatedCard);
                                        }
                                    }
                                });                                toCol.cards = newToCards;
                                
                                // Falls es sich um verschiedene Spalten handelt, ursprüngliche Karte aus Quellspalte entfernen
                                if (fromCol !== toCol) {
                                    fromCol.cards = fromCol.cards.filter(c => c.id !== cardId);
                                }
                                
                                // Element aus DOM entfernen (SortableJS hat es nur temporär bewegt)
                                evt.item.remove();
                                if (typeof saveAllBoards === 'function') saveAllBoards();
                                if (typeof renderColumns === 'function') renderColumns();
                                console.log('Karte dupliziert:', duplicatedCard.heading);
                                return;
                            }
                        }
                        
                        // Normale Bewegung (kein Ctrl gedrückt)
                        // Vorher loggen
                        console.log('Karten vorher (from):', fromCol.cards.map(c => c.heading));
                        console.log('Karten vorher (to):', toCol.cards.map(c => c.heading));
                        // Karten neu anordnen
                        const cardMap = {};
                        window.currentBoard.columns.forEach(col => {
                            col.cards.forEach(card => { cardMap[card.id] = card; });
                        });
                        // Karten in Zielspalte nach DOM sortieren
                        const newToCards = [];
                        evt.to.querySelectorAll('.kanban-card').forEach(cardEl => {
                            const cardId = cardEl.dataset.cardId;
                            if (cardMap[cardId]) newToCards.push(cardMap[cardId]);
                        });
                        toCol.cards = newToCards;
                        // Karten in Quellspalte nach DOM sortieren (falls moved)
                        if (fromCol !== toCol) {
                            const newFromCards = [];
                            evt.from.querySelectorAll('.kanban-card').forEach(cardEl => {
                                const cardId = cardEl.dataset.cardId;
                                if (cardMap[cardId]) newFromCards.push(cardMap[cardId]);
                            });
                            fromCol.cards = newFromCards;
                        }
                        // Nachher loggen
                        console.log('Karten nach (from):', fromCol.cards.map(c => c.heading));
                        console.log('Karten nach (to):', toCol.cards.map(c => c.heading));
                        if (typeof saveAllBoards === 'function') saveAllBoards();
                        console.log('saveAllBoards() nach Karten-Drag ausgeführt');
                    } catch(e) {
                        console.error('Fehler im onEnd Karten-Drag:', e);
                    }
                }
            });
        }
    });
}

// Nach jeder Änderung speichern
function saveAllBoards() {
    console.log('saveAllBoards() aufgerufen', JSON.stringify(boards, null, 2));
    if (typeof window.KanbanStorage?.saveBoards === 'function') {
        window.KanbanStorage.saveBoards(boards);
    }
}

// Nach jedem renderColumns() aufrufen!
window.initSortableKanban = initSortableKanban;
