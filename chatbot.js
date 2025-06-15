// chatbot.js - WebSocket/N8N Chatbot Integration für Kanban
// Diese Datei implementiert die Chatbot-Logik und die Integration mit dem Kanban-Board

// --- Konfiguration ---
let websocketUrl = localStorage.getItem('ai_websocketUrl');
let n8nAgentWebhookUrl = localStorage.getItem('ai_n8nAgentWebhookUrl');
let aiColumnsUrl = localStorage.getItem('ai_columnsUrl');
let aiCardsUrl = localStorage.getItem('ai_cardsUrl');

function saveAIEndpoints(wsUrl, webhookUrl, columnsUrl, cardsUrl) {
    localStorage.setItem('ai_websocketUrl', wsUrl);
    localStorage.setItem('ai_n8nAgentWebhookUrl', webhookUrl);
    localStorage.setItem('ai_columnsUrl', columnsUrl);
    localStorage.setItem('ai_cardsUrl', cardsUrl);
    websocketUrl = wsUrl;
    n8nAgentWebhookUrl = webhookUrl;
    aiColumnsUrl = columnsUrl;
    aiCardsUrl = cardsUrl;
}

let socket = null;
let connectionStatusInterval = null;
let reconnectTimeout = null;
let heartbeatInterval = null;
let lastPongTimestamp = null;
let temporaryStatusTimeout = null; // Für temporäre Statusmeldungen
let isConnecting = false; // Flag um Race Conditions zu vermeiden
let uiResetTimeout = null; // Timeout für automatisches UI-Reset nach Anfrage
const HEARTBEAT_INTERVAL = 30000; // 30 Sekunden
const RECONNECT_DELAY = 3000; // 3 Sekunden
const TEMPORARY_STATUS_DURATION = 5000; // 5 Sekunden für temporäre Fehlermeldungen

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
    }    // Card anlegen
    const newCard = {
        id: generateId(),
        heading: cardData.title || 'Unbenannt',
        content: cardData.content || '',
        color: 'color-gradient-1',
        thumbnail: cardData.thumbnail || '',
        comments: cardData.comment || '',
        url: cardData.url || '',
        labels: cardData.labels || '',
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
        //const exists = column.cards.some(card => card.heading === (cardData.title || 'Unbenannt'));
        const exists = column.cards.some(card => card.content === (cardData.content || 'Kein Inhalt'));
        if (!exists) {
            const newCard = {
                id: generateId(),
                heading: cardData.title || 'Unbenannt',
                content: cardData.content || '',
                color: 'color-gradient-1',
                thumbnail: cardData.thumbnail || '',
                comments: cardData.comment || '',
                url: cardData.url || '',
                labels: cardData.labels || '',
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
(function () {
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
            html = html.replace(/<think>([\s\S]*?)<\/think>/gi, function (_, content) {
                return `<details class="think-accordion" open><summary>Denken ...</summary><div class="markdown-content">${content}</div></details>`;
            });
        }
        return `<div class="markdown-content">${html}</div>`;
    }
    return markdownText;
}

function displayMessage(textOrHtml, sender = 'bot') {
    // System-Messages mit Fehlerindikatoren erhalten temporäre Anzeige
    if (sender === 'system') {
        const hasError = textOrHtml.includes('⚠️') || textOrHtml.includes('Fehler') || textOrHtml.includes('Netzwerkfehler');
        if (hasError) {
            showTemporaryStatus(textOrHtml, true);
        } else {
            updateConnectionStatus(textOrHtml, false);
        }
        return;
    }

    const chatbox = document.getElementById('chatbox');
    const messageElement = document.createElement('div');
    const senderClass = sender + '-message';
    messageElement.classList.add('message', senderClass);
    // Markdown immer erst beim Anzeigen rendern
    let html = renderMarkdownToHtml(textOrHtml);
    messageElement.innerHTML = html;
    chatbox.appendChild(messageElement);
    chatbox.scrollTop = chatbox.scrollHeight;

    // Chat-Nachrichten für aktuelles Board speichern (nur Bot und User Messages, keine System-Messages)
    const boardId = window.currentBoard && window.currentBoard.id ? window.currentBoard.id : 'default';
    const currentMessages = getCurrentChatMessages();
    saveChatMessages(boardId, currentMessages);
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

// Neue Funktion für temporäre Statusmeldungen
function showTemporaryStatus(message, isError = false, duration = TEMPORARY_STATUS_DURATION) {
    // Vorherigen Timeout löschen
    if (temporaryStatusTimeout) {
        clearTimeout(temporaryStatusTimeout);
    }

    // Temporäre Nachricht anzeigen
    updateConnectionStatus(message, isError);

    // Nach der angegebenen Zeit zur normalen Anzeige zurückkehren
    temporaryStatusTimeout = setTimeout(() => {
        temporaryStatusTimeout = null;
        // Zurück zur normalen Verbindungsanzeige
        if (socket && socket.readyState === WebSocket.OPEN) {
            showConnectionId();
        } else {
            updateConnectionStatus('Verbindung zum Chat Agenten abgebrochen!', true);
        }
    }, duration);
}

function showConnectionId() {
    const connectionStatus = document.getElementById('connectionStatus');
    const boardId = window.currentBoard && window.currentBoard.id ? window.currentBoard.id : 'default';
    const serverAssignedConnectionId = getServerAssignedConnectionId(boardId);
    if (serverAssignedConnectionId) {
        // Verbunden-Symbol anzeigen statt langer ID
        connectionStatus.textContent = '🟢 Verbunden';
        connectionStatus.style.color = '#28a745';
        // Connection-ID nur in die Entwicklerkonsole loggen
        console.log(`[Chatbot] Verbunden mit Board ${boardId}, Connection-ID: ${serverAssignedConnectionId}`);
    }
}

function checkWebSocketStatus() {
    // Nur prüfen, wenn keine temporäre Statusmeldung aktiv ist
    if (temporaryStatusTimeout) {
        return; // Temporären Status nicht überschreiben
    }

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

// Server-assigned Connection-ID für Board speichern/lesen
function getServerAssignedConnectionId(boardId) {
    if (!boardId) return null;
    const key = 'serverAssignedConnectionId_' + boardId;
    return sessionStorage.getItem(key) || localStorage.getItem(key);
}

function setServerAssignedConnectionId(boardId, connectionId) {
    if (!boardId) return;
    const key = 'serverAssignedConnectionId_' + boardId;
    sessionStorage.setItem(key, connectionId);
    localStorage.setItem(key, connectionId);
}

function clearServerAssignedConnectionId(boardId) {
    if (!boardId) return;
    const key = 'serverAssignedConnectionId_' + boardId;
    sessionStorage.removeItem(key);
    localStorage.removeItem(key);
}

// WebSocket-URL dynamisch mit Board-gebundener Connection-ID
function getWebSocketUrlForBoard(boardId) {
    let connectionId = getBoardChatConnectionId(boardId);
    if (!connectionId) {
        connectionId = 'boardchat-' + boardId + '-' + Math.random().toString(36).substring(2, 8) + '-' + Date.now();
        setBoardChatConnectionId(boardId, connectionId);
    }
    // Nutze global konfiguriertes websocketUrl
    let url = websocketUrl;

    // Null/undefined-Prüfung hinzufügen
    if (!url) {
        console.error('WebSocket URL ist nicht konfiguriert. Bitte in den AI-Settings einstellen.');
        return null;
    }

    if (!/^wss?:\/\//.test(url)) url = 'wss://' + url.replace(/^https?:\/\//, '');
    return url + '/?clientId=' + encodeURIComponent(connectionId);
}

// connectWebSocket anpassen:
function connectWebSocket() {
    // Verhindere mehrfache gleichzeitige Verbindungsversuche
    if (isConnecting) {
        console.log('WebSocket connection already in progress...');
        return;
    }

    // Bestehende Verbindung schließen
    if (socket && socket.readyState !== WebSocket.CLOSED) {
        try {
            socket.close();
        } catch (e) {
            console.warn('Error closing existing socket:', e);
        }
        socket = null;
    }

    isConnecting = true;

    // Board-ID bestimmen (z.B. window.currentBoard.id)
    const boardId = window.currentBoard && window.currentBoard.id ? window.currentBoard.id : 'default';
    const wsUrl = getWebSocketUrlForBoard(boardId);

    // Prüfung, ob wsUrl gültig ist
    if (!wsUrl) {
        updateConnectionStatus('WebSocket URL fehlt. Bitte AI-Settings konfigurieren.', true);
        displayMessage('⚠️ Fehler: WebSocket URL ist nicht konfiguriert. Bitte öffnen Sie die AI-Settings und konfigurieren Sie die WebSocket URL.', 'system');
        isConnecting = false;
        return;
    }

    updateConnectionStatus('Verbinde mit WebSocket-Server...');

    try {
        socket = new WebSocket(wsUrl);

        socket.onopen = function () {
            isConnecting = false;
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
                    const boardId = window.currentBoard && window.currentBoard.id ? window.currentBoard.id : 'default';
                    setServerAssignedConnectionId(boardId, data.connectionId);
                    showConnectionId();
                    if (!connectionStatusInterval) {
                        connectionStatusInterval = setInterval(checkWebSocketStatus, 3000);
                    }
                    return;
                } else if (data.type === 'final_answer') {
                    displayMessage(data.text || data.message, 'bot');
                    resetChatInputUI(); // UI wieder freigeben nach finaler Antwort
                    return;
                } else if ((data.type === 'suggestion' || data.type === 'suggestions') && (data.suggestion || data.text || data.suggestions)) {
                    // Nur als Button anzeigen, nicht mehr als Chatnachricht
                    const suggestionText = data.suggestion || data.text;
                    if (suggestionText) {
                        renderSuggestions([suggestionText]);
                    } else if (Array.isArray(data.suggestions)) {
                        renderSuggestions(data.suggestions);
                    }
                    resetChatInputUI(); // UI wieder freigeben nach Suggestions
                    return;
                } else if (data.type === 'thinking' && (data.message || data.text)) {
                    const thinkingLabel = data.label || 'Denken...';
                    displayMessage('<div class="think"><details open><summary>' + thinkingLabel + '</summary>' + (data.message || data.text) + '</details></div>', 'bot');
                    // HINWEIS: Bei thinking messages UI NICHT zurücksetzen, da noch weitere Nachrichten erwartet werden
                    return;
                } else if (data.type === 'cards' && Array.isArray(data.cards)) {
                    let targetColumn = data.column || 'Material';
                    const columnWasCreated = addColumnWithCards(targetColumn, data.cards);
                    if (columnWasCreated) {
                        displayMessage(`Spalte "${targetColumn}" wurde neu angelegt und ${data.cards.length} Karten hinzugefügt.`, 'system');
                    } else {
                        displayMessage(`${data.cards.length} Karten wurden zur Spalte "${targetColumn}" hinzugefügt.`, 'system');
                    }
                    resetChatInputUI(); // UI wieder freigeben nach Karten-Antwort
                    return;
                } else if (data.type === 'column' && data.column && Array.isArray(data.cards)) {
                    const newColumnWasCreated = addColumnWithCards(data.column, data.cards);
                    if (newColumnWasCreated) {
                        displayMessage(`Neue Spalte "${data.column}" mit ${data.cards.length} Karten angelegt.`, 'system');
                    } else {
                        displayMessage(`${data.cards.length} Karten wurden zur Spalte "${data.column}" hinzugefügt.`, 'system');
                    }
                    resetChatInputUI(); // UI wieder freigeben nach Spalten-Antwort
                    return;
                } else if (data.type === 'summary' && (data.text || data.summary)) {
                    const summaryText = data.text || data.summary;
                    updateBoardSummary(summaryText);
                    displayMessage('Board-Zusammenfassung wurde generiert und aktualisiert.', 'system');
                    resetChatInputUI(); // UI wieder freigeben nach Summary-Antwort
                    return;
                } else if (data.type === 'update-cards' && data.columnId && Array.isArray(data.cards)) {
                    // Neue Funktionalität: Karten in einer Spalte aktualisieren
                    updateColumnCards(data.columnId, data.cards, data.columnName);
                    displayMessage(`✅ Spalte "${data.columnName || 'Unbekannt'}" wurde durch AI aktualisiert (${data.cards.length} Karten).`, 'system');
                    resetChatInputUI(); // UI wieder freigeben nach Karten-Update
                    return;
                } else {
                    displayMessage(`Unbekannte Nachricht vom Server: ${event.data}`, 'system');
                    resetChatInputUI(); // UI wieder freigeben bei unbekannten Nachrichten
                }
            } catch (e) {
                displayMessage(`Fehler beim Verarbeiten der Server-Nachricht: ${event.data}`, 'system');
                console.error("Error parsing message from server or unknown message type:", e, event.data);
                resetChatInputUI(); // UI wieder freigeben bei Parsing-Fehlern
            }
        }; socket.onclose = function (event) {
            isConnecting = false;
            updateConnectionStatus(`Verbindung zum Chat Agenten abgebrochen! (Code: ${event.code})`, true);
            displayMessage(`Verbindung zum Chat Agenten verloren. Code: ${event.code}`, 'system');
            const boardId = window.currentBoard && window.currentBoard.id ? window.currentBoard.id : 'default';
            clearServerAssignedConnectionId(boardId);
            socket = null; if (connectionStatusInterval) {
                clearInterval(connectionStatusInterval);
                connectionStatusInterval = null;
            }
            if (uiResetTimeout) {
                clearTimeout(uiResetTimeout);
                uiResetTimeout = null;
            }
            stopHeartbeat();
            resetChatInputUI(); // UI wieder freigeben bei Verbindungsverlust
            // Automatisch reconnecten
            if (!reconnectTimeout) {
                reconnectTimeout = setTimeout(() => {
                    reconnectTimeout = null;
                    connectWebSocket();
                }, RECONNECT_DELAY);
            }
        }; socket.onerror = function (error) {
            isConnecting = false;
            updateConnectionStatus('WebSocket Fehler!', true);
            displayMessage('Ein Fehler ist mit der WebSocket-Verbindung aufgetreten.', 'system');
            console.error('WebSocket error event:', error);
            resetChatInputUI(); // UI wieder freigeben bei WebSocket-Fehler
        };
    } catch (error) {
        isConnecting = false;
        updateConnectionStatus('Fehler beim Erstellen der WebSocket-Verbindung!', true);
        displayMessage('Fehler beim Erstellen der WebSocket-Verbindung.', 'system');
        console.error('Error creating WebSocket:', error);
    }
}

function startHeartbeat() {
    stopHeartbeat();
    lastPongTimestamp = Date.now();
    heartbeatInterval = setInterval(() => {
        if (socket && socket.readyState === WebSocket.OPEN) {
            try {
                socket.send('ping');
            } catch (e) {
                console.warn('Error sending ping:', e);
            }
        }
        // Prüfen, ob der Server geantwortet hat
        if (lastPongTimestamp && Date.now() - lastPongTimestamp > HEARTBEAT_INTERVAL * 2) {
            // Keine Antwort -> Verbindung als tot betrachten
            updateConnectionStatus('Verbindung zum Chat Agenten: Timeout, versuche Neuverbindung...', true);
            try {
                if (socket) socket.close();
            } catch (e) {
                console.warn('Error closing socket:', e);
            }
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

    // UI-Elemente für Progress-Anzeige
    const sendButton = document.getElementById('sendButton');
    const progressIndicator = document.getElementById('progressIndicator');
    const userInput = document.getElementById('userInput');    // Hilfsfunktion für lokales UI-Reset bei Fehlern
    function resetUIOnError() {
        try {
            console.log('resetUIOnError called');
            if (sendButton) {
                sendButton.disabled = false;
                console.log('Send button re-enabled in resetUIOnError');
            }
            if (progressIndicator) {
                progressIndicator.classList.remove('show');
                progressIndicator.classList.add('hide');
                progressIndicator.style.display = 'none';
                console.log('Progress indicator hidden in resetUIOnError');
            }
            if (userInput) {
                userInput.disabled = false;
                console.log('User input re-enabled in resetUIOnError');
            }
        } catch (error) {
            console.error('Error in resetUIOnError:', error);
        }
    }

    // Prüfung, ob n8nAgentWebhookUrl konfiguriert ist
    if (!n8nAgentWebhookUrl) {
        displayMessage('⚠️ Fehler: N8N Agent Webhook URL ist nicht konfiguriert. Bitte öffnen Sie die AI-Settings und konfigurieren Sie die Webhook URL.', 'system');
        resetUIOnError();
        return;
    }
    if (!socket || socket.readyState !== WebSocket.OPEN) {
        console.log('[sendQueryToN8NAgent] WebSocket nicht verbunden, versuche Verbindung aufzubauen...');

        // Versuche WebSocket-Verbindung herzustellen, falls sie nicht existiert
        if (!socket && !isConnecting) {
            console.log('[sendQueryToN8NAgent] Keine Socket-Verbindung, starte connectWebSocket()');
            connectWebSocket();
        }

        displayMessage('WebSocket-Verbindung wird aufgebaut. Bitte warten Sie einen Moment und versuchen Sie es erneut.', 'system');
        resetUIOnError();
        return;
    }

    const boardId = window.currentBoard && window.currentBoard.id ? window.currentBoard.id : 'default';
    const serverAssignedConnectionId = getServerAssignedConnectionId(boardId);
    if (!serverAssignedConnectionId) {
        displayMessage('Kann Nachricht nicht senden: Keine Connection ID vom Server erhalten.', 'system');
        resetUIOnError();
        return;
    }    // UI während der Anfrage blockieren
    console.log('Blocking UI for chat request...');
    if (sendButton) {
        sendButton.disabled = true;
        console.log('Send button disabled');
    }
    if (progressIndicator) {
        progressIndicator.classList.remove('hide');
        progressIndicator.classList.add('show');
        progressIndicator.style.display = 'inline-flex';
        console.log('Progress indicator shown');
    }
    if (userInput) {
        userInput.disabled = true;
        console.log('User input disabled');
    }

    // Automatisches UI-Reset nach 30 Sekunden planen
    scheduleUIReset(30000);

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
        // UI wieder freigeben bei Fehler
        resetChatInputUI();
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
        btn.onclick = function () {
            const userInput = document.getElementById('userInput');
            userInput.value = suggestion;
            window.sendQueryToN8NAgent(suggestion);
            userInput.value = '';  // Input-Feld leeren
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

    console.log('setupChatbotUI called', {
        sendButton: !!sendButton,
        userInput: !!userInput
    });

    if (sendButton) {
        sendButton.addEventListener('click', function () {
            const inputValue = userInput.value.trim();
            console.log('Send button clicked, input value:', inputValue);
            window.sendQueryToN8NAgent(inputValue);
            userInput.value = '';
        });
    }

    if (userInput) {
        userInput.addEventListener('keypress', function (event) {
            if (event.key === 'Enter') {
                const inputValue = userInput.value.trim();
                console.log('Enter pressed, input value:', inputValue);
                window.sendQueryToN8NAgent(inputValue);
                userInput.value = '';
            }
        });
    }
}

// Initialisierung
// Chatbot nur initialisieren, wenn das Modal sichtbar ist
function isChatbotModalVisible() {
    const modal = document.getElementById('chatbot-modal');
    return modal && modal.classList.contains('show');
}

// Chatbot-Modal beim Start immer verstecken (robust)
window.addEventListener('DOMContentLoaded', function () {
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
window.addEventListener('DOMContentLoaded', function () {
    const newChatBtn = document.getElementById('newChatBtn');
    if (newChatBtn) {
        newChatBtn.onclick = function () {
            try {
                const boardId = window.currentBoard && window.currentBoard.id ? window.currentBoard.id : 'default';

                console.log('[Neuer Chat] Button geklickt, Board ID:', boardId);

                // UI erst mal freigeben, falls sie blockiert ist
                resetChatInputUI();

                // Chat-Nachrichten für aktuelles Board löschen
                clearChatMessages(boardId);

                // Chat-UI leeren
                const chatbox = document.getElementById('chatbox');
                if (chatbox) chatbox.innerHTML = '';

                // Connection-IDs löschen
                clearBoardChatConnectionId(boardId);
                clearServerAssignedConnectionId(boardId);

                // WebSocket-Verbindung sicher schließen
                if (socket) {
                    try {
                        console.log('[Neuer Chat] Schließe bestehende WebSocket-Verbindung');
                        socket.close();
                    } catch (e) {
                        console.warn('[Neuer Chat] Fehler beim Schließen der WebSocket:', e);
                    }
                }

                // Socket auf null setzen um sicherzustellen, dass neue Verbindung erstellt wird
                socket = null;
                isConnecting = false; // Flag zurücksetzen
                // Alle Timeout-Handler stoppen
                if (reconnectTimeout) {
                    clearTimeout(reconnectTimeout);
                    reconnectTimeout = null;
                }
                if (connectionStatusInterval) {
                    clearInterval(connectionStatusInterval);
                    connectionStatusInterval = null;
                }
                if (uiResetTimeout) {
                    clearTimeout(uiResetTimeout);
                    uiResetTimeout = null;
                }
                stopHeartbeat();

                // Sofort neue Verbindung starten
                console.log('[Neuer Chat] Starte neue WebSocket-Verbindung');
                connectWebSocket();
                displayMessage('Neuer Chat gestartet. Die Verbindung wird neu aufgebaut...', 'system');

            } catch (error) {
                console.error('[Neuer Chat] Fehler beim Neustarten des Chats:', error);
                displayMessage('Fehler beim Neustarten des Chats. Bitte versuchen Sie es erneut.', 'system');
                resetChatInputUI(); // UI freigeben bei Fehlern
            }
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

    // Chat-Nachrichten für aktuelles Board laden
    const boardId = window.currentBoard && window.currentBoard.id ? window.currentBoard.id : 'default';
    const savedMessages = loadChatMessages(boardId);
    restoreChatMessages(savedMessages);

    if (!window._chatbotInitialized) {
        connectWebSocket();
        setupChatbotUI();
        window._chatbotInitialized = true;
    }
}

// Öffnet das globale AI-Settings-Modal und füllt die Felder
function openAISettingsModal() {
    document.getElementById('ai-websocket-url').value = localStorage.getItem('ai_websocketUrl') || '';
    document.getElementById('ai-webhook-url').value = localStorage.getItem('ai_n8nAgentWebhookUrl') || '';
    document.getElementById('ai-columns-url').value = localStorage.getItem('ai_columnsUrl') || '';
    document.getElementById('ai-cards-url').value = localStorage.getItem('ai_cardsUrl') || '';
    openModal('ai-settings-modal');
}

document.addEventListener('DOMContentLoaded', function () {
    const aiSettingsForm = document.getElementById('ai-settings-form');
    if (aiSettingsForm) {
        aiSettingsForm.onsubmit = function (e) {
            e.preventDefault();
            const wsUrl = document.getElementById('ai-websocket-url').value.trim();
            const webhookUrl = document.getElementById('ai-webhook-url').value.trim();
            const columnsUrl = document.getElementById('ai-columns-url').value.trim();
            const cardsUrl = document.getElementById('ai-cards-url').value.trim();
            saveAIEndpoints(wsUrl, webhookUrl, columnsUrl, cardsUrl);
            closeModal('ai-settings-modal');
            // alert('AI-Endpoints gespeichert!');
        };
    }
});

// Hilfsfunktion: UI-Elemente nach Antwort wieder freigeben
function resetChatInputUI() {
    try {
        const sendButton = document.getElementById('sendButton');
        const progressIndicator = document.getElementById('progressIndicator');
        const userInput = document.getElementById('userInput');

        console.log('resetChatInputUI called', {
            sendButton: !!sendButton,
            progressIndicator: !!progressIndicator,
            userInput: !!userInput,
            sendButtonDisabled: sendButton ? sendButton.disabled : 'N/A',
            progressIndicatorClasses: progressIndicator ? progressIndicator.className : 'N/A'
        });

        // UI-Reset-Timeout löschen, wenn manuell resettet wird
        if (uiResetTimeout) {
            clearTimeout(uiResetTimeout);
            uiResetTimeout = null;
            console.log('UI reset timeout cleared');
        }

        // Send Button aktivieren
        if (sendButton) {
            sendButton.disabled = false;
            console.log('Send button enabled');
        }

        // Progress Indicator verstecken - beide Klassen setzen für Sicherheit
        if (progressIndicator) {
            progressIndicator.classList.remove('show');
            progressIndicator.classList.add('hide');
            progressIndicator.style.display = 'none'; // Zusätzliche Sicherheit
            console.log('Progress indicator hidden, new classes:', progressIndicator.className);
        }

        // User Input aktivieren
        if (userInput) {
            userInput.disabled = false;
            console.log('User input enabled');
        }

        console.log('resetChatInputUI completed successfully');
    } catch (error) {
        console.error('Error in resetChatInputUI:', error);
    }
}

// Automatisches UI-Reset nach Timeout (falls keine Antwort kommt)
function scheduleUIReset(timeoutMs = 30000) { // 30 Sekunden Standard-Timeout
    // Vorherigen Timeout löschen
    if (uiResetTimeout) {
        clearTimeout(uiResetTimeout);
    }

    uiResetTimeout = setTimeout(() => {
        console.log('UI reset timeout triggered - automatically resetting UI');
        resetChatInputUI();
        displayMessage('Timeout: UI wurde automatisch wieder freigegeben.', 'system');
    }, timeoutMs);

    console.log(`UI reset scheduled for ${timeoutMs}ms from now`);
}

// Board-Wechsel-Handler: WebSocket-Verbindung für neues Board aktualisieren
function handleBoardChange(newBoardId) {
    // Prüfen ob Chatbot-Modal geöffnet ist
    const modal = document.getElementById('chatbot-modal');
    const isModalVisible = modal && modal.classList.contains('show');

    if (isModalVisible) {
        if (newBoardId === null) {
            // Zurück zum Dashboard - Chat leeren und Verbindung schließen
            const chatbox = document.getElementById('chatbox');
            if (chatbox) chatbox.innerHTML = '';

            if (socket && socket.readyState === WebSocket.OPEN) {
                try {
                    socket.close();
                } catch (e) {
                    console.log('Fehler beim Schließen der WebSocket-Verbindung:', e);
                }
            }
        } else {
            // Chat-Nachrichten für neues Board laden
            const savedMessages = loadChatMessages(newBoardId);
            restoreChatMessages(savedMessages);

            // Board-Wechsel - Verbindung neu aufbauen
            if (socket && socket.readyState === WebSocket.OPEN) {
                try {
                    socket.close();
                } catch (e) {
                    console.log('Fehler beim Schließen der WebSocket-Verbindung:', e);
                }

                // Neue Verbindung für das neue Board aufbauen
                setTimeout(() => {
                    connectWebSocket();
                    displayMessage(`Board gewechselt. Neue Chat-Verbindung wird aufgebaut...`, 'system');
                }, 500);
            }
        }
    }
}

// Chat-Nachrichten pro Board speichern/laden
function saveChatMessages(boardId, messages) {
    if (!boardId) return;
    const key = 'chatMessages_' + boardId;
    localStorage.setItem(key, JSON.stringify(messages));
}

function loadChatMessages(boardId) {
    if (!boardId) return [];
    const key = 'chatMessages_' + boardId;
    const saved = localStorage.getItem(key);
    if (saved) {
        try {
            return JSON.parse(saved);
        } catch (e) {
            console.error('Fehler beim Laden der Chat-Nachrichten:', e);
            return [];
        }
    }
    return [];
}

function clearChatMessages(boardId) {
    if (!boardId) return;
    const key = 'chatMessages_' + boardId;
    localStorage.removeItem(key);
}

// Board Summary Update Funktion
function updateBoardSummary(newSummaryText) {
    if (!window.currentBoard) return;

    // Bestehende Summary nur überschreiben, wenn sie leer ist
    if (!window.currentBoard.summary || window.currentBoard.summary.trim() === '' ||
        window.currentBoard.summary === 'No summary yet...' ||
        window.currentBoard.summary === 'Board summary will appear here...') {
        window.currentBoard.summary = newSummaryText;
    } else {
        // Neue Summary anhängen oder als Aktualisierung markieren
        window.currentBoard.summary = newSummaryText;
    }

    // Board-View aktualisieren
    if (typeof updateBoardView === 'function') {
        updateBoardView();
    }

    // Boards speichern
    if (typeof saveAllBoards === 'function') {
        saveAllBoards();
    }

    console.log('[Chatbot] Board Summary updated:', newSummaryText);
}

function getCurrentChatMessages() {
    const chatbox = document.getElementById('chatbox');
    if (!chatbox) return [];

    const messages = [];
    const messageElements = chatbox.querySelectorAll('.message');

    messageElements.forEach(el => {
        const isUserMessage = el.classList.contains('user-message');
        const isBotMessage = el.classList.contains('bot-message');
        const isSystemMessage = el.classList.contains('system-message');

        // Nur Bot- und User-Messages speichern, keine System-Messages
        if (isUserMessage) {
            messages.push({
                content: el.innerHTML,
                sender: 'user',
                timestamp: Date.now()
            });
        } else if (isBotMessage) {
            messages.push({
                content: el.innerHTML,
                sender: 'bot',
                timestamp: Date.now()
            });
        }
        // System-Messages werden übersprungen
    });

    return messages;
}

function restoreChatMessages(messages) {
    const chatbox = document.getElementById('chatbox');
    if (!chatbox) return;

    // Chat leeren
    chatbox.innerHTML = '';

    // Nur Bot- und User-Messages wiederherstellen, keine System-Messages
    messages.forEach(msg => {
        if (msg.sender === 'user' || msg.sender === 'bot') {
            const messageElement = document.createElement('div');
            const senderClass = msg.sender + '-message';
            messageElement.classList.add('message', senderClass);
            messageElement.innerHTML = msg.content;
            chatbox.appendChild(messageElement);
        }
    });

    // Zum Ende scrollen
    chatbox.scrollTop = chatbox.scrollHeight;
}

// Karten in einer Spalte aktualisieren (für Column AI)
function updateColumnCards(columnId, newCards, columnName) {
    if (!currentBoard || !currentBoard.columns) {
        console.error('No current board available');
        return;
    }

    const column = currentBoard.columns.find(c => c.id === columnId);
    if (!column) {
        console.error(`Column with ID ${columnId} not found`);
        return;
    }

    console.log(`🔄 Updating column "${column.name}" with ${newCards.length} cards from AI`);

    // Karten aktualisieren - sicherstellen, dass alle Karten gültige IDs haben
    const updatedCards = newCards.map(card => {
        // Bestehende Karte finden anhand von heading oder id
        const existingCard = column.cards.find(c =>
            (card.id && c.id === card.id) ||
            (card.heading && c.heading === card.heading)
        );

        return {
            id: existingCard?.id || card.id || generateId(),
            heading: card.heading || '',
            content: card.content || '',
            color: card.color || existingCard?.color || 'color-gradient-1',
            thumbnail: card.thumbnail || existingCard?.thumbnail || '',
            comments: card.comments || existingCard?.comments || '',
            url: card.url || existingCard?.url || '',
            labels: card.labels || existingCard?.labels || '',
            inactive: card.inactive || existingCard?.inactive || false,
            expanded: card.expanded || existingCard?.expanded || false
        };
    });

    // Spalte mit neuen Karten aktualisieren
    column.cards = updatedCards;

    // Board speichern und neu rendern
    saveAllBoards();
    renderColumns();

    // Erfolgs-Benachrichtigung
    if (typeof showAINotification === 'function') {
        showAINotification(`✅ Spalte "${column.name}" erfolgreich aktualisiert!`, 'success');
    }

    console.log(`✅ Column "${column.name}" updated successfully with ${updatedCards.length} cards`);
}

// Export für globale Nutzung
window.addCardToColumn = addCardToColumn;
window.addColumnWithCards = addColumnWithCards;
window.updateColumnCards = updateColumnCards;
window.sendQueryToN8NAgent = sendQueryToN8NAgent;
window.connectWebSocket = connectWebSocket;
window.openChatbotModal = openChatbotModal;
window.closeChatbotModal = closeChatbotModal;
window.openAISettingsModal = openAISettingsModal;
window.handleBoardChange = handleBoardChange;
window.resetChatInputUI = resetChatInputUI;
window.scheduleUIReset = scheduleUIReset;
window.updateBoardSummary = updateBoardSummary;
window.renderMarkdownToHtml = renderMarkdownToHtml;
