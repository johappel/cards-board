// chatbot.js - WebSocket/N8N Chatbot Integration für Kanban
// Diese Datei implementiert die Chatbot-Logik und die Integration mit dem Kanban-Board

// --- Konfiguration ---
let websocketUrl = localStorage.getItem('ai_websocketUrl') ;
let n8nAgentWebhookUrl = localStorage.getItem('ai_n8nAgentWebhookUrl');

// Globale AI-Settings (Model, Provider, API-Key, Base-URL)
let globalAISettings = {
    provider: localStorage.getItem('ai_provider') || '',
    apiKey: localStorage.getItem('ai_apiKey') || '',
    model: localStorage.getItem('ai_model') || '',
    baseUrl: localStorage.getItem('ai_baseUrl') || ''
};

function saveGlobalAISettings(settings) {
    Object.entries(settings).forEach(([key, value]) => {
        localStorage.setItem('ai_' + key, value);
        globalAISettings[key] = value;
    });
}

function saveAIEndpoints(wsUrl, webhookUrl) {
    localStorage.setItem('ai_websocketUrl', wsUrl);
    localStorage.setItem('ai_n8nAgentWebhookUrl', webhookUrl);
    websocketUrl = wsUrl;
    n8nAgentWebhookUrl = webhookUrl;
}

let socket;
let serverAssignedConnectionId = null;
let connectionStatusInterval = null;
let reconnectTimeout = null;
let heartbeatInterval = null;
let lastPongTimestamp = null;
const HEARTBEAT_INTERVAL = 30000; // 30 Sekunden
const RECONNECT_DELAY = 3000; // 3 Sekunden

// Hilfsfunktionen für das Board
function addCardToColumn(columnName, cardData) {
    if (!currentBoard) return;
    let column = currentBoard.columns.find(c => c.name === columnName);
    if (!column) {
        // Spalte anlegen, falls nicht vorhanden
        column = {
            id: generateId(),
            name: columnName,
            color: 'color-gradient-1',
            cards: []
        };
        currentBoard.columns.push(column);
    }
    // Card anlegen
    const newCard = {
        id: generateId(),
        heading: cardData.title || 'Unbenannt',
        content: cardData.content || '',
        color: 'color-gradient-1',
        thumbnail: cardData.thumbnail || '',
        comments: cardData.comment || '',
        inactive: false
    };
    column.cards.push(newCard);
    if (typeof saveAllBoards === 'function') saveAllBoards();
    if (typeof renderColumns === 'function') renderColumns();
}

function addColumnWithCards(columnName, cards) {
    if (!currentBoard) return;
    let column = currentBoard.columns.find(c => c.name === columnName);
    let columnWasCreated = false;
    if (!column) {
        column = {
            id: generateId(),
            name: columnName,
            color: 'color-gradient-1',
            cards: []
        };
        currentBoard.columns.push(column);
        columnWasCreated = true;
    }
    // Karten nur hinzufügen, wenn sie noch nicht existieren (nach Titel vergleichen)
    cards.forEach(cardData => {
        const exists = column.cards.some(card => card.heading === (cardData.title || 'Unbenannt'));
        if (!exists) {
            const newCard = {
                id: generateId(),
                heading: cardData.title || 'Unbenannt',
                content: cardData.content || '',
                color: 'color-gradient-1',
                thumbnail: cardData.thumbnail || '',
                comments: cardData.comment || '',
                inactive: false
            };
            column.cards.push(newCard);
        }
    });
    if (typeof saveAllBoards === 'function') saveAllBoards();
    if (typeof renderColumns === 'function') renderColumns();
    return columnWasCreated;
}

// marked.js für Markdown-zu-HTML-Umwandlung einbinden
if (!window.marked) {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/marked/marked.min.js';
    script.onload = () => { window.marked = marked; };
    document.head.appendChild(script);
}
// markdown.css einbinden
(function() {
    if (!document.getElementById('markdown-css')) {
        const link = document.createElement('link');
        link.id = 'markdown-css';
        link.rel = 'stylesheet';
        link.href = 'markdown.css';
        document.head.appendChild(link);
    }
})();

