// Bereinigter Test-Fix für Nostr-Integration ohne automatische Board-Erstellung

console.log('🧹 Nostr Test Cleanup loaded - preventing automatic board creation');

// Überschreibt createTestBoardForNostr um automatische Speicherung zu vermeiden
window.createTestBoardForNostr_Safe = function() {
    console.log('🧪 Creating SAFE test board for Nostr (no auto-save)...');
    
    const testBoard = {
        id: 'test-nostr-board-' + Date.now(),
        title: 'Nostr Test Board', // Sowohl title als auch name für Kompatibilität
        name: 'Nostr Test Board',
        description: 'Test board for Nostr integration testing',
        summary: 'Ein Test-Board für die Nostr-Integration. Dieses Board enthält verschiedene Spalten und Karten zum Testen der Funktionalität.',
        authors: ['Nostr Tester'],
        backgroundColor: '#f0f8ff',
        backgroundHex: '#f0f8ff',
        headerRGBA: 'rgba(255, 255, 255, 0.8)',
        customStyle: '',
        aiConfig: {
            provider: '',
            apiKey: '',
            model: '',
            baseUrl: ''
        },
        columns: [
            {
                id: 'col-todo-' + Date.now(),
                name: 'To Do',
                color: 'color-gradient-1',
                cards: [
                    {
                        id: 'card-1-' + Date.now(),
                        heading: 'Nostr Integration testen',
                        content: 'Die neue Nostr-Funktionalität ausführlich testen',
                        color: 'color-gradient-1',
                        thumbnail: '',
                        labels: 'High Priority, Feature',
                        comments: 'Schlüsselgenerierung funktioniert!',
                        url: '',
                        inactive: false
                    }
                ]
            },
            {
                id: 'col-progress-' + Date.now(),
                name: 'In Progress',
                color: 'color-gradient-2',
                cards: []
            },
            {
                id: 'col-done-' + Date.now(),
                name: 'Done',
                color: 'color-gradient-3',
                cards: []
            }
        ]
    };
    
    console.log('✅ Safe test board created (not saved to storage)');
    return testBoard;
};

// Sicherer Test-Workflow ohne Board-Erstellung
window.runSafeNostrTest = async function() {
    console.log('\n🔒 === SAFE NOSTR TEST (NO BOARD CREATION) ===');
    
    const results = {
        neventCreation: false,
        neventParsing: false,
        boardValidation: false,
        overall: false
    };
    
    try {
        // Test 1: nevent-Erstellung ohne Board-Erstellung
        console.log('🔧 Step 1: Testing nevent creation...');
        const testEventId = '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
        const testRelays = ['wss://relay.damus.io'];
        
        if (typeof createNeventString === 'function') {
            try {
                const nevent = createNeventString(testEventId, testRelays);
                console.log('✅ nevent created:', nevent.substring(0, 30) + '...');
                results.neventCreation = true;
                
                // Test 2: nevent-Parsing
                console.log('\n🔧 Step 2: Testing nevent parsing...');
                if (typeof parseNeventString === 'function') {
                    const parsed = parseNeventString(nevent);
                    const roundTripOk = parsed.eventId === testEventId;
                    console.log('✅ nevent parsed, round-trip:', roundTripOk ? 'OK' : 'FAIL');
                    results.neventParsing = roundTripOk;
                }
            } catch (error) {
                console.log('❌ nevent test failed:', error.message);
            }
        }
        
        // Test 3: Board-Validierung mit Mock-Daten
        console.log('\n🔧 Step 3: Testing board validation...');
        if (typeof validateBoardStructure === 'function') {
            const mockBoard = window.createTestBoardForNostr_Safe();
            results.boardValidation = validateBoardStructure(mockBoard);
            console.log('✅ Board validation:', results.boardValidation ? 'PASS' : 'FAIL');
        }
        
        // Ergebnis
        const passedTests = Object.values(results).filter(Boolean).length - 1; // -1 für 'overall'
        const totalTests = Object.keys(results).length - 1;
        results.overall = passedTests === totalTests;
        
        console.log('\n📋 === SAFE TEST RESULTS ===');
        console.log(`1. nevent Creation: ${results.neventCreation ? '✅ PASS' : '❌ FAIL'}`);
        console.log(`2. nevent Parsing: ${results.neventParsing ? '✅ PASS' : '❌ FAIL'}`);
        console.log(`3. Board Validation: ${results.boardValidation ? '✅ PASS' : '❌ FAIL'}`);
        console.log(`\n🎯 OVERALL: ${results.overall ? '🎉 ALL TESTS PASSED!' : '⚠️ SOME TESTS FAILED'}`);
        console.log(`Result: ${passedTests}/${totalTests} tests passed`);
        
        if (results.overall) {
            console.log('\n🚀 SUCCESS: Nostr integration is working without creating boards!');
        }
        
        return results;
        
    } catch (error) {
        console.error('❌ Safe test failed:', error);
        return { ...results, overall: false, error: error.message };
    }
};

// Deaktiviere automatische Board-Erstellung in bestehenden Funktionen
const originalCreateTestBoard = window.createTestBoardForNostr;
window.createTestBoardForNostr = function() {
    console.warn('⚠️ createTestBoardForNostr called - redirecting to safe version');
    console.log('💡 Use createTestBoardForNostr_Safe() for testing without storage');
    return window.createTestBoardForNostr_Safe();
};

// Funktion um alle Test-Boards zu löschen
window.cleanupTestBoards = function() {
    console.log('🧹 Cleaning up test boards...');
    
    try {
        const stored = localStorage.getItem('kanban_boards_v1');
        if (!stored) {
            console.log('✅ No boards in storage');
            return;
        }
        
        const data = JSON.parse(stored);
        const originalCount = data.boards ? data.boards.length : 0;
        
        // Entferne alle Boards mit "Nostr Test Board" im Namen oder test-nostr-board ID
        data.boards = data.boards.filter(board => {
            const isTestBoard = board.name?.includes('Nostr Test Board') || 
                               board.title?.includes('Nostr Test Board') ||
                               board.id?.includes('test-nostr-board');
            return !isTestBoard;
        });
        
        const newCount = data.boards.length;
        const removedCount = originalCount - newCount;
        
        localStorage.setItem('kanban_boards_v1', JSON.stringify(data));
        
        console.log(`✅ Removed ${removedCount} test boards (${originalCount} → ${newCount})`);
        
        // Update global state
        if (window.boards) {
            window.boards = data.boards;
        }
        
        // Dashboard neu rendern falls möglich
        if (typeof renderDashboard === 'function') {
            renderDashboard();
        }
        
        return removedCount;
        
    } catch (error) {
        console.error('❌ Cleanup failed:', error);
        return 0;
    }
};

console.log('🧹 Cleanup functions loaded:');
console.log('  - runSafeNostrTest() // Test ohne Board-Erstellung');
console.log('  - createTestBoardForNostr_Safe() // Board nur im Speicher');
console.log('  - cleanupTestBoards() // Entfernt alle Test-Boards');
console.log('  - Original createTestBoardForNostr() ist deaktiviert');
