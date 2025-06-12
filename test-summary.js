// Test-Script für Board Summary Funktionalität

// Warte bis die Seite geladen ist
document.addEventListener('DOMContentLoaded', function() {
    console.log('Test-Script geladen');
    
    // Erstelle Test-Button
    if (document.getElementById('board-view')) {
        const testButton = document.createElement('button');
        testButton.textContent = '🧪 Test Summary';
        testButton.className = 'btn btn-secondary';
        testButton.style.margin = '0.5rem';
        testButton.onclick = testBoardSummary;
        
        const headerActions = document.querySelector('.board-header-actions');
        if (headerActions) {
            headerActions.insertBefore(testButton, headerActions.firstChild);
        }
    }
});

// Test-Funktion für Board Summary
function testBoardSummary() {
    console.log('Testing Board Summary...');
    
    if (!window.currentBoard) {
        alert('Kein Board ausgewählt!');
        return;
    }
    
    // Test-Summary mit Markdown
    const testSummary = `# Board Zusammenfassung (Test)

Dieses ist eine **Test-Zusammenfassung** für das Board "${window.currentBoard.name}".

## Statistiken
- **Spalten**: ${window.currentBoard.columns.length}
- **Karten gesamt**: ${window.currentBoard.columns.reduce((sum, col) => sum + col.cards.length, 0)}

## Spalten-Übersicht
${window.currentBoard.columns.map(col => `- **${col.name}**: ${col.cards.length} Karten`).join('\n')}

## Features getestet
1. ✅ Markdown-Rendering
2. ✅ Expandierbares Interface  
3. ✅ Integration mit WebSocket

> Diese Zusammenfassung wurde automatisch durch einen Test generiert.

---

**Hinweis**: Dies ist ein Test der neuen Summary-Funktionalität.`;

    // Update Summary mit der neuen Funktion
    if (typeof window.updateBoardSummary === 'function') {
        window.updateBoardSummary(testSummary);
        console.log('Board Summary aktualisiert!');
    } else {
        console.error('updateBoardSummary Funktion nicht verfügbar');
    }
}

// Simuliere WebSocket Message für Summary
function simulateWebSocketSummary() {
    console.log('Simuliere WebSocket Summary Message...');
    
    const mockMessage = {
        type: 'summary',
        text: `# WebSocket Summary Test

Diese Summary wurde durch eine **simulierte WebSocket-Nachricht** generiert.

## Test-Details
- Timestamp: ${new Date().toLocaleString()}
- Message Type: \`summary\`
- Source: Test-Script

### Funktionalität
- [x] WebSocket Message Parsing
- [x] Markdown Rendering  
- [x] Board Integration
- [x] UI Update

> Test erfolgreich! 🎉`
    };
    
    // Simuliere die Verarbeitung wie im WebSocket Handler
    if (typeof window.updateBoardSummary === 'function') {
        window.updateBoardSummary(mockMessage.text);
        console.log('WebSocket Summary Test abgeschlossen!');
    }
}

// Globale Verfügbarkeit für Konsolen-Tests
window.testBoardSummary = testBoardSummary;
window.simulateWebSocketSummary = simulateWebSocketSummary;

console.log('Test-Summary Script bereit. Funktionen verfügbar:');
console.log('- testBoardSummary()');
console.log('- simulateWebSocketSummary()');
