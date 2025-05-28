// Chatbot Integration für Kanban-Board
// Erwartet, dass addCardToColumn(columnId, cardData) global verfügbar ist

// Beispiel: Chatbot verarbeitet spezielle Nachrichten vom Server, um Cards zu erzeugen
// (Hier nur die Integration für das Modal und das Hinzufügen von Cards)

// WebSocket- und Chat-Logik wie in deinem Beispiel
// ... (dein bestehender Chatbot-Code, siehe UserPrompt)

// Erweiterung: Wenn der Server eine Nachricht mit type: 'add_card' sendet
// oder eine Card in eine Spalte eingefügt werden soll:

function handleChatbotServerMessage(data) {
    // ...deine bestehende Verarbeitung...
    if (data.type === 'add_card' && data.columnId && data.card) {
        addCardToColumn(data.columnId, data.card);
        displayMessage('Neue Karte wurde in die Spalte eingefügt.', 'system');
    }
    // ...weitere Verarbeitung wie bisher...
}

// Beispiel: Integration in bestehende onmessage-Logik
// socket.onmessage = function (event) {
//     const data = JSON.parse(event.data);
//     handleChatbotServerMessage(data);
//     ...
// }

// Hinweis: Die eigentliche Chatbot-Logik und WebSocket-Initialisierung
// bleibt wie in deinem bisherigen Skript.

// Optional: Chatbot-Modal beim Klick auf einen Button öffnen
window.openChatbotModal = function() {
    document.getElementById('chatbot-modal').classList.add('show');
};
window.closeModal = window.closeModal || function(id) {
    document.getElementById(id).classList.remove('show');
};
