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
