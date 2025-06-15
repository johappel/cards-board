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

// openAIPromptModal überschreiben, damit das Modal immer leer startet
function openAIPromptModal() {
    document.getElementById('ai-prompt-modal').classList.add('show');
    document.getElementById('ai-prompt-input').value = '';
    document.getElementById('ai-include-column-context').checked = false;
}

// submitAIPrompt: Prompt und Kontext an generateWithAI übergeben, Modal schließen
async function submitAIPrompt() {
    const prompt = document.getElementById('ai-prompt-input').value;
    const includeContext = document.getElementById('ai-include-column-context').checked;
    let context = '';
    if (includeContext && currentColumn) {
        context = currentColumn.cards.map(c => `${c.heading}: ${c.content}`).join('\n');
    }
    await generateWithAI(prompt, context);
    closeAIPromptModal();
}

function closeAIPromptModal() {
    document.getElementById('ai-prompt-modal').classList.remove('show');
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
    
    // Prepare payload
    const payload = {
        type: 'column-ai-request',
        boardId: currentBoard.id,
        columnId: currentColumnForAI.id,
        columnName: currentColumnForAI.name,
        chatInput: prompt,
        cards: currentColumnForAI.cards,
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
            openChatbotModal();
            
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

// Export AI functions for global use
window.openColumnAIModal = openColumnAIModal;
window.closeColumnAIModal = closeColumnAIModal;
window.submitColumnAIRequest = submitColumnAIRequest;
window.showAINotification = showAINotification;