// Markdown-zu-HTML-Renderer (nutzt marked)
function renderMarkdownToHtml(markdownText) {
    if (window.marked && typeof markdownText === 'string') {
        let html = window.marked.parse(markdownText);
        // <think>-Tag als Accordion/Details-Container
        if (html.includes('<think>')) {
            html = html.replace(/<think>([\s\S]*?)<\/think>/gi, function(_, content) {
                return `<details class="think-accordion" open><summary>Denken ...</summary><div class="markdown-content">${content}</div></details>`;
            });
        }
        return `<div class="markdown-content">${html}</div>`;
    }
    return markdownText;
}

function displayMessage(textOrHtml, sender = 'bot') {
    const chatbox = document.getElementById('chatbox');
    const messageElement = document.createElement('div');
    const senderClass = sender + '-message';
    messageElement.classList.add('message', senderClass);
    // Markdown immer erst beim Anzeigen rendern
    let html = renderMarkdownToHtml(textOrHtml);
    messageElement.innerHTML = html;
    chatbox.appendChild(messageElement);
    chatbox.scrollTop = chatbox.scrollHeight;
}

function updateConnectionStatus(message, isError = false) {
    const connectionStatus = document.getElementById('connectionStatus');
    connectionStatus.textContent = message;
    connectionStatus.style.color = isError ? 'red' : '#555';
    if (message && message.toLowerCase().includes('verbinde')) {
        connectionStatus.classList.add('reconnecting');
    } else {
        connectionStatus.classList.remove('reconnecting');
    }
}

function showConnectionId() {
    const connectionStatus = document.getElementById('connectionStatus');
    if (serverAssignedConnectionId) {
        connectionStatus.textContent = `Verbunden (ID: ${serverAssignedConnectionId})`;
        connectionStatus.style.color = '#555';
    }
}

function checkWebSocketStatus() {
    if (!socket || socket.readyState !== WebSocket.OPEN) {
        updateConnectionStatus('Verbindung zum Chat Agenten abgebrochen!', true);
    } else {
        showConnectionId();
    }
}

// Hilfsfunktion: Connection-ID für Board speichern/lesen
function getBoardChatConnectionId(boardId) {
    if (!boardId) return null;
    const key = 'chatbotConnectionId_' + boardId;
    // 1. Tab-spezifisch (sessionStorage)
    let id = sessionStorage.getItem(key);
    if (id) return id;
    // 2. Board-weit (localStorage)
    id = localStorage.getItem(key);
    if (id) {
        // In sessionStorage übernehmen, damit der Tab sie weiterverwendet
        sessionStorage.setItem(key, id);
        return id;
    }
    // 3. Neu generieren
    id = 'boardchat-' + boardId + '-' + Math.random().toString(36).substr(2, 8) + '-' + Date.now();
    sessionStorage.setItem(key, id);
    localStorage.setItem(key, id);
    return id;
}
function setBoardChatConnectionId(boardId, connectionId) {
    if (!boardId) return;
    const key = 'chatbotConnectionId_' + boardId;
    sessionStorage.setItem(key, connectionId);
    localStorage.setItem(key, connectionId);
}
function clearBoardChatConnectionId(boardId) {
    if (!boardId) return;
    const key = 'chatbotConnectionId_' + boardId;
    sessionStorage.removeItem(key);
    localStorage.removeItem(key);
}

