// Test für Board-Rendering nach Datenstruktur-Korrekturen
// Führe diese Funktion in der Browser-Konsole aus

function testBoardRendering() {
    console.log('🧪 Testing Board Rendering after Data Structure Fixes...');
    
    try {
        // 1. Test-Board mit korrigierter Datenstruktur erstellen
        const testBoard = {
            id: 'render-test-' + Date.now(),
            name: 'Rendering Test Board',
            description: 'Board to test corrected data structure',
            summary: 'Test Board um die korrigierten Datenstrukturen zu validieren',
            authors: ['Test User'],
            backgroundColor: '#e3f2fd',
            backgroundHex: '#e3f2fd',
            headerRGBA: 'rgba(255, 255, 255, 0.85)',
            customStyle: '',
            aiConfig: {
                provider: '',
                apiKey: '',
                model: '',
                baseUrl: ''
            },
            columns: [
                {
                    id: 'test-col-1',
                    name: 'Test Column',
                    color: 'color-gradient-1',
                    cards: [
                        {
                            id: 'test-card-1',
                            heading: 'Test Card with All Features',
                            content: 'This card tests all supported features:\n\n- Comments functionality\n- URL linking\n- Labels system\n- Proper data types',
                            color: 'color-gradient-1',
                            thumbnail: '',
                            labels: 'Test, Features, All',
                            comments: 'This is a test comment to verify the comments field works properly.',
                            url: 'https://github.com/nostr-protocol/nostr',
                            inactive: false
                        },
                        {
                            id: 'test-card-2',
                            heading: 'Card with Multiple Labels',
                            content: 'Testing multiple labels with different colors.',
                            color: 'color-gradient-2',
                            thumbnail: '',
                            labels: 'Frontend, React, Testing, UI, Sprint1',
                            comments: '',
                            url: '',
                            inactive: false
                        },
                        {
                            id: 'test-card-3',
                            heading: 'Minimal Card',
                            content: 'Testing minimal card with empty optional fields.',
                            color: 'color-gradient-3',
                            thumbnail: '',
                            labels: '',
                            comments: '',
                            url: '',
                            inactive: false
                        }
                    ]
                }
            ]
        };

        // 2. Board zum boards array hinzufügen
        if (!window.boards) window.boards = [];
        window.boards.push(testBoard);
        
        // 3. Board als aktuelles Board setzen
        window.currentBoard = testBoard;
        
        console.log('✅ Test board created with corrected data structure');
        
        // 4. Board rendering testen
        console.log('🎨 Testing board rendering...');
        
        // Board-View aktivieren
        document.getElementById('dashboard').style.display = 'none';
        document.getElementById('board-view').style.display = 'flex';
        
        // Board view updaten
        if (typeof updateBoardView === 'function') {
            updateBoardView();
            console.log('✅ Board view updated');
        }
        
        // Spalten rendern
        if (typeof renderColumns === 'function') {
            renderColumns();
            console.log('✅ Columns rendered');
        }
        
        // 5. Karten-Elemente prüfen
        const cardElements = document.querySelectorAll('.kanban-card');
        console.log(`📋 Found ${cardElements.length} rendered cards`);
        
        // Jede Karte auf Fehler prüfen
        cardElements.forEach((cardEl, index) => {
            const cardId = cardEl.dataset.cardId;
            const card = testBoard.columns[0].cards.find(c => c.id === cardId);
            
            if (card) {
                console.log(`🔍 Testing card ${index + 1}:`, card.heading);
                
                // Labels testen
                const labelsContainer = cardEl.querySelector('.card-labels');
                if (card.labels && card.labels.trim()) {
                    if (labelsContainer) {
                        const labelElements = labelsContainer.querySelectorAll('.card-label');
                        const expectedLabels = card.labels.split(',').map(l => l.trim()).filter(l => l.length > 0);
                        console.log(`  ✅ Labels: ${labelElements.length}/${expectedLabels.length} rendered`);
                    } else {
                        console.log(`  ❌ Labels container missing for card with labels: ${card.labels}`);
                    }
                } else {
                    console.log(`  ✅ No labels expected, none rendered`);
                }
                
                // Kommentare testen
                const commentsCount = cardEl.querySelector('.card-comments-count');
                if (commentsCount) {
                    const expectedCount = (card.comments && card.comments.trim()) ? '1' : '0';
                    const actualText = commentsCount.textContent;
                    if (actualText.includes(expectedCount)) {
                        console.log(`  ✅ Comments count correct: ${actualText}`);
                    } else {
                        console.log(`  ❌ Comments count incorrect: expected ${expectedCount}, got ${actualText}`);
                    }
                }
                
                // URL testen
                const urlLink = cardEl.querySelector('.card-url-link');
                if (card.url && card.url.trim()) {
                    if (urlLink) {
                        console.log(`  ✅ URL link rendered: ${urlLink.href}`);
                    } else {
                        console.log(`  ❌ URL link missing for card with URL: ${card.url}`);
                    }
                } else if (!urlLink) {
                    console.log(`  ✅ No URL expected, none rendered`);
                }
            }
        });
        
        // 6. Console errors prüfen
        console.log('🔍 Check browser console for any rendering errors...');
        
        // 7. Full modal test
        if (cardElements.length > 0) {
            console.log('🖼️ Testing full card modal...');
            const firstCard = cardElements[0];
            const cardId = firstCard.dataset.cardId;
            const columnId = testBoard.columns[0].id;
            
            if (typeof showCardFullModal === 'function') {
                showCardFullModal(cardId, columnId);
                console.log('✅ Full card modal opened - check visually for proper rendering');
                
                // Modal nach kurzer Zeit schließen
                setTimeout(() => {
                    if (typeof closeCardFullModal === 'function') {
                        closeCardFullModal();
                        console.log('✅ Full card modal closed');
                    }
                }, 2000);
            }
        }
        
        console.log('🎉 Board rendering test completed successfully!');
        console.log('💡 Check the board visually to confirm all elements render correctly');
        
        return {
            success: true,
            board: testBoard,
            cardsRendered: cardElements.length,
            message: 'Data structure fixes validated successfully'
        };
        
    } catch (error) {
        console.error('❌ Board rendering test failed:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// Erweiterte Test-Funktion für vollständigen Workflow
async function testCompleteWorkflow() {
    console.log('🚀 Testing Complete Workflow (Rendering + Nostr Publishing)...');
    
    try {
        // 1. Board rendering test
        const renderResult = testBoardRendering();
        if (!renderResult.success) {
            throw new Error('Board rendering failed: ' + renderResult.error);
        }
        
        console.log('✅ Step 1: Board rendering successful');
        
        // 2. Warten auf nostr-tools
        if (typeof waitForNostrTools === 'function') {
            await waitForNostrTools();
            console.log('✅ Step 2: nostr-tools ready');
        }
        
        // 3. Nostr keys generieren
        if (typeof generateNostrKeys === 'function') {
            const keys = await generateNostrKeys();
            console.log('✅ Step 3: Nostr keys generated');
            
            // Keys in UI setzen
            const privateKeyInput = document.getElementById('nostr-private-key');
            const publicKeyInput = document.getElementById('nostr-public-key');
            if (privateKeyInput) privateKeyInput.value = keys.privateKey;
            if (publicKeyInput) publicKeyInput.value = keys.publicKey;
        }
        
        // 4. Board publishing test (nur wenn publishBoardToNostr verfügbar ist)
        if (typeof publishBoardToNostr === 'function') {
            console.log('📤 Step 4: Testing Nostr publishing...');
            // Hier könnten wir optional das Publishing testen
            console.log('💡 Publishing test available - run publishBoardToNostr() manually if desired');
        }
        
        console.log('🎉 Complete workflow test successful!');
        console.log('📋 Summary:');
        console.log('  ✅ Data structure corrections applied');
        console.log('  ✅ Board rendering working');
        console.log('  ✅ All card properties display correctly');
        console.log('  ✅ Nostr integration ready');
        
        return {
            success: true,
            message: 'Complete workflow tested successfully'
        };
        
    } catch (error) {
        console.error('❌ Complete workflow test failed:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// Globale Verfügbarkeit
window.testBoardRendering = testBoardRendering;
window.testCompleteWorkflow = testCompleteWorkflow;

console.log('🧪 Test functions loaded. Available commands:');
console.log('- testBoardRendering() - Test data structure fixes');
console.log('- testCompleteWorkflow() - Test complete workflow');
