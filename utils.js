
// Utility Functions
function generateId() {
    return 'id-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
}

function openModal(modalId) {
    document.getElementById(modalId).classList.add('show');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('show');
}

function backToDashboard() {
    document.getElementById('board-view').style.display = 'none';
    document.getElementById('dashboard').style.display = 'block';
    currentBoard = null;
    renderDashboard();
}

function applyCustomStyle(elementId, styles) {
    const styleElement = document.getElementById(elementId) || document.createElement('style');
    styleElement.id = elementId;
    styleElement.textContent = styles;
    
    if (!document.getElementById(elementId)) {
        document.head.appendChild(styleElement);
    }
}
