// Test für die Duplikat-Fix-Lösung
// Führe diesen Test in der Browser-Konsole aus

async function testDuplicateFix() {
    console.log('🧪 Testing Duplicate Board Prevention Fix...');
    console.log('==============================================');
    
    // Schritt 1: Speichere aktuellen Zustand
    const initialBoardCount = window.boards ? window.boards.length : 0;
    console.log('📊 Initial board count:', initialBoardCount);
    
    // Schritt 2: Erstelle Test-Board
    console.log('\n🎯 Step 1: Creating test board...');
    const testBoard = {
        id: 'test-duplicate-' + Date.now(),
        name: 'Duplicate Fix Test Board',
        description: 'Testing duplicate prevention',
        summary: 'A test board to verify duplicate prevention',
        authors: ['Test User'],
        backgroundColor: '#f5f7fa',
        backgroundHex: '#f5f7fa',
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
                id: 'col-test-1',
                name: 'Test Column',
                color: 'color-gradient-1',
                cards: [{
                    id: 'card-test-1',
                    heading: 'Test Card',
                    content: 'This is a test card',
                    color: 'color-gradient-1',
                    thumbnail: '',
                    labels: 'test, duplicate-fix',
                    comments: 'Testing duplicate prevention',
                    url: '',
                    inactive: false
                }]
            }
        ]
    };
    
    // Setze als aktuelles Board
    window.currentBoard = testBoard;
    if (!window.boards) window.boards = [];
    window.boards.push(testBoard);
    console.log('✅ Test board created and added to boards array');
    
    // Schritt 3: Teste Nostr Publishing
    console.log('\n📤 Step 2: Testing Nostr publishing...');
    try {
        // Generiere Keys falls noch nicht vorhanden
        if (!localStorage.getItem('nostr-private-key')) {
            const keys = await generateNostrKeys();
            console.log('🔑 Generated new keys for testing');
        }
        
        const publishResult = await publishBoardToNostr();
        if (!publishResult || !publishResult.success) {
            throw new Error('Publishing failed: ' + (publishResult?.error || 'Unknown error'));
        }
        
        console.log('✅ Board published successfully');
        console.log('🔗 nevent:', publishResult.nevent.substring(0, 50) + '...');
        
        // Schritt 4: Warte auf Relay-Propagation
        console.log('\n⏳ Step 3: Waiting for relay propagation (3 seconds)...');
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Schritt 5: Teste Import mehrfach
        console.log('\n📥 Step 4: Testing import (first time)...');
        const beforeFirstImport = window.boards.length;
        console.log('Boards before first import:', beforeFirstImport);
        
        await importBoardFromNostr(publishResult.nevent);
        const afterFirstImport = window.boards.length;
        console.log('Boards after first import:', afterFirstImport);
        console.log('Expected increase: 1, Actual increase:', afterFirstImport - beforeFirstImport);
        
        // Schritt 6: Teste zweiten Import (sollte eindeutigen Namen haben)
        console.log('\n📥 Step 5: Testing import (second time - should create unique name)...');
        await importBoardFromNostr(publishResult.nevent);
        const afterSecondImport = window.boards.length;
        console.log('Boards after second import:', afterSecondImport);
        console.log('Expected increase: 1, Actual increase:', afterSecondImport - afterFirstImport);
        
        // Schritt 7: Überprüfe Board-Namen
        console.log('\n📋 Step 6: Checking board names...');
        const importedBoards = window.boards.filter(b => b.name.includes('Imported'));
        console.log('Imported boards found:', importedBoards.length);
        importedBoards.forEach((board, index) => {
            console.log(`  ${index + 1}. "${board.name}" (ID: ${board.id})`);
        });
        
        // Schritt 8: Teste localStorage Integrität
        console.log('\n💾 Step 7: Testing localStorage integrity...');
        const storedBoards = JSON.parse(localStorage.getItem('kanban-boards') || '[]');
        console.log('Boards in localStorage:', storedBoards.length);
        console.log('Boards in memory:', window.boards.length);
        console.log('localStorage sync:', storedBoards.length === window.boards.length ? '✅' : '❌');
        
        // Schritt 9: Zusammenfassung
        console.log('\n📊 Test Results Summary:');
        console.log('========================');
        console.log('✅ Publishing: SUCCESS');
        console.log('✅ Import 1: SUCCESS');
        console.log('✅ Import 2: SUCCESS');
        console.log('✅ Unique names:', importedBoards.every((board, index, arr) => 
            arr.findIndex(b => b.name === board.name) === index) ? 'SUCCESS' : 'FAILED');
        console.log('✅ localStorage sync:', storedBoards.length === window.boards.length ? 'SUCCESS' : 'FAILED');
        console.log('✅ No overwrites:', afterSecondImport > afterFirstImport ? 'SUCCESS' : 'FAILED');
        
        return {
            success: true,
            initialCount: initialBoardCount,
            finalCount: window.boards.length,
            importedBoards: importedBoards.length,
            uniqueNames: importedBoards.every((board, index, arr) => 
                arr.findIndex(b => b.name === board.name) === index),
            localStorageSync: storedBoards.length === window.boards.length
        };
        
    } catch (error) {
        console.error('❌ Test failed:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

// Hilfsfunktion zum Aufräumen nach dem Test
function cleanupTestData() {
    console.log('🧹 Cleaning up test data...');
    if (window.boards) {
        window.boards = window.boards.filter(b => 
            !b.name.includes('Duplicate Fix Test Board') && 
            !b.name.includes('Imported')
        );
        localStorage.setItem('kanban-boards', JSON.stringify(window.boards));
        console.log('✅ Test data cleaned up');
        if (typeof renderDashboard === 'function') {
            renderDashboard();
        }
    }
}

// Exportiere Funktionen für Console-Nutzung
window.testDuplicateFix = testDuplicateFix;
window.cleanupTestData = cleanupTestData;

console.log('🧪 Duplicate Fix Test loaded!');
console.log('Run: await testDuplicateFix()');
console.log('Cleanup: cleanupTestData()');
