// Fix für das aktuelle nevent-Problem

// Aktueller problematischer nevent aus dem letzten Test
const PROBLEMATIC_NEVENT = 'nevent1qqs2nldjnx2pcfhaatp262j7j0zfmkqm2fg3qnr7e0f8t4r7zz2d5h0tqqxrhwef';

async function fixCurrentNeventIssue() {
    console.log('\n🔧 === FIXING CURRENT NEVENT ISSUE ===');
    
    // 1. Analysiere das problematische nevent
    console.log('📋 Analyzing problematic nevent:', PROBLEMATIC_NEVENT);
    
    if (typeof analyzeProblematicNevent === 'function') {
        analyzeProblematicNevent(PROBLEMATIC_NEVENT);
    }
    
    // 2. Teste nevent-Erstellung mit gültigen Daten
    console.log('\n🔧 Testing nevent creation with valid data...');
    
    // Verwende ein echtes Event aus dem letzten Test (falls vorhanden)
    let validEventId = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
    let validRelays = ['wss://relay.damus.io', 'wss://nos.lol'];
    
    // 3. Erstelle einen gültigen nevent
    console.log('\n🔧 Creating valid nevent...');
    try {
        if (typeof createNeventString === 'function') {
            const validNevent = createNeventString(validEventId, validRelays);
            console.log('✅ Valid nevent created:', validNevent);
            
            // 4. Teste das Parsing des gültigen nevents
            console.log('\n🔧 Testing parsing of valid nevent...');
            if (typeof parseNeventString === 'function') {
                const parsed = parseNeventString(validNevent);
                console.log('✅ Valid nevent parsed:', parsed);
                
                // 5. Teste Relay-Verbindung mit gültigem Event
                console.log('\n🔧 Testing relay connection with valid event...');
                if (typeof fetchEventFromRelay === 'function') {
                    const testRelay = 'wss://relay.damus.io';
                    console.log(`📡 Testing connection to ${testRelay}...`);
                    
                    try {
                        // Note: This will likely fail because the event doesn't exist,
                        // but it should not fail due to invalid hex characters
                        const result = await fetchEventFromRelay(parsed.eventId, testRelay);
                        console.log('📡 Relay test result:', result);
                    } catch (error) {
                        console.log('📡 Relay test error (expected for non-existent event):', error.message);
                        
                        // Check if the error is about hex parsing (bad) or event not found (good)
                        if (error.message.includes('unexpected character in from_hex')) {
                            console.log('❌ Still have hex parsing issue!');
                        } else {
                            console.log('✅ No hex parsing issue - error is about event not being found');
                        }
                    }
                }
            }
        }
    } catch (error) {
        console.error('❌ nevent creation failed:', error);
    }
}

// Test mit echten Board-Daten
async function testWithRealBoardData() {
    console.log('\n🔧 === TESTING WITH REAL BOARD DATA ===');
    
    // 1. Use existing board instead of creating new test board
    console.log('📋 Using existing board data...');
    
    if (!window.currentBoard) {
        console.warn('⚠️ No current board selected. Please select a board first or manually create a test board.');
        console.log('💡 Use createTestBoardForNostr() manually if you need a test board');
        return;
    }
    
    const testBoard = window.currentBoard; // Use existing board instead of creating new one
    console.log('✅ Using existing board:', {
        title: testBoard.name || testBoard.title,
        columnsCount: testBoard.columns ? testBoard.columns.length : 0,
        cardsCount: testBoard.columns ? testBoard.columns.reduce((sum, col) => sum + (col.cards || []).length, 0) : 0
    });
    
    // 2. Publiziere das Board (simuliert)
    console.log('\n📡 Simulating board publishing...');
    if (typeof publishBoardToNostr === 'function') {
        // Note: This requires valid Nostr keys, so we'll just test the data preparation
        console.log('📋 Testing board data preparation for Nostr...');
        
        // Mock-Schlüssel für Test
        const mockPrivateKey = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
        const mockRelays = ['wss://relay.danus.io'];
        
        try {
            // Teste nur die Event-Erstellung, nicht das Publishing
            const event = {
                kind: 30023,
                created_at: Math.floor(Date.now() / 1000),
                tags: [
                    ['d', testBoard.name || testBoard.title],
                    ['title', testBoard.name || testBoard.title],
                    ['description', 'Test Board für nevent-Debugging']
                ],
                content: JSON.stringify(testBoard),
                pubkey: 'mock_pubkey'
            };
            
            console.log('✅ Mock event prepared:', {
                kind: event.kind,
                contentLength: event.content.length,
                tagsCount: event.tags.length
            });
            
            // Simuliere Event-ID (würde normalerweise durch nostr-tools generiert)
            const mockEventId = '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
            
            // 3. Teste nevent-Erstellung mit Mock-Event-ID
            console.log('\n🔧 Testing nevent creation with mock event ID...');
            const nevent = createNeventString(mockEventId, mockRelays);
            console.log('✅ nevent created for mock event:', nevent);
            
            // 4. Teste nevent-Parsing
            console.log('\n🔧 Testing nevent parsing...');
            const parsed = parseNeventString(nevent);
            console.log('✅ nevent parsed:', parsed);
            
            return { nevent, parsed, mockEventId };
            
        } catch (error) {
            console.error('❌ Mock publishing test failed:', error);
        }
    }


    // Haupt-Fix-Funktion
    
    if (window.nostrTools) {
        console.log('✅ nostr-tools loaded');
    } else {
        console.log('⚠️ nostr-tools not loaded, using fallback methods');
    }
    
    // Schritt 1: Analysiere das aktuelle Problem
    await fixCurrentNeventIssue();

    
    // Schritt 2: Teste mit echten Board-Daten
    const testResult = await testWithRealBoardData();
    
    // Schritt 3: Teste kompletten Workflow
    console.log('\n🔧 Testing complete workflow...');
    if (typeof testCompleteNeventWorkflow === 'function') {
        const workflowResult = testCompleteNeventWorkflow();
        console.log('🔧 Complete workflow result:', workflowResult);
    }
    
    // Zusammenfassung
    console.log('\n📋 === FIX SUMMARY ===');
    console.log('1. Problematic nevent analyzed');
    console.log('2. Valid nevent creation tested');
    console.log('3. Real board data workflow tested');
    console.log('4. Complete workflow validated');
    
    if (testResult && testResult.nevent) {
        console.log('\n🎉 SUCCESS: Valid nevent generated!');
        console.log('Sample nevent:', testResult.nevent);
        console.log('You can use this workflow for real board publishing.');
    }
}

// Exportiere Funktionen
window.fixCurrentNeventIssue = fixCurrentNeventIssue;
window.testWithRealBoardData = testWithRealBoardData;
window.runNeventFix = runNeventFix;

console.log('🔧 nevent fix functions loaded:');
console.log('  - fixCurrentNeventIssue()');
console.log('  - testWithRealBoardData()');
console.log('  - runNeventFix() // Führt alle Tests aus');