// WebSocket-URL dynamisch mit Board-gebundener Connection-ID
function getWebSocketUrlForBoard(boardId) {
    let connectionId = getBoardChatConnectionId(boardId);
    if (!connectionId) {
        connectionId = 'boardchat-' + boardId + '-' + Math.random().toString(36).substr(2, 8) + '-' + Date.now();
        setBoardChatConnectionId(boardId, connectionId);
    }
    // Nutze global konfiguriertes websocketUrl
    let url = websocketUrl;
    if (!/^wss?:\/\//.test(url)) url = 'wss://' + url.replace(/^https?:\/\//, '');
    return url + '/?clientId=' + encodeURIComponent(connectionId);
}

// connectWebSocket anpassen:
function connectWebSocket() {
    // Board-ID bestimmen (z.B. window.currentBoard.id)
    const boardId = window.currentBoard && window.currentBoard.id ? window.currentBoard.id : 'default';
    const wsUrl = getWebSocketUrlForBoard(boardId);
    updateConnectionStatus('Verbinde mit WebSocket-Server...');
    socket = new WebSocket(wsUrl);

    socket.onopen = function () {
        updateConnectionStatus('Verbunden mit WebSocket-Server.');
        displayMessage('Verbindung zum Chat Agenten hergestellt.', 'system');
        // Connection-ID aus URL extrahieren und speichern
        const urlParams = new URLSearchParams((socket.url || '').split('?')[1] || '');
        const connectionId = urlParams.get('clientId');
        setBoardChatConnectionId(boardId, connectionId);
        startHeartbeat();
    };

    socket.onmessage = function (event) {
        // Heartbeat/Keepalive
        if (event.data === 'pong') {
            lastPongTimestamp = Date.now();
            return;
        }
        try {
            const data = JSON.parse(event.data);
            if (data.type === 'welcome' && data.connectionId) {
                serverAssignedConnectionId = data.connectionId;
                showConnectionId();
                if (!connectionStatusInterval) {
                    connectionStatusInterval = setInterval(checkWebSocketStatus, 3000);
                }
                return;
            } else if (data.type === 'final_answer') {
                displayMessage(data.text || data.message, 'bot');
            } else if ((data.type === 'suggestion' || data.type === 'suggestions') && (data.suggestion || data.text || data.suggestions)) {
                // Nur als Button anzeigen, nicht mehr als Chatnachricht
                const suggestionText = data.suggestion || data.text;
                if (suggestionText) {
                    renderSuggestions([suggestionText]);
                } else if (Array.isArray(data.suggestions)) {
                    renderSuggestions(data.suggestions);
                }
            } else if (data.type === 'thinking' && (data.message || data.text)) {
                displayMessage('<div class="think"><details open><summary>Denken...</summary>' + (data.message || data.text) + '</details></div>', 'system');
            } else if (data.type === 'cards' && Array.isArray(data.cards)) {
                let targetColumn = data.column || 'Material';
                const wasCreated = addColumnWithCards(targetColumn, data.cards);
                if (wasCreated) {
                    displayMessage(`Spalte "${targetColumn}" wurde neu angelegt und ${data.cards.length} Karten hinzugefügt.`, 'system');
                } else {
                    displayMessage(`${data.cards.length} Karten wurden zur Spalte "${targetColumn}" hinzugefügt.`, 'system');
                }
            } else if (data.type === 'column' && data.column && Array.isArray(data.cards)) {
                const wasCreated = addColumnWithCards(data.column, data.cards);
                if (wasCreated) {
                    displayMessage(`Neue Spalte "${data.column}" mit ${data.cards.length} Karten angelegt.`, 'system');
                } else {
                    displayMessage(`${data.cards.length} Karten wurden zur Spalte "${data.column}" hinzugefügt.`, 'system');
                }
            } else {
                displayMessage(`Unbekannte Nachricht vom Server: ${event.data}`, 'system');
            }
        } catch (e) {
            displayMessage(`Fehler beim Verarbeiten der Server-Nachricht: ${event.data}`, 'system');
            console.error("Error parsing message from server or unknown message type:", e, event.data);
        }
    };

    socket.onclose = function (event) {
        updateConnectionStatus(`Verbindung zum Chat Agenten abgebrochen! (Code: ${event.code})`, true);
        displayMessage(`Verbindung zum Chat Agenten verloren. Code: ${event.code}`, 'system');
        serverAssignedConnectionId = null;
        socket = null;
        if (connectionStatusInterval) {
            clearInterval(connectionStatusInterval);
            connectionStatusInterval = null;
        }
        stopHeartbeat();
        // Automatisch reconnecten
        if (!reconnectTimeout) {
            reconnectTimeout = setTimeout(() => {
                reconnectTimeout = null;
                connectWebSocket();
            }, RECONNECT_DELAY);
        }
    };

    socket.onerror = function (error) {
        updateConnectionStatus('WebSocket Fehler!', true);
        displayMessage('Ein Fehler ist mit der WebSocket-Verbindung aufgetreten.', 'system');
        console.error('WebSocket error event:', error);
    };
}

function startHeartbeat() {
    stopHeartbeat();
    lastPongTimestamp = Date.now();
    heartbeatInterval = setInterval(() => {
        if (socket && socket.readyState === WebSocket.OPEN) {
            try {
                socket.send('ping');
            } catch (e) {}
        }
        // Prüfen, ob der Server geantwortet hat
        if (Date.now() - lastPongTimestamp > HEARTBEAT_INTERVAL * 2) {
            // Keine Antwort -> Verbindung als tot betrachten
            updateConnectionStatus('Verbindung zum Chat Agenten: Timeout, versuche Neuverbindung...', true);
            try { socket.close(); } catch (e) {}
        }
    }, HEARTBEAT_INTERVAL);
}

function stopHeartbeat() {
    if (heartbeatInterval) {
        clearInterval(heartbeatInterval);
        heartbeatInterval = null;
    }
}

// sendQueryToN8NAgent muss vor allen Event-Handlern deklariert werden!
function sendQueryToN8NAgent(queryText) {
    if (!queryText) return;
    if (!socket || socket.readyState !== WebSocket.OPEN) {
        displayMessage('Kann Nachricht nicht senden: WebSocket nicht verbunden.', 'system');
        return;
    }
    if (!serverAssignedConnectionId) {
        displayMessage('Kann Nachricht nicht senden: Keine Connection ID vom Server erhalten.', 'system');
        return;
    }
    displayMessage(queryText, 'user');
    const payload = {
        query: queryText,
        connectionId: serverAssignedConnectionId
    };
    fetch(n8nAgentWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    }).catch(error => {
        displayMessage('Netzwerkfehler beim Senden der Anfrage an den Agenten.', 'system');
        console.error('Network error sending query to n8n agent:', error);
    });
}

