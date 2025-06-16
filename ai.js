// AI Functions
function generateBoardSummary() {
    const columnsUrl = localStorage.getItem('ai_columnsUrl');
    if (!columnsUrl) {
        alert('Please configure AI endpoints in Settings first.');
        return;
    }
    
    // Collect all card content
    const allContent = [];
    currentBoard.columns.forEach(column => {
        column.cards.forEach(card => {
            allContent.push(`${column.name}: ${card.heading} - ${card.content}`);
        });
    });
    
    // Simulate AI call (in real implementation, this would call the configured AI API)
    const mockSummary = `# Board Zusammenfassung

Dieses Board enthält **${currentBoard.columns.length} Spalten** mit insgesamt **${allContent.length} Karten**.

## Workflow
Der Arbeitsablauf verläuft durch folgende Bereiche: ${currentBoard.columns.map(c => c.name).join(', ')}.

## Hauptfokus
- Projektplanung
- Aufgabenverwaltung  
- Fortschrittsverfolgung

*Diese Zusammenfassung wurde automatisch generiert.*`;
    
    // Verwende die neue updateBoardSummary Funktion
    if (typeof window.updateBoardSummary === 'function') {
        window.updateBoardSummary(mockSummary);
    } else {
        // Fallback für direkte Aktualisierung
        currentBoard.summary = mockSummary;
        updateBoardView();
    }
    
    alert('Summary generated! (This is a mock implementation)');
}

function generateWithAI(prompt, context) {
    const cardsUrl = localStorage.getItem('ai_cardsUrl');
    if (!cardsUrl) {
        alert('Please configure AI endpoints in Settings first.');
        return;
    }
    // Simulate AI content generation
    let mockContent = '';
    if (prompt) {
        mockContent = `Prompt: ${prompt}\n`;
    }
    if (context) {
        mockContent += `\nKontext:\n${context}\n`;
    }
    mockContent += `\nDies ist KI-generierter Beispielinhalt mit konfigurierten AI-Endpoints.`;
    document.getElementById('card-content').value = mockContent;
    alert('Content generated! (This is a mock implementation)');
}

// AI-Integration für Card-Modal
// Sorgt dafür, dass das AI-Icon im Card-Modal das Prompt-Modal öffnet und die generierten Inhalte in das Card-Content-Feld schreibt

// Variable für aktuell ausgewählte Karte im AI-Modal
let currentCardForAI = null;

document.addEventListener('DOMContentLoaded', function() {
    // AI-Icon im Card-Modal
    const aiBtn = document.getElementById('open-ai-modal');
    if (aiBtn) {
        aiBtn.addEventListener('click', function(e) {
            e.preventDefault();
            openAIPromptModal();
        });
    }
});

// Card AI Modal öffnen
function openCardAIModal(cardId, columnId) {
    const column = currentBoard.columns.find(c => c.id === columnId);
    if (!column) {
        alert('Spalte nicht gefunden');
        return;
    }
    
    const card = column.cards.find(c => c.id === cardId);
    if (!card) {
        alert('Karte nicht gefunden');
        return;
    }
    
    currentCardForAI = card;
    currentColumn = column; // Für bestehende Kompatibilität
    
    // Modal-Inhalte füllen
    document.getElementById('ai-card-title').textContent = card.heading || 'Unbenannte Karte';
    document.getElementById('ai-card-column-name').textContent = column.name;
    document.getElementById('ai-prompt-input').value = '';
    document.getElementById('ai-include-column-context').checked = false;
    document.getElementById('ai-include-board-context').checked = true;
    
    // Modal öffnen
    openAIPromptModal();
}

// openAIPromptModal überschreiben, damit das Modal immer leer startet
function openAIPromptModal() {
    document.getElementById('ai-prompt-modal').classList.add('show');
    // Nur leeren wenn keine Karte ausgewählt ist
    if (!currentCardForAI) {
        document.getElementById('ai-prompt-input').value = '';
        document.getElementById('ai-include-column-context').checked = false;
        document.getElementById('ai-include-board-context').checked = false;
    }
}

