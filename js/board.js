// Board View Functions
function openBoard(boardId) {
    currentBoard = boards.find(b => b.id === boardId);
    if (!currentBoard) return;

    document.getElementById('dashboard').style.display = 'none';
    document.getElementById('board-view').style.display = 'flex';

    // update url with board ID
    window.history.pushState({ boardId: currentBoard.id }, '', `?board=${currentBoard.id}`);
    
    // Global currentBoard aktualisieren
    window.currentBoard = currentBoard;
    
    // Chatbot über Board-Wechsel informieren
    if (typeof window.handleBoardChange === 'function') {
        window.handleBoardChange(currentBoard.id);
    }
    
    updateBoardView();
    renderColumns();
}

function updateBoardView() {
    document.getElementById('board-title').textContent = currentBoard.name;
    
    // Authors mit Icon anzeigen
    const authorsElement = document.getElementById('board-authors');
    const authorsText = currentBoard.authors && currentBoard.authors.length > 0 
        ? currentBoard.authors.join(', ') 
        : 'Kein Autor';
    authorsElement.innerHTML = `<span class="authors-icon">👥</span> ${authorsText}`;
    
    // Board Summary mit Markdown-Rendering und Expand-Funktionalität
    const summaryElement = document.getElementById('board-summary');
    const summaryText = currentBoard.summary || 'No summary yet...';
    
    // Markdown rendern (verwendet die gleiche Funktion wie im Chatbot)
    let summaryHtml = summaryText;
    if (typeof renderMarkdownToHtml === 'function' && summaryText !== 'No summary yet...' && summaryText !== 'Board summary will appear here...') {
        summaryHtml = renderMarkdownToHtml(summaryText);
    }
    
    // Expandierbare Summary erstellen
    if (summaryText.length > 150) {
        const shortText = summaryText.substring(0, 150) + '...';
        let shortHtml = shortText;
        if (typeof renderMarkdownToHtml === 'function' && summaryText !== 'No summary yet...' && summaryText !== 'Board summary will appear here...') {
            shortHtml = renderMarkdownToHtml(shortText);
        }
        
        summaryElement.innerHTML = `
            <div class="summary-content collapsed" id="summary-content">
                <div class="summary-short">${shortHtml}</div>
                <div class="summary-full" style="display: none;">${summaryHtml}</div>
            </div>
            <button class="summary-toggle" onclick="toggleBoardSummary()" aria-label="Summary erweitern">
                <span class="toggle-text">Mehr anzeigen</span>
                <span class="toggle-icon">▼</span>
            </button>
        `;
    } else {
        summaryElement.innerHTML = `<div class="summary-content">${summaryHtml}</div>`;
    }
    
    // Apply background colors
    const boardHeader = document.querySelector('.board-header');
    const boardView = document.getElementById('board-view');
    
    if (boardHeader) {
        if (currentBoard.headerRGBA) {
            // Header uses white with transparency to let board color show through
            boardHeader.style.backgroundColor = currentBoard.headerRGBA;
        } else if (currentBoard.backgroundColor) {
            // Fallback to old hex color
            boardHeader.style.backgroundColor = currentBoard.backgroundColor;
        }
    }
    
    if (boardView) {
        if (currentBoard.backgroundHex) {
            // Board background uses full color without transparency
            boardView.style.backgroundColor = currentBoard.backgroundHex;
        } else if (currentBoard.backgroundColor) {
            // Fallback to old hex color
            boardView.style.backgroundColor = currentBoard.backgroundColor;
        }
    }
      if (currentBoard.customStyle) {
        applyCustomStyle('board-custom-style', currentBoard.customStyle);
    }
}

// Toggle-Funktion für Board Summary
function toggleBoardSummary() {
    const summaryContent = document.getElementById('summary-content');
    const toggleButton = document.querySelector('.summary-toggle');
    const shortDiv = summaryContent.querySelector('.summary-short');
    const fullDiv = summaryContent.querySelector('.summary-full');
    const toggleText = toggleButton.querySelector('.toggle-text');
    const toggleIcon = toggleButton.querySelector('.toggle-icon');
      if (summaryContent.classList.contains('collapsed')) {
        // Expand
        summaryContent.classList.add('expanding');
        shortDiv.style.display = 'none';
        fullDiv.style.display = 'block';
        summaryContent.classList.remove('collapsed');
        summaryContent.classList.add('expanded');
        toggleText.textContent = 'Weniger anzeigen';
        toggleIcon.textContent = '▲';
        
        // Animation-Klasse nach Abschluss entfernen
        setTimeout(() => {
            summaryContent.classList.remove('expanding');
        }, 300);
    } else {
        // Collapse
        shortDiv.style.display = 'block';
        fullDiv.style.display = 'none';
        summaryContent.classList.remove('expanded');
        summaryContent.classList.add('collapsed');
        toggleText.textContent = 'Mehr anzeigen';
        toggleIcon.textContent = '▼';
    }
}

// Globale Verfügbarkeit
window.toggleBoardSummary = toggleBoardSummary;