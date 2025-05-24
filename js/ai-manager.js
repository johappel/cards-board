/**
 * AI Management
 * Handles AI integration and prompt processing
 */
class AIManager {
    constructor() {
        if (AIManager.instance) {
            return AIManager.instance;
        }
        AIManager.instance = this;
        this.supportedProviders = ['openai', 'anthropic', 'gemini'];
    }

    static getInstance() {
        if (!AIManager.instance) {
            AIManager.instance = new AIManager();
        }
        return AIManager.instance;
    }

    async generateBoardSummary(board) {
        const boardManager = BoardManager.getInstance();
        const currentBoard = boardManager.getCurrentBoard();
        
        if (!currentBoard || !currentBoard.aiConfig?.provider || !currentBoard.aiConfig?.apiKey) {
            throw new Error('AI-Konfiguration nicht vollständig');
        }

        const prompt = this.createBoardSummaryPrompt(board);
        
        try {
            const response = await this.callAI(currentBoard.aiConfig, prompt);
            return response;
        } catch (error) {
            console.error('AI Summary Generation Error:', error);
            throw new Error('Fehler beim Generieren der Zusammenfassung: ' + error.message);
        }
    }

    async generateCardContent(cardPrompt, context = {}) {
        const boardManager = BoardManager.getInstance();
        const currentBoard = boardManager.getCurrentBoard();
        
        if (!currentBoard || !currentBoard.aiConfig?.provider || !currentBoard.aiConfig?.apiKey) {
            throw new Error('AI-Konfiguration nicht vollständig');
        }

        const prompt = this.createCardContentPrompt(cardPrompt, context);
        
        try {
            const response = await this.callAI(currentBoard.aiConfig, prompt);
            return this.parseCardResponse(response);
        } catch (error) {
            console.error('AI Card Generation Error:', error);
            throw new Error('Fehler beim Generieren der Karte: ' + error.message);
        }
    }

    async improveCardContent(cardData, improvementType = 'general') {
        const boardManager = BoardManager.getInstance();
        const currentBoard = boardManager.getCurrentBoard();
        
        if (!currentBoard || !currentBoard.aiConfig?.provider || !currentBoard.aiConfig?.apiKey) {
            throw new Error('AI-Konfiguration nicht vollständig');
        }

        const prompt = this.createImprovementPrompt(cardData, improvementType);
        
        try {
            const response = await this.callAI(currentBoard.aiConfig, prompt);
            return this.parseCardResponse(response);
        } catch (error) {
            console.error('AI Card Improvement Error:', error);
            throw new Error('Fehler beim Verbessern der Karte: ' + error.message);
        }
    }

    async callAI(aiConfig, prompt) {
        const { provider, apiKey } = aiConfig;
        
        switch (provider.toLowerCase()) {
            case 'openai':
                return await this.callOpenAI(apiKey, prompt);
            case 'anthropic':
                return await this.callAnthropic(apiKey, prompt);
            case 'gemini':
                return await this.callGemini(apiKey, prompt);
            default:
                throw new Error(`Nicht unterstützter AI-Provider: ${provider}`);
        }
    }