// Suggestions-UI unter dem Chat-Input
function renderSuggestions(suggestions) {
    const suggestionBar = document.getElementById('chatbot-suggestions');
    if (!suggestionBar) return;
    suggestionBar.innerHTML = '';
    if (!Array.isArray(suggestions) || suggestions.length === 0) {
        suggestionBar.classList.remove('show');
        return;
    }
    suggestions.forEach(suggestion => {
        const btn = document.createElement('button');
        btn.className = 'suggestion-btn';
        btn.textContent = suggestion;
        btn.onclick = function() {
            const userInput = document.getElementById('userInput');
            userInput.value = suggestion;
            window.sendQueryToN8NAgent(suggestion);
            suggestionBar.classList.remove('show');
            suggestionBar.innerHTML = '';
        };
        suggestionBar.appendChild(btn);
    });
    suggestionBar.classList.add('show');
}

// Event-Handler für UI
function setupChatbotUI() {
    const sendButton = document.getElementById('sendButton');
    const userInput = document.getElementById('userInput');
    sendButton.addEventListener('click', function() {
        window.sendQueryToN8NAgent(userInput.value.trim());
        userInput.value = '';
    });
    userInput.addEventListener('keypress', function (event) {
        if (event.key === 'Enter') {
            window.sendQueryToN8NAgent(userInput.value.trim());
            userInput.value = '';
        }
    });
}

// Initialisierung
// Chatbot nur initialisieren, wenn das Modal sichtbar ist
function isChatbotModalVisible() {
    const modal = document.getElementById('chatbot-modal');
    return modal && modal.classList.contains('show');
}