// submitAIPrompt: Prompt und Kontext an generateWithAI übergeben, Modal schließen
async function submitAIPrompt() {
    const prompt = document.getElementById('ai-prompt-input').value.trim();
    
    // Wenn eine Karte ausgewählt ist, verwende Card AI
    if (currentCardForAI) {
        await submitCardAIRequest();
    } else {
        // Fallback zur alten Funktionalität
        const includeContext = document.getElementById('ai-include-column-context').checked;
        let context = '';
        if (includeContext && currentColumn) {
            context = currentColumn.cards.map(c => `${c.heading}: ${c.content}`).join('\n');
        }
        await generateWithAI(prompt, context);
    }
    closeAIPromptModal();
}

async function submitCardAIRequest() {
    if (!currentCardForAI) {
        alert('Keine Karte ausgewählt');
        return;
    }
    
    const cardsUrl = localStorage.getItem('ai_cardsUrl');
    if (!cardsUrl) {
        alert('Bitte konfigurieren Sie die AI-Endpoints in den Einstellungen');
        return;
    }
    
    const prompt = document.getElementById('ai-prompt-input').value.trim();
    if (!prompt) {
        alert('Bitte geben Sie eine Anweisung für die AI ein');
        return;
    }
      const includeColumnContext = document.getElementById('ai-include-column-context').checked;
    const includeBoardContext = document.getElementById('ai-include-board-context').checked;
    
    // Connection ID für WebSocket-Routing abrufen
    const connectionId = getServerAssignedConnectionId(currentBoard.id);
    if (!connectionId) {
        alert('Keine WebSocket-Verbindung verfügbar. Bitte versuchen Sie es später erneut.');
        return;
    }
    // Chatbot-Modal öffnen, weil sich sonst keine Connection ID ermitteln lässt und die Anfrage fehlschlägt
    openChatbotModal();
    
    // Prepare payload
    const payload = {
        type: 'card-ai-request',
        boardId: currentBoard.id,
        connectionId: connectionId,
        cardId: currentCardForAI.id,
        columnId: currentColumn.id,
        columnName: currentColumn.name,
        chatInput: prompt,
        card: currentCardForAI,
        timestamp: new Date().toISOString()
    };
    
    // Spalten-Kontext hinzufügen wenn gewünscht
    if (includeColumnContext) {
        payload.columnCards = currentColumn.cards;
    }
    
    // Board-Kontext hinzufügen wenn gewünscht
    if (includeBoardContext) {
        payload.boardContext = {
            name: currentBoard.name,
            summary: currentBoard.summary || ''
        };
    }
    
    try {
        // POST request an Cards Endpoint
        const response = await fetch(cardsUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        
        if (response.ok) {
            // Erfolgs-Benachrichtigung
            showAINotification('🤖 AI-Anfrage für Karte gesendet. Antwort wird über WebSocket empfangen...', 'info');
            
            // Chatbot-Modal öffnen um den Status zu zeigen
            if (typeof openChatbotModal === 'function') {
                openChatbotModal();
                if (typeof displayMessage === 'function') {
                    displayMessage(`🤖 AI verarbeitet Karte "${currentCardForAI.heading}" in Spalte "${currentColumn.name}"...`, 'system');
                }
            }
        } else {
            throw new Error(`Server antwortet mit Status ${response.status}`);
        }
    } catch (error) {
        console.error('Fehler beim Senden der Card AI-Anfrage:', error);
        showAINotification(`❌ Fehler: ${error.message}`, 'error');
    }
}

// Hilfsfunktionen für Call2Actions
function getConnectionId() {
    // Versuche zuerst die gespeicherte Connection ID zu holen
    if (currentBoard && currentBoard.id) {
        return getServerAssignedConnectionId(currentBoard.id);
    }
    return null;
}

function getCardById(cardId) {
    if (!currentBoard) return null;
    
    for (const column of currentBoard.columns) {
        const card = column.cards.find(c => c.id === cardId);
        if (card) return card;
    }
    return null;
}

function getColumnById(columnId) {
    if (!currentBoard) return null;
    return currentBoard.columns.find(c => c.id === columnId);
}

function getAllCardsFromColumn(columnId) {
    const column = getColumnById(columnId);
    return column ? column.cards : [];
}

function showNotification(message, type = 'info') {
    // Verwende die AI-Notification-Funktion falls verfügbar
    if (typeof showAINotification === 'function') {
        const icon = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
        showAINotification(`${icon} ${message}`, type);
    } else {
        // Fallback zu Browser-Alert
        alert(message);
    }
}

// Submit Card AI Request with Action (für Call2Actions)
async function submitCardAIRequestWithAction(cardId, columnId, actionParams) {
    const connectionId = getConnectionId();
    if (!connectionId) {
        showNotification('Keine Verbindung zum AI-Service', 'error');
        return;
    }
    
    const card = getCardById(cardId);
    if (!card) {
        showNotification('Karte nicht gefunden', 'error');
        return;
    }
    
    const column = getColumnById(columnId);
    if (!column) {
        showNotification('Spalte nicht gefunden', 'error');
        return;
    }
    
    // AI Cards URL abrufen
    const cardsUrl = localStorage.getItem('ai_cardsUrl');
    if (!cardsUrl) {
        showNotification('AI-Endpoints nicht konfiguriert', 'error');
        return;
    }
    openChatbotModal();

    // Alle Karten der Spalte sammeln (für Context)
    const allCards = getAllCardsFromColumn(columnId);
    
    const requestData = {
        type: 'card-action-request',
        boardId: currentBoard.id,
        connectionId: connectionId,
        cardId: card.id,
        columnId: column.id,
        columnName: column.name,
        card: card,
        columnCards: allCards,
        action: actionParams,
        timestamp: new Date().toISOString()
    };
    
    try {
        console.log('Sende Card Action Request:', requestData);
        const response = await fetch(cardsUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestData)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('Card Action Response:', result);
        
        if (result.success) {
            showNotification(`🤖 Action "${actionParams.action}" wird verarbeitet...`, 'info');
            
            // Chatbot-Modal öffnen um den Status zu zeigen
            if (typeof openChatbotModal === 'function') {
                openChatbotModal();
                if (typeof displayMessage === 'function') {
                    displayMessage(`🤖 AI führt "${actionParams.action}" für Karte "${card.heading}" aus...`, 'system');
                }
            }
        } else {
            throw new Error(result.error || 'Unbekannter Fehler');
        }
        
    } catch (error) {
        console.error('Fehler beim Card Action Request:', error);
        showNotification('Fehler beim Ausführen der Action: ' + error.message, 'error');
    }
}

function closeAIPromptModal() {
    document.getElementById('ai-prompt-modal').classList.remove('show');
    currentCardForAI = null; // Reset der Karten-Auswahl
}

// Column AI-Funktionalität
let currentColumnForAI = null;

function openColumnAIModal(columnId) {
    const column = currentBoard.columns.find(c => c.id === columnId);
    if (!column) {
        alert('Spalte nicht gefunden');
        return;
    }
    
    currentColumnForAI = column;
    
    // Modal-Inhalte füllen
    document.getElementById('column-ai-name').textContent = column.name;
    document.getElementById('column-ai-cards-count').textContent = `(${column.cards.length} Karten)`;
    document.getElementById('column-ai-prompt').value = '';
    document.getElementById('column-ai-include-board-context').checked = true;
    
    // Modal öffnen
    document.getElementById('column-ai-modal').classList.add('show');
}

function closeColumnAIModal() {
    document.getElementById('column-ai-modal').classList.remove('show');
    currentColumnForAI = null;
}

async function submitColumnAIRequest() {
    if (!currentColumnForAI) {
        alert('Keine Spalte ausgewählt');
        return;
    }
    
    const columnsUrl = localStorage.getItem('ai_columnsUrl');
    if (!columnsUrl) {
        alert('Bitte konfigurieren Sie die AI-Endpoints in den Einstellungen');
        return;
    }
    
    const prompt = document.getElementById('column-ai-prompt').value.trim();
    if (!prompt) {
        alert('Bitte geben Sie eine Anweisung für die AI ein');
        return;
    }
      const includeContext = document.getElementById('column-ai-include-board-context').checked;
    
    // Connection ID für WebSocket-Routing abrufen
    const connectionId = getServerAssignedConnectionId(currentBoard.id);
    if (!connectionId) {
        alert('Keine WebSocket-Verbindung verfügbar. Bitte versuchen Sie es später erneut.');
        return;
    }
    openChatbotModal();

    // Prepare payload - vereinfachtes Format ohne interne IDs
    const payload = {
        type: 'column-ai-request',
        connectionId: connectionId,
        columnName: currentColumnForAI.name,
        columnId: currentColumnForAI.id,
        chatInput: prompt,
        cards: currentColumnForAI.cards.map(card => ({
            id: card.id,
            heading: card.heading,
            content: card.content,
            color: card.color,
            thumbnail: card.thumbnail,
            comments: card.comments,
            url: card.url,
            labels: card.labels,
            inactive: card.inactive || false
        })),
        timestamp: new Date().toISOString()
    };
    
    // Board-Kontext hinzufügen wenn gewünscht
    if (includeContext) {
        payload.boardContext = {
            name: currentBoard.name,
            summary: currentBoard.summary || ''
        };
    }
    
    try {
        // POST request an Columns Endpoint
        const response = await fetch(columnsUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        
        if (response.ok) {
            // Modal schließen
            closeColumnAIModal();
                        
            // Erfolgs-Benachrichtigung
            showAINotification('🤖 AI-Anfrage gesendet. Antwort wird über WebSocket empfangen...', 'info');
            
            // Chatbot-Modal öffnen um den Status zu zeigen
            if (typeof openChatbotModal === 'function') {
                openChatbotModal();
                if (typeof displayMessage === 'function') {
                    displayMessage(`🤖 AI verarbeitet Spalte "${currentColumnForAI.name}" mit ${currentColumnForAI.cards.length} Karten...`, 'system');
                }
            }
        } else {
            throw new Error(`Server antwortet mit Status ${response.status}`);
        }
    } catch (error) {
        console.error('Fehler beim Senden der AI-Anfrage:', error);
        showAINotification(`❌ Fehler: ${error.message}`, 'error');
    }
}

function showAINotification(message, type = 'info') {
    // Erstelle Notification-Element
    const notification = document.createElement('div');
    notification.className = `ai-notification ai-notification-${type}`;
    notification.textContent = message;
    
    // Style für Notification
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'error' ? '#ff6b6b' : type === 'success' ? '#51cf66' : '#339af0'};
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        z-index: 10000;
        font-size: 14px;
        max-width: 400px;
        word-wrap: break-word;
        transition: all 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    // Nach 5 Sekunden entfernen
    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 5000);
}

