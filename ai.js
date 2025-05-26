// AI Functions
function generateBoardSummary() {
    if (!currentBoard.aiConfig?.provider || !currentBoard.aiConfig?.apiKey) {
        alert('Please configure AI settings in Board Settings first.');
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
    const mockSummary = `This board contains ${currentBoard.columns.length} columns with a total of ${allContent.length} cards. The workflow progresses through ${currentBoard.columns.map(c => c.name).join(', ')}. Key focus areas include project planning, task management, and completion tracking.`;
    
    currentBoard.summary = mockSummary;
    updateBoardView();
    
    alert('Summary generated! (This is a mock implementation)');
}

function useAsPrompt() {
    const content = document.getElementById('card-content').value;
    if (!content) {
        alert('Please enter some content first.');
        return;
    }
    
    if (!currentBoard.aiConfig?.provider || !currentBoard.aiConfig?.apiKey) {
        alert('Please configure AI settings in Board Settings first.');
        return;
    }
    
    // Simulate using content as prompt
    alert(`Using as prompt with ${currentBoard.aiConfig.provider} (${currentBoard.aiConfig.model}):\n\n"${content}"\n\n(In a real implementation, this would send the prompt to the configured AI API)`);
}

function generateWithAI() {
    if (!currentBoard.aiConfig?.provider || !currentBoard.aiConfig?.apiKey) {
        alert('Please configure AI settings in Board Settings first.');
        return;
    }
    
    // Simulate AI content generation
    const mockContent = `This is AI-generated content using ${currentBoard.aiConfig.provider} (${currentBoard.aiConfig.model}). In a real implementation, this would use the configured AI provider to generate meaningful content.`;
    
    document.getElementById('card-content').value = mockContent;
    
    alert('Content generated! (This is a mock implementation)');
}
