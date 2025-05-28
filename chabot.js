// chabot.js - Funktionen für das Chatbot-Modal

function openChatbotModal() {
    document.getElementById('chatbot-modal').classList.add('show');
}

function closeChatbotModal() {
    document.getElementById('chatbot-modal').classList.remove('show');
}

// Optional: ESC zum Schließen
window.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeChatbotModal();
    }
});

// Export für globale Nutzung
window.openChatbotModal = openChatbotModal;
window.closeChatbotModal = closeChatbotModal;