// Funktion zum Rendern von Call2Actions-Buttons für Karten
function renderCall2ActionsButtons(card, columnId) {
    if (!card.call2Actions || !Array.isArray(card.call2Actions) || card.call2Actions.length === 0) {
        return '';
    }
    
    const buttonsHtml = card.call2Actions.map(action => {
        const safeAction = JSON.stringify(action).replace(/"/g, '&quot;');
        return `<button class="call2action-btn" 
                        onclick="event.stopPropagation();executeCall2Action('${card.id}', '${columnId}', ${safeAction})"
                        title="${action.description || action.action}">
                    ${action.label || action.action}
                </button>`;
    }).join('');
    
    return `<div class="call2actions-buttons">${buttonsHtml}</div>`;
}

// Funktion zum Ausführen einer Call2Action
async function executeCall2Action(cardId, columnId, actionParams) {
    console.log('Executing Call2Action:', actionParams);
    
    try {
        // Button temporär deaktivieren
        const button = event.target;
        const originalText = button.textContent;
        button.disabled = true;
        button.textContent = '⏳';
        
        await submitCardAIRequestWithAction(cardId, columnId, actionParams);
        
        // Button nach kurzer Zeit wieder aktivieren
        setTimeout(() => {
            button.disabled = false;
            button.textContent = originalText;
        }, 2000);
        
    } catch (error) {
        console.error('Fehler beim Ausführen der Call2Action:', error);
        showNotification('Fehler beim Ausführen der Action: ' + error.message, 'error');
        
        // Button wieder aktivieren
        if (event.target) {
            event.target.disabled = false;
            event.target.textContent = originalText;
        }
    }
}

// Export AI functions for global use
window.openCardAIModal = openCardAIModal;
window.openColumnAIModal = openColumnAIModal;
window.closeColumnAIModal = closeColumnAIModal;
window.submitColumnAIRequest = submitColumnAIRequest;
window.submitCardAIRequest = submitCardAIRequest;
window.submitCardAIRequestWithAction = submitCardAIRequestWithAction;
window.showAINotification = showAINotification;
window.renderCall2ActionsButtons = renderCall2ActionsButtons;
window.executeCall2Action = executeCall2Action;