    async callOpenAI(apiKey, prompt) {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'gpt-3.5-turbo',
                messages: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                max_tokens: 500,
                temperature: 0.7
            })
        });

        if (!response.ok) {
            throw new Error(`OpenAI API Error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;
    }

    async callAnthropic(apiKey, prompt) {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': apiKey,
                'anthropic-version': '2023-06-01'
            },
            body: JSON.stringify({
                model: 'claude-3-haiku-20240307',
                max_tokens: 500,
                messages: [
                    {
                        role: 'user',
                        content: prompt
                    }
                ]
            })
        });

        if (!response.ok) {
            throw new Error(`Anthropic API Error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        return data.content[0].text;
    }

    async callGemini(apiKey, prompt) {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                contents: [
                    {
                        parts: [
                            {
                                text: prompt
                            }
                        ]
                    }
                ]
            })
        });

        if (!response.ok) {
            throw new Error(`Gemini API Error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        return data.candidates[0].content.parts[0].text;
    }

    createBoardSummaryPrompt(board) {
        const columnSummaries = board.columns.map(column => {
            const cardCount = column.cards.length;
            const cardTitles = column.cards.map(card => card.heading).join(', ');
            return `${column.name} (${cardCount} Karten): ${cardTitles}`;
        }).join('\n');

        return `Erstelle eine prägnante Zusammenfassung für dieses Kanban-Board:

Board-Name: ${board.name}
Autoren: ${board.authors.join(', ')}

Spalten und Karten:
${columnSummaries}

Bitte erstelle eine 2-3 Sätze lange Zusammenfassung, die den Zweck und Inhalt des Boards beschreibt.`;
    }

    createCardContentPrompt(userPrompt, context) {
        let contextInfo = '';
        if (context.columnName) {
            contextInfo += `Diese Karte wird in der Spalte "${context.columnName}" erstellt.\n`;
        }
        if (context.boardName) {
            contextInfo += `Board-Kontext: "${context.boardName}"\n`;
        }

        return `${contextInfo}
Bitte erstelle eine Karte basierend auf folgender Anfrage: "${userPrompt}"

Antworte im folgenden Format:
TITEL: [Kurzer, prägnanter Titel]
INHALT: [Detaillierter Inhalt der Karte]

Die Antwort sollte professionell und strukturiert sein.`;
    }

    createImprovementPrompt(cardData, improvementType) {
        const improvements = {
            'general': 'Verbessere allgemein die Klarheit und Struktur',
            'clarity': 'Verbessere die Klarheit und Verständlichkeit',
            'detail': 'Füge mehr Details und Kontext hinzu',
            'concise': 'Mache den Inhalt prägnanter und fokussierter',
            'professional': 'Verbessere den professionellen Ton und Stil'
        };

        const improvementInstruction = improvements[improvementType] || improvements['general'];

        return `${improvementInstruction} der folgenden Karte:

Aktueller Titel: ${cardData.heading}
Aktueller Inhalt: ${cardData.content}

Antworte im folgenden Format:
TITEL: [Verbesserter Titel]
INHALT: [Verbesserter Inhalt]

Behalte die ursprüngliche Bedeutung bei, aber ${improvementInstruction.toLowerCase()}.`;
    }

    parseCardResponse(response) {
        const lines = response.split('\n');
        let title = '';
        let content = '';
        let currentSection = '';

        for (const line of lines) {
            const trimmedLine = line.trim();
            if (trimmedLine.startsWith('TITEL:')) {
                title = trimmedLine.substring(6).trim();
                currentSection = 'title';
            } else if (trimmedLine.startsWith('INHALT:')) {
                content = trimmedLine.substring(7).trim();
                currentSection = 'content';
            } else if (trimmedLine && currentSection === 'content') {
                content += '\n' + trimmedLine;
            }
        }

        return {
            heading: title || 'AI-generierte Karte',
            content: content || response // Fallback to full response if parsing fails
        };
    }

    validateAIConfig(provider, apiKey) {
        if (!provider || !apiKey) {
            return { valid: false, message: 'Provider und API-Key sind erforderlich' };
        }

        if (!this.supportedProviders.includes(provider.toLowerCase())) {
            return { 
                valid: false, 
                message: `Nicht unterstützter Provider. Unterstützte Provider: ${this.supportedProviders.join(', ')}` 
            };
        }

        // Basic API key format validation
        if (apiKey.length < 10) {
            return { valid: false, message: 'API-Key scheint zu kurz zu sein' };
        }

        return { valid: true };
    }

    // Future enhancements placeholder methods
    async generateColumnSuggestions(boardContext) {
        // Placeholder for AI-powered column suggestions
        console.log('Generating column suggestions for board context:', boardContext);
        return [];
    }

    async analyzeWorkflow(board) {
        // Placeholder for workflow analysis
        console.log('Analyzing workflow for board:', board.name);
        return {
            efficiency: 0,
            bottlenecks: [],
            suggestions: []
        };
    }

    async generateTags(cardContent) {
        // Placeholder for automatic tag generation
        console.log('Generating tags for card content:', cardContent);
        return [];
    }

    async suggestAssignments(cardContent, teamMembers) {
        // Placeholder for assignment suggestions
        console.log('Suggesting assignments for card:', cardContent);
        return [];
    }

    async estimateEffort(cardContent) {
        // Placeholder for effort estimation
        console.log('Estimating effort for card:', cardContent);
        return {
            hours: 0,
            complexity: 'medium',
            confidence: 0.5
        };
    }
}

// Export for use in other modules
window.AIManager = AIManager;