// Chatbot-Modal beim Start immer verstecken (robust)
window.addEventListener('DOMContentLoaded', function() {
    var modal = document.getElementById('chatbot-modal');
    if (modal) {
        modal.classList.remove('show');
        modal.style.display = 'none'; // Sicherstellen, dass es nicht angezeigt wird
        // Status initial ausblenden
        var status = document.getElementById('connectionStatus');
        if (status) status.style.display = 'none';
    }
    // Close-Button im Modal verbinden
    const closeBtn = document.querySelector('#chatbot-modal .close-btn');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeChatbotModal);
    }
    // Entfernt: Button dynamisch einfügen (wird jetzt im HTML-Markup gepflegt)
});

// Event-Handler für "Neuer Chat"-Button
window.addEventListener('DOMContentLoaded', function() {
    const newChatBtn = document.getElementById('newChatBtn');
    if (newChatBtn) {
        newChatBtn.onclick = function() {
            const boardId = window.currentBoard && window.currentBoard.id ? window.currentBoard.id : 'default';
            clearBoardChatConnectionId(boardId);
            if (socket) { try { socket.close(); } catch(e){} }
            connectWebSocket();
            displayMessage('Neuer Chat gestartet. Die Verbindung wurde zurückgesetzt.', 'system');
        };
    }
});

function closeChatbotModal() {
    var modal = document.getElementById('chatbot-modal');
    if (modal) {
        modal.classList.remove('show');
        modal.style.display = 'none';
    }
    // Status ausblenden
    const status = document.getElementById('connectionStatus');
    if (status) status.style.display = 'none';
}

function openChatbotModal() {
    var modal = document.getElementById('chatbot-modal');
    if (modal) {
        modal.classList.add('show');
        modal.style.display = '';
    }
    // Status sichtbar machen
    const status = document.getElementById('connectionStatus');
    if (status) status.style.display = 'block';
    if (!window._chatbotInitialized) {
        connectWebSocket();
        setupChatbotUI();
        window._chatbotInitialized = true;
    }
}

// Öffnet das globale AI-Settings-Modal und füllt die Felder
function openAISettingsModal() {
    document.getElementById('ai-websocket-url').value = localStorage.getItem('ai_websocketUrl') || 'wss://n8n.rpi-virtuell.de/chat-websocket-endpoint';
    document.getElementById('ai-webhook-url').value = localStorage.getItem('ai_n8nAgentWebhookUrl') || 'https://n8n.rpi-virtuell.de/webhook/relichat-materialpool';
    document.getElementById('ai-provider').value = localStorage.getItem('ai_provider') || '';
    document.getElementById('ai-api-key').value = localStorage.getItem('ai_apiKey') || '';
    document.getElementById('ai-model').value = localStorage.getItem('ai_model') || '';
    document.getElementById('ai-base-url').value = localStorage.getItem('ai_baseUrl') || '';
    openModal('ai-settings-modal');
}

document.addEventListener('DOMContentLoaded', function() {
    const aiSettingsForm = document.getElementById('ai-settings-form');
    if (aiSettingsForm) {
        aiSettingsForm.onsubmit = function(e) {
            e.preventDefault();
            const wsUrl = document.getElementById('ai-websocket-url').value.trim();
            const webhookUrl = document.getElementById('ai-webhook-url').value.trim();
            const provider = document.getElementById('ai-provider').value.trim();
            const apiKey = document.getElementById('ai-api-key').value.trim();
            const model = document.getElementById('ai-model').value.trim();
            const baseUrl = document.getElementById('ai-base-url').value.trim();
            saveAIEndpoints(wsUrl, webhookUrl);
            saveGlobalAISettings({ provider, apiKey, model, baseUrl });
            closeModal('ai-settings-modal');
            // alert('AI- und n8n-Einstellungen gespeichert!');
        };
    }
});

// Export für globale Nutzung
window.addCardToColumn = addCardToColumn;
window.addColumnWithCards = addColumnWithCards;
window.sendQueryToN8NAgent = sendQueryToN8NAgent;
window.connectWebSocket = connectWebSocket;
window.openChatbotModal = openChatbotModal;
window.closeChatbotModal = closeChatbotModal;
window.openAISettingsModal = openAISettingsModal;
